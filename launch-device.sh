#!/bin/bash
# launch-device.sh
BACKEND_IP=$1
PORT=$2
DEVICE_ID=$3

if [ -z "$BACKEND_IP" ] || [ -z "$PORT" ] || [ -z "$DEVICE_ID" ]; then
    echo "Usage: ./launch-device.sh <backend-ip> <port> <device-id>"
    echo "Example: ./launch-device.sh 192.168.1.100 8181 1"
    exit 1
fi

node active.js $PORT $DEVICE_ID $BACKEND_IP