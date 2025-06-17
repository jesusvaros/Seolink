#!/bin/bash
# This script sets up the proper environment before running the autoRunner

# Set PATH to include common binary locations
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# Go to project directory
cd "/Users/aa/CascadeProjects/amazon-afiliados"

# Run the autoRunner with node
/usr/local/bin/node "/Users/aa/CascadeProjects/amazon-afiliados/autoRunner.js" >> "/Users/aa/CascadeProjects/amazon-afiliados/cron.log" 2>&1
