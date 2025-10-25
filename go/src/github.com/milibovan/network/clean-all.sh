#!/bin/bash

echo "🧹 Complete cleanup starting..."

# Stop network
./start-network.sh down

echo "Removing Docker volumes..."
docker volume prune -f

echo "Removing Fabric-specific volumes..."
for vol in $(docker volume ls -q | grep -E "peer|orderer|ca"); do
    docker volume rm $vol 2>/dev/null || true
done

echo "Removing any remaining containers..."
docker rm -f $(docker ps -aq --filter label=service=hyperledger-fabric) 2>/dev/null || true

echo "Removing chaincode images..."
docker rmi -f $(docker images -q dev-peer*) 2>/dev/null || true

echo "Cleaning local artifacts..."
rm -rf organizations/peerOrganizations organizations/ordererOrganizations
rm -rf organizations/fabric-ca/org*/msp organizations/fabric-ca/org*/tls-cert.pem
rm -rf organizations/fabric-ca/org*/ca-cert.pem organizations/fabric-ca/org*/fabric-ca-server.db
rm -rf organizations/fabric-ca/ordererOrg/msp organizations/fabric-ca/ordererOrg/tls-cert.pem
rm -rf organizations/fabric-ca/ordererOrg/ca-cert.pem organizations/fabric-ca/ordererOrg/fabric-ca-server.db
rm -rf system-genesis-block/*.block
rm -rf channel-artifacts
rm -rf *.tar.gz log.txt

echo "✅ Complete cleanup finished!"
echo "Ready for fresh start with: ./start-network.sh up -ca"