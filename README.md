# AuditAI

AuditAI is a financial audit dashboard for reviewing transactions, detecting anomalies, and generating audit reports with a local AI backend.

**Dashboard**
<img width="1903" height="912" alt="image" src="https://github.com/user-attachments/assets/f04afcd3-9faa-4d3e-b5c7-3d17ef229f67" />
**Uploading a document**
<img width="1600" height="769" alt="image" src="https://github.com/user-attachments/assets/8dfffeba-a577-41ca-9ab5-78d7347b3163" />
**Result**
<img width="1577" height="907" alt="image" src="https://github.com/user-attachments/assets/47257170-28aa-4402-8dd5-49f72c6bcb15" />


## Requirements

- Node.js 18 or newer
- npm
- MongoDB running locally on port `27017`, or a MongoDB Atlas connection string
- Ollama, if you want AI extraction, detection, chat, and report generation
- The Ollama `gemma4` model

## Project Structure

```text
auditai-dashboard/
  backend/   Express, MongoDB, authentication, and Ollama API
  frontend/  Vite, React, TanStack Router, and dashboard UI
```

## Backend Setup

Open a terminal in `backend`:

```bash
cd backend
npm install
copy env.example .env
```

On macOS/Linux, use `cp env.example .env` instead of `copy`.

For local MongoDB, set these values in `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/auditai
JWT_SECRET=replace-with-a-long-random-value
PORT=4000
OLLAMA_URL=http://localhost:11434/api/generate
```

For MongoDB Atlas, replace `MONGO_URI` with the connection string from your Atlas project. Add your IP address to Atlas Network Access and URL-encode special characters in the database username or password.

Never commit `backend/.env`. Keep secrets only in your local environment.

Start the backend:

```bash
npm run dev
```

The backend runs at `http://localhost:4000`. Check it with:

```text
http://localhost:4000/api/health
```

The response should show `"mongodb":"connected"` before using login, registration, or database-backed dashboard features.

## Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:8080` in your browser. Create an account at `/register` before signing in. Accounts are stored in the configured MongoDB database; changing from Atlas to local MongoDB means you need to register again locally.

## Ollama Setup

Install Ollama, start its service, and pull the configured model:

```bash
ollama pull gemma4
```

The backend uses `http://localhost:11434/api/generate` by default. Override `OLLAMA_URL` in `backend/.env` when Ollama runs on another machine or port.

The dashboard can still start without Ollama, but AI-powered operations will fail until the Ollama endpoint and model are available.

## Useful Commands

Run from `frontend`:

```bash
npm run dev       # Start Vite development server
npm run build     # Create a production build
npm run preview   # Preview the production build
npm run lint      # Run ESLint and Prettier checks
```

Run from `backend`:

```bash
npm run dev       # Start the API with file watching
npm start         # Start the API normally
```

## Troubleshooting

### Login or registration fails

Open `/api/health`. If MongoDB is disconnected, start MongoDB or correct `MONGO_URI`. There is no built-in demo password; register an account first.

### MongoDB Atlas hostname cannot be resolved

Verify the Atlas connection string, DNS/network access, and Atlas IP allowlist. A hostname error such as `querySrv ENOTFOUND` means the configured Atlas host is invalid or unavailable.

### AI requests fail

Confirm Ollama is running, `OLLAMA_URL` is correct, and `ollama list` shows `gemma4`.

### Port already in use

Change `PORT` in `backend/.env` for the API. Vite will choose another port automatically, or you can configure it in the Vite config.
