#!/usr/bin/env bash
# scripts/raft1.sh

CHANNEL_NAME=$1

# Source environment setup utility (assuming it defines infoln, fatalln, etc.)
. scripts/envVar.sh

# The Orderer Admin API requires TLS root certs, client certs, and client keys
# Set environment variables for the Orderer Admin
ORDERER_ADMIN_PORT=7054

# Set TLS and Admin credentials for the raft1 Orderer
export ORDERER_ADMIN_TLS_ROOTCERT_FILE=${PWD}/organizations/ordererOrganizations/example.com/orderers/raft1.example.com/tls/ca.crt
export ORDERER_ADMIN_CLIENT_CERT=${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/signcerts/cert.pem
export ORDERER_ADMIN_CLIENT_KEY=${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/keystore/private_key_file

infoln "Orderer raft1.example.com joining channel ${CHANNEL_NAME}"

# Join the application channel using the Orderer Admin API (osnadmin)
# The orderer node's peer address is raft1.example.com:7050 (from configtx/docker-compose)
osnadmin channel join --channelID $CHANNEL_NAME \
  --config-block ./channel-artifacts/${CHANNEL_NAME}.block \
  --ordererTLSHostnameOverride raft1.example.com \
  --client-cert $ORDERER_ADMIN_CLIENT_CERT \
  --client-key $ORDERER_ADMIN_CLIENT_KEY \
  --ca-file $ORDERER_ADMIN_TLS_ROOTCERT_FILE \
  -o localhost:$ORDERER_ADMIN_PORT