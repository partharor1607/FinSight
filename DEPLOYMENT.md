# 🚀 FinSight Deployment Guide

This guide will help you deploy FinSight to production.

## Deployment Architecture

- **Frontend**: Vercel (Recommended) or Netlify
- **Backend**: Render (Recommended) or Railway
- **Database**: MongoDB Atlas (Already configured)

---

## 📋 Prerequisites

1. GitHub account (you already have this)
2. Vercel account (free): https://vercel.com/signup
3. Render account (free): https://render.com/signup
4. MongoDB Atlas connection string (already configured)

---

## 🔧 Step 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Connect your GitHub account

### 1.2 Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `partharor1607/FinSight`
3. Configure the service:
   - **Name**: `finsight-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 1.3 Set Environment Variables
In Render dashboard, go to "Environment" tab and add:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://Parth:amit%40123A@cluster0.7xkhoyh.mongodb.net/finsight?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_to_random_string
OPENAI_API_KEY=your_openai_key_if_you_have_one
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**Note**: Update `FRONTEND_URL` after deploying frontend in Step 2.

### 1.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy your backend URL (e.g., `https://finsight-backend.onrender.com`)

---

## 🎨 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import your repository: `partharor1607/FinSight`

### 2.2 Configure Project
1. **Framework Preset**: Vite
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### 2.3 Set Environment Variables
Add environment variable:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

Replace `your-backend-url.onrender.com` with your actual Render backend URL from Step 1.4.

### 2.4 Deploy
1. Click "Deploy"
2. Wait for deployment
3. Copy your frontend URL (e.g., `https://finsight.vercel.app`)

### 2.5 Update Backend CORS
1. Go back to Render dashboard
2. Update `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy the backend service

---

## 🔄 Alternative: Deploy to Railway (Backend)

If you prefer Railway:

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables (same as Render)
6. Set root directory to `backend`
7. Railway will auto-detect and deploy

---

## 🔄 Alternative: Deploy to Netlify (Frontend)

If you prefer Netlify:

1. Go to https://netlify.com
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
6. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```
7. Deploy

---

## ✅ Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables set correctly
- [ ] CORS configured with frontend URL
- [ ] Test user registration/login
- [ ] Test file upload
- [ ] Test all features

---

## 🔗 Your Live URLs

After deployment, you'll have:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

---

## 🐛 Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify MongoDB Atlas connection string
- Ensure all environment variables are set
- Check CORS settings

### Frontend Issues
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors
- Ensure backend URL is accessible

### CORS Errors
- Update `FRONTEND_URL` in backend environment variables
- Redeploy backend after updating CORS

---

## 📝 Notes

- Render free tier spins down after 15 minutes of inactivity (first request may be slow)
- Vercel has excellent free tier with no spin-down
- Consider upgrading for production use

---

Need help? Check the logs in your deployment platform's dashboard.

