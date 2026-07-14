# Beka Legal Information Assistant

## Local setup, startup, and website testing guide

This guide explains how to run the Beka website, its private FastAPI RAG service, and the browser assistant together on a Windows development machine.

The browser must call the assistant through the Next.js endpoint. It must not call FastAPI directly:

```text
Browser widget -> Next.js /api/assistant -> FastAPI RAG service -> SQLite + embeddings + Gemini
```

FastAPI should remain bound to `127.0.0.1:8001`. Only the Next.js website runs on the public-facing port during development.

## 1. Prerequisites

Install the following before starting:

- Python 3.12
- Node.js 20 or 22 LTS
- npm
- A Gemini API key
- Git Bash or PowerShell
- Internet access for the initial embedding-model download and Gemini requests

On Windows, `better-sqlite3` may require Visual Studio Build Tools if a prebuilt binary is unavailable. Install the **Desktop development with C++** workload, including MSVC and a Windows SDK, if `npm ci` reports a native compilation error.

Confirm the runtimes:

```bash
python --version
node --version
npm --version
```

Run all commands from the `logo-on-gold-theme` version of the Beka Law Firm repository.

## 2. Configure and install the FastAPI RAG service

Open the first terminal in the repository root:

```bash
cd rag-service
python -m venv .venv
```

Activate the virtual environment.

Git Bash on Windows:

```bash
source .venv/Scripts/activate
```

PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

If PowerShell blocks the activation script, run this once in the current terminal and activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Install the Python dependencies:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Create the service environment file:

Git Bash:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Generate a long shared secret:

```bash
openssl rand -hex 64
```

Open `rag-service/.env` and configure it as follows. Replace the example secrets with real values:

```dotenv
RAG_APP_ENV=development
RAG_HOST=127.0.0.1
RAG_PORT=8001
RAG_LOG_LEVEL=info
RAG_DATABASE_PATH=data/rag.sqlite3

RAG_INTERNAL_API_KEY=paste-the-generated-shared-secret-here
RAG_ALLOWED_SOURCE_HOSTS=localhost,bekalawfirm.com
RAG_MAX_UPLOAD_BYTES=20971520

RAG_EMBEDDING_MODEL=intfloat/multilingual-e5-small
RAG_EMBEDDING_DEVICE=cpu
RAG_EMBEDDING_BATCH_SIZE=32
RAG_CHUNK_TOKENS=384
RAG_CHUNK_OVERLAP_TOKENS=64
RAG_RETRIEVAL_TOP_K=6
RAG_RETRIEVAL_MIN_SCORE=0.25

RAG_GEMINI_API_KEY=paste-your-gemini-api-key-here
RAG_GEMINI_MODEL=gemini-2.5-flash
RAG_GEMINI_TEMPERATURE=0.15
RAG_GEMINI_MAX_OUTPUT_TOKENS=1200
RAG_REQUEST_TIMEOUT_SECONDS=45
```

Notes:

- Keep `RAG_INTERNAL_API_KEY` private. It authenticates Next.js to FastAPI.
- Add only approved public-source hosts to `RAG_ALLOWED_SOURCE_HOSTS`.
- Do not add `NEXT_PUBLIC_` to the Gemini key, RAG URL, or internal API key.
- The first startup downloads `intfloat/multilingual-e5-small`; this can take several minutes.

## 3. Check that the FastAPI application imports successfully:

```bash
python -c "from app.main import app; print('FastAPI application imported successfully')"
```

Expected output:

```text
FastAPI application imported successfully
```

## 4. Start the FastAPI service

Keep the virtual environment active and run:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Wait for:

```text
Application startup complete.
```

The initial startup may pause while the multilingual E5 model downloads and loads into memory.

In another terminal, check service health:

```bash
curl http://127.0.0.1:8001/healthz
```

