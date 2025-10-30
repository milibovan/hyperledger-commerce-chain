#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

function warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Exit on error
set -e

info "🧹 Step 1: Cleaning everything..."
if [ -f "./clean-all.sh" ]; then
    ./clean-all.sh
else
    warn "clean-all.sh not found, skipping clean step"
fi

info ""
info "🚀 Step 2: Starting network with Certificate Authorities..."
./start-network.sh up -ca || error "Failed to start network"

info ""
info "📡 Step 3: Creating channels..."
./start-network.sh createChannel -c channel-a || error "Failed to create channels"

info ""
info "⏳ Waiting 5 seconds for channels to stabilize..."
sleep 5

info ""
info "📦 Step 4: Deploying chaincode..."
./start-network.sh deployCC \
  -c channel-a \
  -ccn commerce-chain \
  -ccp ../chaincode \
  -ccl go \
  -ccv 1.0 \
  -ccs 1 \
  -cci NA || error "Failed to deploy chaincode"

info ""
info "✅ Network is ready!"
info ""

info ""
info "🎉 Setup complete! You can now start your application."