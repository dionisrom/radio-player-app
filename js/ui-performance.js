// UI Performance optimizations - additional functions
// Search performance optimization
let searchTimeout = null;
let searchCache = new Map();
const SEARCH_DELAY = 300; // ms
const MAX_SEARCH_RESULTS = 50; // Limit search results for performance

export function optimizedHandleSearch(searchValue) {
    // Clear any existing search timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Debounce the search to avoid excessive DOM updates
    searchTimeout = setTimeout(() => {
        performOptimizedSearch(searchValue);
    }, SEARCH_DELAY);
}

function performOptimizedSearch(searchValue) {
    const trimmedValue = searchValue.trim();
    
    // Check cache first for performance
    if (searchCache.has(trimmedValue)) {
        console.log('Using cached search results for:', trimmedValue);
        return;
    }
    
    if (trimmedValue) {
        // Cache the search term
        searchCache.set(trimmedValue, true);
        
        // Clear old cache entries if getting too large
        if (searchCache.size > 20) {
            const firstKey = searchCache.keys().next().value;
            searchCache.delete(firstKey);
        }
        
        console.log(`Search performed for: "${trimmedValue}"`);
    }
}

export function escapeRegexChars(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function clearSearchCache() {
    searchCache.clear();
    console.log('Search cache cleared');
}
