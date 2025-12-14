# Hugging Face Spaces Deployment Guide

## Overview

This guide walks you through deploying the Grocery Price Tracker backend API to Hugging Face Spaces using Docker.

---

## Step 1: Create a Hugging Face Account

1. Go to [huggingface.co](https://huggingface.co)
2. Click **Sign Up** and create a free account
3. Verify your email

---

## Step 2: Create a New Space

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click **Create new Space**
3. Configure your Space:
   - **Owner**: Your username
   - **Space name**: `grocery-tracker-api`
   - **License**: MIT (or your preference)
   - **SDK**: Select **Docker**
   - **Hardware**: CPU basic (free)
   - **Visibility**: Public (required for free tier)
4. Click **Create Space**

---

## Step 3: Create an Access Token

1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click **Create new token**
3. Name it: `git-access`
4. Select **Write** permission
5. Click **Create token**
6. Copy the token (you'll need it for git push)

---

## Step 4: Clone the Space Repository

```bash
# Clone your new space
git clone https://huggingface.co/spaces/YOUR_USERNAME/grocery-tracker-api

# Enter the directory
cd grocery-tracker-api
```

---

## Step 5: Copy Backend Files

```bash
# Copy all backend files to the space directory
cp -r /path/to/your/backend/* .
```

Or manually copy these essential files:
- `Dockerfile`
- `requirements.txt`
- `README.md` (with HF metadata)
- `app/` folder (entire directory)

---

## Step 6: Verify Required Files

Your space directory should have:

```
grocery-tracker-api/
├── README.md          # Contains HF Spaces metadata
├── Dockerfile         # Docker build instructions
├── requirements.txt   # Python dependencies
└── app/
    ├── __init__.py
    ├── config.py
    ├── database.py
    ├── main.py
    ├── models/
    ├── routers/
    ├── schemas/
    ├── services/
    └── utils/
```

---

## Step 7: Commit and Push

```bash
# Add all files
git add .

# Commit
git commit -m "Initial deploy"

# Push (use access token as password)
git push
```

When prompted:
- **Username**: Your HuggingFace username
- **Password**: Your access token (from Step 3)

---

## Step 8: Configure Secrets

1. Go to your Space: `https://huggingface.co/spaces/YOUR_USERNAME/grocery-tracker-api`
2. Click **Settings** tab
3. Scroll to **Variables and secrets**
4. Add these secrets:

| Name | Value |
|------|-------|
| `SECRET_KEY` | A random 32+ character string |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` |

**To generate a secret key:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Step 9: Wait for Build

- Go to your Space page
- Click the **Logs** tab to monitor the build
- Build typically takes 2-5 minutes
- Once complete, you'll see "Running on..."

---

## Step 10: Test Your API

Your API is now live at:
```
https://YOUR_USERNAME-grocery-tracker-api.hf.space
```

Test endpoints:
- Health check: `https://YOUR_USERNAME-grocery-tracker-api.hf.space/health`
- API docs: `https://YOUR_USERNAME-grocery-tracker-api.hf.space/docs`

---

## Step 11: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set root directory to `frontend`
4. Add environment variable:
   - `VITE_API_URL` = `https://YOUR_USERNAME-grocery-tracker-api.hf.space`
5. Deploy!

---

## Troubleshooting

### Build Fails
- Check the Logs tab for error messages
- Ensure `requirements.txt` has all dependencies
- Verify Dockerfile syntax

### API Returns 500 Error
- Check if secrets are set correctly
- View logs in the Logs tab

### CORS Errors
- Update `FRONTEND_URL` secret to match your Vercel URL
- Rebuild the Space

### Space Sleeps (Free Tier)
- Free spaces sleep after inactivity
- First request after sleep takes ~30 seconds
- This is normal for free tier

---

## Updating Your Space

To push updates:

```bash
cd grocery-tracker-api
git add .
git commit -m "Update description"
git push
```

The space automatically rebuilds after each push.

---

## Your URLs

| Service | URL |
|---------|-----|
| Backend API | `https://YOUR_USERNAME-grocery-tracker-api.hf.space` |
| API Docs | `https://YOUR_USERNAME-grocery-tracker-api.hf.space/docs` |
| Frontend | `https://your-app.vercel.app` |
