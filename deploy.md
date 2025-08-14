# Deployment Guide

This guide covers how to deploy the Regulation Podcast Timeline application to various hosting platforms. The application is a full-stack TypeScript project with a React frontend and Express.js backend.

## Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- A PostgreSQL database (required for production)
- The RSS feed URLs for your podcast content
- Basic familiarity with command line operations

## Environment Variables

All hosting platforms will need these environment variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-username
PGPASSWORD=your-password
PGDATABASE=your-database-name

# Application Configuration
NODE_ENV=production
PORT=5000

# RSS Feed URLs (configure as needed)
PATREON_RSS_URL=https://www.patreon.com/rss/YourPodcast?auth=your-auth-token
MEGAPHONE_RSS_URL=https://feeds.megaphone.fm/your-feed
```

## Platform-Specific Deployment

### 1. Vercel (Recommended for React/Express apps)

Vercel provides excellent support for full-stack applications with automatic deployments.

#### Setup Steps:

1. **Prepare your project:**
   ```bash
   # Add vercel.json configuration
   npm install -g vercel
   ```

2. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       },
       {
         "src": "client/**/*",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "/client/dist/$1"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "build": "npm run build:client && npm run build:server",
       "build:client": "cd client && vite build",
       "build:server": "tsc server/index.ts --outDir dist/server",
       "vercel-build": "npm run build"
     }
   }
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

5. **Configure environment variables** in the Vercel dashboard under Settings > Environment Variables.

6. **Database Setup:** Use Vercel's PostgreSQL addon or connect to external providers like Neon, Supabase, or PlanetScale.

### 2. Netlify

Netlify works well for static sites but requires some configuration for full-stack apps.

#### Setup Steps:

1. **Create `netlify.toml`:**
   ```toml
   [build]
     publish = "client/dist"
     command = "npm run build:client"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Convert backend to Netlify Functions** (create `netlify/functions/` directory and adapt your Express routes).

3. **Deploy via Git** by connecting your repository to Netlify.

### 3. Railway

Railway provides easy deployment for full-stack applications with built-in PostgreSQL.

#### Setup Steps:

1. **Create `railway.toml`:**
   ```toml
   [build]
     builder = "NIXPACKS"

   [deploy]
     startCommand = "npm start"
     restartPolicyType = "ON_FAILURE"
   ```

2. **Add start script to package.json:**
   ```json
   {
     "scripts": {
       "start": "npm run build && node dist/server/index.js",
       "build": "npm run build:client && npm run build:server"
     }
   }
   ```

3. **Deploy:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

4. **Add PostgreSQL:** Railway provides one-click PostgreSQL databases in their dashboard.

### 4. Render

Render offers both static site and web service hosting with managed databases.

#### Setup Steps:

1. **Create `render.yaml`:**
   ```yaml
   services:
     - type: web
       name: podcast-timeline
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: DATABASE_URL
           fromDatabase:
             name: podcast-timeline-db
             property: connectionString

   databases:
     - name: podcast-timeline-db
       databaseName: podcast_timeline
       user: podcast_user
   ```

2. **Connect your GitHub repository** to Render for automatic deployments.

3. **Configure environment variables** in the Render dashboard.

### 5. DigitalOcean App Platform

DigitalOcean provides a Platform-as-a-Service with integrated database options.

#### Setup Steps:

1. **Create `.do/app.yaml`:**
   ```yaml
   name: podcast-timeline
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/podcast-timeline
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: DATABASE_URL
       value: ${podcast-timeline-db.DATABASE_URL}
   databases:
   - name: podcast-timeline-db
     engine: PG
     version: "13"
   ```

2. **Deploy via doctl CLI** or through the DigitalOcean dashboard.

### 6. Traditional VPS (Ubuntu/Debian)

For more control, deploy on a virtual private server.

#### Setup Steps:

1. **Server Setup:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Database Setup:**
   ```bash
   sudo -u postgres createuser --interactive
   sudo -u postgres createdb podcast_timeline
   ```

3. **Application Setup:**
   ```bash
   # Clone your repository
   git clone https://github.com/your-username/podcast-timeline.git
   cd podcast-timeline
   
   # Install dependencies and build
   npm install
   npm run build
   
   # Create PM2 ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'podcast-timeline',
       script: 'dist/server/index.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       }
     }]
   }
   EOF
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Nginx Configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Database Migration

After deployment, run database migrations:

```bash
# Using Drizzle
npm run db:push

# Or manually create tables using the schema in shared/schema.ts
```

## Post-Deployment Checklist

- [ ] Environment variables configured correctly
- [ ] Database connected and migrated
- [ ] RSS feeds accessible and returning data
- [ ] Application loads without errors
- [ ] Search functionality working
- [ ] Responsive design working on mobile
- [ ] HTTPS enabled (most platforms do this automatically)

## Monitoring and Maintenance

1. **Application Monitoring:**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Monitor error rates and performance
   - Set up log aggregation if needed

2. **Database Maintenance:**
   - Regular backups (automated on most platforms)
   - Monitor database performance
   - Plan for scaling as data grows

3. **RSS Feed Updates:**
   - Monitor RSS feed endpoints for changes
   - Set up alerts for failed feed fetches
   - Consider caching strategies for high traffic

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Ensure all dependencies are in package.json
   - Check Node.js version compatibility
   - Verify TypeScript configuration

2. **Database Connection Issues:**
   - Double-check DATABASE_URL format
   - Ensure database exists and is accessible
   - Check firewall settings for VPS deployments

3. **RSS Feed Issues:**
   - Verify RSS URLs are accessible from deployment environment
   - Check for CORS issues
   - Ensure authentication tokens are valid

4. **Static Asset Issues:**
   - Verify build output directory
   - Check routing configuration for SPA
   - Ensure assets are served correctly

## Cost Considerations

**Free Tier Options:**
- Vercel: Good for small to medium traffic
- Netlify: 100GB bandwidth/month
- Railway: $5/month credit
- Render: Limited but functional

**Paid Options:**
- Vercel Pro: $20/month per member
- Railway: Usage-based pricing
- DigitalOcean: $5-12/month for basic apps
- VPS: $5-20/month depending on specs

Choose based on your expected traffic, budget, and technical requirements.