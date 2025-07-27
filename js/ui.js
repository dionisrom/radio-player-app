// UI interactions and DOM manipulation
// UI management functions
import { getStations } from './stations.js';
import { getCodecInfoSync } from './codec-manager.js';
import { assessStreamCompatibility, getCompatibilityDisplay, batchAssessCompatibility } from './stream-tester.js';
import { saveSortOrder } from './storage.js';
import { createFlexibleImage, wrapWithAspectRatio } from './flexible-image.js';
import { memoryManager } from './memory-manager.js';

let stationsToShow = 10;
let isLazyLoadingEnabled = true;
let showOnlyCompatible = false;

export function populateStationList(stationListElement, favorites = [], filter = '') {
    const stations = getStations();
    const searchTerm = filter.toLowerCase().trim();
    
    // Early return if no stations
    if (!stations.length) {
        stationListElement.innerHTML = '<div class="text-center text-gray-500 py-8">No stations available</div>';
        return;
    }
    
    // Use more efficient filtering approach
    let filteredStations;
    if (searchTerm) {
        // If there's a search term, use the optimized search function
        filteredStations = getFilteredStations(searchTerm);
    } else {
        // Sort stations with favorites first only when no search
        filteredStations = [...stations].sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return 0;
        });
    }

    // Apply compatibility filter if enabled
    if (showOnlyCompatible) {
        filteredStations = filteredStations.filter(station => {
            try {
                const compatibility = assessStreamCompatibility(station);
                return compatibility.compatibility === 'excellent' || compatibility.compatibility === 'good';
            } catch (error) {
                console.warn('Error assessing compatibility for filtering:', error);
                return true; // Include station if assessment fails
            }
        });
    }
    
    // Apply lazy loading limit
    const stationsToRender = isLazyLoadingEnabled ? 
        filteredStations.slice(0, stationsToShow) : 
        filteredStations;

    // Use document fragment for batch DOM operations
    const fragment = document.createDocumentFragment();
    
    // Create stations in batches for better performance
    const BATCH_SIZE = 10;
    let batchCount = 0;
    
    const renderBatch = () => {
        const start = batchCount * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, stationsToRender.length);
        
        for (let i = start; i < end; i++) {
            const station = stationsToRender[i];
            const stationDiv = createOptimizedStationElement(station, favorites, searchTerm);
            fragment.appendChild(stationDiv);
        }
        
        batchCount++;
        
        // Continue with next batch if needed
        if (end < stationsToRender.length) {
            // Use requestAnimationFrame for smooth rendering
            requestAnimationFrame(renderBatch);
        } else {
            // All batches complete, update DOM once
            stationListElement.innerHTML = '';
            stationListElement.appendChild(fragment);
            
            // Add performance info for debugging
            console.log(`Rendered ${stationsToRender.length} stations in ${batchCount} batches`);
        }
    };
    
    // Start rendering
    renderBatch();
}

