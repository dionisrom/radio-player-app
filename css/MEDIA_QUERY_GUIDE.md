# Media Query Usage Guide

This document explains how to use our consolidated media query system effectively.

## Standardized Breakpoints

We've standardized on these breakpoint sizes:

- **xs**: 320px (Small mobile phones)
- **sm**: 640px (Large mobile phones)
- **md**: 768px (Tablets)
- **lg**: 1024px (Laptops)
- **xl**: 1440px (Desktops)

## Approaches to Responsive Design

### Mobile-First Approach (Progressive Enhancement)

Use min-width queries when building from mobile up to larger screens:

```css
/* Base styles for all devices - no media query needed */
.element {
  width: 100%;
}

/* Tablet devices (768px+) */
@media (min-width: 768px) {
  .element {
    width: 50%;
  }
}

/* Desktop devices (1440px+) */
@media (min-width: 1440px) {
  .element {
    width: 33%;
  }
}
```

### Desktop-First Approach (Graceful Degradation)

Use max-width queries when adapting desktop designs for smaller screens:

```css
/* Base styles for all devices - no media query needed */
.element {
  width: 33%;
}

/* Laptop and smaller (below 1440px) */
@media (max-width: 1439px) {
  .element {
    width: 50%;
  }
}

/* Mobile devices (below 768px) */
@media (max-width: 767px) {
  .element {
    width: 100%;
  }
}
```

### Device Range Targeting

To target specific device ranges:

```css
/* Only applies to tablet devices (768px-1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .element {
    /* Tablet-specific styles */
  }
}
```

## Utility Classes

Our system provides utility classes for showing/hiding content at different screen sizes:

### Mobile-First Visibility Classes

- `.xs-up-visible`, `.xs-up-hidden` (320px+)
- `.sm-up-visible`, `.sm-up-hidden` (640px+)
- `.md-up-visible`, `.md-up-hidden` (768px+)
- `.lg-up-visible`, `.lg-up-hidden` (1024px+)
- `.xl-up-visible`, `.xl-up-hidden` (1440px+)

### Desktop-First Visibility Classes

- `.sm-down-visible`, `.sm-down-hidden` (below 640px)
- `.md-down-visible`, `.md-down-hidden` (below 768px)
- `.lg-down-visible`, `.lg-down-hidden` (below 1024px)
- `.xl-down-visible`, `.xl-down-hidden` (below 1440px)

### Range-Specific Visibility Classes

- `.xs-only-visible`, `.xs-only-hidden` (320px-639px)
- `.sm-only-visible`, `.sm-only-hidden` (640px-767px)
- `.md-only-visible`, `.md-only-hidden` (768px-1023px)
- `.lg-only-visible`, `.lg-only-hidden` (1024px-1439px)
- `.xl-only-visible`, `.xl-only-hidden` (1440px+)

## Special Media Features

Our system also includes classes for other media features:

- Print: `.print-visible`, `.print-hidden`
- Dark Mode: `.dark-mode-auto-enabled`
- Reduced Motion: `.motion-reduce`
- High Contrast: `.high-contrast-auto`
- Orientation: `.portrait-only`, `.landscape-only`
- Input Method: `.pointer-fine-only` (mouse), `.pointer-coarse-only` (touch)

## Best Practices

1. **Be consistent**: Choose either a mobile-first or desktop-first approach and stick with it.
2. **Use utility classes** for simple visibility changes.
3. **Use breakpoint variables** for custom media queries.
4. **Minimize the number** of media query blocks by grouping related styles.
5. **Consider user preferences** like reduced motion and dark mode.
6. **Test thoroughly** on real devices at all breakpoints.
7. **Maintain a logical structure** in your CSS with media queries grouped together for each component.

## Example Usage

```html
<!-- Shows on mobile, hides on tablet and up -->
<div class="md-up-hidden">Mobile only content</div>

<!-- Hides on mobile, shows on tablet and up -->
<div class="md-up-visible">Tablet and desktop content</div>

<!-- Only visible on tablets -->
<div class="md-only-visible">Tablet only content</div>
```

By following these guidelines, we can maintain a clean and consistent approach to responsive design throughout the application.
