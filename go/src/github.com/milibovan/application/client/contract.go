package client

import (
	"github.com/hyperledger/fabric-gateway/pkg/client"
)

const (
	ChaincodeName = "commerce"
)

type ContractClient struct {
	ChannelAContract client.Contract
	ChannelBContract client.Contract
}