function createOptimizedStationElement(station, favorites, searchTerm = '') {
    const stationDiv = document.createElement('div');
    stationDiv.className = 'station-item station-item-grid w-full text-left border-b border-white/10 dark:border-slate-700/50 hover:bg-white/30 dark:hover:bg-slate-700/50 transition-colors duration-200 element-padding-proportional touch-spacing-y-sm';
    stationDiv.dataset.stationName = station.name;
    stationDiv.setAttribute('role', 'listitem');
    stationDiv.setAttribute('tabindex', '0');
    stationDiv.setAttribute('aria-label', `${station.name} - ${station.genre}. Press space to play, F to favorite`);
    
    // Check if station is favorited
    const isFavorite = favorites.includes(station.name);
    
    // Get codec information for this station
    const codecInfo = getCodecInfoSync(station);
    const formatIcon = getFormatIcon(codecInfo.detectedFormat);
    const codecStatus = codecInfo.isLoaded ? 'loaded' : 'not-loaded';
    
    // Get compatibility assessment
    let compatibility, compatDisplay;
    try {
        compatibility = assessStreamCompatibility(station);
        compatDisplay = getCompatibilityDisplay(compatibility.compatibility);
    } catch (error) {
        console.warn('Error assessing compatibility for station:', station.name, error);
        compatibility = { compatibility: 'unknown', recommendations: ['Unable to assess compatibility'] };
        compatDisplay = getCompatibilityDisplay('unknown');
    }
    
    // Highlight search terms if present
    let displayName = station.name;
    let displayGenre = station.genre;
    
    if (searchTerm) {
        const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
        displayName = station.name.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">$1</mark>');
        displayGenre = station.genre.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">$1</mark>');
    }
    
    // Create the structure with drag handle and station image using grid classes
    stationDiv.innerHTML = `
        <span class="drag-handle cursor-grab" aria-label="Drag to reorder station" role="button" tabindex="0">
            <i class="fas fa-grip-vertical text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300" aria-hidden="true"></i>
        </span>
        <div class="station-image-wrapper hidden sm:block flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-md overflow-hidden bg-white/10 dark:bg-slate-700/30">
            <!-- Flexible image will be inserted here by JS -->
        </div>
        <div class="grid-container min-w-0 cursor-pointer spacing-y-xs" role="button" aria-label="Play ${station.name}">
            <div class="font-medium text-slate-900 dark:text-white fluid-text-lg text-truncate-line prevent-text-overflow">${displayName}</div>
            <div class="text-slate-600 dark:text-slate-300 fluid-text-sm text-truncate-line grid grid-cols-[1fr_auto] gap-2">
                <div class="flex items-center gap-2 overflow-hidden">
                    <span class="text-truncate-line max-w-[150px] md:max-w-[200px] prevent-text-overflow">${displayGenre}</span>
                    <span class="codec-info flex items-center gap-1 fluid-text-xs flex-shrink-0">
                        ${formatIcon}
                        <span class="format-badge ${codecStatus}" title="Format: ${codecInfo.qualityInfo.format}, Detected: ${codecInfo.detectedFormat}">${codecInfo.qualityInfo.format || codecInfo.detectedFormat.toUpperCase()}</span>
                    </span>
                </div>
                <span class="compatibility-indicator flex-shrink-0" title="${compatDisplay.title}: ${compatibility.recommendations[0] || 'No specific recommendations'}">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full fluid-text-xs ${compatDisplay.bgColor} ${compatDisplay.color}">
                        ${compatDisplay.icon}
                        <span class="hidden sm:inline">${compatibility.compatibility}</span>
                    </span>
                </span>
            </div>
        </div>
        <button class="favorite-btn ml-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-600/30 transition-colors text-xl flex-shrink-0 self-center" 
                data-station-name="${station.name}"
                aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}: ${station.name}"
                title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="fa-star ${isFavorite ? 'fas favorited' : 'far'} favorite-star" aria-hidden="true"></i>
        </button>
    `;
    
    // Add station image if available
    if (station.favicon) {
        const imageWrapper = stationDiv.querySelector('.station-image-wrapper');
        if (imageWrapper) {
            // Use the flexible image utility to create a responsive image
            const flexibleImg = createFlexibleImage(station.favicon, {
                alt: `${station.name} logo`,
                fallbackIcon: '<i class="fas fa-broadcast-tower text-slate-400 dark:text-slate-500 text-2xl"></i>',
                aspectRatio: '1:1',
                lazyLoad: true,
                className: 'w-full h-full object-contain'
            });
            
            if (flexibleImg) {
                imageWrapper.appendChild(flexibleImg);
            } else {
                // Add fallback if createFlexibleImage returns null
                imageWrapper.innerHTML = `<div class="flex items-center justify-center w-full h-full">
                    <i class="fas fa-broadcast-tower text-slate-400 dark:text-slate-500 text-2xl"></i>
                </div>`;
            }
        }
    } else {
        // No favicon, show default icon
        const imageWrapper = stationDiv.querySelector('.station-image-wrapper');
        if (imageWrapper) {
            imageWrapper.innerHTML = `<div class="flex items-center justify-center w-full h-full">
                <i class="fas fa-broadcast-tower text-slate-400 dark:text-slate-500 text-2xl"></i>
            </div>`;
        }
    }
    
    // Add optimized event listeners
    addStationEventListeners(stationDiv, station);
    
    return stationDiv;
}

/**
 * Get icon for audio format
 * @param {string} format - The detected format
 * @returns {string} - HTML for format icon
 */
