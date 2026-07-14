# Beka Legal Information Assistant — private RAG service

This FastAPI process is a private backend for the public Beka website widget. It is not a
browser application and must not be exposed directly to the internet. Next.js authenticates
administrators, rate-limits visitors, and calls this service with `x-beka-rag-key`.

## Runtime contract

- Python 3.12
- CPU inference for `intfloat/multilingual-e5-small`
- Gemini through the server-side `google-genai` SDK
- `data/rag.sqlite3` in WAL mode, separate from Next.js `data/beka.db`
- English source documents; English, Amharic, and Afaan Oromo questions and answers
- Exact cosine similarity over normalized `float32` BLOB embeddings

## Local setup

```bash
cd rag-service
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Use Python 3.12 on Windows. The first run downloads the embedding model, so complete that
download during deployment rather than waiting for the first visitor request.

Generate a shared secret and place the same value in `rag-service/.env` and the root
`.env.local`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Set `RAG_ALLOWED_SOURCE_HOSTS` to the deployed Beka hostname and the explicit public-authority
allowlist. The service never fetches those URLs; the allowlist validates citation metadata.

## Source workflow

1. Start FastAPI and Next.js.
2. Sign in as a portal administrator and open `/admin/assistant`.
3. Select **Synchronize published website**. Only already-published English website content is
   exported; it is approved automatically because it has already passed the CMS workflow.
4. Upload curated English PDF, DOCX, TXT, or Markdown public legal sources. New uploads are
   `pending` and cannot be retrieved.
5. Review the title, issuer, jurisdiction, URL, and file, then approve or reject the source.
6. Reindex after changing the pinned embedding model or chunking configuration. All documents
   and queries must stay in one embedding space.

Never upload internal firm files, client material, matter details, privileged communications,
or confidential data. Public release remains subject to the firm's approved feature scope and
legal/content review.

## Verification

```bash
PYTHONPATH=. python -m unittest discover -s tests -v
python -m compileall -q app
```

`GET /healthz` reports corpus counts and model configuration without exposing credentials.
All other routes require the shared internal key.
