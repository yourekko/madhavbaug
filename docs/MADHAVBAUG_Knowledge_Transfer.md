# Madhavbaug Health Forum — Technical Documentation & Knowledge Transfer

**Document version:** 1.0  
**Date:** 29 May 2026  
**Prepared for:** Madhavbaug operations / IT handover  
**Repository:** https://github.com/yourekko/madhavbaug  

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [System architecture](#2-system-architecture)
3. [Production URLs by role](#3-production-urls-by-role)
4. [Accounts and credentials](#4-accounts-and-credentials)
5. [Infrastructure inventory](#5-infrastructure-inventory)
6. [Environment variables](#6-environment-variables)
7. [Source code layout](#7-source-code-layout)
8. [Deployment procedures](#8-deployment-procedures)
9. [Database](#9-database)
10. [API reference (summary)](#10-api-reference-summary)
11. [Forum categories and SEO URLs](#11-forum-categories-and-seo-urls)
12. [Google OAuth configuration](#12-google-oauth-configuration)
13. [SSL and reverse proxy (API server)](#13-ssl-and-reverse-proxy-api-server)
14. [Routine operations](#14-routine-operations)
15. [Troubleshooting guide](#15-troubleshooting-guide)
16. [Security checklist](#16-security-checklist)
17. [Support boundaries](#17-support-boundaries)

---

## 1. Executive summary

The **Madhavbaug Health Forum** is a patient Q&A platform where patients ask health questions, doctors answer, and platform admins moderate and manage SEO.

| Layer | Technology | Hosting |
|--------|------------|---------|
| **Frontend** | React 19 + Vite + TypeScript | **Hostinger** — static files under `public_html/forum/` |
| **Backend API** | NestJS 11 + TypeORM + MySQL | **VPS** (FastPanel) — `https://api.madhavbaug.org` |
| **Database** | MySQL 8 | Same VPS as API |
| **Process manager** | PM2 | VPS — process name `madhavbaug-api` |

**Public website:** https://madhavbaug.org  
**Forum app path:** https://madhavbaug.org/forum/  
**API base URL:** https://api.madhavbaug.org  

---

## 2. System architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Users (browser)                                                 │
└────────────┬───────────────────────────────┬────────────────────┘
             │ HTTPS                          │ HTTPS
             ▼                                ▼
┌────────────────────────────┐    ┌────────────────────────────────┐
│  Hostinger                  │    │  VPS 148.135.137.144           │
│  madhavbaug.org             │    │  FastPanel + Nginx             │
│  public_html/forum/         │    │  api.madhavbaug.org → :3000    │
│  (React SPA + .htaccess)    │    │  NestJS (PM2)                  │
└────────────┬───────────────┘    └───────────────┬────────────────┘
             │  API calls (fetch)                 │
             └──────────────────────────────────►│
                                                 ▼
                                    ┌────────────────────────┐
                                    │  MySQL database         │
                                    │  madhavbaug             │
                                    └────────────────────────┘
```

**Request flow (example — patient asks a question):**

1. Browser loads SPA from Hostinger (`/forum/assets/...`).
2. User signs in (phone/password or Google).
3. Frontend calls `POST https://api.madhavbaug.org/questions` with JWT in `Authorization` header.
4. NestJS validates JWT, writes to MySQL, returns JSON.

**Uploaded images** (doctor profile, answer images) are stored on the API server under `backend/uploads/` and served at `https://api.madhavbaug.org/uploads/<filename>`.

---

## 3. Production URLs by role

All forum routes live under **`/forum/`** on the main domain. Short URLs without `/forum/` redirect automatically.

### 3.1 Public (no login)

| Purpose | URL |
|---------|-----|
| Forum home | https://madhavbaug.org/forum/ |
| Ask a question (gate — login required to submit) | https://madhavbaug.org/forum/ask |
| Category: Diabetes | https://madhavbaug.org/forum/diabetes-management |
| Category: Heart | https://madhavbaug.org/forum/heart-disease-heart-blockage |
| Category: Obesity | https://madhavbaug.org/forum/obesity-metabolic-health |
| Category: Hypertension | https://madhavbaug.org/forum/hypertension-high-blood-pressure |
| Category: Lifestyle | https://madhavbaug.org/forum/lifestyle-disorders-preventive |
| Question detail (pattern) | https://madhavbaug.org/forum/{categorySlug}/{questionSlug} |
| SEO: robots.txt | https://madhavbaug.org/forum/robots.txt |
| SEO: sitemap.xml | https://madhavbaug.org/forum/sitemap.xml |
| API health check | https://api.madhavbaug.org/health |

**Legacy redirects (still work):**

- `/ask` → `/forum/ask`
- `/forum/diabetes/...` → `/forum/diabetes-management/...`
- `/forum/{cat}/question/{slug}` → `/forum/{cat}/{slug}`

### 3.2 Patient

| Purpose | URL |
|---------|-----|
| Sign up / sign in | From forum header (“Sign in”) or https://madhavbaug.org/forum/ask |
| My discussions | https://madhavbaug.org/forum/my-discussions |
| Complete phone (after Google signup) | https://madhavbaug.org/forum/complete-phone |

**Login methods:** Phone + password, or Google Sign-In (patient role).

**No default patient account** — patients self-register.

### 3.3 Doctor

| Purpose | URL |
|---------|-----|
| Doctor signup | https://madhavbaug.org/forum/doctor-signup |
| Doctor login | https://madhavbaug.org/forum/doctor-login |
| Doctor panel (queue & answers) | https://madhavbaug.org/forum/doctor/panel |
| Complete profile (required after signup) | https://madhavbaug.org/forum/doctor/complete-profile |

**Short redirects:**

- https://madhavbaug.org/doctor-signup → `/forum/doctor-signup`
- https://madhavbaug.org/doctor-login → `/forum/doctor-login`
- https://madhavbaug.org/doctor/panel → `/forum/doctor/panel`

**No default doctor account** — doctors self-register via doctor signup form.

### 3.4 Admin / platform operator

| Purpose | URL |
|---------|-----|
| Admin panel | https://madhavbaug.org/forum/admin/panel |
| Short redirect | https://madhavbaug.org/admin/panel → `/forum/admin/panel` |

**Login:** Email + password only (not phone). Sign-in modal appears when opening admin panel while logged out.

### 3.5 Server / operations (not for end users)

| Purpose | URL |
|---------|-----|
| FastPanel (VPS control) | https://148.135.137.144:8888 (or provider URL) |
| Hostinger hPanel | Hostinger account login |
| GitHub repository | https://github.com/yourekko/madhavbaug |
| Direct API (IP — avoid in production links) | http://148.135.137.144:3000/health |

---

## 4. Accounts and credentials

### 4.1 Admin account (platform)

| Field | Value |
|-------|--------|
| **Login URL** | https://madhavbaug.org/forum/admin/panel |
| **Email** | `admin@madhavbaug.local` (unless changed in server `.env`) |
| **Default password (first seed only)** | `Admin@12345` |

**How admin is created:**

- On first API startup, `SeedService` creates one admin if no user exists with `DEFAULT_ADMIN_EMAIL`.
- Values come from `backend/.env`: `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`.
- **Changing `.env` later does not change an existing admin password** — only the first seed uses those values.

**If admin password is forgotten — reset on VPS:**

```bash
cd /var/www/madhavbaug-api/backend
node -e "console.log(require('bcrypt').hashSync('YOUR_NEW_PASSWORD',10))"
# Copy the hash, then:
mysql -u madhavbaug_user -p -D madhavbaug -e \
  "UPDATE users SET password_hash='PASTE_HASH_HERE' WHERE email='admin@madhavbaug.local';"
```

**Important:** Use column name `password_hash` (snake_case) in MySQL, not `passwordHash`.

### 4.2 Doctor accounts

- Created via https://madhavbaug.org/forum/doctor-signup
- No shared default password
- After signup, doctors must complete profile at `/forum/doctor/complete-profile` before full panel access

### 4.3 Patient accounts

- Created via forum sign-up or Google
- Login with **phone + password** or **Google** (not email-only for standard sign-in)
- No shared default password

### 4.4 Database and secrets (not in this document)

These live **only** on the VPS in `/var/www/madhavbaug-api/backend/.env`:

- `DB_PASSWORD`
- `JWT_SECRET`
- Any production `DEFAULT_ADMIN_PASSWORD` if customized

**Do not commit `.env` to Git.** Share secrets via a password manager, not email/WhatsApp.

### 4.5 Google OAuth

- **Web Client ID** (frontend): set in `frontend/.env.production` as `VITE_GOOGLE_CLIENT_ID`
- **Same Client ID** (backend): `GOOGLE_CLIENT_ID` in `backend/.env`
- Configure **Authorized JavaScript origins** in Google Cloud Console (see Section 12)

---

## 5. Infrastructure inventory

### 5.1 VPS (API + database)

| Item | Detail |
|------|--------|
| Provider | VPS with FastPanel (Ubuntu 24.04) |
| Public IP | `148.135.137.144` |
| API domain | `api.madhavbaug.org` → A record → `148.135.137.144` |
| App path | `/var/www/madhavbaug-api/backend` |
| PM2 process | `madhavbaug-api` → `node dist/main.js` |
| Listen port | `3000` (localhost; Nginx proxies 443 → 3000) |
| Nginx site config | `/etc/nginx/fastpanel2-sites/api_madhavba_usr44/api.madhavbaug.org.conf` |
| Uploads | `/var/www/madhavbaug-api/backend/uploads/` |

### 5.2 Hostinger (frontend)

| Item | Detail |
|------|--------|
| Domain | `madhavbaug.org` |
| Forum files | `public_html/forum/` (extract zip contents **into** this folder, not as a subfolder) |
| SPA routing | `public_html/forum/.htaccess` (RewriteBase `/forum/`) |

### 5.3 DNS (Cloudflare or registrar)

| Record | Type | Value | Notes |
|--------|------|-------|-------|
| `@` or `www` | A / CNAME | Hostinger | Main site |
| `api` | A | `148.135.137.144` | API subdomain; DNS-only recommended during LE setup |

---

## 6. Environment variables

### 6.1 Backend (`backend/.env` on VPS)

| Variable | Purpose | Example / notes |
|----------|---------|-----------------|
| `PORT` | API listen port | `3000` |
| `DB_HOST` | MySQL host | `127.0.0.1` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `madhavbaug_user` |
| `DB_PASSWORD` | MySQL password | **Secret** — quote if contains `#` |
| `DB_NAME` | Database name | `madhavbaug` |
| `DB_SYNC` | Auto-create/sync schema | `false` in production after initial setup |
| `JWT_SECRET` | Token signing | Strong random string |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `DEFAULT_ADMIN_EMAIL` | First admin seed | `admin@madhavbaug.local` |
| `DEFAULT_ADMIN_PASSWORD` | First admin seed only | Change after go-live |
| `GOOGLE_CLIENT_ID` | Google token verify | Same as frontend |
| `FORUM_VIEW_DEDUPE_HOURS` | View counting window | `24` |
| `FORUM_PUBLIC_SITE_URL` | Sitemap base URL | `https://madhavbaug.org` |

Template: `backend/.env.example`

### 6.2 Frontend production build (`frontend/.env.production`)

| Variable | Purpose | Production value |
|----------|---------|------------------|
| `VITE_BASE_PATH` | Asset prefix | `/forum/` |
| `VITE_API_BASE_URL` | API origin | `https://api.madhavbaug.org` |
| `VITE_SITE_URL` | Canonical site | `https://madhavbaug.org` |
| `VITE_GOOGLE_CLIENT_ID` | Google button | OAuth Web client ID |

Local dev uses `frontend/.env.development` (not bundled in production zip).

---

## 7. Source code layout

```
madhavbaug/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/            # Login, signup, Google, JWT
│   │   ├── questions/       # Q&A, admin, doctor, public forum
│   │   ├── users/
│   │   ├── seo/
│   │   ├── seed/            # Default admin on first boot
│   │   └── migrations/
│   ├── uploads/             # User-uploaded images (runtime)
│   └── .env                 # Production secrets (on server only)
├── frontend/                # React SPA
│   ├── src/pages/           # Home, Ask, Admin, Doctor, Forum pages
│   ├── src/seo/             # Meta tags, JSON-LD, paths
│   ├── public/.htaccess     # Hostinger SPA rules
│   └── madhav-hostinger-forum-latest.zip  # Build output for upload
└── docs/                    # This documentation
```

**User roles (database enum):** `patient`, `doctor`, `admin`, `superadmin`

---

## 8. Deployment procedures

### 8.1 Deploy frontend to Hostinger

On a developer machine:

```bash
cd frontend
# Ensure .env.production has correct VITE_API_BASE_URL and VITE_SITE_URL
npm install
npm run build:forum
cd dist && zip -r ../madhav-hostinger-forum-latest.zip .
```

On Hostinger:

1. hPanel → **File Manager** → `public_html/forum/`
2. Backup existing folder (optional)
3. Upload `madhav-hostinger-forum-latest.zip`
4. Extract **inside** `forum/` so `index.html` is at `public_html/forum/index.html`
5. Verify: https://madhavbaug.org/forum/ loads and Network tab shows API calls to `api.madhavbaug.org`

### 8.2 Deploy backend to VPS

```bash
ssh root@148.135.137.144
cd /var/www/madhavbaug-api
git pull origin main   # or deploy branch
cd backend
npm ci
npm run build
npm run migration:run   # if new migrations exist
pm2 restart madhavbaug-api --update-env
```

**Verify:**

```bash
curl -i https://api.madhavbaug.org/health
pm2 status
pm2 logs madhavbaug-api --lines 30
```

### 8.3 After HTTPS changes in FastPanel

If SSL certificate is attached but HTTPS fails:

```bash
nginx -t && systemctl reload nginx
ss -tulpn | grep ':443'
```

---

## 9. Database

### 9.1 Tables

| Table | Purpose |
|-------|---------|
| `users` | All accounts (patient, doctor, admin) |
| `doctor_profiles` | Doctor credentials, bio, expertise |
| `questions` | Patient questions |
| `answers` | Doctor answers |
| `question_assignments` | Admin-assigned doctors |
| `question_followups` | Follow-up messages |
| `audit_logs` | Auth and admin actions |
| `seo_pages` | Admin-managed SEO meta |
| `forum_question_view_dedupe` | Unique view counting |
| `migrations` | TypeORM migration history |

### 9.2 Migrations

```bash
cd /var/www/madhavbaug-api/backend
npm run migration:run
```

**Production:** Set `DB_SYNC=false` after schema is stable. Use migrations for schema changes, not `DB_SYNC=true` long-term.

### 9.3 Useful MySQL commands

```bash
mysql -u madhavbaug_user -p -D madhavbaug -e "SHOW TABLES;"
mysql -u madhavbaug_user -p -D madhavbaug -e "SELECT email, role FROM users WHERE role='admin';"
mysql -u madhavbaug_user -p -D madhavbaug -e "SELECT COUNT(*) FROM questions;"
```

---

## 10. API reference (summary)

Base URL: **`https://api.madhavbaug.org`**

Authentication: `Authorization: Bearer <JWT>` for protected routes.

### 10.1 Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/public/forum/stats` | Forum statistics |
| GET | `/public/forum/home-feed` | Home page feed |
| GET | `/public/forum/sitemap.xml` | Dynamic sitemap entries |
| GET | `/public/forum/:categorySlug/questions` | List questions in category |
| GET | `/public/forum/:categorySlug/questions/:questionSlug` | Question detail |

### 10.2 Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Patient signup |
| POST | `/auth/login` | Login (email or phone + password) |
| POST | `/auth/google` | Google ID token login |
| POST | `/auth/doctor/signup` | Doctor registration |
| GET | `/auth/me` | Current user (JWT required) |

### 10.3 Patient (JWT, patient role)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/questions` | Submit question |
| GET | `/questions/my` | My questions |
| POST | `/questions/:id/followups` | Add follow-up |

### 10.4 Doctor (JWT, doctor role)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/doctor/questions` | Assigned / available questions |
| POST | `/doctor/questions/:id/answers` | Post answer |
| POST | `/doctor/uploads/image` | Upload image for answer |

### 10.5 Admin (JWT, admin or superadmin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | Dashboard metrics |
| GET | `/admin/questions` | Question queue |
| PATCH | `/admin/questions/:id/status` | Update status |
| POST | `/admin/questions/:id/assign-doctor` | Assign doctor |
| DELETE | `/admin/questions/:id` | Delete question |
| GET | `/admin/doctors` | List doctors |
| GET | `/admin/reports/doctors` | Doctor analytics |
| GET | `/admin/reports/patients` | Patient analytics |
| GET/PUT | `/admin/seo/pages/:slug` | SEO page meta |

---

## 11. Forum categories and SEO URLs

| Slug | Label |
|------|-------|
| `diabetes-management` | Diabetes Management |
| `heart-disease-heart-blockage` | Heart Disease & Heart Blockage |
| `obesity-metabolic-health` | Obesity & Metabolic Health |
| `hypertension-high-blood-pressure` | Hypertension (High Blood Pressure) |
| `lifestyle-disorders-preventive` | Lifestyle Disorders (Preventive Focus) |

**Question URL format:** `/forum/{categorySlug}/{questionSlug}`  
Slugs are generated server-side (short title slug + id fragment).

**SEO files (static, rebuilt on deploy):**

- `robots.txt` — allows `/forum/`, points to sitemap
- `sitemap.xml` — static category URLs + optional API merge at build time

---

## 12. Google OAuth configuration

In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Web client:

**Authorized JavaScript origins (must include):**

- `https://madhavbaug.org`
- `http://localhost:5173` (local dev)
- `http://localhost:5174` (if used)

**Authorized redirect URIs:** Not required for current Google Identity Services (ID token) flow used by `@react-oauth/google`.

**Errors:**

- `origin_mismatch` → add the exact browser origin above
- Backend `Google sign-in is not configured` → set `GOOGLE_CLIENT_ID` in `backend/.env` and restart PM2

---

## 13. SSL and reverse proxy (API server)

- **HTTP:** Nginx listens on port 80 for `api.madhavbaug.org`
- **HTTPS:** Port 443 with Let's Encrypt certificate (FastPanel → site → HTTPS → select cert → Save → `systemctl reload nginx`)
- **Upstream:** `http://127.0.0.1:3000` (NestJS via PM2)

**Health checks:**

```bash
curl -i http://api.madhavbaug.org/health
curl -i https://api.madhavbaug.org/health
```

---

## 14. Routine operations

| Task | Action |
|------|--------|
| Restart API | `pm2 restart madhavbaug-api` |
| View API logs | `pm2 logs madhavbaug-api` |
| Update frontend | Rebuild zip, upload to Hostinger `public_html/forum/` |
| Update backend | `git pull`, `npm run build`, `migration:run`, `pm2 restart` |
| Renew SSL | FastPanel certificate manager (Let's Encrypt) |
| Backup DB | `mysqldump -u madhavbaug_user -p madhavbaug > backup.sql` |

---

## 15. Troubleshooting guide

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `curl https://api...` times out | Port 443 not listening / firewall | FastPanel HTTPS + `systemctl reload nginx`; open port 443 |
| Forum shows "Failed to fetch" | Wrong `VITE_API_BASE_URL` in build | Rebuild with `https://api.madhavbaug.org`, re-upload |
| Admin "Invalid credentials" | Wrong password or admin not seeded | Reset `password_hash` in MySQL (Section 4.1) |
| Admin "Internal server error" | API 500 on `/admin/questions` | Check `pm2 logs`; ensure `questions` table exists; ensure code uses `q.createdAt` in orderBy (not `q.created_at` in entity queries) |
| Google `origin_mismatch` | Missing origin in Google Console | Add `https://madhavbaug.org` |
| `.env` password with `#` breaks | Shell/env comment | Quote password in `.env`: `DB_PASSWORD='your#pass'` |
| PM2 env not updated | Stale process env | `pm2 restart madhavbaug-api --update-env` |
| 404 on forum deep links | Missing `.htaccess` | Ensure `public_html/forum/.htaccess` exists after deploy |

---

## 16. Security checklist

- [ ] Change default admin password from `Admin@12345`
- [ ] Set `DB_SYNC=false` in production
- [ ] Use strong `JWT_SECRET` (rotate invalidates all sessions)
- [ ] Never commit `.env` files to Git
- [ ] Restrict VPS SSH to trusted IPs if possible
- [ ] Keep Node and OS packages updated
- [ ] Decommission old Render API URL if still referenced anywhere
- [ ] Enable Hostinger / VPS backups

---

## 17. Support boundaries

This document covers **standard operation** of the deployed Madhavbaug forum stack. For **code changes** (new features, bug fixes), use the GitHub repository and standard development workflow (branch → PR → deploy).

**Historical note:** Backend was previously on Render (`madhavbaug.onrender.com`); production now uses VPS `api.madhavbaug.org`. Any old bookmarks or env files pointing to Render should be updated.

---

*End of document*
