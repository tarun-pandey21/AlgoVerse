import { useEffect, useRef, useState } from 'react';
import { Save, RotateCcw, Check, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Toggle from '../components/Toggle';
import { useUser, getInitials } from '../context/UserContext';
import { useLearningProgress } from '../context/LearningProgressContext';
import { usePracticeProgress } from '../context/PracticeProgressContext';
import { LANGUAGES as CODE_LANGUAGES } from '../data/languages';
import './Settings.css';

const LANGUAGES = CODE_LANGUAGES.map((l) => l.label);
const GOALS = [1, 2, 3, 5, 8];

/**
 * Profile & preferences. Edits are held in a local draft and only applied
 * when the learner clicks "Save changes". Saved to the learner's Supabase
 * profile when signed in, otherwise to this browser.
 */
export default function Settings() {
  const { profile, updateProfile, resetProfile, status: profileStatus, error: profileError, source } = useUser();
  const inAccount = source === 'account';
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [resetError, setResetError] = useState(null);
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const { summary, resetAllProgress } = useLearningProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [progressCleared, setProgressCleared] = useState(false);
  const { stats: practice, resetPractice } = usePracticeProgress();
  const [confirmPracticeReset, setConfirmPracticeReset] = useState(false);
  const [practiceCleared, setPracticeCleared] = useState(false);

  // Keep the draft in sync with the saved profile (after loading or a reset).
  // While saving, a failed save restores the old profile; keep the learner's
  // edits in the form so they can retry.
  const keepDraft = useRef(false); // true from "Save" until the save settles
  useEffect(() => {
    if (keepDraft.current) {
      if (!saving) keepDraft.current = false;
      return;
    }
    setDraft(profile);
  }, [profile, saving]);

  // Hide the "Saved" confirmation after a moment
  useEffect(() => {
    if (!saved) return undefined;
    const id = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(id);
  }, [saved]);

  const setField = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }));
  const isDirty = JSON.stringify(draft) !== JSON.stringify(profile);
  const nameIsValid = draft.name.trim().length <= 80;
  const profileReady = profileStatus === 'ready';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!nameIsValid || !profileReady) return;
    const { email, ...editable } = draft; // email is managed by the account / not stored
    keepDraft.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile({ ...editable, name: draft.name.trim(), role: draft.role.trim(), dailyGoal: Number(draft.dailyGoal) });
      setSaved(true);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const runReset = async (action, onDone) => {
    setResetError(null);
    try {
      await action();
      onDone();
    } catch (error) {
      setResetError(error.message);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description={inAccount ? 'Manage your profile and learning preferences. Changes are saved to your account.' : 'Manage your profile and learning preferences. Changes are saved on this device.'}
      />

      {profileStatus === 'error' && (
        <p className="settings__error" role="alert">
          Your settings couldn’t be loaded: {profileError}
        </p>
      )}
      <form className="settings" onSubmit={handleSubmit} aria-busy={profileStatus === 'loading'}>
        <fieldset className="settings__fieldset" disabled={!profileReady || saving}>
        {/* Profile */}
        <section className="card settings__section">
          <div className="settings__intro">
            <h2>Profile</h2>
            <p>How you appear across AlgoVerse.</p>
          </div>
          <div className="settings__fields">
            <div className="settings__avatar-row">
              <span className="settings__avatar">{getInitials(draft.name) || '?'}</span>
              <p className="muted">{draft.name.trim() ? 'Your initials are used as your avatar.' : 'Add your name to personalise your greeting.'}</p>
            </div>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                className="input"
                value={draft.name}
                onChange={(e) => setField('name')(e.target.value)}
                maxLength={80}
                placeholder="Your name"
                aria-invalid={!nameIsValid}
              />
              {!nameIsValid && <p className="field__error">Please use at most 80 characters.</p>}
            </div>
            {inAccount && (
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" className="input" value={draft.email} readOnly aria-readonly="true" />
                <p className="field__hint">This is your sign-in email. It is managed by your account.</p>
              </div>
            )}
            <div className="field">
              <label htmlFor="role">Headline</label>
              <input
                id="role"
                className="input"
                value={draft.role}
                maxLength={120}
                placeholder="e.g. Computer Science student"
                onChange={(e) => setField('role')(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Learning preferences */}
        <section className="card settings__section">
          <div className="settings__intro">
            <h2>Learning preferences</h2>
            <p>Tune AlgoVerse to how you like to practise.</p>
          </div>
          <div className="settings__fields">
            <div className="field">
              <label htmlFor="goal">Daily problem goal</label>
              <select
                id="goal"
                className="select"
                value={draft.dailyGoal}
                onChange={(e) => setField('dailyGoal')(Number(e.target.value))}
              >
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g} {g === 1 ? 'problem' : 'problems'} per day
                  </option>
                ))}
              </select>
              <p className="field__hint">Shown in the sidebar's daily goal tracker.</p>
            </div>
            <div className="field">
              <span className="field__label">Code language</span>
              <div className="chip-group" role="radiogroup" aria-label="Preferred language">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    role="radio"
                    aria-checked={draft.preferredLanguage === lang}
                    className={`chip ${draft.preferredLanguage === lang ? 'chip--active' : ''}`}
                    onClick={() => setField('preferredLanguage')(lang)}
                  >
                    {draft.preferredLanguage === lang && <Check size={14} strokeWidth={2.6} />}
                    {lang}
                  </button>
                ))}
              </div>
              <p className="field__hint">Used for the code examples in every lesson. You can also switch it on any lesson page.</p>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="card settings__section">
          <div className="settings__intro">
            <h2>Notifications</h2>
            <p>Your choices are saved. AlgoVerse doesn’t send emails yet.</p>
          </div>
          <div className="settings__fields settings__fields--flush">
            <Toggle
              id="emailReminders"
              label="Daily practice reminders"
              description="A gentle nudge if you haven't practised today."
              checked={draft.emailReminders}
              onChange={setField('emailReminders')}
            />
            <Toggle
              id="weeklyReport"
              label="Weekly progress report"
              description="A summary of what you learned this week."
              checked={draft.weeklyReport}
              onChange={setField('weeklyReport')}
            />
            <Toggle
              id="streakAlerts"
              label="Streak alerts"
              description="Get notified when your streak is at risk."
              checked={draft.streakAlerts}
              onChange={setField('streakAlerts')}
            />
          </div>
        </section>

        </fieldset>
        {/* Actions */}
        <div className="settings__actions">
          <Button
            variant="ghost"
            icon={RotateCcw}
            disabled={!profileReady || saving}
            onClick={() => resetProfile().catch((error) => setSaveError(error.message))}
          >
            Reset preferences
          </Button>
          <div className="settings__save">
            {saved && (
              <span className="settings__saved" role="status">
                <Check size={16} /> Changes saved
              </span>
            )}
            {saveError && (
              <span className="settings__error" role="alert">
                Not saved: {saveError}
              </span>
            )}
            <Button type="submit" icon={Save} disabled={!isDirty || !nameIsValid || !profileReady || saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </form>
      {resetError && (
        <p className="settings__error" role="alert">
          {resetError}
        </p>
      )}

      {/* Learning progress (stored separately from the profile) */}
      <section className="card settings__section">
        <div className="settings__intro">
          <h2>Learning progress</h2>
          <p>{inAccount ? 'Your lesson progress is saved in your account.' : 'Your lesson progress is saved in this browser.'}</p>
        </div>
        <div className="settings__fields">
          <p className="settings__progress-summary">
            <strong>{summary.completedTopics}</strong> of {summary.totalTopics} topics completed ·{' '}
            <strong>{summary.readSections}</strong> sections read
          </p>
          {confirmReset ? (
            <div className="settings__confirm" role="alert">
              <p>This clears every section you&apos;ve marked as read. It can&apos;t be undone.</p>
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  icon={Trash2}
                  className="btn--danger"
                  onClick={() =>
                    runReset(resetAllProgress, () => {
                      setConfirmReset(false);
                      setProgressCleared(true);
                    })
                  }
                >
                  Yes, reset progress
                </Button>
              </div>
            </div>
          ) : (
            <div className="settings__reset-row">
              <Button variant="secondary" icon={Trash2} onClick={() => setConfirmReset(true)}>
                Reset learning progress
              </Button>
              {progressCleared && (
                <span className="settings__saved" role="status">
                  <Check size={16} /> Progress cleared
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Coding practice history */}
      <section className="card settings__section">
        <div className="settings__intro">
          <h2>Coding practice</h2>
          <p>{inAccount ? 'Your submissions and saved code drafts are stored in your account.' : 'Your submissions and saved code drafts are stored in this browser.'}</p>
        </div>
        <div className="settings__fields">
          <p className="settings__progress-summary">
            <strong>{practice.solvedCount}</strong> of {practice.total} problems solved ·{' '}
            <strong>{practice.submissionCount}</strong> submissions
          </p>
          {confirmPracticeReset ? (
            <div className="settings__confirm" role="alert">
              <p>This deletes your submission history and every saved code draft. It can&apos;t be undone.</p>
              <div>
                <Button variant="secondary" size="sm" onClick={() => setConfirmPracticeReset(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  icon={Trash2}
                  className="btn--danger"
                  onClick={() =>
                    runReset(resetPractice, () => {
                      setConfirmPracticeReset(false);
                      setPracticeCleared(true);
                    })
                  }
                >
                  Yes, reset practice
                </Button>
              </div>
            </div>
          ) : (
            <div className="settings__reset-row">
              <Button variant="secondary" icon={Trash2} onClick={() => setConfirmPracticeReset(true)}>
                Reset practice history
              </Button>
              {practiceCleared && (
                <span className="settings__saved" role="status">
                  <Check size={16} /> Practice history cleared
                </span>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
