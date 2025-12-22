#!/bin/bash

# run-app.sh - Launch the application in interactive mode

cd "$(dirname "$0")/.."

echo "Building application..."
go build -o commerce-app

if [ $? -eq 0 ]; then
    echo "✓ Build successful"
    echo ""
    echo "Starting Commerce SDK Application..."
    echo "===================================="
    ./commerce-app
else
    echo "✗ Build failed"
    exit 1
fi