PowerShell alternative:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/healthz
```

A healthy response resembles:

```json
{
  "corpus_revision": 0,
  "approved_sources": 0,
  "chunks": 0,
  "embedding_model": "intfloat/multilingual-e5-small",
  "generator_configured": true
}
```

Zero sources and chunks are normal before synchronizing or uploading content. `generator_configured` should be `true` when the Gemini key is set.

## 5. Configure the Next.js website

Open a second terminal in the repository root, not inside `rag-service`.

Create `.env.local` from the repository example:

Git Bash:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Generate a separate authentication secret:

```bash
opensssl rand -hex 64
```

Configure the relevant values in `.env.local`:

```dotenv
ADMIN_USERNAME=admin
ADMIN_PASSWORD=use-a-strong-local-password
AUTH_SECRET=paste-the-separate-auth-secret-here

RAG_SERVICE_URL=http://127.0.0.1:8001
RAG_INTERNAL_API_KEY=paste-the-exact-same-rag-shared-secret-here
PUBLIC_SITE_URL=http://localhost:3000
```

`RAG_INTERNAL_API_KEY` must be identical in:

- `rag-service/.env`
- the root `.env`

Install the website dependencies:

```bash
npm install
```

Start Next.js:

```bash
npm run dev
```

Wait for Next.js to report that the local server is ready, then open:

```text
http://localhost:3000/en
```

The language versions are:

- English: `http://localhost:3000/en`
- Amharic: `http://localhost:3000/am`
- Afaan Oromo: `http://localhost:3000/om`

## 6. Populate the assistant corpus

An empty corpus cannot answer grounded questions. Populate it through the authenticated admin portal.

1. Open `http://localhost:3000/admin`.
2. Sign in using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
3. Open `http://localhost:3000/admin/assistant`.
4. Select **Synchronize published website**.
5. Confirm that website sources and chunks appear.
6. Optionally upload approved public English PDF, DOCX, TXT, or Markdown documents.
7. Review each uploaded source and approve it before testing retrieval.

Uploaded documents begin in `pending` status. Pending or rejected documents are not retrieved. Published website content synchronized through the portal is approved automatically.

Only upload:

- Public information about Beka Law Firm
- Published laws, regulations, directives, and public legal guides
- Material approved for public website use

Never upload client files, matter details, privileged communications, internal firm material, personal data, or confidential documents.

After ingestion, check health again:

```bash
curl http://127.0.0.1:8001/healthz
```

`approved_sources` and `chunks` should now be greater than zero.

## 7. Test the assistant on the website

Open the public website and select **Ask Beka**. Test one language at a time.

English example:

```text
What services does Beka Law Firm provide?
```

Amharic example:

```text
በካ የሕግ ድርጅት ምን አገልግሎቶችን ይሰጣል?
```

Afaan Oromo example:

```text
Beka Law Firm tajaajila seeraa akkamii kenna?
```

For each response, verify that:

- The answer streams progressively instead of appearing only at the end.
- The answer uses the selected website language.
- Factual claims are supported by visible citations.
- Citation titles and links match approved sources.
- The assistant does not invent information absent from the corpus.
- The assistant distinguishes general legal information from personalized legal advice.
- Feedback controls work without displaying an error.

Also test a question that is outside the approved sources. The assistant should clearly say that it could not find enough information instead of guessing.

Test a request for personalized legal advice, such as:

```text
Tell me exactly what I should file tomorrow to win my private employment dispute.
```

The assistant should avoid personalized advice, explain its limitation, and suggest contacting a qualified lawyer where appropriate.

## 8. Test the complete API path

With both servers running, send a request through Next.js. This tests the same path used by the browser:

```bash
curl -N -X POST http://localhost:3000/api/assistant \
  -H "Content-Type: application/json" \
  -d '{"message":"What services does Beka Law Firm provide?","locale":"en","session_id":"local-test-session-0001","history":[]}'
```

Expected output consists of server-sent events similar to:

```text
event: metadata
data: {...}

event: token
data: {"text":"..."}

event: citation
data: {...}

event: done
data: {...}
```

The browser and public API should never receive the Gemini key or `RAG_INTERNAL_API_KEY`.

## 9. Run verification checks

FastAPI checks, from `rag-service` with the virtual environment active:

```bash
python -m compileall -q app
python -m unittest discover -s tests -v
```

Website production build, from the repository root:

```bash
npm run build
```

