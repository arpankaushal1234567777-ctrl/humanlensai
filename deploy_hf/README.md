# Deploying HumanLens AI Models Online for $0 (Hugging Face Spaces)

This folder contains the complete configuration to deploy your trained machine learning models to **Hugging Face Spaces** on their permanent **100% Free Cloud Tier** (16 GB RAM, 2 vCPUs, 24/7 availability).

---

### Step 1: Create a Free Hugging Face Space
1. Sign up or log in at [huggingface.co](https://huggingface.co).
2. Click **New Space** (or go to `https://huggingface.co/new-space`).
3. Set:
   - **Space Name**: `humanlens-ml`
   - **License**: `mit`
   - **Space SDK**: `Docker` (Blank)
   - **Hardware**: `CPU Basic • 2 vCPU • 16 GB RAM • Free`

---

### Step 2: Upload Files to the Space
Push this `deploy_hf` directory along with the `research_ml` folder to your Hugging Face Space Git repository:

```bash
git init
git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/humanlens-ml
git add .
git commit -m "Deploy HumanLens ML models"
git push -u origin main
```

---

### Step 3: Connect to your Next.js Web App
Once built (takes ~2 minutes), Hugging Face gives you a public URL:
`https://YOUR_USERNAME-humanlens-ml.hf.space`

Simply open the HumanLens Web App, click **Settings & Cloud AI** (gear icon), and paste your Space URL!