function getFormatIcon(format) {
    const icons = {
        'flac': '<i class="fas fa-gem text-purple-500" title="Lossless Quality"></i>',
        'mpeg': '<i class="fas fa-music text-blue-500" title="MP3 Format"></i>',
        'opus': '<i class="fas fa-broadcast-tower text-green-500" title="Opus Codec"></i>',
        'vorbis': '<i class="fas fa-wave-square text-orange-500" title="OGG Vorbis"></i>',
        'aac': '<i class="fas fa-compact-disc text-indigo-500" title="AAC Format"></i>',
        'mediasource': '<i class="fas fa-stream text-gray-500" title="MediaSource API"></i>'
    };
    
    return icons[format] || '<i class="fas fa-question-circle text-gray-400" title="Unknown Format"></i>';
}

/**
 * Add event listeners to station elements using the memory manager
 * to ensure proper cleanup and prevent memory leaks
 * @param {HTMLElement} stationDiv - The station element 
 * @param {Object} station - The station data object
 */
function addStationEventListeners(stationDiv, station) {
    // Add click handler for the main station area (not the drag handle or favorite button)
    const clickableArea = stationDiv.querySelector('.cursor-pointer[role="button"]');
    
    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Station clicked:', station.name);
        
        // Trigger station play via custom event AND fallback to regular click
        const event = new CustomEvent('stationPlay', { 
            detail: station, 
            bubbles: true, 
            cancelable: true 
        });
        const dispatched = stationDiv.dispatchEvent(event);
        
        // Fallback: if custom event wasn't handled, trigger a regular click event
        if (!event.defaultPrevented) {
            // Simulate clicking the station item itself to trigger handleStationListClick
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            stationDiv.dispatchEvent(clickEvent);
        }
    };
    
    if (clickableArea) {
        memoryManager.addEventListener(clickableArea, 'click', handleClick);
    } else {
        // Fallback: if clickable area not found, make the entire station div clickable
        console.warn('Clickable area not found, using fallback click handler');
        
        const handleStationClick = (e) => {
            // Don't trigger if clicking on drag handle or favorite button
            if (e.target.closest('.drag-handle') || e.target.closest('.favorite-btn')) {
                return;
            }
            console.log('Station clicked (fallback):', station.name);
            // This will be handled by the main handleStationListClick function
        };
        
        memoryManager.addEventListener(stationDiv, 'click', handleStationClick);
    }

    // Add keyboard support for individual stations
    const handleKeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            if (clickableArea) {
                clickableArea.click();
            } else {
                const event = new CustomEvent('stationPlay', { detail: station });
                stationDiv.dispatchEvent(event);
            }
        } else if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            const favoriteBtn = stationDiv.querySelector('.favorite-btn');
            if (favoriteBtn) favoriteBtn.click();
        }
    };
    
    memoryManager.addEventListener(stationDiv, 'keydown', handleKeydown);

    // Prevent drag handle from triggering station play
    const dragHandle = stationDiv.querySelector('.drag-handle');
    if (dragHandle) {
        const handleDragClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        const handleDragKeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                // Focus could be used to start dragging, but SortableJS handles this
            }
        };
        
        memoryManager.addEventListener(dragHandle, 'click', handleDragClick);
        memoryManager.addEventListener(dragHandle, 'keydown', handleDragKeydown);
    }
}

// Helper function to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Set the active station in the UI
 * @param {string} stationName - Name of the station to set as active
 */
