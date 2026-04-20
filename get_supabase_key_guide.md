# Get Your Supabase Anon Key

1. Go to: https://supabase.com/dashboard/project/gwoavpapmbtxwoiizjbd/settings/api

2. Look for "Project API keys" section

3. Copy the "anon public" key (it's a long string starting with "eyJ...")

4. Update your environment files:

## In client/.env:
```
VITE_SUPABASE_ANON_KEY=paste_your_key_here
```

## In api/.env:
```
SUPABASE_ANON_KEY=paste_your_key_here
```

The key will look something like:
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b2F2cGFwbWJ0eHdvaWl6amJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2...`