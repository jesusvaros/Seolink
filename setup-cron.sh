#!/bin/bash

# Setup cron job for Amazon Afiliados
# This script helps set up a cron job to run the autoRunner.js script

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Project directory: $PROJECT_DIR"

# Find the path to Node.js
NODE_PATH=$(which node)
echo "Node.js path: $NODE_PATH"

# Create a temporary file for the crontab
TEMP_CRONTAB=$(mktemp)
echo ""
echo "To verify your cron jobs, run: crontab -l"
echo "To edit your cron jobs manually, run: crontab -e"
echo ""
echo "The script will log its output to: $PROJECT_DIR/cron.log"
echo ""
echo "Created wrapper script: $PROJECT_DIR/run-with-env.sh"