export function setActiveStation(stationName) {
    // Guard against null or undefined stationName
    if (!stationName) {
        console.warn('setActiveStation called with null/undefined stationName');
        return;
    }
    
    // Remove active state from all stations
    document.querySelectorAll('.station-item.active').forEach(item => {
        try {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
            
            // Safely get the genre text or use a default
            const genreEl = item.querySelector('.text-sm, .fluid-text-sm');
            const genreText = genreEl && genreEl.textContent ? genreEl.textContent : 'Genre';
            
            // Only set aria-label if stationName is available in dataset
            if (item.dataset && item.dataset.stationName) {
                item.setAttribute('aria-label', `${item.dataset.stationName} - ${genreText}`);
            }
            
            if (genreEl) {
                genreEl.classList.remove('text-white', 'dark:text-white');
                genreEl.classList.add('text-slate-500', 'dark:text-slate-400');
            }
        } catch (error) {
            console.warn('Error clearing active station state:', error);
        }
    });

    // Set active state for current station
    try {
        // Use a more specific selector to avoid issues with special characters
        const selector = `.station-item[data-station-name="${CSS.escape(stationName)}"]`;
        const activeItem = document.querySelector(selector);
        
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.setAttribute('aria-current', 'true');
            
            // Trigger a custom event for the visual feedback module
            const event = new CustomEvent('stationSelected', {
                detail: { stationName }
            });
            document.dispatchEvent(event);
            
            // Safely get the genre text or use a default
            const genreEl = activeItem.querySelector('.text-sm, .fluid-text-sm');
            const genreText = genreEl && genreEl.textContent ? genreEl.textContent : 'Genre';
            
            activeItem.setAttribute('aria-label', `${stationName} - Currently playing - ${genreText}`);
            
            if (genreEl) {
                genreEl.classList.add('text-white', 'dark:text-white');
                genreEl.classList.remove('text-slate-500', 'dark:text-slate-400');
            }
        } else {
            console.warn(`Station element not found: ${stationName}`);
        }
    } catch (error) {
        console.warn('Error setting active station:', error);
    }
}

export function updatePlayerInfo(station, infoNameElement, infoQualityElement) {
    infoNameElement.textContent = station.name;
    if (infoQualityElement) {
        infoQualityElement.textContent = `Quality: ${station.quality}`;
    }
}

export function updateNowPlaying(text, infoGenreElement) {
    infoGenreElement.textContent = text;
    
    // Update screen reader status
    updateScreenReaderStatus(text);
}

export function updateScreenReaderStatus(message, priority = 'polite') {
    const statusElement = document.getElementById('player-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.setAttribute('aria-live', priority);
        
        // Clear after announcement to prevent repeated readings
        setTimeout(() => {
            statusElement.textContent = '';
        }, 3000);
    }
}

export function updateThemeIcons(themeToggleButton) {
    const isDark = document.documentElement.classList.contains('dark');
    themeToggleButton.querySelector('.fa-sun').classList.toggle('hidden', isDark);
    themeToggleButton.querySelector('.fa-moon').classList.toggle('hidden', !isDark);
}

export function initSortable(stationListElement, onOrderChange) {
    new Sortable(stationListElement, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: function (evt) {
            const stations = updateStationOrder(evt.oldIndex, evt.newIndex);
            saveSortOrder(stations.map(s => s.name));
            onOrderChange();
        },
    });
}

export function setupLazyLoading(stationListElement, searchInputElement, onLoadMore) {
    stationListElement.addEventListener('scroll', () => {
        if (isLazyLoadingEnabled && 
            stationListElement.scrollTop + stationListElement.clientHeight >= 
            stationListElement.scrollHeight - 50) {
            const stations = getStations();
            const filteredStations = stations.filter(station => 
                station.name.toLowerCase().includes(searchInputElement.value.toLowerCase()) || 
                station.genre.toLowerCase().includes(searchInputElement.value.toLowerCase())
            );
            if (stationsToShow < filteredStations.length) {
                stationsToShow += 10;
                onLoadMore();
            }
        }
    });
}

// Search performance optimization
let searchTimeout = null;
let searchCache = new Map();
let lastSearchValue = '';
const SEARCH_DELAY = 300; // ms
const MAX_SEARCH_RESULTS = 50; // Limit search results for performance
const CACHE_MAX_SIZE = 30; // Maximum number of items to keep in cache
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // Cache entries expire after 5 minutes

/**
 * Optimized search handler with debouncing, caching, and early termination
 * @param {string} searchValue - The search term entered by the user
 */
export function handleSearch(searchValue) {
    // Early termination if search value hasn't changed
    if (searchValue === lastSearchValue) {
        return;
    }
    
    lastSearchValue = searchValue;
    
    // Clear any existing search timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
        memoryManager.addTimeout(searchTimeout); // Register with memory manager
    }
    
    // Debounce the search to avoid excessive DOM updates
    searchTimeout = setTimeout(() => {
        performSearch(searchValue);
        searchTimeout = null; // Clear reference to help garbage collection
    }, SEARCH_DELAY);
    
    // Register timeout with memory manager
    memoryManager.addTimeout(searchTimeout);
}

/**
 * Perform the actual search operation with caching
 * @param {string} searchValue - The search term entered by the user
 */
