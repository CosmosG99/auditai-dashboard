# AuditAI Backend

Local backend for AuditAI that connects your dashboard to Ollama Gemma 4.

## Run

```bash
npm install
npm run dev
```

Server starts on `http://localhost:4000`.

## Ollama target

The backend defaults to:

- `OLLAMA_URL=http://192.168.1.112:11434/api/generate`
- `OLLAMA_MODEL=gemma4`

You can override via environment variables.

## API

- `GET /api/health`
- `GET /api/stats`
- `GET /api/events`
- `POST /api/extract`
- `POST /api/detect`
- `POST /api/report`

`/api/detect` stores combined `audit_event` records including:

- detection output
- false positive assessment
- feedback placeholders
