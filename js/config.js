// Configuration settings
export const APP_CONFIG = {
    // Visualization settings
    VISUALIZER: {
        DEFAULT_TYPE: 'bars',
        TYPES: ['bars', 'wave', 'sphere'],
        CONTAINER_HEIGHT: 128, // pixels
        DEFAULT_QUALITY: 'auto', // auto, high, medium, low
        QUALITY_LEVELS: {
            high: {
                name: 'High Quality',
                description: 'Full 3D complexity, smooth animations',
                fftSizes: { bars: 512, wave: 2048, sphere: 512 },
                particleCount: 1000,
                animationFrameSkip: 0,
                enableShadows: true,
                antiAliasing: true
            },
            medium: {
                name: 'Medium Quality',
                description: 'Balanced performance and visuals',
                fftSizes: { bars: 256, wave: 1024, sphere: 256 },
                particleCount: 500,
                animationFrameSkip: 1,
                enableShadows: false,
                antiAliasing: false
            },
            low: {
                name: 'Low Quality',
                description: 'Optimized for performance',
                fftSizes: { bars: 128, wave: 512, sphere: 128 },
                particleCount: 200,
                animationFrameSkip: 2,
                enableShadows: false,
                antiAliasing: false
            }
        },
        // Legacy support - will be deprecated
        FFT_SIZES: {
            bars: 256,
            wave: 2048,
            sphere: 256
        }
    },

    // Performance settings
    PERFORMANCE: {
        MONITORING: {
            ENABLED: true,
            FPS_SAMPLE_SIZE: 60, // frames to average
            MEMORY_CHECK_INTERVAL: 5000, // milliseconds
            QUALITY_ADJUST_THRESHOLD: 30, // FPS below which to reduce quality
            QUALITY_UPGRADE_THRESHOLD: 50 // FPS above which to increase quality
        },
        DEVICE_DETECTION: {
            MOBILE_THRESHOLD: 768, // pixels - below this is considered mobile
            LOW_MEMORY_THRESHOLD: 1000, // MB - rough estimate
            HIGH_PERFORMANCE_INDICATORS: ['WebGL2', 'OES_vertex_array_object']
        },
        AUTO_QUALITY: {
            INITIAL_BENCHMARK_DURATION: 3000, // ms to test performance
            ADJUSTMENT_COOLDOWN: 10000, // ms between auto adjustments
            ENABLE_ADAPTIVE: true
        }
    },

    // UI settings
    UI: {
        LAZY_LOADING: {
            INITIAL_STATIONS: 10,
            LOAD_MORE_THRESHOLD: 50, // pixels from bottom
            INCREMENT: 10
        },
        SEARCH_DEBOUNCE_TIME: 300 // milliseconds
    },

    // Theme settings
    THEME: {
        DEFAULT: 'auto', // 'light', 'dark', 'auto'
        STORAGE_KEY: 'theme'
    },

    // Audio settings
    AUDIO: {
        CROSSORIGIN: 'anonymous',
        DEFAULT_VOLUME: 1.0
    }
};

// Default station configuration
export const STATION_CONFIG = {
    DEFAULT_QUALITY: 'Unknown',
    DEFAULT_GENRE: 'Various',
    SUPPORTED_FORMATS: ['mp3', 'aac', 'flac', 'ogg']
};

// Error messages
export const ERROR_MESSAGES = {
    AUDIO_CONTEXT_FAILED: 'Audio context initialization failed',
    STREAM_LOAD_FAILED: 'Stream could not be loaded',
    VISUALIZER_INIT_FAILED: 'Visualizer initialization failed',
    METADATA_LIBRARY_MISSING: 'IcecastMetadataPlayer library not loaded',
    CONNECTION_TIMEOUT: 'Connection timeout: The station is taking too long to respond',
    NETWORK_ERROR: 'Network error: Unable to connect to the radio station',
    FORMAT_UNSUPPORTED: 'Format not supported: This audio format is not supported by your browser',
    PLAYBACK_BLOCKED: 'Playback blocked: Please click the play button to start audio',
    CORS_ERROR: 'CORS error: Metadata fetching blocked (audio still works)',
    METADATA_UNAVAILABLE: 'Station info will be used (metadata unavailable)'
};

// Retry configuration
export const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000, // milliseconds
    CONNECTION_TIMEOUT: 15000 // milliseconds
};

// Debug and Development configuration
export const DEBUG_CONFIG = {
    ENABLE_MEMORY_MONITORING: false, // Set to true for memory monitoring in production
    MEMORY_MONITOR_INTERVAL: 30000, // 30 seconds
    MEMORY_LOG_THRESHOLD: 100, // MB - only log if usage exceeds this
    SUPPRESS_EXTERNAL_WARNINGS: true, // Filter known warnings from external libraries
    ENABLE_PERFORMANCE_STATS: false // Set to true to show performance stats
};
