/**
 * Integration tests: invite → vouch → register → friend flow
 * and OTP auth happy/sad paths.
 *
 * Uses mongodb-memory-server so no real DB is needed.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-jwt-secret-for-tests';
process.env.NODE_ENV = 'test';
// Force SMS dev mode — unset real Twilio creds before any module loads
delete process.env.TWILIO_ACCOUNT_SID;
delete process.env.TWILIO_AUTH_TOKEN;
delete process.env.TWILIO_PHONE_NUMBER;

const app = require('../app');
const User = require('../models/User');
const Invite = require('../models/Invite');
const FriendRequest = require('../models/FriendRequest');
const PhoneOTP = require('../models/PhoneOTP');

let mongod;

function makeToken(userId, loginVersion = 1) {
  return jwt.sign({ userId: String(userId), loginVersion }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

async function createActiveUser(overrides = {}) {
  const base = {
    phone: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    username: `user_${Math.random().toString(36).slice(2, 8)}`,
    accountStatus: 'active',
    inviteTokens: 5,
    loginVersion: 1,
    probationEndsAt: null,
    publicKey: null,
  };
  return User.create({ ...base, ...overrides });
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Invite.deleteMany({}),
    FriendRequest.deleteMany({}),
    PhoneOTP.deleteMany({}),
  ]);
});

// ─────────────────────────────────────────────────────────────────────────────
// Invite → Vouch → Register → Friend flow
// ─────────────────────────────────────────────────────────────────────────────

describe('Vouched invite → register flow', () => {
  test('inviter generates invite, voucher vouches, new user registers with vouchedBy and friend link', async () => {
    // 1. Create inviter
    const inviter = await createActiveUser();
    const inviterToken = makeToken(inviter._id);

    // 2. Generate invite
    const genRes = await request(app)
      .post('/api/invites/generate')
      .set('Authorization', `Bearer ${inviterToken}`)
      .expect(201);

    expect(genRes.body.code).toBeTruthy();
    const { code } = genRes.body;

    // 3. Verify GET invite shows inviter, no voucher yet
    const getRes = await request(app)
      .get(`/api/invites/${code}`)
      .expect(200);

    expect(getRes.body.inviter.username).toBe(inviter.username);
    expect(getRes.body.vouchedBy).toBeNull();
    expect(getRes.body.status).toBe('active');

    // 4. Create voucher and vouch for the invite
    const voucher = await createActiveUser();
    const voucherToken = makeToken(voucher._id);

    const vouchRes = await request(app)
      .post(`/api/invites/${code}/vouch`)
      .set('Authorization', `Bearer ${voucherToken}`)
      .send({ note: 'I know this person IRL' })
      .expect(200);

    expect(vouchRes.body.vouchedBy.username).toBe(voucher.username);

    // 5. GET invite now shows vouchedBy
    const getRes2 = await request(app)
      .get(`/api/invites/${code}`)
      .expect(200);

    expect(getRes2.body.vouchedBy.username).toBe(voucher.username);

    // 6. New user registers with invite code (simulate OTP verified token)
    const newPhone = '+19998887777';
    const otpRecord = await PhoneOTP.create({
      phone: newPhone,
      otp: '$2a$08$xxx',
      verified: true,
      verifiedToken: 'tok_abc123',
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });
    void otpRecord;

    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ phone: newPhone, verifiedToken: 'tok_abc123', username: 'newuser_x', inviteCode: code })
      .expect(201);

    expect(regRes.body.user.username).toBe('newuser_x');
    const newUserId = regRes.body.user._id;

    // 7. Verify newUser.vouchedBy = voucher._id
    const newUser = await User.findById(newUserId);
    expect(String(newUser.vouchedBy)).toBe(String(voucher._id));
    expect(String(newUser.invitedBy)).toBe(String(inviter._id));

    // 8. Verify accepted FriendRequest created between inviter and new user
    const fr = await FriendRequest.findOne({ sender: inviter._id, receiver: newUserId, status: 'accepted' });
    expect(fr).not.toBeNull();

    // 9. Invite is now marked used
    const usedInvite = await Invite.findOne({ code });
    expect(usedInvite.status).toBe('used');
    expect(String(usedInvite.usedBy)).toBe(newUserId);
  });

  test('self-vouch is rejected', async () => {
    const inviter = await createActiveUser();
    const token = makeToken(inviter._id);

    const genRes = await request(app)
      .post('/api/invites/generate')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    await request(app)
      .post(`/api/invites/${genRes.body.code}/vouch`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  test('duplicate vouch is rejected', async () => {
    const inviter = await createActiveUser();
    const voucher = await createActiveUser();
    const inviterToken = makeToken(inviter._id);
    const voucherToken = makeToken(voucher._id);

    const { body: { code } } = await request(app)
      .post('/api/invites/generate')
      .set('Authorization', `Bearer ${inviterToken}`)
      .expect(201);

    await request(app)
      .post(`/api/invites/${code}/vouch`)
      .set('Authorization', `Bearer ${voucherToken}`)
      .expect(200);

    // Second vouch from a different user should also be rejected
    const voucher2 = await createActiveUser();
    const voucher2Token = makeToken(voucher2._id);

    await request(app)
      .post(`/api/invites/${code}/vouch`)
      .set('Authorization', `Bearer ${voucher2Token}`)
      .expect(400);
  });

  test('used invite cannot be reused for registration', async () => {
    const inviter = await createActiveUser();
    const token = makeToken(inviter._id);

    const { body: { code } } = await request(app)
      .post('/api/invites/generate')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // First registration uses the invite
    const phone1 = '+15550000001';
    await PhoneOTP.create({ phone: phone1, otp: '$2a$08$x', verified: true, verifiedToken: 'vtok1', expiresAt: new Date(Date.now() + 60_000) });
    await request(app)
      .post('/api/auth/register')
      .send({ phone: phone1, verifiedToken: 'vtok1', username: 'firstuser', inviteCode: code })
      .expect(201);

    // Second registration with same code should fail
    const phone2 = '+15550000002';
    await PhoneOTP.create({ phone: phone2, otp: '$2a$08$x', verified: true, verifiedToken: 'vtok2', expiresAt: new Date(Date.now() + 60_000) });
    const failRes = await request(app)
      .post('/api/auth/register')
      .send({ phone: phone2, verifiedToken: 'vtok2', username: 'seconduser', inviteCode: code })
      .expect(400);

    expect(failRes.body.message).toMatch(/expired|used/i);
  });

  test('probation user cannot generate invite', async () => {
    const probationer = await createActiveUser({ accountStatus: 'probation', probationEndsAt: new Date(Date.now() + 86_400_000) });
    const token = makeToken(probationer._id);

    const res = await request(app)
      .post('/api/invites/generate')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body.message).toMatch(/probation/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OTP flow
// ─────────────────────────────────────────────────────────────────────────────

describe('OTP auth flow', () => {
  const TEST_PHONE = '+12025551234';

  test('send-otp returns devOtp in dev mode', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: TEST_PHONE })
      .expect(200);

    expect(res.body.message).toMatch(/sent/i);
    expect(res.body.devOtp).toMatch(/^\d{6}$/);
    expect(res.body.devMode).toBe(true);
  });

  test('send-otp rejects invalid phone format', async () => {
    await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '555-1234' })
      .expect(400);
  });

  test('verify-otp with wrong code increments attempts', async () => {
    // Send OTP first
    const sendRes = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: TEST_PHONE })
      .expect(200);

    const { devOtp } = sendRes.body;
    const wrongOtp = devOtp === '000000' ? '111111' : '000000';

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: TEST_PHONE, otp: wrongOtp })
      .expect(400);

    expect(res.body.message).toMatch(/incorrect|failed/i);
  });

  test('verify-otp happy path returns verifiedToken', async () => {
    const sendRes = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: TEST_PHONE })
      .expect(200);

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: TEST_PHONE, otp: sendRes.body.devOtp })
      .expect(200);

    expect(res.body.verifiedToken).toBeTruthy();
    expect(typeof res.body.isRegistered).toBe('boolean');
  });

  test('register without invite code creates user without invitedBy', async () => {
    const phone = '+13005556789';
    const otpSend = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone })
      .expect(200);

    const otpVerify = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone, otp: otpSend.body.devOtp })
      .expect(200);

    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ phone, verifiedToken: otpVerify.body.verifiedToken, username: 'no_invite_user' })
      .expect(201);

    expect(regRes.body.user.invitedBy).toBeNull();
    expect(regRes.body.user.vouchedBy).toBeNull();
    expect(regRes.body.token).toBeTruthy();
  });

  test('duplicate username registration returns 409', async () => {
    await createActiveUser({ username: 'taken_name' });

    const phone = '+14155550100';
    const send = await request(app).post('/api/auth/send-otp').send({ phone });
    const verify = await request(app).post('/api/auth/verify-otp').send({ phone, otp: send.body.devOtp });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ phone, verifiedToken: verify.body.verifiedToken, username: 'taken_name' })
      .expect(409);

    expect(res.body.message).toMatch(/taken|use/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Admin stats — invite/vouch metrics
// ─────────────────────────────────────────────────────────────────────────────

describe('Admin stats invite metrics', () => {
  test('stats include invitesCreated, invitesUsed, vouchesCreated, conversionRate', async () => {
    const admin = await createActiveUser({ isAdmin: true });
    const adminToken = makeToken(admin._id);

    // Create some invites
    const inviter = await createActiveUser();
    const voucher = await createActiveUser();
    await Invite.create([
      { createdBy: inviter._id, status: 'active' },
      { createdBy: inviter._id, status: 'used', usedBy: admin._id, vouchedBy: voucher._id },
      { createdBy: inviter._id, status: 'used', usedBy: voucher._id },
    ]);

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.invitesCreated).toBe(3);
    expect(res.body.invitesUsed).toBe(2);
    expect(res.body.vouchesCreated).toBe(1);
    expect(res.body.conversionRate).toBe(67); // 2/3 = 66.6... rounds to 67
  });
});
