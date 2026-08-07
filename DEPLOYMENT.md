# 🚀 ClauseGuard-AI Deployment Guide (Vercel + Render)

This guide walks you through deploying **ClauseGuard-AI** to the cloud:
- **Backend (FastAPI)**: Deployed on **Render** (or Railway).
- **Frontend (Next.js)**: Deployed on **Vercel**.

---

## Part 1: Deploy Backend to Render

### Option A: Using Render Blueprints (Recommended)
1. Push your latest code to your **GitHub repository**.
2. Log in to [Render.com](https://render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your GitHub repository. Render will automatically detect `render.yaml`.
5. Enter your environment variables when prompted:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `OPENAI_API_KEY`: (Optional) Your OpenAI API Key.
   - `ALGORAND_SENDER_MNEMONIC`: Your 25-word sender seed phrase for Algorand TestNet transactions.
6. Click **Apply**. Render will build and deploy your backend service.
7. Copy your backend URL once deployed (e.g. `https://clauseguard-backend.onrender.com`).

---

### Option B: Manual Web Service Setup on Render
1. Go to **Render Dashboard** -> **New +** -> **Web Service**.
2. Connect your repository.
3. Configure the settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `GEMINI_API_KEY`: your-gemini-key
   - `OPENAI_API_KEY`: your-openai-key (optional)
   - `ALGORAND_SENDER_MNEMONIC`: your 25 word mnemonic
   - `ALGORAND_RECIPIENT_ADDRESS`: `ULDGSMHBVIIXNZO3W4H6GTHSYPCAFQ6SV5CWZGONABA22RLBLTI4LBFWAQ`
   - `ALGORAND_ALGOD_SERVER`: `https://testnet-api.algonode.cloud`
5. Click **Create Web Service**.

---

## Part 2: Deploy Frontend to Vercel

1. Log in to [Vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Set the **Root Directory** to `frontend`.
5. Under **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://clauseguard-backend.onrender.com` *(Replace with your actual backend URL from Part 1)*
6. Click **Deploy**.

---

## Part 3: Verification & Test

1. Open your Vercel deployment URL (e.g. `https://clauseguard-ai.vercel.app`).
2. Upload a sample contract (PDF or DOCX).
3. Test document analysis, risk scoring, and docx redline downloading.
4. Test payment / x402 feature verification.

---

## Quick Local Test via Docker Compose (Optional)
If you want to test containerized execution locally prior to cloud deployment:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`
