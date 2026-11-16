import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, LogIn, UserPlus, KeyRound, ArrowLeft, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { useAuth, authErrorMessage } from '../context/AuthContext';
import { safeNextPath } from '../lib/safeRedirect';
import './Auth.css';

const MIN_PASSWORD = 8;

function Field({ icon: Icon, label, type = 'text', value, onChange, autoComplete, minLength, required = true, toggleable }) {
  const [visible, setVisible] = useState(false);
  const inputType = toggleable ? (visible ? 'text' : 'password') : type;
  return (
    <label className="auth-field">
      <span className="auth-field__label">{label}</span>
      <span className="auth-field__control">
        <Icon size={16} />
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
        />
        {toggleable && (
          <button type="button" className="auth-field__toggle" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'}>
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </span>
    </label>
  );
}

function Message({ tone, children }) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`auth-message auth-message--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={16} />
      <span>{children}</span>
    </div>
  );
}

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__logo" aria-label="AlgoVerse home">
          <Logo />
        </Link>
        <h1 className="auth-card__title">{title}</h1>
        {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
        {children}
      </div>
      {footer && <div className="auth-footer">{footer}</div>}
    </div>
  );
}

function NotConfigured() {
  return (
    <AuthShell title="Accounts are not set up yet" subtitle="AlgoVerse is running in local mode. Your progress is saved in this browser.">
      <Message tone="error">
        To enable sign-in, add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env and restart the dev server. See “Supabase setup” in the README.
      </Message>
      <Button to="/" variant="secondary" icon={ArrowLeft} fullWidth>
        Back to AlgoVerse
      </Button>
    </AuthShell>
  );
}

/** /auth – sign in, create account, or request a password-reset email. */
export default function Auth() {
  const { enabled, status, signIn, signUp, sendPasswordReset } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = ['signup', 'forgot'].includes(params.get('mode')) ? params.get('mode') : 'signin';
  const next = safeNextPath(params.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setError('');
    setNotice('');
  }, [mode]);

  if (!enabled) return <NotConfigured />;
  if (status === 'signed_in') return <Navigate to={next} replace />;

  const setMode = (m) => {
    const p = new URLSearchParams(params);
    if (m === 'signin') p.delete('mode');
    else p.set('mode', m);
    setParams(p, { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn({ email: email.trim(), password });
        navigate(next, { replace: true });
      } else if (mode === 'signup') {
        if (password.length < MIN_PASSWORD) throw new Error(`Password should be at least ${MIN_PASSWORD} characters.`);
        const { needsConfirmation } = await signUp({ email: email.trim(), password, displayName: displayName.trim() });
        if (needsConfirmation) {
          setNotice(`We sent a confirmation link to ${email.trim()}. Open it to activate your account, then sign in.`);
          setPassword('');
        } else {
          navigate(next, { replace: true });
        }
      } else {
        await sendPasswordReset(email.trim());
        setNotice('If an account exists for that email, a password-reset link is on its way.');
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const titles = {
    signin: ['Welcome back', 'Sign in to sync your progress across devices.'],
    signup: ['Create your account', 'Save your lessons, submissions and AI history to your account.'],
    forgot: ['Reset your password', 'Enter your email and we’ll send you a reset link.'],
  };

  return (
    <AuthShell
      title={titles[mode][0]}
      subtitle={titles[mode][1]}
      footer={
        <Link to="/" className="auth-footer__link">
          <ArrowLeft size={14} /> Continue without an account
        </Link>
      }
    >
      {mode !== 'forgot' && (
        <div className="auth-tabs" role="tablist" aria-label="Account">
          <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => setMode('signin')}>
            Sign in
          </button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => setMode('signup')}>
            Create account
          </button>
        </div>
      )}

      <form className="auth-form" onSubmit={submit} noValidate={false}>
        {mode === 'signup' && (
          <Field icon={User} label="Name" value={displayName} onChange={setDisplayName} autoComplete="name" required={false} />
        )}
        <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        {mode !== 'forgot' && (
          <Field
            icon={Lock}
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={mode === 'signup' ? MIN_PASSWORD : undefined}
            toggleable
          />
        )}
        {mode === 'signup' && <p className="auth-hint">At least {MIN_PASSWORD} characters.</p>}
        {mode === 'signin' && (
          <button type="button" className="auth-link auth-link--right" onClick={() => setMode('forgot')}>
            Forgot password?
          </button>
        )}

        {error && <Message tone="error">{error}</Message>}
        {notice && <Message tone="success">{notice}</Message>}

        <Button type="submit" fullWidth icon={mode === 'signin' ? LogIn : mode === 'signup' ? UserPlus : KeyRound} disabled={busy || status === 'loading'}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </Button>

        {mode === 'forgot' && (
          <button type="button" className="auth-link" onClick={() => setMode('signin')}>
            <ArrowLeft size={14} /> Back to sign in
          </button>
        )}
      </form>
    </AuthShell>
  );
}

/** /auth/reset – choose a new password after opening the email link. */
export function ResetPassword() {
  const { enabled, status, recovery, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!enabled) return <NotConfigured />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD) return setError(`Password should be at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setError('The passwords don’t match.');
    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return <AuthShell title="Checking your reset link…" />;
  }
  if (status !== 'signed_in' && !recovery) {
    return (
      <AuthShell title="Reset link expired" subtitle="This password-reset link is invalid or has expired.">
        <Button to="/auth?mode=forgot" fullWidth icon={KeyRound}>
          Request a new link
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password">
      <form className="auth-form" onSubmit={submit}>
        <Field icon={Lock} label="New password" value={password} onChange={setPassword} autoComplete="new-password" minLength={MIN_PASSWORD} toggleable />
        <Field icon={Lock} label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={MIN_PASSWORD} toggleable />
        {error && <Message tone="error">{error}</Message>}
        {done && <Message tone="success">Password updated. Taking you to AlgoVerse…</Message>}
        <Button type="submit" fullWidth icon={KeyRound} disabled={busy || done}>
          {busy ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  );
}
