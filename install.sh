#!/bin/bash

echo "Installing dependencies in batches..."

# Core dependencies
echo "Installing core dependencies..."
npm install next@14.2.5 react@18.3.1 react-dom@18.3.1 --no-save

# Sui dependencies
echo "Installing Sui dependencies..."
npm install @mysten/sui@1.14.0 @mysten/dapp-kit@0.14.38 @mysten/wallet-standard@0.13.28 --no-save

# Other dependencies
echo "Installing other dependencies..."
npm install @tanstack/react-query@5.64.1 lucide-react@0.468.0 --no-save

# Dev dependencies
echo "Installing dev dependencies..."
npm install -D @types/node@20.14.10 @types/react@18.3.3 @types/react-dom@18.3.0 typescript@5.5.3 tailwindcss@3.4.6 autoprefixer@10.4.19 postcss@8.4.39 eslint@8.57.0 eslint-config-next@14.2.5 --no-save

echo "Done!"