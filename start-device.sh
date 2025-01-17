#!/bin/bash

# Wait for network
sleep 5

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to cleanup on exit
cleanup() {
    pkill -f "node active.js"
    exit 0
}

# Set trap for cleanup
trap cleanup EXIT

# Start device server in background and save PID
./launch-device.sh &
DEVICE_PID=$!

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

# Open Firefox in fullscreen (kiosk) mode
firefox --kiosk "$URL"

# Wait for the device server process
wait $DEVICE_PID