#!/bin/bash

node generate_data.mjs

echo "========================================"
echo "Converting to Parquet"
echo "========================================"
ls *.jsonl | sed 's/\.jsonl$//' | xargs -I {} -P 4 json2parquet {}.jsonl {}.parquet

echo "========================================"
echo "JSONL files size:"
du -ch *jsonl
echo "========================================"
echo "Parquet files size:"
du -ch *parquet
echo "========================================"