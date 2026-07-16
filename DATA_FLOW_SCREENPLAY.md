# The Screenplay — I Am the Resume PDF

> *A first-person journey through the ResumeProof system.*
> *Every file, every function, every service I pass through — in exact order.*
> *No code. Just the map.*

---

## Cast of Characters

Before the story begins, here is everyone I will meet.

```
NGINX                   The bouncer at the door. Checks your ID before you enter.
ms1-orchestrator        The intake desk. Receives me, registers me, hands me off.
Redis + BullMQ          The job board. My work order sits here until a worker picks it up.
ms2-verification        The investigator. Pulls apart everything about me and the GitHub profile.
PostgreSQL              The permanent record. Everything about me is written here forever.
Groq API                The AI consultant. Reads my text and compares it to the job description.
GitHub REST API         The source of truth. Everything the candidate claimed gets checked here.
Webhook Dispatcher      The courier. Delivers my verdict to the client's server.
```

---

## Act 1 — Before I Exist

### Scene 1.1 — The Client's Developer Sits Down

A developer at KRMC Placement Portal has read the ResumeProof docs. They want to add verification to their "Apply Now" form. They already have a form. It collects: candidate name, email, resume PDF, GitHub URL, and optionally a job description.

They have an API key. It looks like `rp_live_k9mX2qL8nR4vT7wY`. It lives in their `.env` file on their backend server. It has never touched a browser. It never will.

Their backend is Express. When a candidate submits the form, their server receives the multipart POST. Then their server calls **our** API. The student never knows ResumeProof exists.

**The architecture from the client's side:**

```
Candidate fills form on KRMC site
  → KRMC frontend sends PDF + GitHub to KRMC's own backend
    → KRMC backend calls POST https://api.resumeproof.com/v1/verify
      → Our system does everything
        → We call KRMC's webhook when done
          → KRMC shows result to the hiring manager
```

The candidate's browser never touches our API. The API key never leaves KRMC's server. This is the correct model.

---

## Act 2 — I Am Created

### Scene 2.1 — The Candidate Clicks Submit

Arjun Mehra, a computer science student, fills in the KRMC Apply form:
- Uploads `resume_arjun_mehra.pdf` (2.4 MB)
- Types `https://github.com/arjun-mehra`
- The JD was pre-filled by KRMC (Backend Engineer role)

He clicks Submit. His browser POSTs to **KRMC's own backend** at `https://krmc.edu/api/apply`. I — the PDF — now exist as a buffer in KRMC's Node.js process memory.

### Scene 2.2 — KRMC's Backend Prepares the Call

KRMC's backend receives the multipart form. Their code (not ours — this is their responsibility) does a few things:

**File:** `krmc-server/src/routes/applyRoute.ts`
**Function:** `handleApplicationSubmit(req, res)`

It calls their own service:

**File:** `krmc-server/src/services/resumeProofClient.ts`
**Function:** `submitForVerification(pdfBuffer, githubUrl, jobDescription, candidateEmail)`

This function:
1. Creates a `FormData` object
2. Appends the PDF buffer as a file field named `resume`
3. Appends `githubUrl`, `jobDescription`, `candidateEmail` as text fields
4. Sets the header `x-api-key: rp_live_k9mX2qL8nR4vT7wY`
5. Calls `axios.post('https://api.resumeproof.com/v1/verify', formData, headers)`

I am now traveling over the internet as a multipart HTTP POST.

**Package used:** `axios` — for the HTTP call from KRMC's server to ours.
**Package used:** `form-data` — Node.js native FormData for file attachments.

---

## Act 3 — I Hit the Door

### Scene 3.1 — NGINX Receives Me

I arrive at `api.resumeproof.com`. The first thing I meet is NGINX, running on port 443 (HTTPS). NGINX is not an application server. It does not understand my contents. It only knows routing, limits, and headers.

**File:** `nginx/production.conf`

NGINX does the following checks immediately, in this order:

**Check 1 — Is the `x-api-key` header present?**
If the header is missing, NGINX returns `401 {"error":"missing_api_key"}` immediately. I never reach Express. NGINX does this with a simple `if ($http_x_api_key = "")` directive. Zero load on our application.

**Check 2 — Rate limiting by API key**
NGINX maintains a shared memory zone (`limit_req_zone`) keyed on the value of `$http_x_api_key`. Each key is allowed 10 requests per minute by default. If KRMC's key has already made 10 requests in the last 60 seconds, NGINX returns `429 Too Many Requests`. I am dropped.

**Check 3 — Request size**
`client_max_body_size 10M` — if I am larger than 10MB, NGINX returns `413 Request Entity Too Large`. I am dropped.

