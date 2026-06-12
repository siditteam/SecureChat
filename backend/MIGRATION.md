# Backend Migration Notes

## Schema Changes (2026-06-12)

### User model (`src/models/User.js`)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `plan` | `String` enum(`free`,`paid`) | `'free'` | Monetization tier. Exposed in `toPublicJSON()`. Toggle via `PUT /api/admin/users/:id/plan`. |

**MongoDB index recommendation:** No new indexes required — `plan` is low-cardinality and queried only in admin stats.

### Team model (`src/models/Team.js`) — new placeholder

Represents a paid workspace. Fields: `name`, `handle` (unique), `owner` (ref User), `members` (ref[] User), `isActive`.  
**Not yet wired into routes.** Billing integration required before creating user-facing endpoints.

### Invite model — no changes

Fields `vouchedBy` and `vouchNote` were already present. Endpoints `GET /api/invites/:code`, `POST /api/invites/:code/vouch` are live.

---

## Admin Stats — new fields

`GET /api/admin/stats` now returns additional fields:

```json
{
  "invitesCreated": 42,
  "invitesUsed": 18,
  "vouchesCreated": 9,
  "usersWithVoucher": 15,
  "conversionRate": 43,
  "paidUsers": 0
}
```

---

## Video Call Deprecation (MVP)

Video calling code is **not removed** but is **disabled by default** in the frontend:

- `ChatWindow.jsx`: video call button is hidden unless `VITE_ENABLE_VIDEO=true` is set.
- `socket.js`: call signaling events (`call_offer`, `call_answer`, `call_end`, `ice_candidate`) remain active for audio calls. The `callType` field is not yet gated server-side.
- Components `ActiveCallOverlay.jsx` and `IncomingCallModal.jsx` remain in the bundle but are not reachable via UI without `VITE_ENABLE_VIDEO=true`.

**To re-enable video:** Set `VITE_ENABLE_VIDEO=true` in the frontend `.env` / Vercel environment. Server-side billing gate should be added before production rollout.

---

## Environment Variables

New variable added (frontend):

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `VITE_ENABLE_VIDEO` | No | `false` | Set to `true` to show video call button |

All other existing variables remain unchanged. See `backend/.env.example` for the full list.

---

## Rollback

All schema changes are additive (new fields with defaults). Rollback to previous release is safe — the `plan` field will be ignored and Team documents will remain orphaned but harmless.

---

## Index Recommendations (run once on production)

```js
// In mongosh or a migration script:
db.invites.createIndex({ code: 1 }, { unique: true });  // already enforced by Mongoose schema
db.users.createIndex({ plan: 1 });                       // useful for future paid-user queries
db.invites.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // optional TTL cleanup
```
