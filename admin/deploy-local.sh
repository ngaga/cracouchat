#!/bin/sh

set -e

echo "-----------------------------------"
echo "Building Docker image"
echo "-----------------------------------"

docker-compose build

echo "-----------------------------------"
echo "Starting containers"
echo "-----------------------------------"

docker-compose up -d

echo "-----------------------------------"
echo "Application is running at http://localhost:3000"
echo "-----------------------------------"
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down"

