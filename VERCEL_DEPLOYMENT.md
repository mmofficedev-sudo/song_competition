# Vercel Deployment Guide

## Quick Start

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (already done ✅)

2. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub

3. **Click "Add New Project"** and import your repository:
   - Repository: `mmofficedev-sudo/song_competition`
   - Framework Preset: **Other** (or leave as default)
   - Root Directory: `./` (root)

4. **Configure Environment Variables**:
   - Click "Environment Variables"
   - Add: `MONGODB_URI` = your MongoDB connection string
   - Add: `NODE_ENV` = `production` (optional)

5. **Click "Deploy"**

Vercel will automatically:
- Build the React frontend from `client/` directory
- Deploy the API as serverless functions from `api/` directory
- Configure routing based on `vercel.json`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? (select your account)
- Link to existing project? **No** (first time) or **Yes** (subsequent deployments)
- Project name: `song-competition` (or your preferred name)
- Directory: `./` (current directory)

4. **Set Environment Variables**:
```bash
vercel env add MONGODB_URI
# Paste your MongoDB connection string when prompted
```

5. **Redeploy** (to apply environment variables):
```bash
vercel --prod
```

## Project Structure

```
song_competition/
├── api/
│   └── index.js          # Serverless function (Express app)
├── client/               # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── routes/               # API route handlers
├── models/               # MongoDB models
├── server.js             # Original Express server (for local dev)
├── vercel.json           # Vercel configuration
└── package.json
```

## How It Works

1. **API Routes** (`/api/*`):
   - Handled by `api/index.js` serverless function
   - Routes: `/api/songs`, `/api/scores`, `/api/judges`, etc.

2. **Frontend** (`/*`):
   - Built React app from `client/build/`
   - Served as static files
   - All non-API routes serve `index.html` (SPA routing)

3. **Build Process**:
   - Vercel runs `cd client && npm run build`
   - Output: `client/build/` directory

## Environment Variables

Required in Vercel Dashboard:
- `MONGODB_URI`: Your MongoDB Atlas connection string

Example:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

## Troubleshooting

### Build Fails
- Check that `client/package.json` has `vercel-build` script
- Ensure all dependencies are in `package.json` (not just `package-lock.json`)

### API Routes Return 404
- Verify `vercel.json` routing configuration
- Check that `api/index.js` exports the Express app correctly

### MongoDB Connection Issues
- Verify `MONGODB_URI` is set in Vercel environment variables
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Vercel)
- Ensure MongoDB connection string is correct

### Frontend Can't Reach API
- API calls use relative paths (`/api/...`) which should work automatically
- Check browser console for CORS errors
- Verify API routes are deployed correctly

## Local Testing

Test the Vercel build locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run Vercel dev server
vercel dev
```

This will simulate the Vercel environment locally.

## Post-Deployment

After deployment, your app will be available at:
- Production: `https://your-project.vercel.app`
- Preview: `https://your-project-git-branch.vercel.app`

Update your MongoDB Atlas IP whitelist to allow Vercel's IPs, or use `0.0.0.0/0` for development.

## Notes

- The original `server.js` is kept for local development
- Vercel uses `api/index.js` for serverless functions
- Frontend build happens automatically during deployment
- Each API route is a serverless function (scales automatically)
