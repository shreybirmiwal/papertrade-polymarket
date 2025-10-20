#!/bin/bash

echo "🚀 Setting up PolyPaper Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Start the backend: cd backend && npm start"
    echo "2. Start the frontend: npm run web"
    echo "3. Open http://localhost:8081 in your browser"
    echo ""
    echo "📡 Backend will be available at http://localhost:3001"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
