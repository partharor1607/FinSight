# Quick Start Guide

## Prerequisites
- Node.js (v16+)
- MongoDB (running locally or MongoDB Atlas connection string)
- OpenAI API key (optional - system works without it using keyword matching)

## Setup Steps

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finsight
JWT_SECRET=your_super_secret_jwt_key_change_this
OPENAI_API_KEY=sk-your-openai-api-key-here
NODE_ENV=development
```

**Note**: If you don't have an OpenAI API key, the system will use keyword-based categorization as a fallback.

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Start MongoDB

If using local MongoDB:
```bash
mongod
```

Or use MongoDB Atlas and update the `MONGODB_URI` in your `.env` file.

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

Open your browser and navigate to: `http://localhost:3000`

## First Steps

1. **Register**: Create a new account
2. **Upload**: Upload a CSV or PDF bank statement
3. **Explore**: View categorized transactions and insights

## Sample CSV Format

Create a test CSV file with this format:

```csv
Date,Description,Amount
2024-01-15,Starbucks Coffee,5.50
2024-01-16,Amazon Purchase,29.99
2024-01-17,Grocery Store,85.23
2024-01-18,Gas Station,45.00
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check your `MONGODB_URI` in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use
- Change `PORT` in backend `.env`
- Update frontend `vite.config.js` proxy target if needed

### File Upload Issues
- Check file size (max 10MB)
- Ensure file is CSV or PDF format
- Check backend `uploads/` directory permissions

## Next Steps

- Customize categories in the Categories API
- Set up budgets for spending alerts
- Explore the Insights page for AI-generated advice

