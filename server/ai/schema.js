/**
 * JSON Schema helpers for structured Claude responses.
 *
 * - strictSchema(): adapts a schema to the subset Anthropic's structured
 *   outputs (output_config.format) accepts: every object gets
 *   additionalProperties: false and lists all its properties as required,
 *   and type arrays such as ["integer", "null"] become anyOf.
 * - validate(): checks a parsed response against the same schema, so the
 *   frontend never receives a malformed result (whichever mode produced it).
 * - extractJson(): pulls a JSON object out of plain text (fallback mode).
 */

export function strictSchema(schema) {
  if (Array.isArray(schema)) return schema.map(strictSchema);
  if (!schema || typeof schema !== 'object') return schema;

  if (Array.isArray(schema.type)) {
    const { type, description, ...rest } = schema;
    return {
      ...(description ? { description } : {}),
      anyOf: type.map((t) => strictSchema({ ...rest, type: t })),
    };
  }

  const out = { ...schema };
  if (out.type === 'object' && out.properties) {
    out.properties = Object.fromEntries(Object.entries(out.properties).map(([key, value]) => [key, strictSchema(value)]));
    out.required = Object.keys(out.properties);
    out.additionalProperties = false;
  }
  if (out.items) out.items = strictSchema(out.items);
  if (out.anyOf) out.anyOf = out.anyOf.map(strictSchema);
  return out;
}

const typeOf = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
};

const matchesType = (value, type) => typeOf(value) === type || (type === 'number' && typeOf(value) === 'integer');

/** Returns a list of problems ("path: message"); empty when valid. */
export function validate(value, schema, path = '$') {
  if (schema.anyOf) {
    const ok = schema.anyOf.some((option) => validate(value, option, path).length === 0);
    return ok ? [] : [`${path}: does not match any allowed shape`];
  }
  if (schema.type && !matchesType(value, schema.type)) return [`${path}: expected ${schema.type}, got ${typeOf(value)}`];
  if (schema.enum && !schema.enum.includes(value)) return [`${path}: "${value}" is not one of ${schema.enum.join(', ')}`];

  const errors = [];
  if (schema.type === 'object' && schema.properties) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push(`${path}.${key}: missing`);
    }
    for (const [key, sub] of Object.entries(schema.properties)) {
      if (key in value) errors.push(...validate(value[key], sub, `${path}.${key}`));
    }
  }
  if (schema.type === 'array' && schema.items) {
    value.forEach((item, i) => errors.push(...validate(item, schema.items, `${path}[${i}]`)));
  }
  return errors;
}

/** Parse JSON from model text, tolerating ```json fences or a short preamble. */
export function extractJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      /* fall through */
    }
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      /* fall through */
    }
  }
  return undefined;
}
