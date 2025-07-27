# CSS Optimization Guide

This document explains how to work with the optimized CSS in this project.

## Background

Previously, this project used the Tailwind CSS CDN which loaded all Tailwind utility classes, including many unused ones. To optimize performance, we've set up a build process that:

1. Scans your HTML and JavaScript files for used Tailwind classes
2. Generates a minimal CSS file containing only the classes you actually use
3. Significantly reduces the CSS bundle size

## How to Use

### Initial Setup

1. Make sure Node.js is installed on your system
2. Run the setup script:
   - On Windows: `.\optimize-css.ps1`
   - On macOS/Linux: `bash optimize-css.sh`

This will install the required dependencies and build the optimized CSS file.

### Development Workflow

When making changes to the CSS or adding new Tailwind classes:

1. Run the watch mode to automatically rebuild CSS when files change:
   ```
   npm run watch:css
   ```

2. When you're done developing, build the optimized CSS for production:
   ```
   npm run build:css
   ```

### Adding New Classes

The build process scans your HTML and JavaScript files for Tailwind class names. If you add new Tailwind utility classes in your code, they will be automatically included in the next build.

## Files

- `tailwind.config.js` - Configuration for Tailwind CSS
- `css/tailwind-input.css` - Source file with Tailwind directives and custom styles
- `css/tailwind-optimized.css` - Output file with optimized CSS (don't edit this directly)

## Benefits

- **Smaller file size**: The optimized CSS file is much smaller than the full Tailwind library
- **Faster load times**: Smaller CSS means faster page load times
- **Better performance**: Reduced CSS parsing time improves overall site performance
