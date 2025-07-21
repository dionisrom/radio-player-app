// Codec Manager - Dynamic loading of format-specific codec modules
import { APP_CONFIG } from './config.js';

// Available codec modules
const CODEC_MODULES = {
    'flac': 'js/player/icecast-metadata-player-1.17.12.flac.min.js',
    'mpeg': 'js/player/icecast-metadata-player-1.17.12.mpeg.min.js', // MP3
    'opus': 'js/player/icecast-metadata-player-1.17.12.opus.min.js',
    'vorbis': 'js/player/icecast-metadata-player-1.17.12.vorbis.min.js', // OGG
    'mediasource': 'js/player/icecast-metadata-player-1.17.12.mediasource.min.js',
    'synaudio': 'js/player/icecast-metadata-player-1.17.12.synaudio.min.js'
};

// Format detection patterns
const FORMAT_PATTERNS = {
    'flac': ['.flac', '/flac', '-flac', 'flac'],
    'mpeg': ['.mp3', '/mp3', 'mp3', '/128.mp3', '/320.mp3', '/192.mp3'],
    'opus': ['.opus', '/opus', 'opus'],
    'vorbis': ['.ogg', '/ogg', '-ogg', 'ogg', '/vorbis'],
    'aac': ['.aac', '/aac', 'aac', '.m4a', '/m4a']
};

// Loaded modules cache
const loadedModules = new Set();
const loadingPromises = new Map();

// MIME type to format mapping
const MIME_TYPE_FORMATS = {
    // FLAC formats
    'audio/flac': 'flac',
    'audio/x-flac': 'flac',
    
    // MP3/MPEG formats
    'audio/mpeg': 'mpeg',
    'audio/mp3': 'mpeg',
    'audio/x-mp3': 'mpeg',
    'audio/mpeg3': 'mpeg',
    
    // AAC formats
    'audio/aac': 'aac',
    'audio/x-aac': 'aac',
    'audio/mp4': 'aac',
    'audio/x-m4a': 'aac',
    
    // OGG/Vorbis formats
    'audio/ogg': 'vorbis',
    'audio/x-ogg': 'vorbis',
    'application/ogg': 'vorbis',
    'audio/vorbis': 'vorbis',
    
    // Opus formats
    'audio/opus': 'opus',
    'audio/x-opus': 'opus',
    
    // WebM (often contains Opus)
    'audio/webm': 'opus',
    
    // Generic/fallback
    'audio/x-scpls': 'mpeg', // Playlist, assume MP3
    'application/pls+xml': 'mpeg', // Playlist
    'audio/x-mpegurl': 'mpeg', // M3U playlist
    'application/vnd.apple.mpegurl': 'mpeg', // HLS playlist
    'application/x-mpegURL': 'mpeg'
};

// Cache for MIME type results (to avoid repeated requests)
const mimeTypeCache = new Map();

/**
 * Detect stream format by performing a HEAD request to check MIME type
 * @param {string} url - The stream URL
 * @param {number} timeoutMs - Request timeout in milliseconds
 * @returns {Promise<Object>} - Detection result with format, mimeType, and metadata
 */
