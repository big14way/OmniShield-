#!/bin/bash

# Quick Build Script for Development
# Runs essential checks without full deployment

set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "\n${CYAN}⚡ OmniShield Quick Build${NC}\n"

# 1. Compile
echo "Compiling contracts..."
npx hardhat compile

# 2. Run tests
echo -e "\nRunning tests..."
npm run test

# 3. Check sizes
echo -e "\nChecking contract sizes..."
npx hardhat size-contracts

echo -e "\n${GREEN}✅ Quick build complete!${NC}\n"
