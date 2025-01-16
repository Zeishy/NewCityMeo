#!/bin/bash

# Get monitor names and info
PRIMARY=$(hyprctl monitors -j | jq -r '.[0].name')
SECONDARY=$(hyprctl monitors -j | jq -r '.[1].name')

# Get primary monitor resolution
PRIMARY_RES=$(hyprctl monitors -j | jq -r '.[0].width + "x" + .[0].height')

# Check if HDMI is connected
if [[ $SECONDARY == *"HDMI"* ]]; then
    # Mirror with specific resolution and scale
    hyprctl keyword monitor "$SECONDARY,preferred,auto,1,mirror,$PRIMARY"
    
    if [ $? -eq 0 ]; then
        echo "Successfully mirroring $PRIMARY to $SECONDARY"
    else
        echo "Error: Failed to mirror display"
        exit 1
    fi
else
    echo "No HDMI display detected"
    exit 1
fi