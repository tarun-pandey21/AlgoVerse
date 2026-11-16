/** Request validation helpers. Each throws a ValidationError (→ HTTP 400/413). */

export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const LANGUAGES = ['java', 'cpp', 'python'];
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export function oneOf(value, allowed, name) {
  if (!allowed.includes(value)) throw new ValidationError(`${name} must be one of: ${allowed.join(', ')}.`);
  return value;
}

/** A trimmed string; optional strings return '' when missing. */
export function text(value, name, { max, required = false, min = 0 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(`${name} is required.`);
    return '';
  }
  if (typeof value !== 'string') throw new ValidationError(`${name} must be text.`);
  const trimmed = value.trim();
  if (required && trimmed.length < Math.max(1, min)) throw new ValidationError(`${name} is required.`);
  if (max && trimmed.length > max) throw new ValidationError(`${name} is too long (max ${max.toLocaleString()} characters).`, 413);
  return trimmed;
}

export function integer(value, name, { min, max, fallback }) {
  if (value === undefined || value === null) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new ValidationError(`${name} must be a whole number from ${min} to ${max}.`);
  return n;
}

/** An array of short strings (topic names etc.). */
export function stringList(value, name, { maxItems = 40, maxLength = 80 } = {}) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ValidationError(`${name} must be a list.`);
  if (value.length > maxItems) throw new ValidationError(`${name} has too many items (max ${maxItems}).`);
  return [...new Set(value.map((item, i) => text(item, `${name}[${i}]`, { max: maxLength })).filter(Boolean))];
}

/**
 * Tutor conversation: [{ role: 'user'|'assistant', content: string }, ...]
 * Must alternate, start and end with a user turn, and fit the size limits.
 * Older turns are dropped (keeping a user turn first) when over maxMessages.
 */
export function conversation(value, { maxMessages, maxMessageChars, maxConversationChars }) {
  if (!Array.isArray(value) || value.length === 0) throw new ValidationError('messages must be a non-empty list.');
  if (value.length > 200) throw new ValidationError('Conversation is too long. Start a new chat.', 413);

  const messages = value.map((m, i) => {
    if (!m || typeof m !== 'object') throw new ValidationError(`messages[${i}] is invalid.`);
    const role = oneOf(m.role, ['user', 'assistant'], `messages[${i}].role`);
    const content = text(m.content, `messages[${i}].content`, { required: true });
    if (role === 'user' && content.length > maxMessageChars) {
      throw new ValidationError(`Your message is too long (max ${maxMessageChars.toLocaleString()} characters).`, 413);
    }
    return { role, content };
  });

  for (let i = 0; i < messages.length; i += 1) {
    const expected = i % 2 === 0 ? 'user' : 'assistant';
    if (messages[i].role !== expected) throw new ValidationError('Messages must alternate between user and assistant, starting with user.');
  }
  if (messages.at(-1).role !== 'user') throw new ValidationError('The last message must be from the user.');

  // Keep the most recent context within limits.
  let kept = messages.slice(-maxMessages);
  if (kept[0].role !== 'user') kept = kept.slice(1);
  const size = (list) => list.reduce((sum, m) => sum + m.content.length, 0);
  while (kept.length > 1 && size(kept) > maxConversationChars) kept = kept.slice(2);
  if (size(kept) > maxConversationChars) throw new ValidationError('Your message is too long.', 413);
  return kept;
}
