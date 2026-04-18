# ABV-IIITM Registration System - Render Deployment Guide

## Overview
This guide will help you deploy both the frontend and backend of the ABV-IIITM Registration System to Render.

## Prerequisites
- GitHub account with your project pushed
- Render account (free tier available)
- MongoDB Atlas account (free tier available)
- Gemini API key (for PDF processing)

## Step 1: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Create a new project: "ABV-IIITM Registration"

2. **Create Database Cluster**
   - Click "Build a Database"
   - Choose "M0 Sandbox" (free tier)
   - Select a cloud provider and region (closest to your users)
   - Leave cluster name as default or change to "abviiitm-cluster"

3. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

4. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Username: `abviiitm_admin`
   - Password: Generate a strong password (save it!)
   - Select "Read and write to any database"
   - Click "Create User"

5. **Get Connection String**
   - Go to "Database" -> "Connect" -> "Drivers"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `abviiitm_registration`

## Step 2: Deploy Backend to Render

1. **Connect GitHub to Render**
   - Go to [Render](https://render.com)
   - Sign up/login with GitHub
   - Authorize Render to access your repository

2. **Create Backend Service**
   - Click "New +" -> "Web Service"
   - Select your `HCI_PROJECT` repository
   - Configure service:
     - **Name**: `abviiitm-backend`
     - **Environment**: `Node`
     - **Root Directory**: `server`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Plan**: `Free`

3. **Add Environment Variables**
   - Go to "Environment" tab
   - Add these variables:
     ```
     NODE_ENV=production
     PORT=10000
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_super_secure_jwt_secret_key_here
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

4. **Deploy Backend**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your backend URL: `https://abviiitm-backend.onrender.com`

## Step 3: Deploy Frontend to Render

1. **Create Frontend Service**
   - Click "New +" -> "Static Site"
   - Select your `HCI_PROJECT` repository
   - Configure service:
     - **Name**: `abviiitm-frontend`
     - **Root Directory**: `client`
     - **Build Command**: `npm run build`
     - **Publish Directory**: `dist`
     - **Plan**: `Free`

2. **Add Environment Variables**
   - Go to "Environment" tab
   - Add this variable:
     ```
     VITE_API_URL=https://abviiitm-backend.onrender.com
     ```

3. **Deploy Frontend**
   - Click "Create Static Site"
   - Wait for deployment to complete
   - Note your frontend URL: `https://abviiitm-frontend.onrender.com`

## Step 4: Test the Deployment

1. **Check Backend Health**
   - Visit: `https://abviiitm-backend.onrender.com/api/health`
   - Should see: `{"status":"OK","message":"ABV-IIITM Registration System is running"}`

2. **Test Frontend**
   - Visit: `https://abviiitm-frontend.onrender.com`
   - Should load the login page

3. **Test Registration**
   - Try registering a new student account
   - Verify email functionality works

## Step 5: Post-Deployment Configuration

1. **Create Admin Account**
   - Register as an admin using the staff registration
   - Update role to 'admin' in MongoDB if needed

2. **Upload Subject PDFs**
   - Login as admin
   - Upload subject PDFs for different programs
   - Verify PDF processing works

3. **Test Complete Workflow**
   - Student registration
   - Subject selection
   - Fee payment
   - Receipt upload
   - Faculty dashboard

## Troubleshooting

### Common Issues

1. **Backend Not Starting**
   - Check environment variables
   - Verify MongoDB connection string
   - Check Render logs

2. **Frontend Not Connecting to Backend**
   - Verify `VITE_API_URL` environment variable
   - Check CORS configuration
   - Ensure backend is running

3. **Database Connection Issues**
   - Verify MongoDB Atlas IP access
   - Check database user credentials
   - Ensure cluster is running

4. **PDF Processing Issues**
   - Verify Gemini API key
   - Check PDF file size limits
   - Review error logs

### Useful Commands

```bash
# Check Render logs
# In Render dashboard, go to your service -> Logs

# Restart services
# In Render dashboard, go to your service -> Manual Deploy -> Deploy Latest Commit

# Check environment variables
# In Render dashboard, go to your service -> Environment
```

## Production Considerations

1. **Security**
   - Use strong passwords
   - Keep API keys secure
   - Enable HTTPS (Render does this automatically)

2. **Performance**
   - Monitor free tier limits
   - Optimize database queries
   - Consider upgrading plans if needed

3. **Backups**
   - MongoDB Atlas provides automatic backups
   - Regularly export important data

4. **Monitoring**
   - Monitor Render service health
   - Set up alerts for downtime
   - Check error logs regularly

## Support

- Render Documentation: https://render.com/docs
- MongoDB Atlas Documentation: https://docs.mongodb.com/atlas
- GitHub Repository: https://github.com/psp2535/HCI_PROJECT

## Next Steps

1. Share the frontend URL with users
2. Monitor system performance
3. Plan for scaling if needed
4. Regular maintenance and updates
