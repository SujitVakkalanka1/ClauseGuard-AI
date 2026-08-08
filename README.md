# 🛡️ ClauseGuard-AI

> **Automated Legal Contract Analysis, Risk Scoring, and Redlining powered by Gemini AI and Algorand TestNet Micropayments (x402 Protocol).**

Developed by **Team Morgan** 🚀

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Workflow](#-architecture--workflow)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Deployment Guide](#-deployment-guide)
- [Team](#-team)
- [License](#-license)

---

## 💡 Overview

**ClauseGuard-AI** is an enterprise-grade AI legal tech solution designed to demystify complex legal contracts for freelancers, businesses, and legal teams. By combining **Google Gemini AI** for contract comprehension with **Algorand Blockchain** for decentralized micro-payment verification (HTTP `402 Payment Required`), ClauseGuard-AI delivers instant, risk-assessed redline suggestions and exportable modified contract documents.

---

## ✨ Key Features

- 🧠 **AI-Powered Clause Analysis & Risk Tagger**:
  - Automatically parses PDF, DOCX, and TXT contract files.
  - Detects high, medium, and low-risk clauses (Indemnity, Liability Limits, Non-Competes, IP Assignment, Termination Terms, etc.).
  - Generates comprehensive overall risk scores and actionable legal recommendations.

- ⚡ **Web3 Micropayments (Algorand x402 Protocol)**:
  - Implements the HTTP `402 Payment Required` standard powered by **Algorand TestNet**.
  - Programmatic challenge issuance and on-chain verification with transaction hash proof (`txid`) tied to reports.

- 📝 **Interactive Redlining & Custom Edits**:
  - View side-by-side original contract text versus recommended safer rewrites.
  - In-browser editor allows customized clause modifications before downloading.

- 📄 **One-Click Word (.docx) Export**:
  - Download ready-to-sign or ready-to-negotiate Microsoft Word (`.docx`) documents with safer provisions incorporated.

- 📜 **Historical Report Dashboard**:
  - Persistent storage using SQLite and SQLAlchemy to view past contract analyses and track transaction receipts.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js (React / TypeScript)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite / SQLAlchemy ORM
- **AI Models**: Google Gemini AI (`google-generativeai`)
- **Blockchain**: Algorand Python SDK (`algosdk`)
- **Document Processing**: `PyPDF2`, `python-docx`
- **Deployment**: Render

---

## 🏗️ Architecture & Workflow

```
[ User / Web Frontend (Next.js) ]
               │
               ▼
 [ x402 Payment Gate Check ] ──(Algorand TestNet Tx)──► [ Algorand Ledger ]
               │ (Confirmed)
               ▼
   [ FastAPI Backend Router ]
         ├──► [ File Parser (PDF/DOCX) ]
         ├──► [ Gemini AI Risk Analysis ]
         ├──► [ Database Persistence (SQLite) ]
         └──► [ DOCX Redline Generator ]
               │
               ▼
[ Risk Report & Safe DOCX Download ]
```

---

## 📁 Project Structure

```
ClauseGuard-AI/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers & x402 endpoints
│   │   ├── services/     # Gemini AI, Algorand SDK, DOCX & Text Extraction
│   │   ├── config.py     # Environment settings
│   │   ├── database.py   # SQLAlchemy session manager
│   │   ├── main.py       # FastAPI application entry point
│   │   ├── models.py     # DB Schemas (Contracts, Reports, Clauses, Transactions)
│   │   └── schemas.py    # Pydantic data validation models
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/              # Next.js UI components and page routes
│   ├── vercel.json
│   └── package.json
├── docker-compose.yml     # Local orchestration
├── DEPLOYMENT.md          # Cloud deployment documentation
├── render.yaml            # Render deployment blueprint
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** / **yarn**
- **Python** 3.10+
- **Algorand TestNet Account** (with test ALGOs from an Algorand faucet)
- **Google Gemini API Key**

---

### Local Development Setup

#### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
PROJECT_NAME="ClauseGuard-AI"
GEMINI_API_KEY="your-gemini-api-key"
ALGORAND_SENDER_MNEMONIC="your 25 word testnet seed phrase"
ALGORAND_RECIPIENT_ADDRESS="ULDGSMHBVIIXNZO3W4H6GTHSYPCAFQ6SV5CWZGONABA22RLBLTI4LBFWAQ"
ALGORAND_ALGOD_SERVER="https://testnet-api.algonode.cloud"
```

Start the backend server:

```bash
uvicorn app.main:app --reload --port 8000
```
Interactive API Documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

Start the frontend development server:

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Docker Setup

Run both frontend and backend using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔑 Environment Variables

| Variable | Description | Required |
| :--- | :--- | :---: |
| `GEMINI_API_KEY` | Google Gemini AI API key for clause risk scoring | Yes |
| `ALGORAND_SENDER_MNEMONIC` | 25-word seed phrase for signing Algorand TestNet micropayments | Yes |
| `ALGORAND_RECIPIENT_ADDRESS` | Algorand wallet address for receiving x402 payments | Yes |
| `ALGORAND_ALGOD_SERVER` | Algorand Node endpoint (e.g. AlgoNode TestNet) | Yes |
| `NEXT_PUBLIC_API_URL` | Frontend pointer to FastAPI backend API | Yes |

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/pay-challenge` | Executes on-chain Algorand TestNet payment for x402 challenge |
| `POST` | `/api/v1/analyze` | Main endpoint: Uploads contract (PDF/DOCX) & returns AI risk analysis |
| `GET` | `/api/v1/reports` | Returns history of analyzed contract reports |
| `GET` | `/api/v1/reports/{id}` | Retrieves detailed analysis report by ID |
| `GET` | `/api/v1/reports/{id}/download-edited` | Downloads automatically reworded Word (`.docx`) document |
| `PUT` | `/api/v1/reports/{id}/clauses` | Updates custom clause modifications |
| `POST` | `/api/v1/reports/{id}/download-amended` | Downloads custom amended Word (`.docx`) document |

---

## 🌐 Deployment Guide

Refer to [DEPLOYMENT.md](file:///c:/Users/vsbsu/Documents/Hackathon/DEPLOYMENT.md) for step-by-step instructions on deploying:
- **Backend** to **Render** via Blueprint (`render.yaml`).
- **Frontend** to **Vercel**.

---

## 👥 Team

Built with ❤️ for the Hackathon by **Team Morgan**:
- **Team Morgan**

---

## 📄 License

This project is licensed under the MIT License.
