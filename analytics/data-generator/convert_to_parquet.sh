#!/bin/bash

ls *.jsonl | sed 's/\.jsonl$//' | xargs -I {} -P 4 json2parquet {}.jsonl {}.parquet