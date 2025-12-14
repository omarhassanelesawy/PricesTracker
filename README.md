# Grocery Price Tracker 🛒

A web application that helps you track grocery prices across different supermarkets by uploading receipts (manually or via OCR) and provides powerful search and price comparison features.

## 🔗 Live Demo

**Frontend:** [https://prices-tracker-eta.vercel.app](https://prices-tracker-eta.vercel.app)

**Backend API:** [https://omarhassanelesawy-grocery-tracker-api.hf.space](https://omarhassanelesawy-grocery-tracker-api.hf.space)

**API Docs:** [https://omarhassanelesawy-grocery-tracker-api.hf.space/docs](https://omarhassanelesawy-grocery-tracker-api.hf.space/docs)

## Features

- **Receipt Management**: Add receipts manually or upload images for OCR extraction
- **Price Tracking**: Track prices for all your grocery items over time
- **Search & Compare**: Search items by keyword and compare prices across supermarkets
- **Price History**: View price trends with interactive charts
- **Multi-Currency Support**: EGP, USD, EUR, GBP, SAR, AED
- **Multiple Auth Options**: Email/password or Google OAuth
- **Multi-User Support**: Each user has their own private data

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python) |
| Database | SQLite (no installation needed) |
| ORM | SQLAlchemy |
| Auth | JWT + OAuth2 (Google) |
| OCR | Google Gemini API |
| Frontend | React + Vite |
| Charts | Recharts |
| Styling | Custom CSS |

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+**
- **Node.js 18+** and npm
- **Gemini API Key** (free at [Google AI Studio](https://aistudio.google.com/apikey))

> **Note**: No database installation required! SQLite is built into Python.

## Setup Instructions

### 1. Get the Code

```bash
cd /Users/omarelesawy/workdir/dev
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  
# On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Add your Gemini API key to .env file
# Get key from: https://aistudio.google.com/apikey

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: http://localhost:5173

## Environment Variables

### Backend (.env)

```env
# Database (SQLite - auto-created)
DATABASE_URL=sqlite+aiosqlite:///./grocery_tracker.db

# Security - CHANGE IN PRODUCTION!
SECRET_KEY=your-super-secret-key-generate-a-random-one

# JWT
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days

# Google OAuth (optional for social login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Gemini API (required for OCR)
GEMINI_API_KEY=your-gemini-api-key

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## Setting Up Gemini API (Required for OCR)

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **Create API Key**
3. Copy the key and add to your `.env` file:
   ```
   GEMINI_API_KEY=your-api-key
   ```

That's it! Gemini API has a generous free tier (15 requests/minute, 1 million tokens/month).

## Setting Up Google OAuth (Optional for Social Login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Set redirect URI: `http://localhost:8000/auth/google/callback`
6. Copy Client ID and Secret to `.env`

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| GET | `/auth/google` | Start Google OAuth flow |
| GET | `/auth/me` | Get current user profile |
| PUT | `/auth/me` | Update user profile |

### Receipts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/receipts` | List receipts (paginated) |
| POST | `/receipts` | Create receipt with items |
| POST | `/receipts/ocr` | Upload receipt for OCR |
| GET | `/receipts/{id}` | Get receipt details |
| PUT | `/receipts/{id}` | Update receipt |
| DELETE | `/receipts/{id}` | Delete receipt |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/items/{receipt_id}` | Add item to receipt |
| PUT | `/items/{id}` | Update item |
| DELETE | `/items/{id}` | Delete item |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search items by keyword |
| GET | `/search/history/{item}` | Get price history |
| GET | `/search/supermarkets` | Get supermarket list |

## Usage

1. **Register/Login**: Create an account or login
2. **Add Receipt**: 
   - Manual: Fill in supermarket, date, and items
   - OCR: Upload a receipt photo for automatic extraction
3. **Search**: Use the search page to find items by name or brand
4. **Compare**: View price history to see trends and find best prices

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # SQLite setup
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routers/             # API routes
│   │   ├── services/            # Business logic
│   │   └── utils/               # Utilities
│   ├── requirements.txt
│   ├── .env                     # Your config (create this)
│   └── grocery_tracker.db       # SQLite database (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── context/             # React context
│   │   ├── services/            # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Development

### Running Tests

```bash
# Backend
cd backend
pytest tests/ -v

# Frontend
cd frontend
npm test
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
```

## License

MIT License - feel free to use this for personal or commercial projects.
