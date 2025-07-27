// Flexible image component with automatic scaling
export function createFlexibleImage(src, options = {}) {
    // Early return if no source provided
    if (!src) {
        console.warn('No image source provided to createFlexibleImage');
        return null;
    }
    
    // Handle both legacy function signature and new options object
    let alt, className, loadingStrategy, fallbackIcon, aspectRatio;
    
    if (typeof options === 'string') {
        // Legacy usage: createFlexibleImage(src, alt, className, loadingStrategy)
        alt = options || 'Station logo';
        className = arguments[2] || '';
        loadingStrategy = arguments[3] || 'lazy';
    } else {
        // New usage: createFlexibleImage(src, { alt, className, lazyLoad, fallbackIcon, aspectRatio })
        alt = options.alt || 'Station logo';
        className = options.className || '';
        loadingStrategy = options.lazyLoad ? 'lazy' : 'eager';
        fallbackIcon = options.fallbackIcon;
        aspectRatio = options.aspectRatio;
    }
    
    // Create image container with relative positioning
    const container = document.createElement('div');
    container.className = `station-image-container relative overflow-hidden ${className}`;
    
    // Create image element with responsive properties
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = 'station-image w-full h-full object-contain transition-opacity duration-300';
    img.loading = loadingStrategy;
    
    // Store fallback icon reference to prevent closure memory leaks
    const fallbackHtml = fallbackIcon;
    
    // Add fallback content for when image fails to load - avoid memory leaks
    img.onerror = function() {
        // Replace with placeholder
        if (this.src !== 'assets/icons/placeholder.svg') {
            this.src = 'assets/icons/placeholder.svg';
        }
        
        // Clear existing fallback elements first to prevent duplicates
        const existingFallbacks = container.querySelectorAll('.fallback-element');
        existingFallbacks.forEach(el => el.remove());
        
        // If fallback icon is provided, use it
        if (fallbackHtml) {
            const fallbackContainer = document.createElement('div');
            fallbackContainer.className = 'absolute inset-0 flex items-center justify-center fallback-element';
            fallbackContainer.innerHTML = fallbackHtml;
            container.appendChild(fallbackContainer);
        } else {
            // Otherwise add station initial as text overlay
            try {
                // Safely get first character, defaulting to "S" if issues occur
                const stationName = alt || 'Station';
                let initialChar = 'S';
                
                if (stationName && typeof stationName === 'string' && stationName.length > 0) {
                    initialChar = stationName.charAt(0).toUpperCase();
                }
                
                const initial = document.createElement('span');
                initial.className = 'absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-600 dark:text-slate-300 fallback-element';
                initial.textContent = initialChar;
                container.appendChild(initial);
            } catch (e) {
                console.warn('Could not create initial from alt text:', e);
                // Add default fallback on error
                const fallback = document.createElement('div');
                fallback.className = 'absolute inset-0 flex items-center justify-center fallback-element';
                fallback.innerHTML = '<i class="fas fa-music text-slate-400"></i>';
                container.appendChild(fallback);
            }
        }
    };
    
    // Add loading state
    img.style.opacity = '0';
    img.onload = function() {
        this.style.opacity = '1';
        // Remove any fallback elements that might have been added
        const fallbacks = container.querySelectorAll('.fallback-element');
        fallbacks.forEach(el => el.remove());
    };
    
    container.appendChild(img);
    
    // Apply aspect ratio if specified
    if (aspectRatio) {
        const wrapper = wrapWithAspectRatio(container, aspectRatio);
        return wrapper;
    }
    
    return container;
}

// Create a picture element with multiple sources for responsive images
export function createResponsivePicture(sources, fallbackSrc, alt, className = '') {
    const picture = document.createElement('picture');
    
    // Add source elements for different screen sizes
    sources.forEach(source => {
        const sourceElement = document.createElement('source');
        sourceElement.srcset = source.srcset;
        sourceElement.media = source.media; // e.g. '(max-width: 768px)'
        sourceElement.type = source.type || 'image/webp'; // Default to WebP
        picture.appendChild(sourceElement);
    });
    
    // Add fallback img
    const img = document.createElement('img');
    img.src = fallbackSrc;
    img.alt = alt;
    img.className = className;
    img.loading = 'lazy';
    
    picture.appendChild(img);
    return picture;
}

// Apply aspect ratio container for consistent image size
export function wrapWithAspectRatio(element, ratio = '1/1') {
    const wrapper = document.createElement('div');
    wrapper.className = 'aspect-ratio-container relative';
    wrapper.style.aspectRatio = ratio;
    wrapper.appendChild(element);
    return wrapper;
}
