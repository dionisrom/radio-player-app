#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install

# Build optimized CSS
echo "Building optimized CSS..."
npm run build:css

echo "CSS optimization complete!"
echo "To watch for changes during development, run: npm run watch:css"