export async function detectStreamMimeType(url, timeoutMs = 5000) {
    // Check cache first
    if (mimeTypeCache.has(url)) {
        console.log(`🔍 Using cached MIME type for: ${url}`);
        return mimeTypeCache.get(url);
    }
    
    console.log(`🔍 Detecting MIME type for: ${url}`);
    
    const result = {
        url,
        mimeType: null,
        format: null,
        detected: false,
        error: null,
        headers: {},
        redirectUrl: null
    };
    
    try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        // Perform HEAD request
        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache',
            redirect: 'follow' // Follow redirects to get final URL
        });
        
        clearTimeout(timeoutId);
        
        // Get headers
        const contentType = response.headers.get('content-type');
        const server = response.headers.get('server');
        const icyName = response.headers.get('icy-name');
        const icyGenre = response.headers.get('icy-genre');
        const icyBr = response.headers.get('icy-br');
        
        result.headers = {
            'content-type': contentType,
            'server': server,
            'icy-name': icyName,
            'icy-genre': icyGenre,
            'icy-br': icyBr
        };
        
        result.redirectUrl = response.url !== url ? response.url : null;
        
        if (contentType) {
            // Clean up the MIME type (remove parameters like charset)
            const cleanMimeType = contentType.split(';')[0].trim().toLowerCase();
            result.mimeType = cleanMimeType;
            
            // Map MIME type to format
            if (MIME_TYPE_FORMATS[cleanMimeType]) {
                result.format = MIME_TYPE_FORMATS[cleanMimeType];
                result.detected = true;
                console.log(`✅ MIME type detected: ${cleanMimeType} → ${result.format}`);
            } else {
                console.warn(`⚠️ Unknown MIME type: ${cleanMimeType}`);
                // Try to guess from the MIME type string
                result.format = guessFormatFromMimeType(cleanMimeType);
            }
        } else {
            console.warn(`⚠️ No Content-Type header found for: ${url}`);
        }
        
        // Extract additional metadata from headers
        if (icyBr) {
            result.bitrate = parseInt(icyBr);
        }
        
        if (icyName) {
            result.stationName = icyName;
        }
        
        if (icyGenre) {
            result.genre = icyGenre;
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            result.error = 'Request timeout';
            console.warn(`⏱️ MIME type detection timeout for: ${url}`);
        } else {
            result.error = error.message;
            console.warn(`❌ MIME type detection failed for: ${url}`, error);
        }
    }
    
    // Cache the result (even failures, to avoid repeated requests)
    mimeTypeCache.set(url, result);
    
    return result;
}

/**
 * Guess format from MIME type string when not in our mapping
 * @param {string} mimeType - The MIME type
 * @returns {string} - Guessed format
 */
function guessFormatFromMimeType(mimeType) {
    if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mpeg';
    if (mimeType.includes('flac')) return 'flac';
    if (mimeType.includes('ogg') || mimeType.includes('vorbis')) return 'vorbis';
    if (mimeType.includes('opus')) return 'opus';
    if (mimeType.includes('aac') || mimeType.includes('mp4')) return 'aac';
    if (mimeType.includes('webm')) return 'opus';
    
    // Default fallback
    return 'mpeg';
}

/**
 * Enhanced format detection using both MIME type and URL patterns
 * @param {string} url - The stream URL
 * @param {string} quality - The quality description (optional)
 * @returns {Promise<Object>} - Enhanced detection result
 */
export async function detectStreamFormatEnhanced(url, quality = '') {
    console.log(`🔍 Enhanced format detection for: ${url}`);
    
    // First, try MIME type detection
    const mimeResult = await detectStreamMimeType(url);
    
    // Also do pattern-based detection as fallback
    const patternFormat = detectStreamFormat(url, quality);
    
    const result = {
        url,
        detectedFormat: null,
        confidence: 'low',
        mimeTypeResult: mimeResult,
        patternFormat,
        finalFormat: null,
        metadata: {}
    };
    
    // Determine the best format based on available information
    if (mimeResult.detected && mimeResult.format) {
        result.detectedFormat = mimeResult.format;
        result.confidence = 'high';
        result.finalFormat = mimeResult.format;
        
        // Add metadata from headers
        if (mimeResult.stationName) result.metadata.stationName = mimeResult.stationName;
        if (mimeResult.genre) result.metadata.genre = mimeResult.genre;
        if (mimeResult.bitrate) result.metadata.bitrate = mimeResult.bitrate;
        
        console.log(`✅ High confidence detection: ${result.finalFormat} (MIME: ${mimeResult.mimeType})`);
    } else {
        // Fall back to pattern matching
        result.detectedFormat = patternFormat;
        result.confidence = 'medium';
        result.finalFormat = patternFormat;
        
        console.log(`⚠️ Medium confidence detection: ${result.finalFormat} (pattern-based)`);
    }
    
    // Cross-validate: if both methods agree, increase confidence
    if (mimeResult.format === patternFormat && mimeResult.detected) {
        result.confidence = 'very-high';
        console.log(`🎯 Very high confidence: Both MIME and pattern agree on ${result.finalFormat}`);
    }
    
    return result;
}

/**
 * Detect the most likely format for a stream URL
 * @param {string} url - The stream URL
 * @param {string} quality - The quality description (optional)
 * @returns {string} - Detected format key
 */
