# College Discovery Platform

A production-grade backend API for a college discovery and decision-making platform.

## Live URL
https://college-discovery-sooty.vercel.app

## Tech Stack
- **Framework:** Next.js 16 + TypeScript
- **Database:** PostgreSQL (Neon Cloud)
- **ORM:** Prisma
- **Auth:** JWT + bcrypt
- **Deployment:** Vercel

## API Endpoints

### Colleges
- `GET /api/colleges` — List all colleges with search, filter, pagination
- `GET /api/colleges/:id` — Get college detail
- `GET /api/colleges/compare?ids=1,2,3` — Compare colleges

### Auth
- `POST /api/auth/signup` — Register user
- `POST /api/auth/login` — Login, get JWT token

### Saved Colleges (Protected)
- `POST /api/colleges/save` — Save a college
- `GET /api/user/saved` — Get saved colleges

### Predictor
- `GET /api/predictor?exam=JEE&rank=75&category=General` — Get eligible colleges

## Features
- Search by name
- Filter by state, fees
- Pagination
- JWT Authentication
- College comparison
- Rank based predictor
- Proper error handling