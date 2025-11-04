#!/bin/sh

set -e

echo "-----------------------------------"
echo "Testing production build locally"
echo "-----------------------------------"

# Build the application
npm run build

echo "-----------------------------------"
echo "Build successful!"
echo "-----------------------------------"
echo "To test locally: npm run start"

