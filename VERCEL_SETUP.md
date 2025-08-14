# Vercel Deployment Setup

This project is now configured for deployment on Vercel. Follow these steps to deploy:

## Prerequisites

1. **Install Vercel CLI** (optional but recommended):
   ```bash
   npm i -g vercel
   ```

2. **Create a Vercel account** at [vercel.com](https://vercel.com)

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Navigate to your project directory**:
   ```bash
   cd your-project-folder
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Follow the prompts**:
   - Link to existing project or create new one
   - Confirm build settings (should auto-detect)
   - Deploy!

### Option 2: Deploy via Git Integration

1. **Push your code to GitHub/GitLab**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect settings

## Required Environment Variables

Set these in your Vercel project settings:

### Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=your-database-name
```

### Application Settings
```
NODE_ENV=production
```

## Database Setup Options

### Option 1: Neon Database (Recommended)
1. Create account at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string to `DATABASE_URL`

### Option 2: Vercel Postgres
1. Go to your Vercel project dashboard
2. Go to Storage tab
3. Create new Postgres database
4. Environment variables will be set automatically

### Option 3: Supabase
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection details from Settings > Database

## Package.json Scripts

You'll need to add these scripts to your `package.json` for proper Vercel deployment:

```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "vite build"
  }
}
```

## Project Structure for Vercel

The project has been restructured for Vercel serverless functions:

```
├── api/                    # Vercel serverless functions
│   ├── episodes.ts         # GET /api/episodes
│   └── episodes/
│       └── refresh.ts      # POST /api/episodes/refresh
├── client/                 # Frontend React app
├── server/                 # Server utilities (used by API functions)
├── shared/                 # Shared schemas and types
├── vercel.json            # Vercel configuration
└── package.json
```

## Build Process

Vercel will automatically:

1. **Install dependencies**: `npm install`
2. **Build the frontend**: `npm run build` (runs `vite build`)
3. **Deploy API functions**: Deploy files in `api/` directory as serverless functions
4. **Deploy static files**: Serve the built frontend from `dist/`

## Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to "Domains" tab
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure TypeScript types are available for all imports
- Verify that `vite build` works locally

### API Issues
- Check function logs in Vercel dashboard
- Verify environment variables are set correctly
- Ensure database is accessible from Vercel's servers

### Database Connection Issues
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Check that database accepts connections from Vercel IP ranges
- Test connection locally with same credentials

### RSS Feed Issues
- Ensure RSS URLs are publicly accessible
- Check for CORS restrictions
- Verify RSS feed format is valid

## Performance Optimization

- **Function Cold Starts**: First request may be slower
- **Database Connections**: Use connection pooling for better performance
- **Caching**: Consider implementing caching for RSS data
- **CDN**: Vercel automatically provides global CDN for static assets

## Monitoring

- **Function Logs**: View in Vercel dashboard under "Functions" tab
- **Analytics**: Available in Vercel dashboard
- **Error Tracking**: Consider integrating Sentry or similar service

## Cost Considerations

**Vercel Free Tier Limits:**
- 100GB bandwidth per month
- 1,000 serverless function invocations per day
- 10 second function execution limit

**Upgrade triggers:**
- High traffic requiring more bandwidth
- Frequent RSS refreshes exceeding function limits
- Need for longer function execution times

That's it! Your podcast timeline application should now be successfully deployed on Vercel.