export function detectStreamFormat(url, quality = '') {
    const urlLower = url.toLowerCase();
    const qualityLower = quality.toLowerCase();
    
    // Check URL and quality string for format indicators
    for (const [format, patterns] of Object.entries(FORMAT_PATTERNS)) {
        for (const pattern of patterns) {
            if (urlLower.includes(pattern) || qualityLower.includes(pattern.replace(/[/.]/g, ''))) {
                console.log(`🔍 Detected format: ${format} (pattern: ${pattern})`);
                return format;
            }
        }
    }
    
    // Default fallback - try mpeg first, then mediasource
    console.log('🔍 No specific format detected, defaulting to mpeg (MP3)');
    return 'mpeg';
}

/**
 * Load a codec module dynamically
 * @param {string} format - The format key
 * @returns {Promise<boolean>} - Success status
 */
export function loadCodecModule(format) {
    // Return early if already loaded
    if (loadedModules.has(format)) {
        console.log(`📦 Codec module '${format}' already loaded`);
        return Promise.resolve(true);
    }
    
    // Return existing loading promise if in progress
    if (loadingPromises.has(format)) {
        console.log(`📦 Codec module '${format}' already loading...`);
        return loadingPromises.get(format);
    }
    
    const moduleFile = CODEC_MODULES[format];
    if (!moduleFile) {
        console.warn(`❌ No codec module available for format: ${format}`);
        return Promise.resolve(false);
    }
    
    console.log(`📦 Loading codec module: ${format} (${moduleFile})`);
    
    const loadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = moduleFile;
        script.async = true;
        
        script.onload = () => {
            console.log(`✅ Codec module loaded successfully: ${format}`);
            loadedModules.add(format);
            loadingPromises.delete(format);
            resolve(true);
        };
        
        script.onerror = (error) => {
            console.error(`❌ Failed to load codec module: ${format}`, error);
            loadingPromises.delete(format);
            resolve(false); // Don't reject, just return false
        };
        
        document.head.appendChild(script);
    });
    
    loadingPromises.set(format, loadPromise);
    return loadPromise;
}

/**
 * Load multiple codec modules
 * @param {string[]} formats - Array of format keys
 * @returns {Promise<Object>} - Object with format keys and success status
 */
export async function loadCodecModules(formats) {
    const results = {};
    
    const loadPromises = formats.map(async (format) => {
        const success = await loadCodecModule(format);
        results[format] = success;
        return { format, success };
    });
    
    await Promise.all(loadPromises);
    
    const successful = Object.values(results).filter(Boolean).length;
    console.log(`📦 Loaded ${successful}/${formats.length} codec modules`);
    
    return results;
}

/**
 * Preload common codec modules
 * @returns {Promise<Object>} - Loading results
 */
export async function preloadCommonCodecs() {
    console.log('📦 Preloading common codec modules...');
    
    // Load the most common formats first
    const commonFormats = ['mpeg', 'flac', 'mediasource'];
    
    const results = await loadCodecModules(commonFormats);
    
    // Load less common ones in the background (don't wait)
    setTimeout(() => {
        loadCodecModules(['opus', 'vorbis', 'synaudio']).then(bgResults => {
            console.log('📦 Background codec loading complete:', bgResults);
        });
    }, 2000);
    
    return results;
}

/**
 * Get the best codec module for a stream (enhanced with MIME type detection)
 * @param {string} url - Stream URL
 * @param {string} quality - Quality description
 * @param {boolean} useMimeDetection - Whether to use MIME type detection
 * @returns {Promise<Object>} - Best available codec info with detection details
 */
