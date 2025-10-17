#!/bin/bash

# Frontend Setup Script
# Integrates deployed contracts with frontend application

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "\n${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  📱 ${GREEN}OmniShield Frontend Setup${NC}                        ${CYAN}║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}\n"

# Check if contracts are deployed
NETWORK="${NETWORK:-sepolia}"
DEPLOYMENT_FILE="deployments/${NETWORK}.json"

if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo -e "${YELLOW}⚠️  No deployment found for ${NETWORK}${NC}"
    echo -e "${CYAN}ℹ️  Run deployment first:${NC}"
    echo -e "   npm run deploy:${NETWORK}\n"
    exit 1
fi

echo -e "${GREEN}✅ Found deployment for ${NETWORK}${NC}\n"

# Step 1: Update frontend with contract addresses
echo -e "${CYAN}[Step 1/4]${NC} Updating frontend contract addresses..."
npx hardhat run scripts/integration/update-frontend.ts
echo -e "${GREEN}✅ Contract addresses updated${NC}\n"

# Step 2: Install frontend dependencies (if needed)
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${CYAN}[Step 2/4]${NC} Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}\n"
else
    echo -e "${CYAN}[Step 2/4]${NC} ${GREEN}Frontend dependencies already installed${NC}\n"
fi

# Step 3: Check .env.local
if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env.local not found${NC}"
    echo -e "${CYAN}Creating from .env.example...${NC}"
    cp frontend/.env.example frontend/.env.local
    echo -e "${GREEN}✅ Created frontend/.env.local${NC}\n"
    echo -e "${YELLOW}⚠️  Remember to add your WalletConnect Project ID:${NC}"
    echo -e "   Edit frontend/.env.local"
    echo -e "   Get project ID from: https://cloud.walletconnect.com/\n"
fi

# Step 4: Build frontend
echo -e "${CYAN}[Step 4/4]${NC} Building frontend..."
cd frontend
npm run build
cd ..
echo -e "${GREEN}✅ Frontend built successfully${NC}\n"

# Final summary
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}✅ Frontend Setup Complete!${NC}                          ${CYAN}║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}🎉 Your frontend is ready!${NC}\n"

# Read deployment info
if command -v jq >/dev/null 2>&1; then
    INSURANCE_POOL=$(cat $DEPLOYMENT_FILE | jq -r '.insurancePool')
    RISK_ENGINE=$(cat $DEPLOYMENT_FILE | jq -r '.riskEngine')
    
    echo -e "${CYAN}Contract Addresses:${NC}"
    echo -e "  InsurancePool: ${GREEN}${INSURANCE_POOL}${NC}"
    echo -e "  RiskEngine: ${GREEN}${RISK_ENGINE}${NC}"
    echo -e ""
fi

echo -e "${CYAN}Next Steps:${NC}"
echo -e "  1. ${GREEN}cd frontend && npm run dev${NC}"
echo -e "  2. ${GREEN}Open http://localhost:3000${NC}"
echo -e "  3. ${GREEN}Connect MetaMask (Sepolia network)${NC}"
echo -e "  4. ${GREEN}Start using the app!${NC}"
echo -e ""

echo -e "${CYAN}Verify contracts on Etherscan:${NC}"
echo -e "  https://sepolia.etherscan.io/address/${INSURANCE_POOL:-YOUR_CONTRACT_ADDRESS}"
echo -e ""

exit 0
