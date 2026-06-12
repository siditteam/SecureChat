import { Link } from 'react-router-dom';

function Rule({ n, title, children }) {
  return (
    <div className="flex gap-4">
      <span className="w-8 h-8 rounded-full bg-primary-500 text-ink-950 font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <div>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title}</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{children}</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 space-y-5">
      <h2 className="text-primary-400 text-xs font-bold uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

export default function Manual() {
  return (
    <div className="min-h-screen bg-ink-900 px-4 py-10">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center mb-8">
          <img src="/assets/pngs/logo-unddr-icon-128.png" alt="Unddr" className="w-14 h-14 rounded-2xl mx-auto mb-4 shadow-xl shadow-black/50" />
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>The Unddr Manual</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>How this place works. Read once. Live it always.</p>
        </div>

        {/* What this is */}
        <Section title="What Unddr is">
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Unddr is a small, closed garden. You're here because someone vouched for you personally —
            not an algorithm, not a mass link. That vouching carries weight, both for you and for the
            person who brought you in.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            It's not a broadcast platform. It's not a place to perform. It's a place to actually talk.
          </p>
        </Section>

        {/* The one rule */}
        <Section title="The one rule, expanded">
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl px-5 py-4">
            <p className="text-primary-300 font-bold text-base text-center">
              "Say anything. Just don't try to wound."
            </p>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            You can talk religion, politics, money, sex, failure, addiction, love, nihilism, your weird
            3am thoughts — all of it. What's not okay is using any of that as a weapon against
            another person.
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3 items-start">
              <span className="text-success mt-0.5 flex-shrink-0">✓</span>
              <span style={{ color: 'var(--text-secondary)' }}>&quot;I think that policy actively harms people&quot; — disagreement</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-error mt-0.5 flex-shrink-0">✗</span>
              <span style={{ color: 'var(--text-secondary)' }}>&quot;You're an idiot for believing that&quot; — contempt</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-success mt-0.5 flex-shrink-0">✓</span>
              <span style={{ color: 'var(--text-secondary)' }}>&quot;I struggle with this and it makes me pull away&quot; — honesty</span>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-error mt-0.5 flex-shrink-0">✗</span>
              <span style={{ color: 'var(--text-secondary)' }}>&quot;You're clearly broken, get help&quot; — attack</span>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', fontStyle: 'italic' }}>Disagreement is great. Contempt is not.</p>
        </Section>

        {/* Five principles */}
        <Section title="Five principles">
          <div className="space-y-5">
            <Rule n="1" title="Warmth first.">
              Assume the person you're talking to is reasonable and human. Most misunderstandings
              come from missing tone. Give people the benefit of the doubt before escalating.
            </Rule>
            <Rule n="2" title="No performance.">
              You're not here to impress anyone. Drop the online persona. Nobody is scoring points.
              Just talk.
            </Rule>
            <Rule n="3" title="You can always leave.">
              Block, mute, step away — walking away is always the right move if you feel yourself
              heating up. No one is required to engage with anyone.
            </Rule>
            <Rule n="4" title="Speak like there's a record.">
              Messages can be set to disappear, but say things you'd stand behind. Private doesn't
              mean consequence-free.
            </Rule>
            <Rule n="5" title="Your invite reflects on you.">
              When you bring someone in, you're vouching for them. You get two vouches. Choose
              carefully. If they get flagged repeatedly, that's noted.
            </Rule>
          </div>
        </Section>

        {/* What gets you removed */}
        <Section title="What gets you removed">
          <div className="space-y-3">
            {[
              'Deliberately and repeatedly trying to cause distress to another user',
              'Sharing someone\'s private information without their consent (doxxing)',
              'Using this space to coordinate harm in the real world',
              'Abusing the invite system to flood the network',
              'Impersonating another user',
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start text-sm">
                <span className="text-error/70 mt-0.5 flex-shrink-0">—</span>
                <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 1.4 }}>
              Being wrong, controversial, hard to agree with, or holding unpopular opinions is
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}> not</span> grounds for removal.
              This is a place for honest conversation, not comfortable consensus.
            </p>
          </div>
        </Section>

        {/* Process */}
        <Section title="The process">
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <p>
              If you're flagged by other users, you'll receive a private review. We look at the full
              picture — not just the complaint, but the pattern, the context, and who's reporting.
            </p>
            <p>
              If we remove you: you get <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>one appeal</span>.
              Write it plainly and honestly. We read every one.
            </p>
            <p>
              If you're restored — welcome back. If not — no further correspondence.
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>unddrground.com · v1</p>
          <Link to="/" className="text-primary-500 text-sm font-semibold hover:underline mt-3 block">
            Back to Unddr
          </Link>
        </div>

      </div>
    </div>
  );
}