export async function getBestCodec(url, quality = '', useMimeDetection = true) {
    let detectedFormat;
    let detectionInfo = null;
    
    if (useMimeDetection) {
        // Use enhanced detection with MIME type
        detectionInfo = await detectStreamFormatEnhanced(url, quality);
        detectedFormat = detectionInfo.finalFormat;
        
        console.log(`🎵 Enhanced detection result:`, {
            format: detectedFormat,
            confidence: detectionInfo.confidence,
            mimeType: detectionInfo.mimeTypeResult.mimeType,
            metadata: detectionInfo.metadata
        });
    } else {
        // Use pattern-based detection only
        detectedFormat = detectStreamFormat(url, quality);
        console.log(`🔍 Pattern-based detection: ${detectedFormat}`);
    }
    
    // Try to load the detected format first
    const primarySuccess = await loadCodecModule(detectedFormat);
    if (primarySuccess) {
        return {
            format: detectedFormat,
            success: true,
            detectionInfo,
            fallbackUsed: false
        };
    }
    
    // Fallback chain based on format
    let fallbackFormats = [];
    
    switch (detectedFormat) {
        case 'flac':
            fallbackFormats = ['mediasource', 'mpeg'];
            break;
        case 'opus':
            fallbackFormats = ['mediasource', 'vorbis', 'mpeg'];
            break;
        case 'vorbis':
            fallbackFormats = ['opus', 'mediasource', 'mpeg'];
            break;
        case 'aac':
            fallbackFormats = ['mediasource', 'mpeg'];
            break;
        default:
            fallbackFormats = ['mediasource', 'mpeg'];
    }
    
    // Try fallback formats
    for (const format of fallbackFormats) {
        const success = await loadCodecModule(format);
        if (success) {
            console.log(`📦 Using fallback codec: ${format} for ${detectedFormat}`);
            return {
                format: format,
                success: true,
                detectionInfo,
                fallbackUsed: true,
                originalFormat: detectedFormat
            };
        }
    }
    
    console.warn(`❌ No suitable codec found for format: ${detectedFormat}`);
    return {
        format: null,
        success: false,
        detectionInfo,
        fallbackUsed: false,
        error: `No suitable codec found for format: ${detectedFormat}`
    };
}

/**
 * Get codec recommendations for a station (enhanced)
 * @param {Object} station - Station object with url and quality
 * @param {boolean} useMimeDetection - Whether to use MIME type detection
 * @returns {Promise<Object>} - Codec recommendations and info
 */
export async function getCodecInfo(station, useMimeDetection = false) {
    let detectedFormat;
    let detectionInfo = null;
    
    if (useMimeDetection) {
        // Use enhanced detection
        detectionInfo = await detectStreamFormatEnhanced(station.url, station.quality);
        detectedFormat = detectionInfo.finalFormat;
    } else {
        // Use pattern-based detection only (for backward compatibility)
        detectedFormat = detectStreamFormat(station.url, station.quality);
    }
    
    const isLoaded = loadedModules.has(detectedFormat);
    
    const result = {
        detectedFormat,
        isLoaded,
        moduleFile: CODEC_MODULES[detectedFormat],
        recommendations: getFormatRecommendations(detectedFormat),
        qualityInfo: parseQualityInfo(station.quality),
        detectionInfo
    };
    
    // Add enhanced metadata if available
    if (detectionInfo && detectionInfo.metadata) {
        result.enhancedMetadata = detectionInfo.metadata;
        result.confidence = detectionInfo.confidence;
        result.mimeType = detectionInfo.mimeTypeResult.mimeType;
    }
    
    return result;
}

/**
 * Get codec recommendations for a station (synchronous, pattern-based only)
 * @param {Object} station - Station object with url and quality  
 * @returns {Object} - Codec recommendations and info
 */
export function getCodecInfoSync(station) {
    const detectedFormat = detectStreamFormat(station.url, station.quality);
    const isLoaded = loadedModules.has(detectedFormat);
    
    return {
        detectedFormat,
        isLoaded,
        moduleFile: CODEC_MODULES[detectedFormat],
        recommendations: getFormatRecommendations(detectedFormat),
        qualityInfo: parseQualityInfo(station.quality)
    };
}

/**
 * Parse quality information from quality string
 * @param {string} quality - Quality description
 * @returns {Object} - Parsed quality info
 */
function parseQualityInfo(quality) {
    const qualityLower = quality.toLowerCase();
    
    // Extract bitrate
    const bitrateMatch = qualityLower.match(/(\d+)\s*kbps?/);
    const bitrate = bitrateMatch ? parseInt(bitrateMatch[1]) : null;
    
    // Detect lossless
    const isLossless = qualityLower.includes('flac') || qualityLower.includes('lossless');
    
    // Detect format
    let format = 'unknown';
    if (qualityLower.includes('mp3')) format = 'MP3';
    else if (qualityLower.includes('aac')) format = 'AAC';
    else if (qualityLower.includes('flac')) format = 'FLAC';
    else if (qualityLower.includes('opus')) format = 'Opus';
    else if (qualityLower.includes('ogg') || qualityLower.includes('vorbis')) format = 'OGG';
    
    return {
        format,
        bitrate,
        isLossless,
        originalQuality: quality
    };
}

