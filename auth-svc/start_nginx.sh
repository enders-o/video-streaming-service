#!/bin/bash

# Load environment variables from .env file
export $(xargs < .env)

# Replace placeholders in the nginx-template.conf with actual environment variables
envsubst '${AUTH_USERNAME} ${AUTH_PASSWORD}' < nginx-template.conf > /etc/nginx/conf.d/default.conf

# Start NGINX
nginx
