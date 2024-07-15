#!/bin/su root

# Fetch latest server
su forestpark -c "git pull"
# Stop existing server
systemctl stop traileyes-staging
# Start server
systemctl enable traileyes-staging

