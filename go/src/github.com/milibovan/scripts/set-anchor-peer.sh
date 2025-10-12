#!/bin/bash
#
# Set anchor peer for a single organization
#

# Get the directory where the script is located (scripts folder)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the root directory (parent of scripts folder)
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
# Set TEST_NETWORK_HOME to network folder
TEST_NETWORK_HOME=${TEST_NETWORK_HOME:-${ROOT_DIR}/network}

# Source the configuration functions
. ${SCRIPT_DIR}/env-var.sh
. ${SCRIPT_DIR}/config-update.sh

# Parse arguments
ORG=$1
CHANNEL_NAME=${2:-"channel-a"}

if [ -z "$ORG" ]; then
  errorln "Usage: set-anchor-peer.sh <org_number> [channel_name]"
  exit 1
fi

# Set the anchor peer port based on organization
if [ $ORG -eq 1 ]; then
  PEER_PORT=7051
  ORG_MSP="Org1MSP"
  ORG_NAME="Org1"  # Organization name in channel config
  PEER_HOST="peer0.org1.example.com"
elif [ $ORG -eq 2 ]; then
  PEER_PORT=9051
  ORG_MSP="Org2MSP"
  ORG_NAME="Org2"  # Organization name in channel config
  PEER_HOST="peer0.org2.example.com"
elif [ $ORG -eq 3 ]; then
  PEER_PORT=8051
  ORG_MSP="Org3MSP"
  ORG_NAME="Org3"  # Organization name in channel config
  PEER_HOST="peer0.org3.example.com"
else
  errorln "Invalid organization number: $ORG"
  exit 1
fi

infoln "Setting anchor peer for ${ORG_MSP} on channel ${CHANNEL_NAME}"

# Step 1: Fetch the current channel configuration
fetchChannelConfig $ORG ${CHANNEL_NAME} ${TEST_NETWORK_HOME}/channel-artifacts/config.json

# Step 2: Modify the configuration to add anchor peer
infoln "Generating anchor peer update for ${ORG_NAME}"

# Check if AnchorPeers already exists and get its version
ANCHOR_VERSION=$(jq -r '.channel_group.groups.Application.groups.'${ORG_NAME}'.values.AnchorPeers.version // "0"' ${TEST_NETWORK_HOME}/channel-artifacts/config.json)

jq '.channel_group.groups.Application.groups.'${ORG_NAME}'.values.AnchorPeers = {
  "mod_policy": "Admins",
  "value": {
    "anchor_peers": [
      {
        "host": "'${PEER_HOST}'",
        "port": '${PEER_PORT}'
      }
    ]
  },
  "version": "'${ANCHOR_VERSION}'"
}' ${TEST_NETWORK_HOME}/channel-artifacts/config.json > ${TEST_NETWORK_HOME}/channel-artifacts/modified_config.json

# Step 3: Create the config update
createConfigUpdate ${CHANNEL_NAME} \
  ${TEST_NETWORK_HOME}/channel-artifacts/config.json \
  ${TEST_NETWORK_HOME}/channel-artifacts/modified_config.json \
  ${TEST_NETWORK_HOME}/channel-artifacts/anchor_${ORG_NAME}.tx

# Step 4: Collect signatures from multiple organizations (need majority for Admins policy)
infoln "Collecting signatures from organizations"

# Save the original ORG value before signing
SUBMITTING_ORG=$ORG

# Determine which orgs to get signatures from (need at least 2 total)
# The submitting org signs implicitly, so we need 1 more signature
if [ $SUBMITTING_ORG -eq 1 ]; then
  # Org1 is submitting, get signature from Org2
  infoln "Signing with Org2"
  signConfigtxAsPeerOrg 2 ${TEST_NETWORK_HOME}/channel-artifacts/anchor_${ORG_NAME}.tx
elif [ $SUBMITTING_ORG -eq 2 ]; then
  # Org2 is submitting, get signature from Org1
  infoln "Signing with Org1"
  signConfigtxAsPeerOrg 1 ${TEST_NETWORK_HOME}/channel-artifacts/anchor_${ORG_NAME}.tx
elif [ $SUBMITTING_ORG -eq 3 ]; then
  # Org3 is submitting, get signatures from Org1 and Org2
  infoln "Signing with Org1"
  signConfigtxAsPeerOrg 1 ${TEST_NETWORK_HOME}/channel-artifacts/anchor_${ORG_NAME}.tx
  infoln "Signing with Org2"
  signConfigtxAsPeerOrg 2 ${TEST_NETWORK_HOME}/channel-artifacts/anchor_${ORG_NAME}.tx
fi

# Step 5: Submit the update with the organization that owns the anchor peer
# Reset to the submitting org (signConfigtxAsPeerOrg changes global env vars)
infoln "Submitting anchor peer update for ${ORG_NAME} as Org${SUBMITTING_ORG}"
setGlobals $SUBMITTING_ORG

set -x
peer channel update -o localhost:7050 --ordererTLSHostnameOverride raft0.example.com \
  -c ${CHANNEL_NAME} -f ${TEST_NETWORK_HOME}/channel-artifacts/anchor_${ORG_NAME}.tx \
  --tls --cafile "$ORDERER_CA"
res=$?
{ set +x; } 2>/dev/null

verifyResult $res "Anchor peer update for ${ORG_NAME} failed"
successln "Anchor peer set for ${ORG_NAME} on channel '${CHANNEL_NAME}'"