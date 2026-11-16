/**
 * npm run judge0:check
 *
 * Tests the code execution service configured in .env (JUDGE0_URL,
 * JUDGE0_AUTH_TOKEN, …) with REAL submissions, through the same client the
 * Run / Submit buttons use:
 *
 *   1. each configured language id exists on the service (GET /languages/{id})
 *   2. Java, C++ and Python programs read stdin and print the right output
 *   3. compile errors (Java, C++) are reported as "Compilation Error"
 *   4. a Python exception is reported as a runtime error
 *   5. an infinite loop is stopped by the time limit
 *
 * Uses 7 runs of your plan's quota. Never prints the API key.
 */
import { config, isExecutionConfigured } from '../server/config.js';
import { executeOnce, provider, Judge0Error } from '../server/judge0.js';

const mask = (key) => (key ? `${key.slice(0, 4)}…${key.slice(-4)} (${key.length} chars)` : '(not set)');
const NAMES = { java: 'Java', cpp: 'C++', python: 'Python' };

if (!isExecutionConfigured()) {
  console.error('✗ JUDGE0_URL is not set in .env. For OnlineCompiler.io use:\n  JUDGE0_URL=https://api.onlinecompiler.io/api/judge0\n  JUDGE0_AUTH_TOKEN=<your API key>');
  process.exit(1);
}

const service = provider();
console.log(`Service:  ${service.label}`);
console.log(`URL:      ${config.judge0.url}`);
console.log(`API key:  ${mask(config.judge0.authToken)} → sent as X-Auth-Token`);
console.log(`Language ids: Java ${config.judge0.languageIds.java}, C++ ${config.judge0.languageIds.cpp}, Python ${config.judge0.languageIds.python}`);
if (service.id === 'onlinecompiler' && !config.judge0.authToken) {
  console.error('✗ JUDGE0_AUTH_TOKEN is empty. Add your OnlineCompiler.io API key to .env.');
  process.exit(1);
}

let failed = 0;
const report = (ok, label, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? '✓ PASS' : '✗ FAIL'}  ${label}${detail ? `: ${detail}` : ''}`);
};

// 1. language ids
console.log('\nChecking language ids…');
for (const [language, id] of Object.entries(config.judge0.languageIds)) {
  try {
    const response = await fetch(`${config.judge0.url}/languages/${id}`, { headers: { Accept: 'application/json' } });
    const body = await response.json().catch(() => null);
    report(response.ok && body?.id === id, `${NAMES[language]} → id ${id}`, response.ok ? `"${body?.name}"` : `HTTP ${response.status}`);
  } catch (error) {
    report(false, `${NAMES[language]} → id ${id}`, error.message);
  }
}

// 2–5. real runs
const PROGRAMS = {
  java: 'import java.util.*;\npublic class Main {\n  public static void main(String[] a) {\n    Scanner s = new Scanner(System.in);\n    int x = s.nextInt(), y = s.nextInt();\n    System.out.println("sum=" + (x + y));\n  }\n}\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() { long long x, y; cin >> x >> y; cout << "sum=" << x + y << endl; return 0; }\n',
  python: 'x, y = map(int, input().split())\nprint(f"sum={x + y}")\n',
};
const COMPILE_ERRORS = {
  java: 'public class Main {\n  public static void main(String[] a) {\n    int x = "text";\n  }\n}\n',
  cpp: '#include <iostream>\nint main() { std::cout << undefinedName; }\n',
};

async function run(label, language, sourceCode, stdin, check) {
  const started = Date.now();
  try {
    const result = await executeOnce({ language, sourceCode, stdin });
    const verdict = check(result);
    report(verdict === true, label, `${result.statusDescription}${verdict === true ? '' : ` (${verdict})`} in ${((Date.now() - started) / 1000).toFixed(1)} s`);
  } catch (error) {
    report(false, label, error instanceof Judge0Error ? error.message : error.message);
  }
}

console.log('\nRunning programs (7 runs)…');
for (const language of ['java', 'cpp', 'python']) {
  await run(`${NAMES[language]}: reads stdin, prints output`, language, PROGRAMS[language], '20 22\n', (r) =>
    r.statusId === 3 && r.stdout.trim() === 'sum=42' ? true : `stdout=${JSON.stringify(r.stdout.slice(0, 80))} stderr=${JSON.stringify((r.stderr || r.compileOutput).slice(0, 120))}`,
  );
}
for (const language of ['java', 'cpp']) {
  await run(`${NAMES[language]}: compile error is reported as Compilation Error`, language, COMPILE_ERRORS[language], '', (r) =>
    r.statusId === 6 && r.compileOutput.trim() ? true : `status ${r.statusId}, stderr=${JSON.stringify(r.stderr.slice(0, 120))}`,
  );
}
await run('Python: exception is reported as a runtime error', 'python', 'raise ValueError("boom")\n', '', (r) =>
  r.statusId >= 7 && r.statusId <= 12 && /ValueError/.test(r.stderr) ? true : `status ${r.statusId}`,
);
await run('Python: infinite loop stopped by the time limit', 'python', 'while True:\n    pass\n', '', (r) => (r.statusId === 5 ? true : `status ${r.statusId}`));

console.log(failed ? `\n${failed} check(s) failed. See the messages above.` : `\nAll checks passed: ${service.label} is ready for Run and Submit.`);
process.exit(failed ? 1 : 0);