/**
 * Get format-specific recommendations
 * @param {string} format - Format key
 * @returns {Object} - Format recommendations
 */
function getFormatRecommendations(format) {
    const recommendations = {
        'flac': {
            description: 'Lossless compression, best audio quality',
            pros: ['Highest quality', 'Lossless compression'],
            cons: ['Large bandwidth requirement', 'May not work on all devices']
        },
        'mpeg': {
            description: 'MP3 format, widely compatible',
            pros: ['Universal compatibility', 'Good compression', 'Stable streaming'],
            cons: ['Lossy compression', 'Lower quality than lossless']
        },
        'opus': {
            description: 'Modern codec, excellent quality at low bitrates',
            pros: ['Efficient compression', 'Low latency', 'Good quality'],
            cons: ['Limited browser support', 'Newer format']
        },
        'vorbis': {
            description: 'OGG Vorbis, open source codec',
            pros: ['Open source', 'Good compression', 'Free licensing'],
            cons: ['Less common', 'Variable browser support']
        },
        'aac': {
            description: 'Advanced Audio Coding, efficient compression',
            pros: ['Good quality', 'Efficient compression', 'Wide support'],
            cons: ['Patent restrictions', 'Complex licensing']
        }
    };
    
    return recommendations[format] || {
        description: 'Unknown format',
        pros: [],
        cons: ['Unknown compatibility']
    };
}

/**
 * Get status of all codec modules
 * @returns {Object} - Status of all modules
 */
export function getCodecStatus() {
    const status = {};
    
    for (const [format, moduleFile] of Object.entries(CODEC_MODULES)) {
        status[format] = {
            loaded: loadedModules.has(format),
            loading: loadingPromises.has(format),
            moduleFile
        };
    }
    
    return status;
}

/**
 * Initialize codec manager
 * @returns {Promise<void>}
 */
export async function initCodecManager() {
    console.log('🎵 Initializing Codec Manager...');
    
    // Preload common codecs
    await preloadCommonCodecs();
    
    console.log('✅ Codec Manager initialized');
    console.log('📊 Codec Status:', getCodecStatus());
}

/**
 * Clear MIME type cache
 */
export function clearMimeTypeCache() {
    mimeTypeCache.clear();
    console.log('🗑️ MIME type cache cleared');
}

/**
 * Get MIME type cache statistics
 * @returns {Object} - Cache statistics
 */
export function getMimeTypeCacheStats() {
    return {
        size: mimeTypeCache.size,
        entries: Array.from(mimeTypeCache.keys()),
        successfulDetections: Array.from(mimeTypeCache.values()).filter(v => v.detected).length,
        failedDetections: Array.from(mimeTypeCache.values()).filter(v => v.error).length
    };
}

/**
 * Preload MIME type detection for multiple stations
 * @param {Array} stations - Array of station objects
 * @param {number} concurrency - Number of concurrent requests
 * @returns {Promise<Object>} - Results summary
 */
export async function preloadStationMimeTypes(stations, concurrency = 3) {
    console.log(`🔍 Preloading MIME types for ${stations.length} stations...`);
    
    const results = {
        total: stations.length,
        successful: 0,
        failed: 0,
        details: []
    };
    
    // Process in batches to avoid overwhelming servers
    const batches = [];
    for (let i = 0; i < stations.length; i += concurrency) {
        batches.push(stations.slice(i, i + concurrency));
    }
    
    for (const batch of batches) {
        const batchPromises = batch.map(async (station) => {
            try {
                const mimeResult = await detectStreamMimeType(station.url, 3000); // Shorter timeout for preload
                const result = {
                    station: station.name,
                    url: station.url,
                    success: mimeResult.detected,
                    format: mimeResult.format,
                    mimeType: mimeResult.mimeType,
                    error: mimeResult.error
                };
                
                if (mimeResult.detected) {
                    results.successful++;
                } else {
                    results.failed++;
                }
                
                results.details.push(result);
                return result;
            } catch (error) {
                results.failed++;
                const result = {
                    station: station.name,
                    url: station.url,
                    success: false,
                    error: error.message
                };
                results.details.push(result);
                return result;
            }
        });
        
        await Promise.all(batchPromises);
        
        // Small delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log(`✅ MIME type preloading complete: ${results.successful}/${results.total} successful`);
    return results;
}
