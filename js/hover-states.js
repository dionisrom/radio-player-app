// Enhanced hover states functionality
// Improves user feedback for interactive elements on desktop

/**
 * Initialize enhanced hover states
 */
export function initHoverStates() {
    // Apply hover-transition class to interactive elements
    applyHoverClasses();
    
    // Set up special hover effects for elements that need JavaScript
    setupAdvancedHoverEffects();
    
    // Handle active states for buttons
    setupActiveStates();
    
    // Add hover audio feedback if user prefers
    if (localStorage.getItem('enableHoverSound') === 'true') {
        setupHoverSounds();
    }
    
    // Set up hover cards for station items
    setupStationHoverCards();
}

/**
 * Apply hover-related classes to appropriate elements
 */
function applyHoverClasses() {
    // Add .hover-transition class to all interactive elements
    const interactiveElements = document.querySelectorAll('button, a, .station-item, input, select, textarea');
    interactiveElements.forEach(element => {
        element.classList.add('hover-transition');
    });
    
    // Add icon-button class to icon-only buttons
    const iconButtons = document.querySelectorAll('.favorite-btn, #theme-toggle, #compatibility-filter');
    iconButtons.forEach(button => {
        button.classList.add('icon-button');
    });
    
    // Add card-hover class to card-like elements
    const cards = document.querySelectorAll('#custom-audio-player, .glass-player-container');
    cards.forEach(card => {
        card.classList.add('card-hover');
    });
    
    // Add toggle-btn class to toggle buttons
    const toggleButtons = document.querySelectorAll('.view-toggle-button');
    toggleButtons.forEach(button => {
        button.classList.add('toggle-btn');
    });
}

/**
 * Set up advanced hover effects that need JavaScript
 */
function setupAdvancedHoverEffects() {
    // Track mouse movement for advanced hover effects
    document.addEventListener('mousemove', handleMouseMove);
    
    // Add magnetic effect to play/pause button
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('mouseenter', enableMagneticEffect);
        playPauseBtn.addEventListener('mouseleave', disableMagneticEffect);
    }
    
    // Add hover caption to visualizer container
    const visualizerContainer = document.getElementById('visualizer-container');
    if (visualizerContainer) {
        visualizerContainer.addEventListener('mouseenter', () => {
            // Only create if it doesn't exist
            if (!visualizerContainer.querySelector('.hover-caption')) {
                const caption = document.createElement('div');
                caption.className = 'hover-caption absolute bottom-2 left-0 right-0 text-center text-sm text-slate-600 dark:text-slate-300 opacity-0 transition-opacity duration-300';
                caption.textContent = 'Audio Visualization';
                visualizerContainer.appendChild(caption);
                
                // Fade in
                setTimeout(() => {
                    caption.style.opacity = '0.7';
                }, 10);
            }
        });
        
        visualizerContainer.addEventListener('mouseleave', () => {
            const caption = visualizerContainer.querySelector('.hover-caption');
            if (caption) {
                // Fade out and remove
                caption.style.opacity = '0';
                setTimeout(() => {
                    if (caption.parentNode) {
                        caption.remove();
                    }
                }, 300);
            }
        });
    }
}

/**
 * Handle mouse movement for advanced hover effects
 * @param {MouseEvent} e - Mouse move event
 */
function handleMouseMove(e) {
    // Only handle if we're tracking an element with magnetic effect
    const currentMagneticElement = document.querySelector('.magnetic-active');
    if (currentMagneticElement) {
        const rect = currentMagneticElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate distance from mouse to center of element
        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;
        
        // Max movement in pixels
        const maxMovement = 10;
        
        // Calculate movement (closer = more movement)
        const movementX = (distanceX / rect.width) * maxMovement;
        const movementY = (distanceY / rect.height) * maxMovement;
        
        // Apply movement
        currentMagneticElement.style.transform = `translate(${movementX}px, ${movementY}px)`;
    }
}

/**
 * Enable magnetic effect on an element
 */
function enableMagneticEffect() {
    if (window.innerWidth < 768) return; // Only on desktop
    
    this.classList.add('magnetic-active');
    
    // Store original transform
    this.dataset.originalTransform = this.style.transform || '';
}

/**
 * Disable magnetic effect on an element
 */
function disableMagneticEffect() {
    this.classList.remove('magnetic-active');
    
    // Reset to original transform with a smooth transition
    if (this.dataset.originalTransform) {
        this.style.transition = 'transform 0.3s ease-out';
        this.style.transform = this.dataset.originalTransform;
        
        // Remove transition after animation completes
        setTimeout(() => {
            this.style.transition = '';
        }, 300);
    } else {
        this.style.transform = '';
    }
}

/**
 * Set up active states for buttons
 */
function setupActiveStates() {
    // Add active state to buttons on click
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.classList.add('button-active');
        });
        
        button.addEventListener('mouseup', function() {
            this.classList.remove('button-active');
        });
        
        button.addEventListener('mouseleave', function() {
            this.classList.remove('button-active');
        });
    });
}

/**
 * Set up hover sound effects (subtle audio feedback)
 */
