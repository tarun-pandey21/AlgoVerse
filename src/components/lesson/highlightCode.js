/**
 * Minimal syntax highlighter for Java, C++ and Python (no dependencies).
 * Splits one line of code into tokens: comment, string, keyword, type,
 * number, annotation/preprocessor, function call or plain text.
 */

const words = (s) => new Set(s.split(/\s+/));

const LANGUAGE_RULES = {
  java: {
    comment: '//',
    keywords: words(`public private protected static final void int long double float boolean char byte
      short class new return if else for while do break continue true false null this super import
      package throw throws try catch finally extends implements interface record var instanceof switch
      case default enum abstract`),
    builtins: words(''),
  },
  cpp: {
    comment: '//',
    keywords: words(`int long double float bool char void auto const constexpr static class struct public
      private protected return if else for while do break continue true false nullptr new delete this
      using namespace template typename throw try catch explicit virtual override operator unsigned
      signed size_t sizeof switch case default enum inline friend`),
    builtins: words(`std cout cin endl vector string map unordered_map set unordered_set queue deque stack
      priority_queue pair list optional nullopt greater less istringstream boolalpha fixed setprecision
      INT_MAX INT_MIN LLONG_MIN LLONG_MAX hash swap min max sort to_string overflow_error underflow_error`),
  },
  python: {
    comment: '#',
    keywords: words(`def return if elif else for while in not and or is None True False class import
      from as pass break continue lambda yield try except finally raise with global nonlocal del assert`),
    builtins: words(`print len range enumerate zip sorted reversed list dict set tuple str int float min max
      sum all any abs ord chr isinstance super self map filter iter next open`),
  },
};

// Strings: "..." and '...' (Python allows both for strings; Java/C++ use '.' for chars)
const STRING = `"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'`;
const PATTERNS = {
  '//': new RegExp(`(\\/\\/.*$)|(${STRING})|(@\\w+|^\\s*#\\s*\\w+.*$)|\\b(\\d+(?:\\.\\d+)?[lLfFdDuU]*)\\b|\\b([A-Za-z_]\\w*)\\b`, 'g'),
  '#': new RegExp(`(#.*$)|((?:[fFrRbB]{1,2})?${STRING})|(@\\w+)|\\b(\\d+(?:\\.\\d+)?)\\b|\\b([A-Za-z_]\\w*)\\b`, 'g'),
};

export function highlightLine(line, language = 'java') {
  const rules = LANGUAGE_RULES[language] ?? LANGUAGE_RULES.java;
  const pattern = PATTERNS[rules.comment];
  const tokens = [];
  let last = 0;
  let match;
  pattern.lastIndex = 0;

  while ((match = pattern.exec(line)) !== null) {
    if (match[0] === '') {
      pattern.lastIndex++;
      continue;
    }
    if (match.index > last) tokens.push({ text: line.slice(last, match.index), type: 'plain' });
    const [text, comment, str, annotation, number, word] = match;

    let type = 'plain';
    if (comment) type = 'comment';
    else if (str) type = 'string';
    else if (annotation) type = 'annotation';
    else if (number) type = 'number';
    else if (word) {
      if (rules.keywords.has(word)) type = 'keyword';
      else if (rules.builtins.has(word)) type = 'builtin';
      else if (/^[A-Z]/.test(word)) type = 'type';
      else if (line[match.index + word.length] === '(') type = 'function';
    }

    tokens.push({ text, type });
    last = match.index + text.length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last), type: 'plain' });
  return tokens;
}
