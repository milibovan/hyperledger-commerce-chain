# Data Lake Architecture

## Raw Zone
- Path: `/datalake/raw/`
- Format: JSON (original format)
- Data: Users, Traders, Products, Orders, Receipts, Order Requests
- Size: 300MB+

## Transform Zone
- Path: `/datalake/transform/`
- Format: Parquet
- Data: Cleaned, validated, deduplicated
- Transformations: Type conversion, null handling, standardization

## Curated Zone
- Path: `/datalake/curated/`
- Format: Parquet (optimized, partitioned)
- Data: Enriched, aggregated, ready for analytics
- Partitioning: By date, category