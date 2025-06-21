#!/bin/bash

# Create NFT Collection
echo "Creating NFT Collection..."

sui client call \
  --package 0xc52379a8841aca72525a71e1ce30fc869b36a187adcb3b45f615fa753b9c6493 \
  --module nft \
  --function create_collection \
  --args "Chat NFT Collection" 1000000 \
  --gas-budget 50000000