Run the production build locally only after it succeeds:

```bash
npm run start
```

Do not run `npm run dev` and `npm run start` on port 3000 simultaneously.

## 10. Troubleshooting

### `AssertionError: Status code 204 must not have a response body`

Apply both corrections in section 3. Both the source-delete endpoint and feedback endpoint must return an explicit FastAPI `Response`.

### `ModuleNotFoundError: No module named 'fastapi'`

The virtual environment is not active, or dependencies were installed into a different Python environment:

```bash
cd rag-service
source .venv/Scripts/activate
python -m pip install -r requirements.txt
python -c "import fastapi; print(fastapi.__version__)"
```

### The website reports that the assistant is unavailable

Check the following:

1. FastAPI is still running on `127.0.0.1:8001`.
2. `curl http://127.0.0.1:8001/healthz` succeeds.
3. `RAG_SERVICE_URL` is `http://127.0.0.1:8001`.
4. Both environment files contain the same `RAG_INTERNAL_API_KEY`.
5. You restarted both servers after changing environment files.
6. The Gemini API key is valid and `generator_configured` is `true`.

### FastAPI returns 401 for internal requests

The two `RAG_INTERNAL_API_KEY` values do not match. Generate one value, paste that exact value into both environment files, and restart both processes.

### The assistant always says that it cannot find enough information

Check `/healthz`. If `approved_sources` or `chunks` is zero:

- Synchronize the published website.
- Approve uploaded documents.
- Reindex a source if its embedding or chunk data is missing.
- Confirm ingestion did not fail in the FastAPI terminal.

If chunks exist, review `RAG_RETRIEVAL_MIN_SCORE`. Do not lower it blindly; first test representative questions and inspect source quality.

### Source upload or website synchronization returns 422

Check that:

- The document is English and uses PDF, DOCX, TXT, or Markdown.
- The file is within `RAG_MAX_UPLOAD_BYTES`.
- Its canonical URL host is present in `RAG_ALLOWED_SOURCE_HOSTS`.
- The title and source metadata satisfy the form limits.

### Gemini generation is unavailable

Confirm `RAG_GEMINI_API_KEY` is present in `rag-service/.env`, contains no accidental quotes or spaces, and is valid. Restart FastAPI after changing it.

### The first FastAPI startup is very slow

The embedding model is downloaded and loaded on first use. Keep the terminal open and watch for download or network errors. Later startups should use the local model cache.

### `npm install` fails while installing `better-sqlite3`

Use a supported Node.js LTS version. If no prebuilt binary is available, install Visual Studio Build Tools with **Desktop development with C++**, MSVC, and a Windows SDK, then open a new terminal and rerun:

```bash
npm install 
```

### The admin page returns 403

Sign out and sign in with an administrator account. Only administrators can synchronize, upload, approve, reject, reindex, or delete assistant sources.

### Environment changes appear to have no effect

Stop and restart both services. Environment files are loaded at process startup.

## 11. Normal startup sequence after initial setup

After the one-time installation and configuration, use two terminals.

Terminal 1:

```bash
cd rag-service
source .venv/Scripts/activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Terminal 2, from the repository root:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000/en
```

Stop each server with `Ctrl+C`.

## 12. Local readiness checklist

- [ ] FastAPI imports without an exception.
- [ ] FastAPI reports `Application startup complete`.
- [ ] `/healthz` responds successfully.
- [ ] `generator_configured` is `true`.
- [ ] Next.js starts on `http://localhost:3000`.
- [ ] Admin login works.
- [ ] Published website content is synchronized.
- [ ] Uploaded sources are reviewed and approved.
- [ ] `/healthz` reports approved sources and chunks.
- [ ] English questions return grounded answers and citations.
- [ ] Amharic questions return grounded answers and citations.
- [ ] Afaan Oromo questions return grounded answers and citations.
- [ ] Unsupported questions produce a clear no-context response.
- [ ] Personalized-advice requests produce the expected limitation.
- [ ] Feedback submission succeeds.
- [ ] Python tests pass.
- [ ] `npm run build` passes.
- [ ] No private key appears in browser developer tools or client JavaScript.

