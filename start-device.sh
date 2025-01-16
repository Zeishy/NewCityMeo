#!/bin/bash

# Wait for network
sleep 5

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Start device server
./launch-device.sh &

# Wait for server to start
sleep 3

# Check if device is configured
if [ -f "device-config.json" ]; then
    # Get port and device ID from config
    PORT=$(jq -r '.port' device-config.json)
    DEVICE_ID=$(jq -r '.id' device-config.json)
    URL="http://localhost:${PORT}/device/${DEVICE_ID}"
else
    # Use setup URL
    URL="http://localhost:8181"
fi

# Open browser
xdg-open "$URL"