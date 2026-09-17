# HumanLens AI 🧠⚡
> **Multimodal Human Behavior Analysis & Real-Time De-escalation System**  
> An intelligent digital buffer designed to protect relationships and foster constructive communication through multimodal affective computing and contextual de-escalation.

---

## 🌟 Overview

**HumanLens AI** addresses digital communication friction caused by autonomic stress, sleep deprivation, and lack of nonverbal social cues in text-based environments (group chats, Slack, email, WhatsApp). 

The platform operates across two distinct operational modes:
1. **Consumer Mode**: An Apple-inspired, distraction-free, monochrome sanctuary (`Write`, `Trends`, `Coach`). Intercepts inflammatory messages on send, provides a 20-second vagal cooling pause (box breathing), and suggests three constructive rewrites.
2. **Developer & ML Research Studio**: A real-time telemetry laboratory for evaluators, researchers, and engineers. Exposes raw Action Units (MediaPipe AU04 brow furrow, AU15 lip corner depressor, AU24 lip pressor), real-time Web Audio API frequency waveforms, logistic fusion weights, and attribution matrices.

---

## 🏗️ Architecture

```
HUMANLENS AI/
├── web/                       # Next.js 14 App (TypeScript, Tailwind, Lucide, Recharts)
│   ├── app/                   # App Router & 11 REST API Endpoints
│   │   ├── api/analyze/       # Multimodal analysis (text, voice, face, multimodal)
│   │   ├── api/checkins/      # 8-dimension daily behavioral logs (Supabase-synced)
│   │   ├── api/intervention/  # De-escalation event tracking
│   │   ├── api/chat/          # Evidence-grounded Reflection Coach
│   │   ├── api/supabase/test/ # Live cloud database health verification
│   │   └── page.tsx           # Seamless Dual-Mode Switcher
│   ├── components/
│   │   ├── consumer/          # ConsumerApp (Write, Trends, Coach)
│   │   ├── dev/               # DeveloperApp (Telemetry, Mirror, Scenarios)
│   │   ├── EmotionMirror.tsx  # Native HTML5 Web Audio API & MediaPipe Face AUs
│   │   └── SettingsModal.tsx  # Cloud credentials & live connection tester
│   └── lib/                   # Supabase REST client & analysis inference engine
│
├── supabase/                  # Cloud Database Layer (Supabase Free Tier)
│   └── schema.sql             # 10 PostgreSQL tables, pgvector, RLS policies, seeds
│
├── research_ml/               # Research & Model Development Layer
│   ├── notebooks/             # 14 executed Jupyter research notebooks
│   ├── models/                # Trained .pkl models (toxicity, insult, fusion)
│   ├── src/                   # Feature extractors (acoustic, MediaPipe, fusion)
│   └── tests/                 # 59 passing unit tests
│
└── deploy_hf/                 # Optional Hugging Face Spaces (Free 16GB CPU)
```

---

## ⚡ 100% Free Cloud Infrastructure ($0 / Month)

HumanLens AI is engineered to operate 100% in the cloud at zero hosting expense:

| Service | Tier | Purpose |
|---|---|---|
| **Vercel** | Free Hobby Tier | Next.js 14 Web Application & Edge API Routes |
| **Supabase** | Free Tier (500MB PostgreSQL) | Relational Storage, `pgvector`, Row-Level Security |
| **Google Gemini API** | Free Tier (Google AI Studio) | Live Contextual Rewrites & Reflection Coach |
| **Hugging Face Spaces** | Free 16GB CPU Space | Optional standalone Python ML microservice |

## ☁️ Deploy 100% Online in 60 Seconds ($0 Cost)

Click below to deploy your Next.js Web App and REST API to **Vercel** with zero configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Farpankaushal1234567777-ctrl%2Fhumanlensai&root-directory=web&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

1. Sign in with GitHub on Vercel.
2. Select Root Directory: **`web`**.
3. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://oybxycvcaqtdjckrkxfa.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key`
4. Click **Deploy** — you get a permanent, live `https://*.vercel.app` domain running 24/7!

---

## 🚀 Quick Start (Local Development)

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/arpankaushal1234567777-ctrl/humanlensai.git
cd humanlensai/web
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your free Supabase URL and Anon Key, or configure them directly within the UI Settings modal!

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view HumanLens AI.

---

## 🗄️ Database Setup (Supabase Free Tier)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** -> **New query**.
3. Paste the contents of `supabase/schema.sql` and click **Run**.
4. Retrieve your **Project URL** and **anon public key** from *Project Settings -> API* and paste them into HumanLens **Settings** (gear icon in the app header).

---

## 🔬 Research & Evaluation Highlights

- **Acoustic Biomarkers**: Pitch (F0), Jitter, Shimmer, RMS Energy, and Harmonic-to-Noise Ratio (HNR).
- **Facial Action Units (FACS)**: MediaPipe landmark geometry for AU04 (Brow Lowerer), AU15 (Lip Corner Depressor), and AU24 (Lip Pressor).
- **Multimodal Late Fusion**: Logistic regression with temperature scaling balancing text valence, acoustic arousal, and facial distress.
- **Autonomy-Preserving Interventions**: Users retain the absolute freedom to send their original message ("Send Original"), ensuring agency and psychological safety.
- **Crisis De-escalation Protocol**: Automatic recognition of distress indicators with immediate 988 Suicide & Crisis Lifeline routing.

---

## 📜 Ethical Principles & Privacy Guarantees

- **No Raw Biometrics Stored**: Audio waveforms and camera frames are analyzed ephemerally in-browser memory and never persisted to disks or remote servers.
- **Transparent Control**: Users can export all behavioral self-reports in JSON format or purge all stored sessions with a single click.

---

## 📄 License
Academic & Research Open Source License. Built with ❤️ for healthier digital communication.
