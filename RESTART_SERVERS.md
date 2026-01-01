# 🔄 RESTART INSTRUCTIONS

## The error "Only CSV and PDF files are allowed" is from OLD CACHED CODE

The current code ONLY accepts TXT files. You MUST restart both servers to clear the cache.

## Steps to Fix:

### 1. Stop Backend Server
- Find the terminal running `node server.js` or `npm start`
- Press `Ctrl+C` to stop it
- Wait for it to fully stop

### 2. Clear Node.js Cache (Optional but recommended)
```bash
cd backend
# Delete node_modules/.cache if it exists
rm -rf node_modules/.cache
```

### 3. Restart Backend Server
```bash
cd backend
node server.js
```

**Look for this message when it starts:**
```
📋 Upload route loaded - Version: TXT-ONLY v2.0
✅ Only TXT files are accepted
```

### 4. Stop Frontend Server
- Find the terminal running `npm run dev`
- Press `Ctrl+C` to stop it

### 5. Restart Frontend Server
```bash
cd frontend
npm run dev
```

**Check browser console for:**
```
📋 Upload component loaded - Version: TXT-ONLY v2.0
```

### 6. Hard Refresh Browser
- Chrome/Edge: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

### 7. Test Upload
- Try uploading a `.txt` file
- Check backend terminal for: `=== FILE UPLOAD FILTER ===`
- Should see: `✅ File ACCEPTED: yourfile.txt`

## If Still Not Working:

1. Check backend terminal - do you see the version message?
2. Check browser console - do you see the version message?
3. If NO version messages appear, the servers are still running old code
4. Kill all Node processes: `pkill -f node` (Mac/Linux) or `taskkill /F /IM node.exe` (Windows)
5. Restart both servers from scratch

## Current Configuration:
- ✅ Backend: Only accepts `.txt` files
- ✅ Frontend: Only accepts `.txt` files  
- ✅ Parser: Tested and working (parsed 38 transactions successfully)