function performSearch(searchValue) {
    const trimmedValue = searchValue.trim();
    const currentTime = Date.now();
    
    // Check cache first for performance
    if (searchCache.has(trimmedValue)) {
        const cacheEntry = searchCache.get(trimmedValue);
        
        // Check if cache is still valid (not expired)
        if (currentTime - cacheEntry.timestamp < CACHE_EXPIRY_MS) {
            updateSearchResults(cacheEntry.results, trimmedValue);
            return;
        } else {
            // Cache expired, remove it
            searchCache.delete(trimmedValue);
        }
    }
    
    if (trimmedValue) {
        isLazyLoadingEnabled = false;
        
        // Get search results with limit for performance
        const searchResults = getFilteredStations(trimmedValue, MAX_SEARCH_RESULTS);
        
        // Cache the results with timestamp
        searchCache.set(trimmedValue, {
            results: searchResults,
            timestamp: currentTime
        });
        
        // Clean up old cache entries
        cleanupSearchCache();
        
        updateSearchResults(searchResults, trimmedValue);
        updateScreenReaderStatus(`${searchResults.length} stations found for "${trimmedValue}"`, 'polite');
    } else {
        // Clear search - reset to show all stations
        isLazyLoadingEnabled = true;
        stationsToShow = 10;
        updateSearchResults(null, '');
        updateScreenReaderStatus('Showing all stations', 'polite');
    }
}

/**
 * Clean up old or excess cache entries to prevent memory leaks
 */
function cleanupSearchCache() {
    if (searchCache.size <= CACHE_MAX_SIZE) {
        return; // Cache not full yet
    }
    
    const currentTime = Date.now();
    const entries = Array.from(searchCache.entries());
    
    // First remove expired entries
    const expiredEntries = entries.filter(([key, entry]) => 
        currentTime - entry.timestamp > CACHE_EXPIRY_MS
    );
    
    expiredEntries.forEach(([key]) => searchCache.delete(key));
    
    // If still too many entries, remove oldest ones
    if (searchCache.size > CACHE_MAX_SIZE) {
        // Sort by timestamp (oldest first)
        const oldestEntries = entries
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .slice(0, searchCache.size - CACHE_MAX_SIZE);
        
        oldestEntries.forEach(([key]) => searchCache.delete(key));
    }
}

/**
 * Clear the search cache to free memory
 */
export function clearSearchCache() {
    searchCache.clear();
    console.log('Search cache cleared');
}

function getFilteredStations(searchTerm, limit = MAX_SEARCH_RESULTS) {
    const searchTermLower = searchTerm.toLowerCase();
    const stations = getStations();
    const results = [];
    
    // First pass: exact name matches (highest priority)
    for (const station of stations) {
        if (results.length >= limit) break;
        if (station.name.toLowerCase().startsWith(searchTermLower)) {
            results.push(station);
        }
    }
    
    // Second pass: partial name matches
    for (const station of stations) {
        if (results.length >= limit) break;
        if (!results.includes(station) && 
            station.name.toLowerCase().includes(searchTermLower)) {
            results.push(station);
        }
    }
    
    // Third pass: genre matches
    for (const station of stations) {
        if (results.length >= limit) break;
        if (!results.includes(station) && 
            station.genre.toLowerCase().includes(searchTermLower)) {
            results.push(station);
        }
    }
    
    return results;
}

function updateSearchResults(results, searchTerm) {
    // Get the station list element
    const stationListElement = document.getElementById('station-list');
    if (!stationListElement) return;
    
    // Batch DOM updates using document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    if (results) {
        // Show limited search results
        results.forEach(station => {
            const stationElement = createStationElement(station, searchTerm);
            fragment.appendChild(stationElement);
        });
        
        // Clear existing content and add new results in one operation
        stationListElement.innerHTML = '';
        stationListElement.appendChild(fragment);
        
        // Add "no more results" message if at limit
        if (results.length === MAX_SEARCH_RESULTS) {
            const limitMessage = document.createElement('div');
            limitMessage.className = 'text-gray-500 text-sm text-center py-2';
            limitMessage.textContent = `Showing first ${MAX_SEARCH_RESULTS} results. Refine your search for more specific results.`;
            stationListElement.appendChild(limitMessage);
        }
    } else {
        // Trigger normal station list population (will use lazy loading)
        const event = new CustomEvent('refreshStationList');
        document.dispatchEvent(event);
    }
}

