package models

// UserDetailsResponse User detail page
type UserDetailsResponse struct {
	User   *User              `json:"user"`
	Orders []OrderWithDetails `json:"orders"`
}

// OrderWithDetails Order detail page
type OrderWithDetails struct {
	Order    *Order     `json:"order"`
	Products []*Product `json:"products"`
	Receipts []*Receipt `json:"receipts"`
}

// TraderDetailsResponse Trader detail page
type TraderDetailsResponse struct {
	Trader            *Trader    `json:"trader"`
	Receipts          []*Receipt `json:"receipts"`
	ReceiptsProducts  []*Product `json:"receipts_products"`
	AvailableProducts []*Product `json:"available_products"`
}

// ReceiptDetailsResponse Receipt detail page
type ReceiptDetailsResponse struct {
	Receipt  *Receipt   `json:"receipt"`
	Products []*Product `json:"products"`
	Trader   *Trader    `json:"trader"`
	User     *User      `json:"user"`
}
