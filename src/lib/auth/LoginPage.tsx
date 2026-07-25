import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button, Input, Field, Card } from '@/shared/components/ui';

export function LoginPage() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }

    setSending(true);
    const { error: err } = await signInWithEmail(trimmed);
    setSending(false);

    if (err) {
      setError(err);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-11 h-11 rounded-full border-2 border-gold flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gold" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold tracking-[0.06em] m-0">
              ICARO PROJECTS
            </p>
            <p className="text-[11px] text-text-muted mt-1 m-0">
              Construction management platform
            </p>
          </div>
        </div>

        <Card padding="lg" className="border-t-2 border-t-gold/30">
          {sent ? (
            <div className="space-y-5 text-center py-8">
              <div className="w-14 h-14 rounded-full bg-status-green-bg flex items-center justify-center mx-auto">
                <Mail size={22} className="text-status-green" />
              </div>
              <div>
                <p className="text-lg font-semibold m-0">Check your inbox</p>
                <p className="text-[13px] text-text-secondary mt-2 leading-relaxed">
                  We sent a magic link to{' '}
                  <strong className="text-text-primary">{email}</strong>.
                  Click the link to sign in.
                </p>
              </div>
              <p className="text-[11px] text-text-muted m-0">
                Didn't receive it?{' '}
                <button
                  type="button"
                  onClick={() => { setSent(false); setError(null); }}
                  className="bg-transparent text-gold cursor-pointer hover:text-gold-hover underline m-0 p-0 border-0 text-[11px]"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <p className="text-lg font-semibold m-0">Sign in</p>
                <p className="text-[13px] text-text-secondary mt-1.5 m-0 leading-relaxed">
                  Enter your work email to receive a magic link.
                </p>
              </div>

              <Field label="Work email" error={error ?? undefined}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@icaroprojects.com"
                  autoComplete="email"
                  autoFocus
                />
              </Field>

              <Button
                type="submit"
                variant="primary"
                disabled={sending}
                className="w-full justify-center"
              >
                {sending ? 'Sending…' : 'Send magic link'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-bg-panel px-2 text-[10px] text-text-muted uppercase tracking-wider">
                    No password needed
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-text-muted text-center m-0 leading-relaxed">
                Auth uses Supabase magic links — no password required.
                Server-enforced RBAC controls module access after sign-in.
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}