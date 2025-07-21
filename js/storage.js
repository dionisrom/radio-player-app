// LocalStorage management utilities
export const STORAGE_KEYS = {
    FAVORITES: 'radioFavorites',
    SORT_ORDER: 'radioSortOrder', 
    VISUALIZATION: 'radioViz',
    THEME: 'theme',
    QUALITY: 'radioQuality'
};

// Generic storage functions
export function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
    }
}

export function loadFromStorage(key, defaultValue = null) {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return defaultValue;
    }
}

export function loadFavorites() {
    const storedFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return storedFavorites ? JSON.parse(storedFavorites) : [];
}

export function saveFavorites(favorites) {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
}

export function loadSortOrder() {
    const storedOrder = localStorage.getItem(STORAGE_KEYS.SORT_ORDER);
    return storedOrder ? JSON.parse(storedOrder) : null;
}

export function saveSortOrder(orderedNames) {
    localStorage.setItem(STORAGE_KEYS.SORT_ORDER, JSON.stringify(orderedNames));
}

export function loadVisualization() {
    return localStorage.getItem(STORAGE_KEYS.VISUALIZATION) || 'bars';
}

export function saveVisualization(vizType) {
    localStorage.setItem(STORAGE_KEYS.VISUALIZATION, vizType);
}

export function loadTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME);
}

export function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
}