function setupHoverSounds() {
    // Create audio elements for hover and click
    const hoverSound = new Audio();
    hoverSound.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbgAYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDP/////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCkAAAAAAAAAG4ixJCxgAAAAAAAAAAAAAAAAAAAP/jOMAAAAAAAAAAAABJbmZvAAAADwAAAAMAAAG4AGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz////////////////////////////////////////////wAAAABMYXZjNTguMTMAAAAAAAAAAAAAAACQAlAAAAAAAAG4ixJCxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/4zjMAAAAAAAAAAAASW5mbwAAAA8AAAADAAABuABgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM///////////////////////////////////////////wAAAABMYXZjNTguMTMAAAAAAAAAAAAAAACQAlAAAAAAAAG4ixJCxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbgAYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDP/////////////////////////////////////////wAAAABMYXZjNTguMTMAAAAAAAAAAAAAAACQAlAAAAAAAAG4ixJCxgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    hoverSound.volume = 0.1;
    
    const clickSound = new Audio();
    clickSound.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAABAAABRgANTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7P/////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQEoAAAAAAAAAUYMFpKygAAAAAAAAAAAAAAAAAAAP/jOMAAAAAAAAAAAABJbmZvAAAADwAAAAQAAAUYADU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTVpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWmfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+zs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs///////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQEoAAAAAAAAAUYMFpKygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/4zjMAAAAAAAAAAAASW5mbwAAAA8AAAAEAAAFGAAuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV4CAgICAgICAgICAgICAgICAgICAgICAgICqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGFAYzU4LjEzAAAAAAAAAAAAAAAAJAAwAAAAAAAABQYwTrWOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEluZm8AAAAPAAAABAAABRgALi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLldXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1eAgICAgICAgICAgICAgICAgICAgICAgICAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQAMAAAAAAAAAUGME61jgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    clickSound.volume = 0.2;
    
    // Apply hover sounds to interactive elements
    const interactiveElements = document.querySelectorAll('button, .station-item');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            if (window.innerWidth >= 768) {
                hoverSound.currentTime = 0;
                hoverSound.play().catch(() => {}); // Catch error if sound can't play
            }
        });
        
        element.addEventListener('mousedown', () => {
            if (window.innerWidth >= 768) {
                clickSound.currentTime = 0;
                clickSound.play().catch(() => {}); // Catch error if sound can't play
            }
        });
    });
}

/**
 * Set up hover info cards for station items
 */
function setupStationHoverCards() {
    // Create hover card element
    const hoverCard = document.createElement('div');
    hoverCard.className = 'station-hover-card absolute bg-white/90 dark:bg-slate-800/90 p-3 rounded-lg shadow-lg z-50 transition-opacity duration-200 opacity-0 pointer-events-none';
    hoverCard.style.display = 'none';
    document.body.appendChild(hoverCard);
    
    // Add hover listeners to station items
    const stationItems = document.querySelectorAll('.station-item');
    stationItems.forEach(item => {
        item.addEventListener('mouseenter', (e) => {
            if (window.innerWidth < 768) return; // Only on desktop
            
            // Get station data
            const stationName = item.dataset.stationName;
            const stationGenre = item.querySelector('.text-slate-600')?.textContent || 'Unknown genre';
            const stationFormat = item.querySelector('.format-badge')?.textContent || '';
            const stationCompatibility = item.querySelector('.compatibility-indicator span')?.textContent || '';
            
            // Find the image if it exists
            const stationImage = item.querySelector('.station-image-wrapper img');
            const imageHtml = stationImage ? 
                `<div class="w-16 h-16 bg-white/50 dark:bg-slate-700/50 rounded overflow-hidden mb-2">
                    <img src="${stationImage.src}" alt="${stationName}" class="w-full h-full object-contain">
                </div>` : 
                `<div class="w-16 h-16 bg-white/50 dark:bg-slate-700/50 rounded overflow-hidden mb-2 flex items-center justify-center">
                    <i class="fas fa-broadcast-tower text-slate-400 text-2xl"></i>
                </div>`;
            
            // Populate hover card
            hoverCard.innerHTML = `
                <div class="flex flex-col items-center">
                    ${imageHtml}
                    <h3 class="font-semibold text-slate-800 dark:text-white text-lg">${stationName}</h3>
                    <p class="text-slate-600 dark:text-slate-300 text-sm">${stationGenre}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">${stationFormat}</span>
                        <span class="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">${stationCompatibility}</span>
                    </div>
                </div>
            `;
            
            // Calculate position
            const rect = item.getBoundingClientRect();
            const cardWidth = 180; // Approximate width of hover card
            
            // Position to the right of the item, unless it would go off-screen
            let left = rect.right + 10;
            if (left + cardWidth > window.innerWidth) {
                left = rect.left - cardWidth - 10;
            }
            
            // Center vertically
            const top = rect.top + rect.height / 2 - 75;
            
            // Apply position
            hoverCard.style.left = `${left}px`;
            hoverCard.style.top = `${top}px`;
            
            // Show the card
            hoverCard.style.display = 'block';
            setTimeout(() => {
                hoverCard.style.opacity = '1';
            }, 10);
        });
        
        item.addEventListener('mouseleave', () => {
            // Hide the card
            hoverCard.style.opacity = '0';
            setTimeout(() => {
                hoverCard.style.display = 'none';
            }, 200);
        });
    });
}
