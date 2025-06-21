#!/bin/bash

# Fund the dice game house
echo "Funding Dice Game House..."
sui client call \
  --package 0xee0b758075ff9449750dd2998618589136104837b1ededd3ed585bc6fb9f9dfc \
  --module dice_game \
  --function fund_house \
  --args 0xcbe4b8a1047108928ab0a8ac835079a73c04896cdde0d2b41e9e2308ad76282b \
  --type-args 0x2::sui::SUI \
  --gas-budget 10000000

# Activate a trivia question
echo "Activating Trivia Question..."
sui client call \
  --package 0xee0b758075ff9449750dd2998618589136104837b1ededd3ed585bc6fb9f9dfc \
  --module trivia_game \
  --function activate_random_question \
  --args 0x844f46922dc01edddfca80fae4ee31a86e329b11f0799a237652fb290bf77dd1 0x6 \
  --gas-budget 10000000

echo "Done!"