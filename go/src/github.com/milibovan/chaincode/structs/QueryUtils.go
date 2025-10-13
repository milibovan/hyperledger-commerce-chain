package structs

import "time"

// ProductHistoryQueryResult structure used for returning result of history query
type ProductHistoryQueryResult struct {
	Record    *Product  `json:"record"`
	TxId      string    `json:"txId"`
	Timestamp time.Time `json:"timestamp"`
	IsDelete  bool      `json:"isDelete"`
}

// ProductPaginatedQueryResult structure used for returning paginated query results and metadata
type ProductPaginatedQueryResult struct {
	Records             []*Product `json:"records"`
	FetchedRecordsCount int32      `json:"fetchedRecordsCount"`
	Bookmark            string     `json:"bookmark"`
}

// UserHistoryQueryResult structure used for returning result of history query
type UserHistoryQueryResult struct {
	Record    *User     `json:"record"`
	TxId      string    `json:"txId"`
	Timestamp time.Time `json:"timestamp"`
	IsDelete  bool      `json:"isDelete"`
}

// UserPaginatedQueryResult structure used for returning paginated query results and metadata
type UserPaginatedQueryResult struct {
	Records             []*User `json:"records"`
	FetchedRecordsCount int32   `json:"fetchedRecordsCount"`
	Bookmark            string  `json:"bookmark"`
}

// TraderHistoryQueryResult structure used for returning result of history query
type TraderHistoryQueryResult struct {
	Record    *Trader   `json:"record"`
	TxId      string    `json:"txId"`
	Timestamp time.Time `json:"timestamp"`
	IsDelete  bool      `json:"isDelete"`
}

// TraderPaginatedQueryResult structure used for returning paginated query results and metadata
type TraderPaginatedQueryResult struct {
	Records             []*Trader `json:"records"`
	FetchedRecordsCount int32     `json:"fetchedRecordsCount"`
	Bookmark            string    `json:"bookmark"`
}

// ReceiptHistoryQueryResult structure used for returning result of history query
type ReceiptHistoryQueryResult struct {
	Record    *Receipt  `json:"record"`
	TxId      string    `json:"txId"`
	Timestamp time.Time `json:"timestamp"`
	IsDelete  bool      `json:"isDelete"`
}

// ReceiptPaginatedQueryResult structure used for returning paginated query results and metadata
type ReceiptPaginatedQueryResult struct {
	Records             []*Receipt `json:"records"`
	FetchedRecordsCount int32      `json:"fetchedRecordsCount"`
	Bookmark            string     `json:"bookmark"`
}
