# MongoDB Atlas Setup Guide

## Why MongoDB Atlas?

- ✅ **Accessible from anywhere** - Other users can connect to it
- ✅ **No local installation needed** - Runs in the cloud
- ✅ **Free tier available** - M0 cluster is free forever
- ✅ **Automatic backups** - Built-in data protection
- ✅ **Scalable** - Easy to upgrade as you grow

## Step-by-Step Setup

### 1. Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email (or use Google/GitHub)
3. Verify your email address

### 2. Create a Free Cluster

1. After logging in, click **"Build a Database"**
2. Choose **"M0 FREE"** tier (Free forever)
3. Select a **Cloud Provider** (AWS, Google Cloud, or Azure)
4. Choose a **Region** closest to you (e.g., Mumbai for India)
5. Click **"Create"** (takes 3-5 minutes)

### 3. Create Database User

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `finsight-admin`)
5. Click **"Autogenerate Secure Password"** or create your own
6. **IMPORTANT**: Copy and save the password! You'll need it.
7. Set user privileges to **"Atlas admin"** or **"Read and write to any database"**
8. Click **"Add User"**

### 4. Whitelist Your IP Address

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development, click **"Add Current IP Address"**
4. For production (allowing all users), click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ **Note**: This is less secure but allows any user to connect
5. Click **"Confirm"**

### 5. Get Your Connection String

1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` with your database username
7. Replace `<password>` with your database password
8. Add your database name at the end:
   ```
   mongodb+srv://finsight-admin:yourpassword@cluster0.xxxxx.mongodb.net/finsight?retryWrites=true&w=majority
   ```

### 6. Update Your .env File

1. Open `backend/.env` file
2. Replace the `MONGODB_URI` line with your Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://finsight-admin:yourpassword@cluster0.xxxxx.mongodb.net/finsight?retryWrites=true&w=majority
   ```
3. Save the file

### 7. Restart Your Backend Server

1. Stop your current backend server (Ctrl+C)
2. Restart it:
   ```bash
   cd backend
   node server.js
   ```
3. You should see: `MongoDB connected successfully`

## Security Best Practices

- ✅ **Never commit your `.env` file** to Git (it's already in .gitignore)
- ✅ **Use strong passwords** for database users
- ✅ **Limit IP access** in production (don't use 0.0.0.0/0)
- ✅ **Rotate passwords** regularly
- ✅ **Use environment variables** for all sensitive data

## Troubleshooting

### Connection Timeout
- Check your IP is whitelisted in Network Access
- Verify your connection string is correct
- Check your internet connection

### Authentication Failed
- Verify username and password are correct
- Make sure you replaced `<username>` and `<password>` in the connection string
- Check user has proper permissions

### Database Not Found
- Make sure you added `/finsight` at the end of the connection string
- MongoDB Atlas will create the database automatically on first use

## Need Help?

Once you have your connection string, share it with me and I'll help you update the `.env` file!

