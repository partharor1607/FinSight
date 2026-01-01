# 🚀 START SERVERS

## Quick Start

You need to start BOTH servers in separate terminals.

### Option 1: Use the scripts (Easiest)

**Terminal 1 - Backend:**
```bash
cd "/Users/partharora/Desktop/Projects/FinSight – AI-Powered Expense Intelligence Platform"
./start-backend.sh
```

**Terminal 2 - Frontend:**
```bash
cd "/Users/partharora/Desktop/Projects/FinSight – AI-Powered Expense Intelligence Platform"
./start-frontend.sh
```

### Option 2: Manual commands

**Terminal 1 - Backend:**
```bash
cd "/Users/partharora/Desktop/Projects/FinSight – AI-Powered Expense Intelligence Platform/backend"
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd "/Users/partharora/Desktop/Projects/FinSight – AI-Powered Expense Intelligence Platform/frontend"
npm run dev
```

## What You Should See

### Backend Terminal:
```
═══════════════════════════════════════════════════════
🚀 SERVER STARTING - ES MODULES VERSION
📋 UPLOAD ROUTE LOADED - ES MODULES VERSION
✅ Only TXT files are accepted
🚀 Server running on port 5000
```

### Frontend Terminal:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
```

## Access Your App

- **Frontend:** http://localhost:3000
- **Backend Health:** http://localhost:5000/api/health
- **Upload Health:** http://localhost:5000/api/upload/health

## Troubleshooting

If you see "port already in use":
```bash
# Kill processes on ports
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

Then restart the servers.

