#!/bin/bash

# Code Execution Setup Script
# This script helps you set up code execution for your interviewer app

echo "🚀 Code Execution Setup for Interviewer App"
echo "============================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    touch .env
fi

echo "Choose your code execution method:"
echo ""
echo "1. RapidAPI Judge0 (Easiest - 50 free requests/day)"
echo "2. Self-hosted Judge0 (Free, unlimited)"
echo "3. Skip for now (JavaScript only)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📋 RapidAPI Setup:"
        echo "1. Go to: https://rapidapi.com/judge0-official/api/judge0-ce"
        echo "2. Subscribe to the free tier"
        echo "3. Copy your API key"
        echo ""
        read -p "Enter your RapidAPI key: " api_key
        
        # Add to .env
        if grep -q "VITE_RAPIDAPI_KEY" .env; then
            sed -i "s/VITE_RAPIDAPI_KEY=.*/VITE_RAPIDAPI_KEY=$api_key/" .env
        else
            echo "VITE_RAPIDAPI_KEY=$api_key" >> .env
        fi
        
        echo "✅ RapidAPI key saved to .env"
        echo "🔄 Please restart your dev server (npm run dev)"
        ;;
        
    2)
        echo ""
        echo "🐳 Self-hosted Judge0 Setup:"
        echo ""
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed"
            echo "📥 Install Docker first:"
            echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
            echo "   sh get-docker.sh"
            exit 1
        fi
        
        echo "✅ Docker is installed"
        echo ""
        read -p "Do you want to clone and run Judge0 now? (y/n): " run_judge0
        
        if [ "$run_judge0" = "y" ]; then
            echo "📥 Cloning Judge0..."
            cd ..
            git clone https://github.com/judge0/judge0.git
            cd judge0
            
            echo "🚀 Starting Judge0..."
            docker-compose up -d
            
            echo "✅ Judge0 is running on http://localhost:2358"
            cd ../interviewer
            
            # Add to .env
            if grep -q "VITE_JUDGE0_URL" .env; then
                sed -i "s|VITE_JUDGE0_URL=.*|VITE_JUDGE0_URL=http://localhost:2358|" .env
            else
                echo "VITE_JUDGE0_URL=http://localhost:2358" >> .env
            fi
            
            echo "✅ Judge0 URL saved to .env"
            echo "🔄 Please restart your dev server (npm run dev)"
        else
            echo "📝 Manual setup:"
            echo "1. Clone: git clone https://github.com/judge0/judge0.git"
            echo "2. Run: cd judge0 && docker-compose up -d"
            echo "3. Add to .env: VITE_JUDGE0_URL=http://localhost:2358"
        fi
        ;;
        
    3)
        echo ""
        echo "ℹ️  JavaScript-only mode"
        echo "You can run JavaScript code locally in the browser."
        echo "To enable other languages later, run this script again."
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 For more information, see COMPILER_INTEGRATION.md"
echo ""
