// Desktop UI Refinements
// Enhances the desktop experience with improved visual hierarchy and interactions

/**
 * Initialize desktop UI refinements
 * These enhancements are specifically for larger screens to better utilize space
 * and create a more visually appealing interface
 */
export function initDesktopUI() {
    // Add .primary-element class to important interactive elements
    enhancePrimaryElements();
    
    // Set up hover states for interactive elements
    setupEnhancedHoverStates();
    
    // Add visual feedback for interactive elements
    setupVisualFeedback();
    
    // Add content section separators
    addContentSectionClasses();
    
    // Handle window resize to adjust desktop-specific features
    window.addEventListener('resize', handleDesktopResize);
    
    // Initialize immediately
    handleDesktopResize();
}

/**
 * Enhance primary elements with stronger visual hierarchy
 */
function enhancePrimaryElements() {
    // Add .primary-element class to key elements
    const primaryElements = [
        document.getElementById('custom-audio-player'),
        document.getElementById('play-pause-btn'),
        document.querySelector('.metadata-grid'),
        document.getElementById('visualizer-container')
    ];
    
    primaryElements.forEach(element => {
        if (element) element.classList.add('primary-element');
    });
    
    // Add .secondary-content class to secondary elements
    const secondaryElements = [
        document.querySelector('#keyboard-help'),
        document.querySelector('#info-quality'),
        document.getElementById('performance-stats')
    ];
    
    secondaryElements.forEach(element => {
        if (element) element.classList.add('secondary-content');
    });
    
    // Add .secondary-text class to secondary text
    const secondaryText = [
        document.querySelector('#info-genre')
    ];
    
    secondaryText.forEach(element => {
        if (element) element.classList.add('secondary-text');
    });
}

/**
 * Set up enhanced hover states for interactive elements
 */
function setupEnhancedHoverStates() {
    // Add subtle hover animations to station items
    const stationItems = document.querySelectorAll('.station-item');
    stationItems.forEach(item => {
        item.classList.add('transition-all', 'duration-200');
        
        // Add hover event listeners for additional effects
        item.addEventListener('mouseenter', () => {
            if (!item.classList.contains('active') && window.innerWidth >= 768) {
                item.style.transform = 'translateX(3px)';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = '';
        });
    });
    
    // Enhance player controls hover states
    const playerControls = document.querySelectorAll('#custom-audio-player button');
    playerControls.forEach(control => {
        control.addEventListener('mouseenter', () => {
            if (window.innerWidth >= 768) {
                control.classList.add('scale-110');
                control.style.transition = 'transform 0.2s ease-in-out';
            }
        });
        
        control.addEventListener('mouseleave', () => {
            control.classList.remove('scale-110');
        });
    });
}

/**
 * Set up visual feedback for interactive elements
 */
function setupVisualFeedback() {
    // Add click ripple effect to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (!button.classList.contains('ripple-added')) {
            button.classList.add('ripple-added');
            button.addEventListener('click', createRipple);
        }
    });
    
    // Add focused class for keyboard navigation
    document.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    // Remove when using mouse
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
}

/**
 * Create ripple effect on click
 * @param {Event} e - Click event
 */
function createRipple(e) {
    // Only apply effect on desktop
    if (window.innerWidth < 768) return;
    
    const button = e.currentTarget;
    
    // Remove any existing ripples
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
        existingRipple.remove();
    }
    
    // Create ripple element
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    button.appendChild(ripple);
    
    // Position the ripple
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
    ripple.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
    
    // Remove after animation completes
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Add content section classes to improve visual hierarchy
 */
function addContentSectionClasses() {
    // Add content-section class to appropriate elements
    const contentSections = [
        document.querySelector('header'),
        document.getElementById('station-list').parentElement,
        document.getElementById('visualizer-container').parentElement,
        document.getElementById('custom-audio-player')
    ];
    
    contentSections.forEach(section => {
        if (section) section.classList.add('content-section');
    });
    
    // Add key-info class to important text
    const keyInfo = [
        document.getElementById('info-name')
    ];
    
    keyInfo.forEach(element => {
        if (element) element.classList.add('key-info');
    });
}

/**
 * Handle window resize for desktop-specific features
 */
function handleDesktopResize() {
    const isDesktop = window.innerWidth >= 768;
    
    // Apply desktop-specific classes
    document.body.classList.toggle('is-desktop', isDesktop);
    
    if (isDesktop) {
        // Enhance station list scrollbar on desktop only
        const stationList = document.getElementById('station-list');
        if (stationList) {
            stationList.classList.add('enhanced-scrollbar');
        }
        
        // Enhance visualization container on desktop
        const visualizerContainer = document.getElementById('visualizer-container');
        if (visualizerContainer) {
            visualizerContainer.classList.add('enhanced-visualizer');
        }
    }
}
