# GitHub Actions Environment Variables Guide

## How Environment Variables Work in GitHub Actions

### ✅ YES - Environment Variables ARE Baked into Docker Images at Build Time

When GitHub Actions builds your Docker images, the environment variables are **passed as build arguments** and **baked into the image** during the build process.

## Frontend Environment Variables

### How It Works:

1. **GitHub Secrets** → Set in your repository settings
2. **Workflow reads secrets** → Passes them as build-args to Docker
3. **Dockerfile receives build-args** → Sets them as ENV during build
4. **Next.js build** → Embeds `NEXT_PUBLIC_*` vars into JavaScript bundles
5. **Final image** → Contains pre-built static files with env vars baked in

### Configuration Steps:

#### 1. Set GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_FRONTEND_URL=https://yourdomain.com
```

#### 2. Dockerfile (Already Configured)

```dockerfile
FROM node:24-alpine AS builder
WORKDIR /app

# Build-time arguments (received from GitHub Actions)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_FRONTEND_URL

# Set as environment variables for the build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL

# Build the app (env vars are embedded in the build)
RUN yarn build
```

#### 3. GitHub Actions Workflow (Already Configured)

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: ./frontend
    push: true
    build-args: |
      NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com' }}
      NEXT_PUBLIC_FRONTEND_URL=${{ secrets.NEXT_PUBLIC_FRONTEND_URL || 'https://yourdomain.com' }}
```

### Important Notes:

- ✅ **Build-time only**: Frontend env vars are embedded during `yarn build`
- ✅ **Cannot be changed at runtime**: Once image is built, env vars are fixed
- ✅ **Fallback values**: If secrets aren't set, uses default values
- ✅ **Next.js requirement**: Only `NEXT_PUBLIC_*` vars are exposed to browser

## Backend Environment Variables

### How It Works:

Backend env vars are **NOT baked into the image**. They are provided at **runtime** when you start the container.

### Why?

- Security: Sensitive data (JWT secrets, DB passwords) shouldn't be in images
- Flexibility: Same image can be used in different environments
- Best practice: Separate config from code

### Configuration:

#### Docker Run:
```bash
docker run -d \
  -e MONGODB_URI="mongodb://prod-db:27017" \
  -e JWT_SECRET="your-secret" \
  -e FRONTEND_URL="https://yourdomain.com" \
  ghcr.io/yourorg/backend:latest
```

#### Docker Compose:
```yaml
services:
  backend:
    image: ghcr.io/yourorg/backend:latest
    environment:
      - MONGODB_URI=mongodb://mongodb:27017
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=https://yourdomain.com
```

#### Kubernetes:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
data:
  jwt-secret: <base64-encoded>
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: jwt-secret
```

## Summary Table

| Component | When Set | Where Stored | Can Change at Runtime? |
|-----------|----------|--------------|----------------------|
| Frontend `NEXT_PUBLIC_*` | Build time | In JavaScript bundles | ❌ No - rebuild required |
| Backend env vars | Runtime | Environment variables | ✅ Yes - restart container |

## Workflow Breakdown

### 1. CI Build (`ci.yml`)
- Runs on every push/PR
- Uses secrets or fallback values
- Just validates build works
- **Does NOT push images**

### 2. Frontend Build (`frontend.yml`)
- Runs when frontend code changes
- Builds with production env vars from secrets
- Pushes image to GitHub Container Registry
- **Image contains baked-in env vars**

### 3. Backend Build (`backend.yml`)
- Runs when backend code changes
- Builds Go binary
- Pushes image to GitHub Container Registry
- **Image does NOT contain env vars**

### 4. Release (`release.yml`)
- Runs when you push a version tag (e.g., `v1.0.0`)
- Builds both frontend and backend
- Tags images with version number
- **Frontend image has baked-in env vars**

## Testing Locally

### Frontend with custom env vars:
```bash
cd frontend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.test.com \
  --build-arg NEXT_PUBLIC_FRONTEND_URL=https://test.com \
  -t frontend:test .
```

### Backend with runtime env vars:
```bash
cd backend
docker build -t backend:test .
docker run -e MONGODB_URI=mongodb://localhost:27017 backend:test
```

## Deployment Checklist

### Before First Deploy:

1. **Set GitHub Secrets**:
   - Go to repo Settings → Secrets → Actions
   - Add `NEXT_PUBLIC_API_URL`
   - Add `NEXT_PUBLIC_FRONTEND_URL`

2. **Push Code**:
   - GitHub Actions will build images
   - Images pushed to `ghcr.io/yourorg/repo/frontend:latest`
   - Images pushed to `ghcr.io/yourorg/repo/backend:latest`

3. **Deploy**:
   - Pull images from GitHub Container Registry
   - Frontend: Just run (env vars already baked in)
   - Backend: Provide runtime env vars

### Updating Environment Variables:

**Frontend** (requires rebuild):
1. Update GitHub secrets
2. Push code or manually trigger workflow
3. New image built with new env vars
4. Deploy new image

**Backend** (no rebuild needed):
1. Update env vars in deployment config
2. Restart containers
3. Done!

## Common Issues

### Frontend env vars not working?
- ✅ Check they start with `NEXT_PUBLIC_`
- ✅ Check GitHub secrets are set
- ✅ Rebuild and redeploy image

### Backend can't connect to database?
- ✅ Check runtime env vars are provided
- ✅ Check connection strings are correct
- ✅ Check network connectivity

### Image too large?
- Frontend: Normal (includes Node.js and built files)
- Backend: Should be small (~20MB with Alpine)

## Security Best Practices

1. **Never commit secrets** to git
2. **Use GitHub Secrets** for sensitive data
3. **Frontend**: Only non-sensitive data in `NEXT_PUBLIC_*`
4. **Backend**: All sensitive data as runtime env vars
5. **Rotate secrets** regularly
6. **Use different secrets** for dev/staging/prod

## Example: Full Deployment Flow

```bash
# 1. Set GitHub secrets (one time)
# Go to repo settings and add secrets

# 2. Push code
git tag v1.0.0
git push origin v1.0.0

# 3. GitHub Actions builds images with env vars baked in

# 4. Pull and run on your server
docker pull ghcr.io/yourorg/repo/frontend:v1.0.0
docker pull ghcr.io/yourorg/repo/backend:v1.0.0

# 5. Run frontend (env vars already in image)
docker run -d -p 3000:3000 ghcr.io/yourorg/repo/frontend:v1.0.0

# 6. Run backend (provide env vars at runtime)
docker run -d -p 8080:8080 \
  -e MONGODB_URI="mongodb://prod:27017" \
  -e JWT_SECRET="prod-secret" \
  ghcr.io/yourorg/repo/backend:v1.0.0
```

---

**TL;DR**: 
- ✅ Frontend env vars: Baked into image at build time via GitHub Actions
- ✅ Backend env vars: Provided at runtime when starting container
- ✅ Set GitHub Secrets for production values
- ✅ Fallback values used if secrets not set
