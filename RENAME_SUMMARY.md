# Project Rename: Herodotus → Krakens

## Summary
Complete rename of the project from "Herodotus Analytics" to "Krakens Analytics".

## Changes Made

### 1. Directory Structure
- `herodotus-backend/` → `krakens-backend/`
- `herodotus-frontend/` → `krakens-frontend/`

### 2. Backend (Go)
- **Module name**: `github.com/nesohq/herodotus-backend` → `github.com/nesohq/krakens-backend`
- **All import statements** updated across all `.go` files
- **go.mod** updated with new module path
- **docker-compose.yml**: MongoDB database name changed to `krakens`
- **README.md** updated with new branding

### 3. Frontend (Next.js/TypeScript)
- **package.json**: Package name changed to `krakens-frontend`
- **Tracking script**: `herodotus.js` → `krakens.js`
- **Global object**: `window.Herodotus` → `window.Krakens`
- **All UI text** updated:
  - Navigation header
  - Page titles
  - Login/Register pages
  - Dashboard welcome message
  - Getting Started component
  - API Keys installation instructions
- **Metadata**: Page title and description updated
- **README.md** updated with new branding

### 4. Documentation
- **Root README.md**: All references updated
- **Backend README.md**: Title and branding updated
- **Frontend README.md**: Title and Docker commands updated
- **test-tracking.html**: Complete update with new script name and API calls

### 5. Code References
- All console.log messages updated
- All error messages updated
- All comments updated
- Installation code snippets updated

## Files Modified

### Backend
- `krakens-backend/go.mod`
- `krakens-backend/cmd/main.go`
- `krakens-backend/internal/**/*.go` (all Go files)
- `krakens-backend/docker-compose.yml`
- `krakens-backend/README.md`

### Frontend
- `krakens-frontend/package.json`
- `krakens-frontend/public/krakens.js` (renamed from herodotus.js)
- `krakens-frontend/src/app/layout.tsx`
- `krakens-frontend/src/app/login/page.tsx`
- `krakens-frontend/src/app/register/page.tsx`
- `krakens-frontend/src/app/(dashboard)/dashboard/page.tsx`
- `krakens-frontend/src/app/(dashboard)/api-keys/page.tsx`
- `krakens-frontend/src/components/Navigation.tsx`
- `krakens-frontend/src/components/onboarding/GettingStarted.tsx`
- `krakens-frontend/README.md`

### Root
- `README.md`
- `test-tracking.html`

## Next Steps

1. **Start the backend**:
   ```bash
   cd krakens-backend
   make dev
   ```

2. **Start the frontend**:
   ```bash
   cd krakens-frontend
   npm run dev
   ```

3. **Update your test tracking file** with a new API key if needed

4. **Update any external references**:
   - Git remote URLs (if applicable)
   - CI/CD pipelines
   - Environment variables
   - Documentation links

## Breaking Changes

⚠️ **Important**: If you have existing tracking implementations:

1. Update the script URL: `herodotus.js` → `krakens.js`
2. Update the API calls: `Herodotus.init()` → `Krakens.init()`
3. Update any references to `window.Herodotus` → `window.Krakens`

## Database

The MongoDB database name has been changed from `herodotus` to `krakens`. If you have existing data:

- Either migrate the data to the new database name
- Or update `docker-compose.yml` to use the old database name temporarily

---

**Rename completed successfully!** 🎉
