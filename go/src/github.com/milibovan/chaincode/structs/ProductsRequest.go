package structs

import "fmt"

type RequestStatus string

const (
	CREATED       RequestStatus = "CREATED"
	PENDING_FUNDS RequestStatus = "PENDING_FUNDS"
	APPROVED      RequestStatus = "APPROVED"
	REJECTED      RequestStatus = "REJECTED"
	EXPIRED       RequestStatus = "EXPIRED"
	FULFILLED     RequestStatus = "FULFILLED"
	CANCELED      RequestStatus = "CANCELED"
)

type ProductsRequest struct {
	DocType     string             `json:"doc-type"`
	Id          string             `json:"id"`
	UserId      string             `json:"user-id"`
	TraderId    string             `json:"trader-id"`
	UserEmail   string             `json:"user-email"`
	Products    []ProductInventory `json:"products"`
	CreatedDate string             `json:"created-date"`
	DueDate     string             `json:"due-date"`
	TotalCost   float64            `json:"total-cost"`
	Status      RequestStatus      `json:"status"`
	OrderId     string             `json:"order-id"`
	Deleted     bool               `json:"deleted"`
}

func GetRequestStatusFromString(input string) (RequestStatus, error) {
	requestStatus := RequestStatus(input)

	switch requestStatus {
	case CREATED,
		PENDING_FUNDS,
		APPROVED,
		REJECTED,
		EXPIRED,
		FULFILLED,
		CANCELED:
		return requestStatus, nil
	default:
		return "", fmt.Errorf("invalid or unsupported request status: %s", input)
	}
}