function createStationElement(station, searchTerm = '') {
    const stationDiv = document.createElement('div');
    stationDiv.className = 'station-item p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-gray-600 touch-spacing-y-sm';
    stationDiv.dataset.stationName = station.name;
    
    // Highlight search term in results
    let displayName = station.name;
    let displayGenre = station.genre;
    
    if (searchTerm) {
        const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
        displayName = station.name.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">$1</mark>');
        displayGenre = station.genre.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">$1</mark>');
    }
    
    stationDiv.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="station-search-image flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-white/10 dark:bg-slate-700/30 hidden sm:block">
                <!-- Flexible image will be inserted here by JS -->
            </div>
            <div class="flex-1 min-w-0 spacing-y-xs">
                <div class="font-medium text-gray-900 dark:text-white fluid-text-md text-truncate-line prevent-text-overflow">${displayName}</div>
                <div class="fluid-text-sm text-gray-500 dark:text-gray-400 text-truncate-line prevent-text-overflow">${displayGenre}</div>
            </div>
            <button class="favorite-btn flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    data-station-name="${station.name}"
                    aria-label="Toggle favorite for ${station.name}">
                <i class="fa-heart far"></i>
            </button>
        </div>
    `;

    // Add station image if available
    if (station.favicon) {
        const imageWrapper = stationDiv.querySelector('.station-search-image');
        if (imageWrapper) {
            // Use the flexible image utility to create a responsive image
            const flexibleImg = createFlexibleImage(station.favicon, {
                alt: `${station.name} logo`,
                fallbackIcon: '<i class="fas fa-broadcast-tower text-slate-400 dark:text-slate-500"></i>',
                aspectRatio: '1:1',
                lazyLoad: true,
                className: 'w-full h-full object-contain'
            });
            
            if (flexibleImg) {
                imageWrapper.appendChild(flexibleImg);
            } else {
                // Add fallback if createFlexibleImage returns null
                imageWrapper.innerHTML = `<div class="flex items-center justify-center w-full h-full">
                    <i class="fas fa-broadcast-tower text-slate-400 dark:text-slate-500"></i>
                </div>`;
            }
        }
    } else {
        // No favicon, show default icon
        const imageWrapper = stationDiv.querySelector('.station-search-image');
        if (imageWrapper) {
            imageWrapper.innerHTML = `<div class="flex items-center justify-center w-full h-full">
                <i class="fas fa-broadcast-tower text-slate-400 dark:text-slate-500"></i>
            </div>`;
        }
    }
    
    return stationDiv;
}

export function resetLazyLoading() {
    stationsToShow = 10;
    isLazyLoadingEnabled = true;
    searchCache.clear(); // Clear search cache when resetting
}

// Error message display
export function showErrorMessage(message, container, duration = 5000) {
    // Remove any existing error messages
    clearErrorMessage(container);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-3" aria-hidden="true"></i>
            <div class="flex-1">
                <p class="font-medium">Playback Error</p>
                <p class="text-sm opacity-90">${message}</p>
            </div>
            <button class="ml-3 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()" aria-label="Close error message">
                <i class="fas fa-times" aria-hidden="true"></i>
            </button>
        </div>
    `;
    
    // Integrate with visual feedback module
    if (typeof setErrorState === 'function') {
        setErrorState(true);
    }
    
    document.body.appendChild(errorDiv);
    
    // Also announce to screen readers
    updateScreenReaderStatus(`Error: ${message}`, 'assertive');
    
    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, duration);
    }
    
    return errorDiv;
}

export function showRetryMessage(currentRetry, maxRetries, stationName, container) {
    // Remove any existing retry messages
    clearRetryMessage();
    
    const retryDiv = document.createElement('div');
    retryDiv.className = 'retry-message fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    retryDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-sync-alt fa-spin mr-3"></i>
            <div>
                <p class="font-medium">Retrying Connection</p>
                <p class="text-sm opacity-90">Attempt ${currentRetry}/${maxRetries} for ${stationName}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(retryDiv);
    return retryDiv;
}

export function clearErrorMessage() {
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());
    
    // Integrate with visual feedback module
    if (typeof setErrorState === 'function') {
        setErrorState(false);
    }
}

