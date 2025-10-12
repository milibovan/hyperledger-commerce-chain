#!/usr/bin/env bash
# scripts/raft1.sh

CHANNEL_NAME=$1

# Get the directory where the script is located (scripts folder)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the root directory (parent of scripts folder)
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
# Set TEST_NETWORK_HOME to network folder
TEST_NETWORK_HOME=${TEST_NETWORK_HOME:-${ROOT_DIR}/network}

# Add Fabric binaries to PATH
export PATH=${ROOT_DIR}/bin:$PATH

# Source environment setup utility
. ${SCRIPT_DIR}/utils.sh

# The Orderer Admin API requires TLS root certs, client certs, and client keys
# Set environment variables for the Orderer Admin
ORDERER_ADMIN_PORT=7554

# Set TLS and Admin credentials for the raft1 Orderer
export ORDERER_ADMIN_TLS_ROOTCERT_FILE=${TEST_NETWORK_HOME}/organizations/ordererOrganizations/example.com/orderers/raft1.example.com/tls/ca.crt
export ORDERER_ADMIN_CLIENT_CERT=${TEST_NETWORK_HOME}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/signcerts/cert.pem

# Find the actual private key file (it's a hash, not a fixed name)
ADMIN_KEYSTORE_DIR=${TEST_NETWORK_HOME}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/keystore
export ORDERER_ADMIN_CLIENT_KEY=$(ls ${ADMIN_KEYSTORE_DIR}/*_sk 2>/dev/null | head -n 1)

if [ -z "$ORDERER_ADMIN_CLIENT_KEY" ]; then
  # Fallback: try finding any file in keystore
  export ORDERER_ADMIN_CLIENT_KEY=$(ls ${ADMIN_KEYSTORE_DIR}/* 2>/dev/null | head -n 1)
fi

infoln "Orderer raft1.example.com joining channel ${CHANNEL_NAME}"

# Join the application channel using the Orderer Admin API (osnadmin)
set -x
osnadmin channel join --channelID $CHANNEL_NAME \
  --config-block ${TEST_NETWORK_HOME}/channel-artifacts/${CHANNEL_NAME}.block \
  -o localhost:$ORDERER_ADMIN_PORT \
  --ca-file "$ORDERER_ADMIN_TLS_ROOTCERT_FILE" \
  --client-cert "$ORDERER_ADMIN_CLIENT_CERT" \
  --client-key "$ORDERER_ADMIN_CLIENT_KEY"
res=$?
{ set +x; } 2>/dev/null

# Use exit when run directly, return when sourced
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
    exit $res
else
    return $res
fi