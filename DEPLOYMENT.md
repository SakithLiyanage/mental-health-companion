# Deployment Guide for Mental Health Companion

## 🚀 Deploy to Vercel

### Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Create a Vercel account at https://vercel.com
3. Have your MongoDB Atlas connection string ready

### Step 1: Install Dependencies
```bash
# Install all dependencies
npm run install:all

# Or install separately
npm run install:frontend
npm run install:backend
```

### Step 2: Test Local Build
```bash
# Test frontend build
cd frontend && npm run build

# Test backend
cd backend && npm start
```

### Step 3: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)
```bash
# From project root
vercel

# Follow the prompts:
# - Setup and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: mental-health-companion
# - Directory: ./
```

#### Option B: Using GitHub + Vercel Dashboard
1. Push your code to GitHub
2. Go to https://vercel.com/dashboard
3. Click "New Project"
4. Import your GitHub repository
5. Configure build settings (see below)

### Step 4: Configure Environment Variables in Vercel
Go to your project dashboard → Settings → Environment Variables

Add these variables:
```
MONGODB_URI = your_mongodb_atlas_connection_string
JWT_SECRET = your_super_secret_jwt_key_for_production  
OPENAI_API_KEY = your_openai_api_key (if using AI features)
FRONTEND_URL = https://your-app-name.vercel.app
NODE_ENV = production
```

### Step 5: Configure Build Settings
In Vercel dashboard → Settings → Build & Development Settings:
- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: `frontend/build`
- Install Command: `npm run install:all`

### Step 6: Update Frontend Environment
After deployment, update `frontend/.env.production`:
```
REACT_APP_API_URL=https://your-actual-vercel-domain.vercel.app/api
```

Then redeploy:
```bash
vercel --prod
```

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check that all dependencies are installed
   - Ensure `vercel.json` is in root directory
   - Verify Node.js version compatibility

2. **API Routes Not Working**
   - Verify `vercel.json` routing configuration
   - Check environment variables are set
   - Ensure MongoDB connection is working

3. **Frontend Not Loading**
   - Check build directory is correct (`frontend/build`)
   - Verify static file routing in `vercel.json`

4. **CORS Errors**
   - Update backend CORS configuration with your Vercel domain
   - Check `FRONTEND_URL` environment variable

### Logs and Debugging:
```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --since=1h
```

## 📱 Post-Deployment Checklist

- [ ] Test user registration/login
- [ ] Test journal functionality
- [ ] Test emotion tracking
- [ ] Test chat with Luna
- [ ] Test daily goals
- [ ] Verify all emojis display correctly
- [ ] Test responsive design on mobile
- [ ] Check performance metrics

## 🔐 Security Notes

- Use strong JWT secrets in production
- Enable MongoDB IP whitelisting
- Configure CORS properly
- Use HTTPS for all API calls
- Regularly rotate API keys

## 📊 Monitoring

- Monitor Vercel Analytics
- Set up error tracking (Sentry recommended)
- Monitor MongoDB Atlas metrics
- Set up uptime monitoring
