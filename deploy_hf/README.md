---
title: Humanlens Ml
emoji: 🧠
colorFrom: indigo
colorTo: purple
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
---

# Deploying HumanLens AI Models Online for $0 (Hugging Face Spaces - Gradio SDK)

This folder contains the complete configuration to deploy your trained machine learning models to **Hugging Face Spaces** using the **Gradio SDK** on their permanent **100% Free Cloud Tier** (16 GB RAM, 2 vCPUs, 24/7 availability, **NO Credit Card Required**).

---

### Step 1: Create a Free Hugging Face Space
1. Sign up or log in at [huggingface.co](https://huggingface.co).
2. Click **New Space** (or visit `https://huggingface.co/new-space`).
3. Set:
   - **Space Name**: `humanlens-ml`
   - **License**: `mit`
   - **Space SDK**: **Gradio** (Select Gradio — 100% FREE, NO Credit Card!)
   - **Hardware**: `CPU Basic • 2 vCPU • 16 GB RAM • Free`
   - **Visibility**: Public (so your web app can call its API)

---

### Step 2: Push/Upload to the Space
Push this `deploy_hf` directory to your Hugging Face Space Git repository:

```bash
cd deploy_hf
git init
git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/humanlens-ml
git add .
git commit -m "Deploy HumanLens ML microservice"
git push -u origin main --force
```

*(Or, in the Hugging Face Web UI, click "Files" -> "Add file" -> "Upload files" and drag and drop `app.py`, `requirements.txt`, `README.md`, and the `research_ml` folder).*

---

### Step 3: Connect to your Next.js Web App
Once built (takes ~1-2 minutes), Hugging Face gives you a public URL:
`https://YOUR_USERNAME-humanlens-ml.hf.space`

You can test it directly in the browser or connect it to your HumanLens Web App via the **Cloud AI Settings** gear icon or by setting `RESEARCH_ML_API_URL` in Vercel!