**Check 4 — SSL termination**
NGINX decrypts the HTTPS connection. Everything downstream (Express, FastAPI) speaks plain HTTP internally. SSL certificates are managed by Certbot (Let's Encrypt), auto-renewed. `nginx/ssl.conf` contains the certificate paths.

**If I pass all 4 checks:**
NGINX forwards me as a plain HTTP POST to `http://127.0.0.1:3001/v1/verify`, attaching two additional headers it sets itself:
- `X-API-Key: rp_live_k9mX2qL8nR4vT7wY` (forwarded from client)
- `X-Forwarded-For: <KRMC's server IP>` (for audit logs)

I now enter Express.

---

## Act 4 — I Enter the Orchestrator

### Scene 4.1 — Express Receives Me

**Service:** `ms1-orchestrator`
**File:** `ms1-orchestrator/src/server.ts`
**Function:** `createExpressApp()`

This is the entry point. `createExpressApp()` is called once at startup. It registers all middleware in order, then mounts the routers. The order of middleware registration is not optional — it is the sequence I pass through.

**Middleware stack (in exact registration order):**

```
1. requestIdMiddleware        → attaches a uuid to every request as req.requestId
2. requestLoggerMiddleware    → logs method, path, requestId, clientIP (uses winston)
3. helmetMiddleware           → sets security HTTP headers (X-Frame-Options, CSP, etc.)
4. corsMiddleware             → allows cross-origin from configured domains only
5. express.json()             → parses JSON bodies (for non-file routes)
6. authenticateApiKey         → validates the API key (THE most important middleware)
7. router (mounted at /v1)    → all route handlers live here
8. notFoundHandler            → catches any route that didn't match → 404
9. globalErrorHandler         → catches anything thrown downstream → structured error
```

**Package:** `helmet` — security headers in one line.
**Package:** `cors` — CORS policy enforcement.
**Package:** `winston` — structured logging with JSON format in production.
**Package:** `uuid` — request ID generation.

### Scene 4.2 — The API Key Middleware Inspects Me

**File:** `ms1-orchestrator/src/middlewares/authenticateApiKey.ts`
**Function:** `authenticateApiKey(req, res, next)`

This is the most security-critical function in the entire system. Here is exactly what it does:

**Step 1** — Read `req.headers['x-api-key']`. If missing, return 401. (NGINX already checked this, but defense in depth — never trust that NGINX is the only entry point.)

**Step 2** — Extract the prefix. My key is `rp_live_k9mX2qL8nR4vT7wY`. The prefix is the first 8 characters: `rp_live_`. This narrows the database lookup without revealing anything about the full key.

**Step 3** — Query the database:
**File:** `ms1-orchestrator/src/repositories/apiKeyRepository.ts`
**Function:** `findActiveKeysByPrefix(prefix)`
Uses Prisma to query `api_keys` table WHERE `prefix = 'rp_live_'` AND `isActive = true`. Returns a small list of candidates (usually just one).

**Step 4** — For each candidate, call `bcrypt.compare(incomingKey, storedHash)`. The raw key is never stored. Only its bcrypt hash exists in the DB. If the comparison passes, this is a valid key.

**Step 5** — Attach to request: `req.clientId`, `req.client` (the full client row including `webhookUrl`, `plan`, `webhookSecret`). Call `next()`.

**Step 6** — Fire-and-forget: update `api_keys.lastUsed` timestamp. Don't await — we don't want this to slow down the request.

**Step 7** — Write an audit log entry via `auditService.logEvent('api_key.authenticated', clientId, { ip })`. Fire and forget.

**Package:** `bcrypt` — for comparing the incoming key against the stored hash.
**Package:** `@prisma/client` — database access.

If auth fails → `auditService.logEvent('api_key.rejected', null, { prefix, ip })` → return 401.

I am now authenticated. Express knows who sent me.

### Scene 4.3 — I Reach the Route

**File:** `ms1-orchestrator/src/routes/verifyRoutes.ts`

The router maps `POST /v1/verify` to a chain:

```
multerUploadMiddleware → validateVerifyRequestMiddleware → verifyController.submit
```

**Step 1 — multerUploadMiddleware**
**File:** `ms1-orchestrator/src/middlewares/multerUploadMiddleware.ts`
**Function:** `configureMulterUpload()`

`multer` handles the multipart body. It is configured with:
- `storage: multer.memoryStorage()` — I am held in RAM as `req.file.buffer`. I never touch the filesystem on this server.
- `limits: { fileSize: 5 * 1024 * 1024 }` — 5MB hard limit at the multer layer (second check after NGINX's 10MB)
- `fileFilter: pdfOnlyFilter` — only accepts files where `mimetype === 'application/pdf'`

**Package:** `multer` — multipart form parsing and file handling.

**Step 2 — validateVerifyRequestMiddleware**
**File:** `ms1-orchestrator/src/middlewares/validateVerifyRequestMiddleware.ts`
**Function:** `validateVerifyRequest(req, res, next)`

Uses `zod` to validate the non-file fields:

**Schema defined in:** `ms1-orchestrator/src/schemas/verifyRequestSchema.ts`
**Schema name:** `verifyRequestSchema`

Fields validated:
- `githubUrl` — must match `/^https?:\/\/github\.com\/[a-zA-Z0-9_-]{1,39}\/?$/`
- `jobDescription` — optional, max 5000 chars, stripped of HTML tags
- `candidateEmail` — optional, valid email format

If validation fails → 422 with field-level error messages from zod. I go no further.

**Magic bytes check:**
**File:** `ms1-orchestrator/src/utils/validatePdfMagicBytes.ts`
**Function:** `validatePdfMagicBytes(buffer)`

Reads the first 4 bytes of `req.file.buffer`. Must be `%PDF` (hex: `25 50 44 46`). If not → 422 "File is not a valid PDF." This catches renamed `.exe` files.

**Package:** `zod` — schema validation with typed error output.

### Scene 4.4 — I Reach the Controller

**File:** `ms1-orchestrator/src/controllers/verifyController.ts`
**Function:** `submit(req, res, next)`

The controller is intentionally thin. It does three things only:
1. Calls `verificationService.initiateVerification(req)` and gets back `{ transactionId, pollUrl }`
2. Sends `202 Accepted` with `{ transactionId, status: 'processing', estimatedSeconds: 45, pollUrl }`
3. Wraps everything in try/catch → passes errors to `next(err)` → globalErrorHandler

The controller makes zero business decisions. It is a translator between HTTP and the service layer.

### Scene 4.5 — The Service Does the Real Work

**File:** `ms1-orchestrator/src/services/verificationService.ts`
**Function:** `initiateVerification(requestData)`

This is the orchestration function. It calls other services in sequence:

**Step 1 — Extract text from my PDF**
**File:** `ms1-orchestrator/src/services/pdfService.ts`
**Function:** `extractTextFromPdfBuffer(buffer)`

Uses `pdf-parse` to pull all text content out of me. Returns `{ text, pageCount, isImageOnly }`.
`isImageOnly` is true if fewer than 50 characters per page were extracted — indicating a scanned image PDF with no selectable text. If true, a flag is noted: AI analysis will be skipped.

**Package:** `pdf-parse` — PDF text extraction in Node.js.

**Step 2 — Generate a tracking ID**
**File:** `ms1-orchestrator/src/utils/generateTrackingId.ts`
**Function:** `generateTrackingId()`

Returns something like `RPV-2026-07-16-A4X9F2`. Human-readable, date-sortable, unique enough for our scale. Uses Node's built-in `crypto.randomBytes(3).toString('hex').toUpperCase()` for the suffix.

**Package:** Node.js built-in `crypto` — no external dependency needed.

**Step 3 — Write the transaction to the database**
**File:** `ms1-orchestrator/src/repositories/transactionRepository.ts`
**Function:** `createTransaction(data)`

Writes a new row to the `transactions` table via Prisma:
```
status: 'pending'
trackingId: 'RPV-2026-07-16-A4X9F2'
clientId: (from req.clientId)
githubUrl: 'https://github.com/arjun-mehra'
resumeText: (extracted text, stored temporarily)
resumeFilename: 'resume_arjun_mehra.pdf'
jdText: (the job description)
candidateEmail: 'arjun@iit.ac.in'
```

**Package:** `@prisma/client` — type-safe database access.

**Step 4 — Write a Job row**
**File:** `ms1-orchestrator/src/repositories/jobRepository.ts`
**Function:** `createJobRecord(transactionId)`

Writes a row to the `jobs` table with `status: 'queued'`. This mirrors what will be in BullMQ — it is a human-readable audit trail of the queue state, useful for dashboards and debugging.

**Step 5 — Enqueue the verification job**
**File:** `ms1-orchestrator/src/services/queueService.ts`
**Function:** `enqueueVerificationJob(transactionId, payload)`

Creates a BullMQ job in the `verification-jobs` queue via `ioredis`.

The payload sent to the queue:
```
{
  transactionId: 'RPV-2026-07-16-A4X9F2',
  githubUrl: 'https://github.com/arjun-mehra',
  resumeText: '(extracted text)',
  jdText: '(job description)',
  clientId: 'uuid-of-krmc',
  isImageOnly: false
}
```

The job is created with `jobId: transactionId` — BullMQ will reject a duplicate job with the same ID, making this idempotent.

**Package:** `bullmq` — job queue built on Redis.
**Package:** `ioredis` — Redis client for Node.js.

**Step 6 — Write audit log**
**File:** `ms1-orchestrator/src/services/auditService.ts`
**Function:** `logEvent('verify.submitted', clientId, { transactionId, githubUrl })`

Fire and forget. Writes to `audit_logs` table.

**Step 7 — Return to controller**
Returns `{ transactionId: 'RPV-2026-07-16-A4X9F2', pollUrl: '/v1/verify/RPV-2026-07-16-A4X9F2' }`.

The controller sends 202. KRMC's server receives it. KRMC stores the `transactionId` against the candidate's application record in their own database. The HTTP connection closes.

I am now at rest in two places: the `transactions` table in PostgreSQL, and the `verification-jobs` queue in Redis. My PDF buffer has been garbage collected from memory — it served its purpose (text extraction). I will not be stored as a file anywhere.

---

## Act 5 — I Wait in the Queue

The job sits in Redis under the BullMQ key `bull:verification-jobs:wait`. It is a JSON string. ms1 has already moved on to serve other requests.

ms2 is running as a separate process on the same server (or a different server in future). It is a long-running FastAPI application with a background worker thread that is always listening to this queue.

Nothing happens until the worker wakes up. On a lightly loaded system this is near-instant — milliseconds. Under load, there could be a queue of dozens of jobs. BullMQ handles ordering, retries, and deduplication.

---

## Act 6 — The Investigator Wakes Up

### Scene 6.1 — ms2 Dequeues My Job

**Service:** `ms2-verification`
**File:** `ms2-verification/app/workers/job_consumer.py`
**Function:** `start_consumer(redis_client)`

This function runs in an infinite loop in a background thread when the FastAPI app starts. It calls `brpoplpush` on Redis — an atomic operation that moves the job from the `wait` list to the `active` list. If the worker crashes mid-job, the job remains in `active` and can be recovered. If no job is available, `brpoplpush` blocks and waits (with a 5-second timeout before looping).

The job JSON is parsed. `transactionId` is extracted. The function calls:
**Function:** `process_single_job(transaction_id, job_data)`

**Package:** `redis` (Python) — `redis-py` for talking to Redis from Python.

### Scene 6.2 — Job Status Updated

**File:** `ms2-verification/app/services/db_service.py`
**Function:** `update_transaction_status(transaction_id, 'processing')`

Uses `psycopg2` to update the `transactions` table: `status = 'processing'`, `startedAt = now()`.
Also updates the `jobs` table: `status = 'active'`, `attempts += 1`.

**Package:** `psycopg2-binary` — PostgreSQL driver for Python.
**Package:** `python-dotenv` — loads `.env` variables in Python.

### Scene 6.3 — The Orchestration Function

**File:** `ms2-verification/app/analyzers/verification_orchestrator.py`
**Function:** `run_full_verification(transaction_id, job_data)`

This is the brain of the operation. It calls every analyzer in sequence. Each analyzer returns its own result dict. The orchestrator assembles them into a final result. If one analyzer fails, it logs the error, sets that section's result to null, and continues — it does not abort the whole job.

---

## Act 7 — The GitHub Investigation

### Scene 7.1 — GitHub Client Setup

**File:** `ms2-verification/app/utils/github_client.py`
**Function:** `get_authenticated_github_client()`

Returns a `PyGithub` `Github` instance authenticated with `GITHUB_TOKEN` from env. This gives 5,000 API requests per hour instead of 60. Every function that needs GitHub goes through this factory — if the token changes or rotates, only this one file changes.

**Package:** `PyGithub` — official GitHub REST API wrapper for Python.

### Scene 7.2 — Check 1: Does the User Exist?

**File:** `ms2-verification/app/analyzers/github_analyzer.py`
**Function:** `verify_github_user_exists(username)`

Calls `GET /users/{username}` via PyGithub. Returns:
```python
{
  "exists": True,
  "name": "Arjun Mehra",
  "email": "arjun@iit.ac.in",     # used later for commit authorship
  "created_at": "2022-06-15",     # how old is this account?
  "public_repos": 12,
  "followers": 34,
  "account_age_days": 1492
}
```

If 404 → `{ "exists": False }`. The orchestrator immediately sets status to `flagged` and skips all remaining GitHub checks.

If `account_age_days < 60` → the orchestrator adds a flag: "GitHub account is less than 60 days old."

### Scene 7.3 — Check 2: Fetch All Public Repos

**File:** `ms2-verification/app/analyzers/github_analyzer.py`
**Function:** `fetch_public_repos(username)`

Calls `GET /users/{username}/repos?type=owner&per_page=100`. The `type=owner` parameter is critical — it excludes forked repositories. Forked repos are not the candidate's original work. They are filtered out entirely.

For each non-forked repo, collects:
```python
{
  "name": "taskflow-api",
  "description": "A task management REST API",
  "language": "JavaScript",        # primary language
  "languages": ["JavaScript", "TypeScript", "Shell"],  # all languages
  "topics": ["nodejs", "express", "postgresql"],
  "created_at": "2024-03-10",
  "pushed_at": "2026-04-22",       # last commit date
  "size_kb": 2840,
  "stars": 3,
  "is_fork": False
}
```

**Package:** `PyGithub` — wraps the GitHub REST API.

### Scene 7.4 — Check 3: Match Resume Projects to Repos

**File:** `ms2-verification/app/analyzers/project_matcher.py`
**Function:** `extract_claimed_projects_from_resume_text(resume_text)`

First, the claimed projects must be extracted from my text. This is an AI call to Groq.

**File:** `ms2-verification/app/analyzers/ai_analyzer.py`
**Function:** `extract_projects_with_ai(resume_text)`

Sends a structured prompt to Groq's `llama3-70b-8192` model. Instructs it to return only a JSON array — no explanation, no markdown. Returns:
```python
[
  { "name": "TaskFlow API", "technologies": ["Node.js", "PostgreSQL", "Express"] },
  { "name": "Expense Tracker", "technologies": ["React", "Firebase"] },
  { "name": "CLI DevTool", "technologies": ["Python"] },
  { "name": "ML Pipeline", "technologies": ["Python", "scikit-learn"] }
]
```

Temperature is set to 0 for deterministic output. The response is stripped of markdown code fences before `json.loads()`.

**Package:** `groq` — official Groq Python SDK.

Back in the project matcher:

**Function:** `match_projects_to_repos(claimed_projects, repos)`

For each claimed project name, computes similarity against every repo name, description, and topic string using `difflib.SequenceMatcher`. Returns the best match above a 0.4 threshold. Below 0.4 → no match found.

Also calls `check_language_alignment(claimed_techs, repo_languages)` for each matched pair — checks if the technologies claimed in the resume actually appear in the repo's language list.

**Package:** `difflib` — Python standard library, fuzzy string matching.

### Scene 7.5 — Check 4: Commit Authorship

**File:** `ms2-verification/app/analyzers/commit_analyzer.py`
**Function:** `check_commit_authorship(username, repo_full_name)`

For each matched repo, fetches commit history via `GET /repos/{owner}/{repo}/commits?author={username}`.

The `author` parameter filters by GitHub login — more reliable than email matching because contributors may use different emails on different machines.

Collects up to 200 commits and runs:

**Function:** `detect_suspicious_commit_patterns(commit_dates)`

Checks for:
- All commits on the same calendar day (bulk import flag)
- More than 10 commits compressed into under 3 days (scripted history flag)
- All commits within the same clock hour (automated tool flag)
- Perfectly uniform spacing between commits (unnatural pattern flag)

Returns:
```python
{
  "is_author": True,
  "authored_commits": 147,
  "first_commit": "2024-03-10",
  "last_commit": "2026-04-22",
  "date_range_days": 773,
  "suspicious_patterns": []          # empty = clean
}
```

### Scene 7.6 — Check 5: Account-Level Patterns

**File:** `ms2-verification/app/analyzers/github_analyzer.py`
**Function:** `analyze_account_health(user_info, repos)`

Looks at the account holistically:
- Is commit history spread across multiple years? (positive signal)
- Are repos in multiple languages? (positive signal — diverse learner)
- Are all repos created on the same day? (red flag — bulk creation)
- Is the account private with no followers and 0 stars? (weak signal)

Returns a `profile_health_score` (0–100) and a list of observations.

---

## Act 8 — The AI Reads Me

### Scene 8.1 — Skill–JD Alignment Analysis

**File:** `ms2-verification/app/analyzers/ai_analyzer.py`
**Function:** `analyze_skill_alignment(resume_text, jd_text)`

Only called if `jd_text` is present and longer than 50 characters.

Makes a second call to Groq (`llama3-70b-8192`, temperature 0). The prompt asks the model to:
1. Extract required skills from the JD
2. Check which skills appear (with evidence) in the resume text
3. Return a score 0–100, matched skills list, missing skills list, experience level estimate, and a 2-sentence summary

The response is parsed as JSON. If Groq is down or returns invalid JSON → `{ "skipped": True, "reason": "AI service unavailable" }`. The job continues.

**Package:** `groq` — Groq Python SDK.

---

## Act 9 — The Verdict Is Computed

### Scene 9.1 — Confidence Score Assembly

**File:** `ms2-verification/app/analyzers/score_calculator.py`
**Function:** `compute_confidence_score(github_result, project_matches, authorship_results, skill_alignment, account_health)`

All the individual results feed into this function. It produces a single integer 0–100 using a weighted formula:

```
40 points — Project existence and match quality
30 points — Commit authorship (meaningful commits, no suspicious patterns)
20 points — Skill–JD alignment (skipped if no JD → redistributed proportionally)
10 points — Account health (age, diversity, activity patterns)
```

**Function:** `determine_verification_status(score)`

```
score >= 70 → "verified"
score 40–69 → "flagged"
score < 40  → "rejected"
```

**Function:** `assemble_flags(github_result, project_matches, authorship_results, account_health)`

Builds the flags array — every anomaly, observation, and red flag encountered across all checks, with `type` (error/warning/observation) and `severity` (high/medium/low).

### Scene 9.2 — Final Result Object Assembled

**File:** `ms2-verification/app/analyzers/verification_orchestrator.py`
**Function:** `build_final_result(transaction_id, all_analyzer_outputs)`

Constructs the full result dict:
```python
{
  "transactionId": "RPV-2026-07-16-A4X9F2",
  "status": "verified",
  "confidenceScore": 91,
  "github": {
    "username": "arjun-mehra",
    "accountAgeDays": 1492,
    "reposFound": 12,
    "claimedProjects": 4,
    "verifiedProjects": 4,
    "projectMatches": [...],
    "commitAuthorship": True,
    "accountHealth": 88
  },
  "skillAlignment": 87,
  "matchedSkills": ["Node.js", "PostgreSQL", "Express", "REST APIs"],
  "missingSkills": ["Kubernetes"],
  "flags": [
    {
      "type": "observation",
      "message": "ML Pipeline repo has only 21 commits over 3 months",
      "severity": "low"
    }
  ]
}
```

---

## Act 10 — I Am Written to the Record

### Scene 10.1 — Result Persisted to PostgreSQL

**File:** `ms2-verification/app/services/db_service.py`
**Function:** `write_verification_result(transaction_id, result_data)`

Two writes happen in a single database transaction (atomic — both succeed or both fail):

1. `INSERT INTO results (...)` — the full result JSON, all sub-scores, all flags
2. `UPDATE transactions SET status = 'done', completedAt = now() WHERE id = ...`

If the DB write fails → the job is marked failed in BullMQ → retried up to 3 times.

**Package:** `psycopg2-binary` — PostgreSQL driver.

**Function:** `update_job_record(transaction_id, 'done')`

Updates `jobs` table: `status = 'done'`, `finishedAt = now()`.

---

## Act 11 — KRMC Is Notified

### Scene 11.1 — Webhook Dispatch

**File:** `ms2-verification/app/services/webhook_dispatcher.py`
**Function:** `dispatch_webhook_to_client(transaction_id, result_data, client_config)`

`client_config` includes KRMC's `webhookUrl` and `webhookSecret` (fetched from the `clients` table at the start of the job).

**Step 1 — Build the payload:**
```python
payload = {
  "event": "verification.completed",
  "transactionId": "RPV-2026-07-16-A4X9F2",
  "timestamp": "2026-07-16T10:45:23Z",
  "result": { ...the full result object... }
}
```

**Step 2 — Sign the payload:**
**File:** `ms2-verification/app/utils/hmac_signer.py`
**Function:** `sign_webhook_payload(payload_json_string, secret)`

Uses Python's built-in `hmac` and `hashlib` libraries.
`signature = "sha256=" + hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()`

This signature goes in the `X-ResumeProof-Signature` header. KRMC's server verifies it with their own `webhookSecret` (which only they and we know) to confirm the payload wasn't tampered with or forged.

**Package:** `hmac` — Python standard library. No external dependency.
**Package:** `hashlib` — Python standard library.
**Package:** `httpx` — async HTTP client for Python. Used for the webhook POST.

**Step 3 — POST to KRMC:**
`POST https://krmc.edu/api/resumeproof/callback`
Headers: `Content-Type: application/json`, `X-ResumeProof-Signature: sha256=abc123...`
Body: the signed payload JSON.

**Step 4 — Handle response:**
If KRMC's server returns `2xx` → mark `webhook_deliveries` row as `delivered: true`. Done.
If KRMC's server returns non-2xx or times out → record the failure, set `nextRetryAt = now() + 30s`.

**Function:** `schedule_webhook_retry(webhook_delivery_id, attempt_number)`

Retries follow exponential backoff: 30s, 5min, 30min. Maximum 3 retry attempts. All attempts are logged to the `webhook_deliveries` table.

A separate background task in ms2 (or ms1, depending on final architecture) runs every 30 seconds:

**File:** `ms2-verification/app/workers/webhook_retry_worker.py`
**Function:** `retry_failed_webhooks()`

Queries `webhook_deliveries WHERE delivered = false AND nextRetryAt < now()` and retries them.

---

## Act 12 — KRMC Gets the News

### Scene 12.1 — KRMC's Webhook Handler

KRMC's backend receives the POST at their `/api/resumeproof/callback` endpoint.

Their code (in their `resumeProofWebhookHandler` function) does:
1. Reads the raw request body as a string (before JSON parsing — HMAC must be computed on the raw bytes)
2. Computes `expected_sig = "sha256=" + hmac(secret, raw_body)`
3. Compares with `X-ResumeProof-Signature` header using a timing-safe comparison (`crypto.timingSafeEqual` in Node.js)
4. If mismatch → 401, log suspicious activity
5. If match → parse JSON, look up the candidate by `transactionId`, update their application status
6. Return `200 { received: true }` immediately — never make us wait for their DB write

**Package (on KRMC's side):** Node.js built-in `crypto` — `timingSafeEqual` for secure signature comparison.

### Scene 12.2 — The Polling Path (Alternative Delivery)

While all of this was happening, KRMC's frontend has been polling our API for the status (if they chose polling over webhooks, or if they want to show live progress to the hiring manager):

**File:** `ms1-orchestrator/src/controllers/pollController.ts`
**Function:** `getVerificationStatus(req, res, next)`

**File:** `ms1-orchestrator/src/repositories/transactionRepository.ts`
**Function:** `findTransactionWithResult(trackingId, clientId)`

The `clientId` scope is critical — a client can only read their own transactions. Even if KRMC somehow knows another client's tracking ID, the query returns 404 because the clientIds don't match.

Returns:
- `status: 'processing'` + `202` if the result isn't in the `results` table yet
- Full result object + `200` if it is

---

## Act 13 — The Story Ends

I am now:
- A row in `transactions` with `status: 'done'`
- A row in `results` with the full verified output
- A row in `webhook_deliveries` marked `delivered: true`
- A row in `audit_logs` for every significant event along my journey
- My raw resume text (`resumeText` in the `transactions` table) will be set to `NULL` by a cron job after 30 days

**File:** `ms1-orchestrator/src/jobs/cleanupJob.ts`
**Function:** `clearOldResumeText()`

Runs nightly at 2AM via `node-cron`. Updates `transactions SET resumeText = NULL WHERE createdAt < NOW() - INTERVAL 30 DAYS`. Logs how many rows were cleared.

**Package:** `node-cron` — cron scheduler for Node.js.

The hiring manager at KRMC sees: Arjun Mehra — Verified — 91/100 — 4/4 projects confirmed — Skill match 87%.

---

## The Complete File Map

### ms1-orchestrator/

```
src/
├── server.ts                              createExpressApp(), startServer()
├── config/
│   └── env.ts                             loadAndValidateEnv() — zod schema for all env vars
├── middlewares/
│   ├── requestIdMiddleware.ts             attachRequestId()
│   ├── requestLoggerMiddleware.ts         logIncomingRequest()
│   ├── authenticateApiKey.ts              authenticateApiKey()
│   ├── multerUploadMiddleware.ts          configureMulterUpload(), pdfOnlyFilter()
│   └── validateVerifyRequestMiddleware.ts validateVerifyRequest()
├── routes/
│   ├── index.ts                           mountAllRoutes()
│   ├── verifyRoutes.ts                    POST /v1/verify
│   ├── pollRoutes.ts                      GET /v1/verify/:transactionId
│   ├── internalRoutes.ts                  POST /internal/webhook-dispatch (ms2 calls this)
│   └── healthRoutes.ts                    GET /health
├── controllers/
│   ├── verifyController.ts                submit()
│   └── pollController.ts                  getVerificationStatus()
├── services/
│   ├── verificationService.ts             initiateVerification()
│   ├── pdfService.ts                      extractTextFromPdfBuffer()
│   ├── queueService.ts                    enqueueVerificationJob(), getQueueStats()
│   ├── webhookService.ts                  dispatchWebhook(), scheduleWebhookRetry()
│   └── auditService.ts                    logEvent()
├── repositories/
│   ├── apiKeyRepository.ts                findActiveKeysByPrefix(), updateLastUsed()
│   ├── transactionRepository.ts           createTransaction(), findTransactionWithResult(), updateStatus()
│   ├── jobRepository.ts                   createJobRecord(), updateJobStatus()
│   ├── resultRepository.ts                findResultByTransactionId()
│   └── webhookDeliveryRepository.ts       createDeliveryRecord(), markDelivered(), getPendingRetries()
├── schemas/
│   └── verifyRequestSchema.ts             verifyRequestSchema (zod)
├── utils/
│   ├── generateTrackingId.ts              generateTrackingId()
│   ├── validatePdfMagicBytes.ts           validatePdfMagicBytes()
│   └── logger.ts                          createLogger() — winston instance
├── jobs/
│   └── cleanupJob.ts                      clearOldResumeText(), startCleanupScheduler()
└── errors/
    ├── AppError.ts                         AppError class (operational vs programmer errors)
    └── globalErrorHandler.ts              globalErrorHandler()
```

### ms2-verification/

```
app/
├── main.py                                create_app(), start_background_worker()
├── config.py                             load_config() — pydantic settings
├── workers/
│   ├── job_consumer.py                   start_consumer(), process_single_job()
│   └── webhook_retry_worker.py           retry_failed_webhooks(), start_retry_scheduler()
├── analyzers/
│   ├── verification_orchestrator.py      run_full_verification(), build_final_result()
│   ├── github_analyzer.py                verify_github_user_exists(), fetch_public_repos(), analyze_account_health()
│   ├── project_matcher.py                match_projects_to_repos(), check_language_alignment()
│   ├── commit_analyzer.py                check_commit_authorship(), detect_suspicious_commit_patterns()
│   ├── ai_analyzer.py                    extract_projects_with_ai(), analyze_skill_alignment()
│   └── score_calculator.py               compute_confidence_score(), determine_verification_status(), assemble_flags()
├── services/
│   ├── db_service.py                     write_verification_result(), update_transaction_status(), update_job_record()
│   └── webhook_dispatcher.py             dispatch_webhook_to_client(), schedule_webhook_retry()
└── utils/
    ├── github_client.py                  get_authenticated_github_client()
    ├── hmac_signer.py                    sign_webhook_payload()
    └── logger.py                         get_logger()
```

### Database tables touched at each stage

```
Stage                  Table written            Table read
─────────────────────────────────────────────────────────────
Auth middleware        audit_logs               api_keys, clients
PDF parse + enqueue    transactions, jobs        —
ms2 dequeue            transactions, jobs        transactions
GitHub analysis        —                        —  (only GitHub API)
Result write           results, transactions     —
Webhook dispatch       webhook_deliveries        clients
Poll endpoint          —                        transactions, results
Cleanup cron           transactions (nullify)    transactions
```

---

## Package Master Reference

| Package | Where | What it does |
|---------|-------|-------------|
| `express` | ms1 | HTTP server framework |
| `helmet` | ms1 | Security headers |
| `cors` | ms1 | Cross-origin policy |
| `multer` | ms1 | Multipart file uploads |
| `pdf-parse` | ms1 | Extract text from PDF buffer |
| `bullmq` | ms1 | Job queue producer |
| `ioredis` | ms1 | Redis client for Node.js |
| `@prisma/client` | ms1 | Type-safe PostgreSQL access |
| `zod` | ms1 | Request schema validation |
| `bcrypt` | ms1 | API key hash comparison |
| `winston` | ms1 | Structured logging |
| `uuid` | ms1 | Request ID generation |
| `node-cron` | ms1 | Scheduled cleanup job |
| `axios` | client | HTTP calls (KRMC's side) |
| `fastapi` | ms2 | HTTP server (health + internal routes) |
| `redis` (py) | ms2 | Queue consumer, Redis client |
| `psycopg2-binary` | ms2 | PostgreSQL driver for Python |
| `PyGithub` | ms2 | GitHub REST API wrapper |
| `groq` | ms2 | Groq AI API SDK |
| `httpx` | ms2 | Async HTTP for webhook dispatch |
| `python-dotenv` | ms2 | Env variable loading |
| `pydantic` | ms2 | Config and data validation |
| `difflib` | ms2 | Fuzzy project name matching (stdlib) |
| `hmac` | ms2 | Webhook payload signing (stdlib) |
| `hashlib` | ms2 | SHA256 for HMAC (stdlib) |
| `crypto` | client | timingSafeEqual for webhook verify (Node stdlib) |
| `node-cron` | ms1 | Nightly cleanup scheduler |
