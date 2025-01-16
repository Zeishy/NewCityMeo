#!/bin/bash

CONFIG_FILE="device-config.json"

launch_device() {
    # Kill any existing instances
    pkill -f "node active.js"
    
    # Wait for port to be available
    sleep 2
    
    DEVICE_ID=$(jq -r '.id' "$CONFIG_FILE")
    BACKEND_IP=$(jq -r '.backendIp' "$CONFIG_FILE")
    PORT=$(jq -r '.port' "$CONFIG_FILE")

    echo "Starting device $DEVICE_ID with backend $BACKEND_IP on port $PORT"
    node active.js "$PORT" "$DEVICE_ID" "$BACKEND_IP"
    
    # If the server exits with success, restart it
    if [ $? -eq 0 ] && [ -f "$CONFIG_FILE" ]; then
        sleep 2
        launch_device
    fi
}

monitor_config() {
    initial_config_exists=$([[ -f "$CONFIG_FILE" ]] && echo "yes" || echo "no")
    
    echo "Starting setup server on port 8181..."
    # Start setup server
    node active.js 8181 &
    setup_pid=$!
    
    echo "Waiting for configuration..."
    # Wait for configuration to be created or modified
    while true; do
        if [[ "$initial_config_exists" == "no" ]] && [[ -f "$CONFIG_FILE" ]]; then
            echo "Configuration detected, restarting server..."
            kill $setup_pid
            sleep 2
            launch_device
            break
        fi
        sleep 1
    done
}

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Device not configured. Starting setup..."
    monitor_config
else
    launch_device
fi