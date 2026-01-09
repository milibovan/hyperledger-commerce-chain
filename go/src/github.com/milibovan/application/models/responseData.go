package models

// UserDetailsResponse User detail page
type UserDetailsResponse struct {
	User     *User                     `json:"user"`
	Orders   []OrderDetailsResponse    `json:"orders"`
	Requests []*RequestDetailsResponse `json:"requests"`
}

// OrderDetailsResponse Order detail page
type OrderDetailsResponse struct {
	Order    *Order     `json:"order"`
	Products []*Product `json:"products"`
	Receipts []*Receipt `json:"receipts"`
}

// TraderDetailsResponse Trader detail page
type TraderDetailsResponse struct {
	Trader            *Trader                   `json:"trader"`
	Receipts          []*Receipt                `json:"receipts"`
	ReceiptsProducts  []*Product                `json:"receipts-products"`
	AvailableProducts []*Product                `json:"available-products"`
	Requests          []*RequestDetailsResponse `json:"requests"`
	AvailableRequests []*RequestDetailsResponse `json:"available-requests"`
}

// ReceiptDetailsResponse Receipt detail page
type ReceiptDetailsResponse struct {
	Receipt  *Receipt   `json:"receipt"`
	Products []*Product `json:"products"`
	Trader   *Trader    `json:"trader"`
	User     *User      `json:"user"`
}

// RequestDetailsResponse detail page
type RequestDetailsResponse struct {
	Request  *ProductsRequest `json:"request"`
	Products []*Product       `json:"products"`
	User     *User            `json:"user"`
}
