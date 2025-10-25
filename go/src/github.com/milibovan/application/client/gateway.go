package client

import (
	"crypto/x509"
	"fmt"
	"os"
	"path"
	"time"

	"github.com/hyperledger/fabric-gateway/pkg/client"
	"github.com/hyperledger/fabric-gateway/pkg/hash"
	"github.com/hyperledger/fabric-gateway/pkg/identity"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

const (
	Org1MSP = "Org1MSP"
	Org2MSP = "Org2MSP"
	Org3MSP = "Org3MSP"
)

const (
	ChaincodeName = "commerce-chain"
	Channel_a     = "channel-a"
	Channel_b     = "channel-b"
)

type OrgConfig struct {
	MSP      string
	Crypto   string
	PeerEP   string
	PeerHost string
}

var OrgConfigs = map[string]OrgConfig{
	"org1": {
		MSP:      Org1MSP,
		Crypto:   "../network/organizations/peerOrganizations/org1.example.com",
		PeerEP:   "dns:///localhost:7051",
		PeerHost: "peer0.org1.example.com",
	},
	"org2": {
		MSP:      Org2MSP,
		Crypto:   "../network/organizations/peerOrganizations/org2.example.com",
		PeerEP:   "dns:///localhost:9051",
		PeerHost: "peer0.org2.example.com",
	},
	"org3": {
		MSP:      Org3MSP,
		Crypto:   "../network/organizations/peerOrganizations/org3.example.com",
		PeerEP:   "dns:///localhost:8051",
		PeerHost: "peer0.org3.example.com",
	},
}

func ConnectGateway(orgName, userID string) (*client.Gateway, *grpc.ClientConn, error) {
	config, ok := OrgConfigs[orgName]
	if !ok {
		return nil, nil, fmt.Errorf("organization %s not found in configuration", orgName)
	}

	clientConnection := newGrpcConnection(config.Crypto, config.PeerEP, config.PeerHost)
	//defer clientConnection.Close()

	certPath := path.Join(config.Crypto, fmt.Sprintf("/users/%s@%s.example.com/msp/signcerts", userID, orgName))
	keyPath := path.Join(config.Crypto, fmt.Sprintf("/users/%s@%s.example.com/msp/keystore", userID, orgName))

	id := newIdentity(config.MSP, certPath)

	sign := newSign(keyPath)

	// Create a Gateway connection for a specific client identity
	gw, err := client.Connect(
		id,
		client.WithSign(sign),
		client.WithHash(hash.SHA256),
		client.WithClientConnection(clientConnection),
		// Default timeouts for different gRPC calls
		client.WithEvaluateTimeout(5*time.Second),
		client.WithEndorseTimeout(15*time.Second),
		client.WithSubmitTimeout(5*time.Second),
		client.WithCommitStatusTimeout(1*time.Minute),
	)
	if err != nil {
		clientConnection.Close()
		return nil, nil, fmt.Errorf("failed to connect to gateway: %w", err)
	}
	//defer gw.Close()
	return gw, clientConnection, nil
}

// newGrpcConnection creates a gRPC connection to the Gateway server.
func newGrpcConnection(cryptoPath, peerEndpoint, gatewayPeer string) *grpc.ClientConn {
	tlsCertPath := path.Join(cryptoPath, "/peers/", gatewayPeer, "/tls/ca.crt")

	certificatePEM, err := os.ReadFile(tlsCertPath)
	if err != nil {
		panic(fmt.Errorf("failed to read TLS certifcate file: %w", err))
	}

	certificate, err := identity.CertificateFromPEM(certificatePEM)
	if err != nil {
		panic(err)
	}

	certPool := x509.NewCertPool()
	certPool.AddCert(certificate)
	transportCredentials := credentials.NewClientTLSFromCert(certPool, gatewayPeer)

	connection, err := grpc.NewClient(peerEndpoint, grpc.WithTransportCredentials(transportCredentials))
	if err != nil {
		panic(fmt.Errorf("failed to create gRPC connection: %w", err))
	}

	return connection
}

// newIdentity creates a client identity for this Gateway connection using an X.509 certificate.
func newIdentity(mspID, certPath string) *identity.X509Identity {
	certificatePEM, err := readFirstFile(certPath)
	if err != nil {
		panic(fmt.Errorf("failed to read certificate file: %w", err))
	}

	certificate, err := identity.CertificateFromPEM(certificatePEM)
	if err != nil {
		panic(err)
	}

	id, err := identity.NewX509Identity(mspID, certificate)
	if err != nil {
		panic(err)
	}

	return id
}

// newSign creates a function that generates a digital signature from a message digest using a private key.
func newSign(keyPath string) identity.Sign {
	privateKeyPEM, err := readFirstFile(keyPath)
	if err != nil {
		panic(fmt.Errorf("failed to read private key file: %w", err))
	}

	privateKey, err := identity.PrivateKeyFromPEM(privateKeyPEM)
	if err != nil {
		panic(err)
	}

	sign, err := identity.NewPrivateKeySign(privateKey)
	if err != nil {
		panic(err)
	}

	return sign
}

func readFirstFile(dirPath string) ([]byte, error) {
	dir, err := os.Open(dirPath)
	if err != nil {
		return nil, err
	}

	fileNames, err := dir.Readdirnames(1)
	if err != nil {
		return nil, err
	}

	return os.ReadFile(path.Join(dirPath, fileNames[0]))
}
