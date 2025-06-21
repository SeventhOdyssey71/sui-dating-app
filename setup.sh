#!/bin/bash

echo "🚀 Setting up Discoveer Messenger..."
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Contract Details:"
echo "   Package ID: 0xd4cb9a02cab2481e241997af5e98f50305232893b66afb064a1e37f42f8e0528"
echo "   MessageHub: 0xdc3351f49f222c37c9a20f27d2a22b8726a18472bbb37018a11ebbcdd07d9954"
echo "   Network: Testnet"
echo ""
echo "🎯 Next steps:"
echo "   1. Run 'npm run dev' to start the development server"
echo "   2. Open http://localhost:3000 in your browser"
echo "   3. Connect your wallet and start messaging!"
echo ""
echo "💰 Need testnet SUI? Run: sui client faucet"