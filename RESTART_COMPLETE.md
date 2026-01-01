# 🔄 COMPLETE SERVER RESTART GUIDE

## The Problem
You're seeing: **"Invalid file type. Only CSV and PDF files are allowed"**

This error message is **NOT in the code anymore**. It means your server is running **OLD CACHED CODE**.

## ✅ SOLUTION: Complete Restart

### Step 1: Kill ALL Node Processes

**Open a NEW terminal window** and run:

```bash
# Kill all Node processes
killall -9 node

# Or if that doesn't work:
pkill -9 node

# Verify they're all dead:
ps aux | grep node | grep -v grep
# Should show NOTHING
```

### Step 2: Clear Node Module Cache (Optional but Recommended)

```bash
cd "/Users/partharora/Desktop/Projects/FinSight – AI-Powered Expense Intelligence Platform/backend"
rm -rf node_modules/.cache 2>/dev/null || true
```

### Step 3: Start Backend Server

```bash
cd "/Users/partharora/Desktop/Projects/FinSight – AI-Powered Expense Intelligence Platform/backend"
node server.js
```

**Look for these messages:**
```
═══════════════════════════════════════════════════════
🚀 SERVER STARTING - ES MODULES VERSION
═══════════════════════════════════════════════════════
✅ Using ES modules (import/export)
✅ This is NOT CommonJS (require/module.exports)
═══════════════════════════════════════════════════════
═══════════════════════════════════════════════════════
📋 UPLOAD ROUTE LOADED - ES MODULES VERSION
📋 Version: ES-MODULES-TXT-ONLY-v3.0-...
✅ Only TXT files are accepted
❌ CSV and PDF are NOT accepted
❌ OLD ERROR MESSAGE SHOULD NOT APPEAR
═══════════════════════════════════════════════════════
```

### Step 4: Verify Server Version

Open browser and go to:
```
http://localhost:5000/api/upload/health
```

**You MUST see:**
```json
{
  "status": "OK",
  "version": "ES-MODULES-TXT-ONLY-v3.0-...",
  "allowedTypes": [".txt"],
  "message": "Only TXT files are accepted"
}
```

**If you see an OLD version or error**, the server is still cached. Go back to Step 1.

### Step 5: Restart Frontend

In a **NEW terminal window**:

```bash
cd "/Users/partharora/Desktop/Projects/FinSight – AI-Powered Expense Intelligence Platform/frontend"
npm run dev
```

### Step 6: Hard Refresh Browser

- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

Or clear browser cache completely.

### Step 7: Test Upload

1. Upload a `.txt` file
2. Check backend terminal - you should see:
   ```
   ═══════════════════════════════════════════════════════
   === FILE UPLOAD FILTER (ES MODULES) ===
   Route Version: ES-MODULES-TXT-ONLY-v3.0-...
   ✅ File ACCEPTED: yourfile.txt
   ```

## ⚠️ If Still Not Working

1. **Check backend terminal** - Do you see the ES MODULES version messages?
2. **Check health endpoint** - What version does it show?
3. **Check browser console** - What error do you see?
4. **Kill processes harder**:
   ```bash
   # Find process on port 5000
   lsof -i:5000
   # Kill it
   kill -9 <PID>
   ```

## Current Code Status:
- ✅ Backend: ES modules, only accepts `.txt` files
- ✅ Frontend: Only accepts `.txt` files  
- ✅ Error message: "Only TXT files are allowed" (NOT CSV/PDF)

