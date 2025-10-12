#!/usr/bin/env bash
# (Contains one_line_pem, json_ccp, yaml_ccp functions)

# ==============================================================================
# ORG 1 (Ports: Peer 7051, CA 7055)
# ==============================================================================
ORG=1
P0PORT=7051
CAPORT=7055 # <-- Updated CA Port from 7054 to 7055
PEERPEM=organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
CAPEM=organizations/peerOrganizations/org1.example.com/ca/ca.org1.example.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org1.example.com/connection-org1.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org1.example.com/connection-org1.yaml

# ==============================================================================
# ORG 2 (Ports: Peer 9051, CA 7056)
# ==============================================================================
ORG=2
P0PORT=9051
CAPORT=7056 # <-- Updated CA Port from 8054 to 7056
PEERPEM=organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem
CAPEM=organizations/peerOrganizations/org2.example.com/ca/ca.org2.example.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org2.example.com/connection-org2.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org2.example.com/connection-org2.yaml


# ==============================================================================
# ORG 3 (Ports: Peer 8051, CA 7057)
# ==============================================================================
ORG=3
P0PORT=8051  # <-- Org3 Peer Listen Port
CAPORT=7057  # <-- Org3 CA Port
PEERPEM=organizations/peerOrganizations/org3.example.com/tlsca/tlsca.org3.example.com-cert.pem
CAPEM=organizations/peerOrganizations/org3.example.com/ca/ca.org3.example.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org3.example.com/connection-org3.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/org3.example.com/connection-org3.yaml