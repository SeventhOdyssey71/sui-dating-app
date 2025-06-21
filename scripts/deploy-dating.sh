#!/bin/bash

echo "🚀 Deploying Dating Platform Smart Contract to Sui Testnet"

# Navigate to contracts directory
cd contracts

# Build the contract
echo "📦 Building contract..."
sui move build

# Deploy the contract
echo "🔗 Deploying to testnet..."
DEPLOY_RESULT=$(sui client publish --gas-budget 200000000 --skip-dependency-verification 2>&1)

# Extract the package ID from the deployment result
PACKAGE_ID=$(echo "$DEPLOY_RESULT" | grep -A 1 "Published Objects" | grep "PackageID" | awk '{print $3}')

# Extract the UserRegistry and MatchRegistry object IDs
USER_REGISTRY_ID=$(echo "$DEPLOY_RESULT" | grep -A 20 "Created Objects" | grep -B 2 "discoveer::dating_platform::UserRegistry" | grep "ObjectID" | head -1 | awk '{print $3}')
MATCH_REGISTRY_ID=$(echo "$DEPLOY_RESULT" | grep -A 20 "Created Objects" | grep -B 2 "discoveer::dating_platform::MatchRegistry" | grep "ObjectID" | head -1 | awk '{print $3}')

echo "✅ Deployment successful!"
echo ""
echo "📋 Deployment Details:"
echo "Package ID: $PACKAGE_ID"
echo "UserRegistry ID: $USER_REGISTRY_ID"
echo "MatchRegistry ID: $MATCH_REGISTRY_ID"

# Create or update .env.local file
cd ..
echo "NEXT_PUBLIC_DATING_PACKAGE_ID=$PACKAGE_ID" >> .env.local
echo "NEXT_PUBLIC_USER_REGISTRY_ID=$USER_REGISTRY_ID" >> .env.local
echo "NEXT_PUBLIC_MATCH_REGISTRY_ID=$MATCH_REGISTRY_ID" >> .env.local

echo ""
echo "🎉 Environment variables updated in .env.local"
echo ""
echo "Full deployment output:"
echo "$DEPLOY_RESULT"