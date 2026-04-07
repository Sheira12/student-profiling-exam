# Student Profiling System

A full-stack student profiling system built with React + Express + Supabase (PostgreSQL).

## Setup

### 1. Supabase Database
1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run the contents of `supabase_schema.sql`
4. Go to **Project Settings > API** and copy your `URL` and `anon public` key

### 2. Environment Variables
Create a `.env` file in the `api/` folder:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install Dependencies
```bash
cd api && npm install
cd ../client && npm install
```

### 4. Run Locally
```bash
# Terminal 1 - API
cd api && node index.js

# Terminal 2 - Frontend
cd client && npm run dev
```

## Deploy to Vercel
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
4. Deploy

## Features
- Add / Edit / Delete student profiles
- View student list with search
- Individual student profile page
- Query/filter by skill, activity, affiliation, or violation
- Preset queries (Basketball, Programming, etc.)
