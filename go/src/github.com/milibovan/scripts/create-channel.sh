#!/usr/bin/env bash

# Get the directory where the script is located (scripts folder)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the root directory (parent of scripts folder)
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
# Set TEST_NETWORK_HOME to network folder
export TEST_NETWORK_HOME="${ROOT_DIR}/network"

# Add Fabric binaries to PATH
export PATH=${ROOT_DIR}/bin:$PATH
export FABRIC_CFG_PATH=${TEST_NETWORK_HOME}

# Verify configtxgen is available
if ! command -v configtxgen &> /dev/null; then
    echo "ERROR: configtxgen not found in PATH"
    echo "Current PATH: $PATH"
    echo "Expected location: ${ROOT_DIR}/bin"
    exit 1
fi

# imports
. ${SCRIPT_DIR}/env-var.sh
. ${SCRIPT_DIR}/utils.sh

CHANNEL_NAME="$1"
DELAY="$2"
MAX_RETRY="$3"
VERBOSE="$4"
BFT="$5"
: ${CHANNEL_NAME:="channel-a"}
: ${DELAY:="3"}
: ${MAX_RETRY:="5"}
: ${VERBOSE:="false"}
: ${BFT:=0}

: ${CONTAINER_CLI:="docker"}
if command -v ${CONTAINER_CLI}-compose > /dev/null 2>&1; then
    : ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI}-compose"}
else
    : ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI} compose"}
fi
infoln "Using ${CONTAINER_CLI} and ${CONTAINER_CLI_COMPOSE}"

# Change to network directory for channel artifacts
cd ${TEST_NETWORK_HOME}

if [ ! -d "channel-artifacts" ]; then
	mkdir channel-artifacts
fi

createChannelGenesisBlock() {
  setGlobals 1

  local bft_true=$1

  # Set FABRIC_CFG_PATH to network root (where configtx.yaml is)
  if [ $bft_true -eq 1 ]; then
    export FABRIC_CFG_PATH=${TEST_NETWORK_HOME}/bft-config
  else
    export FABRIC_CFG_PATH=${TEST_NETWORK_HOME}
  fi

  set -x
  if [ $bft_true -eq 1 ]; then
    configtxgen -profile ChannelUsingBFT -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID $CHANNEL_NAME
  elif [ "$CHANNEL_NAME_B" == "channel-b" ]; then
    configtxgen -profile channel-b -outputBlock ./channel-artifacts/${CHANNEL_NAME_B}.block -channelID $CHANNEL_NAME_B
  else
    configtxgen -profile channel-a -outputBlock ./channel-artifacts/${CHANNEL_NAME}.block -channelID $CHANNEL_NAME
  fi
  res=$?
  { set +x; } 2>/dev/null
  verifyResult $res "Failed to generate channel configuration transaction..."
}

createChannel() {
	# Poll in case the raft leader is not set yet
	local rc=1
	local COUNTER=1
	local bft_true=$1
	infoln "Adding orderers to channel"
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
		sleep $DELAY
		set -x

    # Execute and check each orderer join individually
    . ${SCRIPT_DIR}/raft0.sh ${CHANNEL_NAME}
    rc=$?
    verifyResult $rc "Orderer raft0.example.com failed to join channel '$CHANNEL_NAME'"

    . ${SCRIPT_DIR}/raft1.sh ${CHANNEL_NAME}
    rc=$?
    verifyResult $rc "Orderer raft1.example.com failed to join channel '$CHANNEL_NAME'"

    . ${SCRIPT_DIR}/raft2.sh ${CHANNEL_NAME}
    rc=$?
    verifyResult $rc "Orderer raft2.example.com failed to join channel '$CHANNEL_NAME'"

    # If all above succeeded, rc is 0, loop breaks. Otherwise, counter increments and retry.
		let COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	verifyResult $rc "Orderer channel creation/join failed after $MAX_RETRY attempts"
}

# joinChannel ORG
joinChannel() {
  ORG=$1
  export FABRIC_CFG_PATH=${TEST_NETWORK_HOME}/config
  setGlobals $ORG
	local rc=1
	local COUNTER=1
	## Sometimes Join takes time, hence retry
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
    sleep $DELAY
    set -x
    peer channel join -b $BLOCKFILE >&log.txt
    res=$?
    { set +x; } 2>/dev/null

    if [ $res -eq 0 ] || grep -q "already exists" log.txt; then
            infoln "Peer0 Org${ORG} successfully joined channel '$CHANNEL_NAME'."
            JOIN_SUCCESS=0 # Set the success flag
            break        # Exit the loop immediately
          fi

          rc=$res # Update rc with actual result code only on genuine failure
          COUNTER=$(expr $COUNTER + 1)

		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	verifyResult $JOIN_SUCCESS "After $MAX_RETRY attempts, peer0.org${ORG} has failed to join channel '$CHANNEL_NAME' "
}

setAnchorPeer() {
  ORG=$1
  . ${SCRIPT_DIR}/set-anchor-peer.sh $ORG $CHANNEL_NAME
}

## Create channel genesis block
BLOCKFILE="./channel-artifacts/${CHANNEL_NAME}.block"

infoln "Generating channel genesis block '${CHANNEL_NAME}.block'"
createChannelGenesisBlock $BFT


## Create channel
infoln "Creating channel ${CHANNEL_NAME}"
createChannel $BFT
successln "Channel '$CHANNEL_NAME' created"

## Join all the peers to the channel
infoln "Joining org1 peer to the channel..."
joinChannel 1
infoln "Joining org2 peer to the channel..."
joinChannel 2
infoln "Joining org3 peer to the channel..."
joinChannel 3

infoln "Waiting for channel updates to stabilize on the Orderer..."
sleep 5

## Set the anchor peers for each org in the channel
infoln "Setting anchor peer for org1..."
setAnchorPeer 1
infoln "Setting anchor peer for org2..."
setAnchorPeer 2
infoln "Setting anchor peer for org3..."
setAnchorPeer 3

successln "Channel '$CHANNEL_NAME' joined"