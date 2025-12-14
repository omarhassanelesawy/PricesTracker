# Grocery Price Tracker - Backend

## Environment Variables

Required for production:

```
DATABASE_URL=sqlite+aiosqlite:///./grocery_tracker.db
SECRET_KEY=your-super-secret-key
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_URL=https://your-app.vercel.app
```

## Local Development

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Deploy to Railway

1. Push to GitHub
2. Create new project in Railway → Deploy from GitHub
3. Set environment variables in Railway dashboard
4. Railway will auto-deploy!

## API Docs

- Local: http://localhost:8000/docs
- Production: https://your-backend.railway.app/docs
