#!/bin/bash

echo "🚀 Student Information System - Deployment Script"
echo "=================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Student Information System"
    git branch -M main
    echo "✅ Git repository initialized"
else
    echo "📝 Adding changes to Git..."
    git add .
    git commit -m "Update: Ready for deployment"
    echo "✅ Changes committed"
fi

echo ""
echo "🔗 Next steps:"
echo "1. Create a repository on GitHub"
echo "2. Run: git remote add origin https://github.com/yourusername/your-repo-name.git"
echo "3. Run: git push -u origin main"
echo "4. Go to vercel.com and import your repository"
echo "5. Set environment variables in Vercel dashboard"
echo ""
echo "📋 Environment variables to set in Vercel:"
echo "SUPABASE_URL=https://gwoavpapmbtxwoiizjbd.supabase.co"
echo "SUPABASE_ANON_KEY=your-anon-key"
echo "VITE_SUPABASE_URL=https://gwoavpapmbtxwoiizjbd.supabase.co"
echo "VITE_SUPABASE_ANON_KEY=your-anon-key"
echo ""
echo "🎉 Your app is ready for deployment!"