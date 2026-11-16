# AlgoVerse

**Learn. Practice. Master.** An AI-powered Data Structures & Algorithms learning platform.

**Phase 1** built the frontend foundation: dashboard, sidebar navigation, routing, a responsive light theme and reusable components.

**Phase 2** adds the complete DSA Learning Module:

- A Learn DSA homepage with overall progress, Beginner/Intermediate/Advanced levels, search and filters.
- 16 lessons, from Programming Fundamentals to Dynamic Programming. Each has 10 expandable sections: introduction, concepts, applications, terminology, Java code, step-by-step algorithm, complexity, common mistakes, key takeaways and practice questions.
- 33 Java examples with syntax highlighting, notes on important lines, expected output and complexity. Every example was compiled and run with JDK 21, so each expected output is the program's real output.
- Interactive visualizers for array operations, linear search, binary search, and bubble, selection and insertion sort.
- Progress tracking in localStorage: mark sections read, mark topics complete, and move between lessons with Previous/Next.

**Phase 3** adds multi-language code:

- Every one of the 33 examples is available in **Java** (default), **C++** and **Python**: 99 programs in total, each with comments, notes on important lines, expected output and time/space complexity.
- A language selector appears on every code block, at the top of the Code Examples section and in the lesson sidebar. All of them share one saved preference (the profile's `preferredLanguage` in localStorage), which Settings shows too.
- Explanations are language-independent. Language-specific tips appear in an “In Java / C++ / Python” note inside each lesson's concepts, which follows the selected language.
- Syntax highlighting for all three languages (`components/lesson/highlightCode.js`, no dependencies).
- Every program was compiled and run (JDK 21; g++ 13 with `-std=c++17 -Wall -Wextra -Werror` plus address and undefined-behaviour checks; Python 3.13), and each "Expected output" is the program's real output.

**Phase 4** adds the Coding Practice module:

- **Practice dashboard:** total, solved, attempted, solving streak, overall progress and accuracy; recently attempted and recommended problems; progress by difficulty and by topic.
- **Problem library:** 33 problems across 16 topics (Easy / Medium / Hard), with search, difficulty, topic and status filters, and sorting.
- **Problem pages:** description, a plain-words explanation, input and output formats, constraints, worked examples, extra test cases, step-by-step hints, and previous/next navigation.
- **Coding workspace:** a CodeMirror 6 editor with Java (default), C++ and Python, syntax highlighting, auto-indent, line numbers, starter code for every problem and language, auto-saved drafts, Reset and Copy. The language follows your saved preference.
- **Run & Submit** via a secure backend + Judge0. Run checks the sample tests and shows output and errors per test. Submit also runs hidden tests and returns Accepted, Wrong Answer, Compilation Error, Runtime Error or Time Limit Exceeded, with the number of tests passed.
- **Progress tracking** (localStorage, behind a storage module ready for a database): solved and attempted problems, submission history, accuracy, streaks, and difficulty-wise and topic-wise progress. The dashboard, sidebar daily goal, top-bar streak and My Progress now use these real numbers.

**Phase 5** integrates **Claude** (Anthropic) through the official `@anthropic-ai/sdk`, always via the backend:

- **AI Tutor** (`/ai-tutor`): a streaming chat that explains DSA concepts for beginners, step by step, with Java, C++ or Python code (follows your language preference), time and space complexity, and **hints before full solutions**. Follow-ups use the conversation so far. It can be opened from a practice problem or a lesson, and that page is sent as context.
- **AI Code Reviewer** (`/code-analyzer`): finds bugs, logical mistakes and edge cases, explains them with line numbers and suggested fixes, and reviews readability, coding practices and complexity.
- **AI Complexity Analyzer** (`/code-analyzer?mode=complexity`): best, average and worst-case time, extra space, step-by-step reasoning, assumptions and possible optimizations. It is always labelled an **estimate, not formal verification**.
- **AI Question Generator** (`/ai-questions`): original problems by topic, difficulty and language, with statement, signature, examples, constraints, progressive hints and a hidden approach.
- **AI Learning Roadmap** (`/ai-roadmap`): a week-by-week plan from your real lesson progress, solved problems, weak areas, skill level, target difficulty and available time. It links to AlgoVerse lessons and practice problems.

The browser never talks to Anthropic and never sees the API key. When `ANTHROPIC_API_KEY` is missing, the AI pages say so plainly and nothing is simulated.

**Phase 6** adds the **Supabase** foundation (PostgreSQL + Supabase Auth):

- **Database schema** (`supabase/migrations/`): profiles, preferences, lesson progress, submissions and problem statistics, code drafts, AI Tutor conversations, generated questions and roadmaps. Row Level Security is on every table, and an auto-generated catalog seed holds the real topics and problems. See [docs/DATABASE.md](docs/DATABASE.md).
- **Accounts:** sign up, sign in, sign out, forgot/reset password (`/auth`, `/auth/reset`), and an account menu in the top bar. Supabase Auth handles passwords; AlgoVerse never stores them.
- **Protected API:** the Express server verifies Supabase access tokens (`supabase.auth.getClaims`) and exposes `/api/account/me`. In production (`npm start`) it requires sign-in for AI features and code execution (`AI_REQUIRE_AUTH`, `EXECUTION_REQUIRE_AUTH`), and rate limits count per user.
- **Real data only:** there is no sample learner, seeded progress or demo statistics. When signed in, the dashboard, My Progress, Learn DSA, Practice, Settings, the top bar and the AI Roadmap read **your** rows from Supabase. The rows are filtered by your user id and protected by RLS. A new account starts at 0, with a "Get started" guide. If the data can't be loaded, the app says so and shows no placeholder numbers.
- **Signed out:** progress is kept in this browser only, and the pages say so.

The sample learner starts with some lessons already completed so the dashboard shows realistic data; **Settings → Reset learning progress** clears it.

## Tech stack

- React 18 + Vite 5
- JavaScript (JSX)
- Plain CSS3 with design tokens (CSS custom properties)
- React Router 6
- Lucide React icons
- API server: Node.js + Express 5, official Anthropic SDK (`@anthropic-ai/sdk`), Judge0 for code execution
- Supabase: PostgreSQL with Row Level Security, Supabase Auth (`@supabase/supabase-js`)

## Getting started

**You need:** Node.js 18 or newer (check with `node -v`).

```bash
cd algoverse-phase6
npm install          # install dependencies
npm run dev:full     # start the app (http://localhost:5173) and the API server together
```

Other scripts:

```bash
npm run dev          # frontend only (Vite). Code execution will show "server offline"
npm run server       # API server only (http://localhost:8787)
npm run build        # production build into dist/
npm start            # PRODUCTION server (sign-in required for AI + code execution); serves dist/ after `npm run build`
npm run practice:tests   # regenerate practice test cases (needs Python 3)
npm run ai:check     # send one tiny test message to Claude with your .env settings
npm run db:seed-sql  # regenerate the database catalog seed from src/data
```

### Updating to a new version

Every update ships as **`algoverse-phase6.zip`** with the same root folder, **`algoverse-phase6/`**. The ZIP never contains `.env` (or any `.env.*` file except `.env.example`), `node_modules` or `dist`, so you can extract it over your existing folder:

1. Stop the dev servers.
2. Extract `algoverse-phase6.zip` into the folder that **contains** `algoverse-phase6/` and choose "replace" for existing files. Your `.env` is untouched because it isn't in the ZIP.
3. Run `npm install` in case dependencies changed.
4. Compare `.env.example` with your `.env`. New optional settings are added there with empty values; existing names never change.
5. If the update adds files in `supabase/migrations/`, run only the new ones.
6. Start again with `npm run dev:full`.

Extracting doesn't delete files that a newer version removed. Each update's notes list any files that should be deleted.

### Where your data lives

| Data | Signed in (Supabase) | Signed out |
| --- | --- | --- |
| Name, headline, preferences | `profiles`, `user_preferences` | this browser |
| Lessons read, completed topics, last visited | `section_progress`, `topic_progress` | this browser |
| Submissions, solved/attempted, streaks, activity | `submissions` (saved by the API server with `SUPABASE_SECRET_KEY`), `problem_progress` | this browser |
| Code drafts | `code_drafts` | this browser |
| AI Tutor chats, generated questions, roadmaps | this browser, **separately for each account** (database storage not built yet) | this browser |

Streaks and the weekly chart use your **local calendar days**, computed from your real accepted-submission times.

### Supabase setup (database + accounts)

1. **Create a project** at [supabase.com](https://supabase.com/dashboard) and note its URL (`https://<ref>.supabase.co`).
2. **Run the migrations**, in order. Either:
   - **SQL editor:** paste and run `supabase/migrations/20261114120000_algoverse_schema.sql`, then `20261114120100_catalog_seed.sql`, then `20261116120000_profile_name_from_signup_only.sql`; or
   - **Supabase CLI:** `npx supabase login`, `npx supabase link --project-ref <ref>`, then `npx supabase db push`. If the CLI asks for a `supabase/config.toml`, run `npx supabase init` first and keep the existing `migrations` folder.
3. **Authentication → Sign In / Providers:** keep **Email** enabled. "Confirm email" is recommended; the sign-up page handles both settings.
4. **Authentication → URL Configuration:** set the Site URL to `http://localhost:5173` and add `http://localhost:5173/**` to Redirect URLs. Add your production URL later.
5. **Project Settings → API Keys:** copy the **publishable** key (`sb_publishable_…`) and create or copy a **secret** key (`sb_secret_…`). JWT signing keys (asymmetric) are recommended, so the server can verify tokens locally.
6. Add to `.env`:
   ```bash
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...          # server only
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   # AI_REQUIRE_AUTH / EXECUTION_REQUIRE_AUTH: on automatically with `npm start` (see "Deploying to production")
   ```
   Only the URL and the **publishable** key may go in `VITE_` variables. The build stops with an error if a secret key, service-role key or Anthropic key appears in one.
7. Restart `npm run dev:full`, click **Sign in → Create account**, and check that **Table Editor → profiles** shows your new row.

After editing topics or problems in `src/data`, run `npm run db:seed-sql` and apply the regenerated seed.

### Enabling the AI features (Claude API)

1. Create an API key at [console.anthropic.com](https://console.anthropic.com/) (Settings → API Keys). The account needs credits.
2. Copy `.env.example` to `.env` in the project root (next to `package.json`) and set:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-sonnet-5-5   # optional; any Messages API model id you have access to
   ```
   Never put the key in a `VITE_*` variable or anywhere under `src/`: Vite would bundle it into the browser code. `.env` is git-ignored.
3. Run `npm run ai:check`. It prints Claude's real reply, or the exact problem (invalid key, unknown model, no credits, rate limit, network). Run `npm run ai:check -- --all` to call every AI feature once and get PASS/FAIL per feature.
4. Start everything with `npm run dev:full` and open **AI Tutor**. The Overview cards show **Ready** once the server has a key.

If `ANTHROPIC_BASE_URL` is set in your shell (some tools set it), the SDK uses that address. `npm run ai:check` prints it; unset it to use `https://api.anthropic.com`.

**Structured responses:** the Code Reviewer, Complexity Analyzer, Question Generator and Roadmap need JSON in a fixed shape. They use Anthropic's **structured outputs** (`output_config.format` with `type: "json_schema"`), not forced tool use: Claude Sonnet 5.5, Opus 5.5 and other recent models reject `tool_choice` of type `tool` or `any` with a 400 error. Schemas are made strict automatically (`server/ai/schema.js`), and every reply is parsed and validated before it reaches the browser. A malformed reply is retried once, then shown as an error. If a model doesn't support structured outputs, the server falls back to asking for JSON in the prompt (`ANTHROPIC_STRUCTURED_MODE`).

**How it is protected:** all Claude calls go through `server/routes/ai.js`. Requests are validated (roles, languages, enums, sizes), long tutor histories are trimmed to recent turns, code and messages have length limits, bodies are capped at 128 KB, and AI routes have their own per-client rate limit (20 requests / 5 min by default). SDK errors become clear messages (invalid key, model not found, rate limited, overloaded, timeout, empty or cut-off response). Requests are cancelled when the user presses Stop or leaves the page, so you don't pay for unused tokens.

### Enabling code execution (Judge0)

Run and Submit send code to **Judge0**, a sandboxed code-execution service, through the API server in `server/`. Code is **never** executed in the browser or by the AlgoVerse server itself. Until Judge0 is configured, the editor says so clearly and nothing is run or recorded.

1. Copy `.env.example` to `.env`.
2. Point it at a Judge0 instance:
   - **Self-hosted Judge0 CE** (free; Docker): `JUDGE0_URL=http://localhost:2358` (plus `JUDGE0_AUTH_TOKEN` if your instance requires one).
   - **Hosted Judge0 on RapidAPI**: `JUDGE0_URL=https://judge0-ce.p.rapidapi.com`, `JUDGE0_RAPIDAPI_KEY=…`, `JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com`.
   - **OnlineCompiler.io** (Judge0-compatible, free plan): `JUDGE0_URL=https://api.onlinecompiler.io/api/judge0` and `JUDGE0_AUTH_TOKEN=<your OnlineCompiler.io API key>`. Leave the RapidAPI variables empty. The key stays on the server and is sent as the `X-Auth-Token` header.
3. Run `npm run judge0:check`. It looks up the three language ids on the service and runs real Java, C++ and Python programs (output, compile error, runtime error, time limit), printing PASS/FAIL for each.
4. Restart the API server. The workspace shows **Judge0 connected** (or **OnlineCompiler.io connected**) once it can run code.

Rate limits (HTTP 429) and temporary outages (503) are retried twice with backoff, then shown to the user as a clear message; a rejected API key or unsupported language id is also reported clearly. The key never reaches the browser or the logs.

Language ids default to Judge0 CE's Java 13 (62), C++17/GCC 9 (54) and Python 3.8 (71); override them in `.env` if your instance differs. The API applies per-test time and memory limits, a code size limit and a per-IP rate limit (all configurable).

## Deploying to production

```bash
npm install
npm run build        # builds dist/ – VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY must be set at build time
npm start            # = node server/index.js --production
```

**What production mode changes** (`npm start`, or `NODE_ENV=production`):

| Setting | Development (`npm run server`, `npm run dev:full`) | Production (`npm start`) |
| --- | --- | --- |
| AI features (`AI_REQUIRE_AUTH`) | open | **sign-in required** |
| Run / Submit code (`EXECUTION_REQUIRE_AUTH`) | open | **sign-in required** |
| Listens on (`HOST`) | `127.0.0.1` | `0.0.0.0` |
| API request log (`LOG_REQUESTS`) | off | on (method, path, status, time; never bodies, tokens or code) |

Each can be overridden in `.env`. Signed-out visitors see "Sign in to use AI features" / "Sign in to run your code" with a sign-in link that brings them back. If sign-in is required but Supabase isn't configured, the server logs a warning at startup and those features answer `503 auth_not_configured`; nothing is silently left open.

**TRUST_PROXY.** Set `TRUST_PROXY=1` (the number of proxy hops) **only** when a reverse proxy, load balancer or platform router sits in front of the server: Nginx, Caddy, Render, Railway, Fly.io, Heroku, Cloudflare and so on. It then:
- uses the visitor's real IP for rate limits (otherwise every visitor shares the proxy's IP and one limit);
- recognises HTTPS, so `Strict-Transport-Security` is sent.

Leave it empty when browsers connect directly; otherwise anyone could fake their IP with an `X-Forwarded-For` header.

**Security headers** (sent by the Express server; `npm run dev` is unaffected):
- **Content-Security-Policy:**
  - scripts from this site only;
  - styles from this site and Google Fonts; fonts from Google Fonts;
  - network requests to this site and your Supabase project, plus `CSP_CONNECT_SRC` for any extra origin;
  - no framing, no plugins.
- **Strict-Transport-Security**, for HTTPS requests only.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a `Permissions-Policy` and `Cross-Origin-Opener-Policy`.
- API responses get a deny-all CSP.

**Performance and caching:**
- Responses are gzip-compressed. The AI Tutor's live stream is excluded, so it isn't buffered.
- Hashed `/assets/*` files are cached for a year (`immutable`).
- `index.html` is always revalidated (`no-cache`), so a new deploy is picked up immediately.
- A missing file (for example an old build's chunk) gets a real `404`. In the app, a page that fails to download shows a "This page couldn't be loaded · Reload page" card instead of a blank screen.

**Restarts and crashes:**
- On `SIGTERM`/`SIGINT` (stop, redeploy, Ctrl+C) the server stops accepting connections and lets running requests finish, up to `SHUTDOWN_TIMEOUT_MS` (10 s). Then it exits.
- Unhandled promise rejections are logged and the server keeps running.
- An uncaught exception is logged, the server shuts down gracefully, and it exits with code 1, so your process manager (Docker, systemd, PM2, the platform) restarts it.

**Rate limits** (in memory, per server process; use a shared store such as Redis if you run several instances):

| Routes | Default limit | Settings |
| --- | --- | --- |
| AI routes | 20 requests / 5 min | `AI_RATE_LIMIT_*` |
| Code execution | 40 requests / 5 min | `RATE_LIMIT_*` |
| `/api/account` | 60 requests / min | `ACCOUNT_RATE_LIMIT_*` |

Limits are counted per signed-in user, otherwise per IP.

### Supabase dashboard settings for production

These are set in the Supabase dashboard, not in code:
1. **Authentication → Providers → Email:** set **Minimum password length to 8**, which matches the sign-up form. Supabase's own default is 6, and the form's check alone can be bypassed.
2. **Same page:** keep **Confirm email** on.
3. **Authentication → Providers → Email → password security:** turn on **leaked password protection**, if your plan offers it.
4. **Authentication → URL Configuration:** set the **Site URL** to your production URL (`https://…`), and add `https://<your-domain>/**` to **Redirect URLs**. Keep the `http://localhost:5173/**` entry for local development.
5. **Project Settings → API Keys:** keep the **secret** key only in the server's environment, never in a `VITE_` variable.

## Folder structure

```
algoverse-phase6/
├── public/
│   └── favicon.svg              # Brand mark
├── server/                      # API server (Node + Express)
│   ├── index.js                 # Starts the server
│   ├── app.js                   # Express app: /api/health, /api/execution/*, /api/ai/*, dist/
│   ├── routes/
│   │   ├── execution.js         # /api/execution/status, /run, /submit (Judge0)
│   │   └── ai.js                # /api/ai/status, /tutor (SSE), /review, /complexity, /questions, /roadmap
│   ├── ai/                      # Claude features (official @anthropic-ai/sdk)
│   │   ├── client.js            # SDK client, error mapping, structured-output helper (output_config.format)
│   │   ├── schema.js            # Strict JSON Schema conversion, response validation, JSON extraction
│   │   ├── prompts.js           # System prompts for every feature
│   │   ├── tutor.js             # Streaming tutor replies
│   │   ├── reviewer.js · complexity.js · questions.js · roadmap.js   # One service per feature, each with a JSON schema
│   │   └── format.js            # Prompt helpers (numbered code, problem context)
│   ├── supabase.js              # Token verification (getClaims), RLS-scoped user client, secret-key admin client
│   ├── routes/account.js        # /api/account/status, /api/account/me
│   ├── middleware/
│   │   ├── securityHeaders.js   # CSP (Supabase + Google Fonts allowed), HSTS on HTTPS, frame protection
│   │   ├── requestLogger.js     # One line per API request in production
│   │   ├── auth.js              # authenticate (verifies Bearer tokens) + requireAuth
│   │   ├── rateLimit.js         # Per-user / per-IP sliding-window limiter
│   │   └── validate.js          # Request validation helpers
│   ├── judge.js                 # Runs tests via Judge0 and decides the verdict
│   ├── judge0.js                # Judge0 / OnlineCompiler.io client (wait=true, polling, retries)
│   ├── config.js                # Reads .env / environment variables
│   └── data/hiddenTests.json    # Hidden test cases: server-only, never sent to the browser
├── supabase/migrations/          # SQL: schema + RLS, generated catalog seed
├── docs/DATABASE.md             # Tables, relationships, security model
├── scripts/
│   ├── db/generate-catalog-seed.mjs # npm run db:seed-sql
│   ├── dev-all.mjs              # npm run dev:full (app + API together)
│   ├── ai-check.mjs             # npm run ai:check (one real test call to Claude)
│   ├── judge0-check.mjs         # npm run judge0:check (real runs against your execution service)
│   └── practice/generate_tests.py   # Reference solutions that generate all test cases
├── .env.example                 # Server, Judge0 and Claude settings (copy to .env)
├── src/
│   ├── assets/                  # Images / static assets (for later phases)
│   ├── components/              # Reusable UI building blocks (each with its own .css)
│   │   ├── Button.jsx           # One button for links (to=) and actions
│   │   ├── Badge.jsx            # Pills + DifficultyBadge
│   │   ├── ProgressBar.jsx      # Animated linear progress
│   │   ├── ProgressRing.jsx     # SVG donut chart
│   │   ├── ActivityChart.jsx    # 7-day bar chart (pure CSS)
│   │   ├── StatCard.jsx         # Headline metric card
│   │   ├── TopicCard.jsx        # DSA topic card
│   │   ├── TopicProgressList.jsx
│   │   ├── DailyChallenge.jsx   # Featured problem + countdown
│   │   ├── AIFeatureCard.jsx    # AI feature card with live status (Ready / Needs API key)
│   │   ├── ErrorBoundary.jsx    # "This page couldn't be loaded · Reload" instead of a blank screen
│   │   ├── ai/                  # Shared AI UI
│   │   │   ├── Markdown.jsx         # Safe Markdown renderer for Claude's answers (no HTML injection)
│   │   │   ├── AINotice.jsx         # Not configured / offline / error banners + footnote
│   │   │   └── AI.css               # Shared AI page styles
│   │   ├── FilterTabs.jsx       # Segmented filter control
│   │   ├── Toggle.jsx           # Accessible switch
│   │   ├── PageHeader.jsx / SectionHeader.jsx
│   │   ├── Sidebar.jsx / Topbar.jsx / Logo.jsx
│   │   ├── lesson/              # Lesson page building blocks
│   │   │   ├── LessonSection.jsx    # Expandable section with "mark as read"
│   │   │   ├── SectionContent.jsx   # Renders each of the 10 section types
│   │   │   ├── CodeBlock.jsx        # Java code + notes + output + complexity
│   │   │   ├── highlightCode.js     # Java / C++ / Python highlighter (no dependencies)
│   │   │   ├── LanguageSelector.jsx # Java · C++ · Python switch (shared, saved preference)
│   │   │   └── RichText.jsx         # **bold**, *italic*, `code` in lesson text
│   │   ├── practice/            # Coding workspace pieces
│   │   │   ├── CodeEditor.jsx       # CodeMirror 6 editor (languages load on demand)
│   │   │   ├── ProblemDescription.jsx
│   │   │   └── ResultsPanel.jsx     # Verdicts, per-test results, "not configured" states
│   │   └── visualizer/          # Algorithm visualizations
│   │       ├── algorithms.js        # Step generators (search + sorts)
│   │       ├── arrayOperations.js   # Insert/delete/access/update/search steps
│   │       ├── useFramePlayer.js    # Play/pause/step/speed hook
│   │       ├── AlgorithmVisualizer.jsx / ArrayOperationsVisualizer.jsx
│   │       └── ArrayView.jsx, PlayerControls.jsx, Legend.jsx, VisualizerPanel.jsx
│   ├── lib/supabase.js          # Browser Supabase client (publishable key only) + authHeaders()
│   ├── lib/safeRedirect.js      # Validates ?next= after sign-in (same-origin paths only)
│   ├── context/
│   │   ├── AuthContext.jsx              # Supabase Auth session: sign in/up/out, password reset
│   │   ├── UserContext.jsx              # Profile & preferences (localStorage)
│   │   ├── PracticeProgressContext.jsx  # Submissions → solved, streaks, accuracy…
│   │   └── LearningProgressContext.jsx  # Lesson progress (localStorage)
│   ├── data/                    # Sample data (replace with API calls later)
│   │   ├── topics.js            # 16 topics: metadata, levels, order
│   │   ├── lessonSections.js    # The 10 sections every lesson has
│   │   ├── lessons/             # One content file per topic (+ index.js); Java code lives here
│   │   │   └── implementations/ # C++ and Python versions of each topic's examples
│   │   ├── languages.js         # Supported code languages + file-name helper
│   │   ├── practice/            # Coding Practice data (shared with the server)
│   │   │   ├── problems.js          # Statements, signatures, constraints, hints
│   │   │   ├── visibleTests.json    # Examples + sample tests (generated)
│   │   │   ├── io.js                # stdin/stdout formats, shared with the server
│   │   │   ├── starterCode.js       # Generates Java / C++ / Python starter programs
│   │   │   └── index.js             # Problems ready for the UI
│   │   ├── problems.js          # Problem set + daily challenge
│   │   ├── user.js              # Stats, activity, defaults
│   │   ├── aiFeatures.js
│   │   └── navigation.js        # Sidebar items
│   ├── services/
│   │   ├── executionApi.js      # Calls the API server (never runs code locally)
│   │   ├── aiApi.js             # Calls /api/ai/* (streaming reader for the tutor)
│   │   └── practiceStore.js     # localStorage persistence (swap for a database later)
│   ├── hooks/
│   │   ├── useCodeLanguage.js   # Read/set the preferred code language
│   │   └── useAIStatus.js       # Is Claude configured on the server?
│   ├── layouts/
│   │   └── DashboardLayout.jsx  # Sidebar + top bar + <Outlet/>
│   ├── pages/                   # One file per route
│   │   ├── Overview.jsx         # Dashboard home
│   │   ├── LearnDSA.jsx  ·  TopicLesson.jsx (lazy-loaded)
│   │   ├── PracticeProblems.jsx  ·  ProblemWorkspace.jsx (lazy-loaded)
│   │   ├── AITutor.jsx  ·  CodeAnalyzer.jsx  ·  AIQuestions.jsx  ·  AIRoadmap.jsx (lazy-loaded)
│   │   ├── MyProgress.jsx  ·  Settings.jsx  ·  NotFound.jsx
│   │   ├── Auth.jsx             # /auth (sign in · create account · forgot password) and /auth/reset
│   ├── styles/
│   │   ├── variables.css        # Design tokens: colours, radii, shadows, fonts
│   │   └── global.css           # Reset, base styles, shared utilities
│   ├── App.jsx                  # Route table
│   └── main.jsx                 # Entry point
├── index.html
├── vite.config.js
└── package.json
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Overview (dashboard) |
| `/learn` · `/learn/:topicId` | Learn DSA homepage · lesson page (add `#code`, `#complexity`, etc. to open a section) |
| `/practice` · `/practice/:problemId` | Practice dashboard + problem library · coding workspace |
| `/ai-tutor` | AI Tutor (`?problem=<id>`, `?topic=<id>` add context; `?q=` pre-fills a question) |
| `/code-analyzer` | AI Code Review · `?mode=complexity` for the Complexity Analyzer · `?problem=<id>` loads your draft |
| `/ai-questions` | AI Question Generator |
| `/ai-roadmap` | AI Learning Roadmap |
| `/auth` · `/auth/reset` | Sign in / create account / forgot password · choose a new password (Supabase) |
| `/progress` | Detailed analytics |
| `/settings` | Profile & preferences |

## Adding or editing a lesson

1. Add the topic's metadata to `src/data/topics.js` (its position in the array sets the lesson order).
2. Create `src/data/lessons/<id>.js`, following the shape documented in `lessons/helpers.js`. Write Java code inside the `java` tagged template.
3. Register it in `src/data/lessons/index.js`.
4. Add the C++ and Python versions in `src/data/lessons/implementations/<id>.js` (one entry per example, same order) and register the file in `implementations/index.js`.
5. Optionally add `languageNotes: { java: [...], cpp: [...], python: [...] }` for language-specific tips.
6. Make sure every id in `practice` exists in `src/data/problems.js`.

## Adding a practice problem

1. Add the problem to `src/data/practice/problems.js`. Its `signature` (function name, typed parameters and return type) automatically produces the input/output format text and the starter code in all three languages.
2. Add a reference solution and test inputs to `scripts/practice/generate_tests.py`, then run `npm run practice:tests`. The first two visible tests become the worked examples, and hidden tests go to `server/data/hiddenTests.json`.
3. Optionally link it from a lesson's `practice` list.

## Where to go next

- Replace `src/data/*` with API calls once a backend exists. Components only receive plain objects, so they won't need to change.
- Add authentication, then swap `UserContext`'s localStorage persistence for the real user.
- **Phase 6 next steps:** move each feature from localStorage to Supabase when signed in: preferences/profile ↔ `UserContext`, lessons ↔ `section_progress`, practice ↔ server-recorded `submissions` + `code_drafts`, tutor chats, questions and roadmaps saved by the AI routes. Include a one-time "import my local progress" step.
- With accounts, store tutor chats and roadmaps server-side and move the AI rate limit to a shared store (e.g. Redis) if you run several server instances.

## AI API reference

All routes are on the API server; the browser calls them through the Vite proxy (dev) or the same origin (production).

| Route | Body | Returns |
| --- | --- | --- |
| `GET /api/ai/status` | none | `{ configured, model, limits }` (never the key) |
| `POST /api/ai/tutor` | `{ messages: [{role, content}], language, context? }` | Server-Sent Events: `start`, `delta {text}`, `done {truncated}`, `error {error, message}` |
| `POST /api/ai/review` | `{ language, code, problemId?, includeImprovedCode? }` | `{ data: { summary, verdict, issues[], strengths[], readability, complexity, improvedCode }, model }` |
| `POST /api/ai/complexity` | `{ language, code, problemId? }` | `{ data: { time {best, average, worst}, space, steps[], assumptions[], optimizations[], confidence, … }, model }` |
| `POST /api/ai/questions` | `{ topic, difficulty, language, count (1–3), focus? }` | `{ data: { questions[] }, model }` |
| `POST /api/ai/roadmap` | `{ skillLevel, targetDifficulty, weeks, hoursPerWeek, language, goals?, weakAreas[], completedTopics[], inProgressTopics[], solvedProblemIds[] }` | `{ data: { summary, focusAreas[], weeks[], tips[] }, model }` |

Errors are JSON `{ error, message }`: `not_configured` (503), `bad_request` (400/413), `rate_limited` (429), `auth_failed`, `model_not_found`, `bad_request_upstream`, `empty_response`, `invalid_response`, `truncated` (502), `overloaded` (503), `timeout` (504).