export function clearRetryMessage() {
    const existingRetries = document.querySelectorAll('.retry-message');
    existingRetries.forEach(retry => retry.remove());
}

export function showLoadingState(infoGenreElement) {
    infoGenreElement.innerHTML = `
        <div class="flex items-center justify-center">
            <i class="fas fa-spinner fa-spin mr-2" aria-hidden="true"></i>
            Loading stream...
        </div>
    `;
    updateScreenReaderStatus('Loading stream...', 'polite');
    
    // Integrate with visual feedback module
    if (typeof setLoadingState === 'function') {
        setLoadingState(true);
    }
}

export function clearLoadingState(infoGenreElement, fallbackText = 'Your music awaits') {
    if (infoGenreElement.innerHTML.includes('fa-spinner')) {
        infoGenreElement.textContent = fallbackText;
        updateScreenReaderStatus(`Loaded: ${fallbackText}`, 'polite');
        
        // Integrate with visual feedback module
        if (typeof setLoadingState === 'function') {
            setLoadingState(false);
        }
    }
}

/**
 * Show compatibility statistics for all stations
 * @param {HTMLElement} container - Container to display stats in
 */
export function showCompatibilityStats(container) {
    const stations = getStations();
    if (!stations.length) return;

    const results = batchAssessCompatibility(stations);
    const compatible = results.excellent + results.good;
    const total = results.total;
    const percentage = Math.round((compatible / total) * 100);

    const statsDiv = document.createElement('div');
    statsDiv.className = 'compatibility-stats p-3 mb-4 rounded-lg bg-gradient-to-r from-blue-100/30 to-indigo-100/30 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/20 dark:border-blue-700/20';
    statsDiv.innerHTML = `
        <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
                <span class="text-blue-600 dark:text-blue-400 font-medium">Browser Compatibility:</span>
                <span class="text-green-600 dark:text-green-400 font-semibold">${compatible}/${total} stations (${percentage}%)</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
                <span title="Excellent compatibility - works on all browsers" class="cursor-help">🟢 ${results.excellent}</span>
                <span title="Good compatibility - works on most browsers" class="cursor-help">🟡 ${results.good}</span>
                <span title="Limited compatibility - may not work on some browsers" class="cursor-help">🔴 ${results.limited + results.poor}</span>
                ${results.cors > 0 ? `<span title="CORS blocked - server blocks web access" class="cursor-help">🚫 ${results.cors}</span>` : ''}
            </div>
        </div>
        ${compatible < total ? `
        <div class="text-xs text-slate-600 dark:text-slate-400 mt-1">
            <i class="fas fa-info-circle mr-1" aria-hidden="true"></i>
            For best compatibility, choose stations with 🟢 indicators or use the filter button above.
        </div>` : ''}
    `;
    
    // Remove existing stats if present
    const existingStats = container.querySelector('.compatibility-stats');
    if (existingStats) {
        existingStats.remove();
    }
    
    // Add new stats at the beginning of the container
    container.insertBefore(statsDiv, container.firstChild);
}

/**
 * Toggle the compatibility filter
 * @param {HTMLElement} stationListElement - Station list container
 * @param {Array} favorites - Current favorites
 * @param {string} currentSearch - Current search filter
 */
export function toggleCompatibilityFilter(stationListElement, favorites = [], currentSearch = '') {
    showOnlyCompatible = !showOnlyCompatible;
    
    // Update button appearance
    const filterButton = document.getElementById('compatibility-filter');
    if (filterButton) {
        if (showOnlyCompatible) {
            filterButton.classList.add('text-green-600', 'dark:text-green-400');
            filterButton.classList.remove('text-slate-500');
            filterButton.title = 'Show all stations';
        } else {
            filterButton.classList.remove('text-green-600', 'dark:text-green-400');
            filterButton.classList.add('text-slate-500');
            filterButton.title = 'Show only compatible stations';
        }
    }
    
    // Repopulate the station list with the new filter
    populateStationList(stationListElement, favorites, currentSearch);
    
    console.log(`🎵 Compatibility filter ${showOnlyCompatible ? 'enabled' : 'disabled'}`);
}

/**
 * Get the current state of the compatibility filter
 * @returns {boolean} - Whether compatibility filter is active
 */
export function isCompatibilityFilterActive() {
    return showOnlyCompatible;
}
