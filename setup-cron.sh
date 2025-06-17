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

# Export the current crontab
crontab -l > "$TEMP_CRONTAB" 2>/dev/null

# Check if our cron job already exists
if grep -q "autoRunner.js" "$TEMP_CRONTAB"; then
  echo "Cron job for Amazon Afiliados already exists."
  echo "Current crontab:"
  cat "$TEMP_CRONTAB"
else
  # Add our cron job - runs every Friday at 16:00 (4:00 PM)
  echo "# Amazon Afiliados automation - runs every Friday at 16:00" >> "$TEMP_CRONTAB"
  echo "0 16 * * 5 cd $PROJECT_DIR && $NODE_PATH $PROJECT_DIR/autoRunner.js >> $PROJECT_DIR/cron.log 2>&1" >> "$TEMP_CRONTAB"
  
  # Import the modified crontab
  crontab "$TEMP_CRONTAB"
  
  echo "Cron job added successfully!"
  echo "The script will run every Friday at 16:00 (4:00 PM)."
fi

# Clean up
rm "$TEMP_CRONTAB"

echo ""
echo "To verify your cron jobs, run: crontab -l"
echo "To edit your cron jobs manually, run: crontab -e"
echo ""
echo "The script will log its output to: $PROJECT_DIR/cron.log"
