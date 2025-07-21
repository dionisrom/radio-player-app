// Stream compatibility testing utility
import { getCodecInfoSync } from './codec-manager.js';

// Cache for test results
const compatibilityCache = new Map();

/**
 * Test if a stream format is likely to be supported by the current browser
 * @param {Object} station - Station object
 * @returns {Object} - Compatibility assessment
 */
export function assessStreamCompatibility(station) {
    const cacheKey = `${station.url}-${station.quality}`;
    
    if (compatibilityCache.has(cacheKey)) {
        return compatibilityCache.get(cacheKey);
    }
    
    const codecInfo = getCodecInfoSync(station);
    const testAudio = document.createElement('audio');
    
    const result = {
        station: station.name,
        format: codecInfo.detectedFormat,
        formatDisplay: codecInfo.qualityInfo.format || codecInfo.detectedFormat.toUpperCase(),
        compatibility: 'unknown',
        confidence: 'low',
        canPlayResult: '',
        browserSupport: {},
        recommendations: []
    };
    
    // Test basic browser support based on format
    switch (codecInfo.detectedFormat) {
        case 'mpeg':
            // MP3 - universally supported
            result.compatibility = 'excellent';
            result.confidence = 'high';
            result.canPlayResult = 'probably';
            result.recommendations.push('✅ Excellent compatibility - works on all browsers');
            break;
            
        case 'aac':
            // AAC - well supported
            const aacSupport = testAudio.canPlayType('audio/aac') || testAudio.canPlayType('audio/mp4');
            if (aacSupport === 'probably' || aacSupport === 'maybe') {
                result.compatibility = 'good';
                result.confidence = 'medium';
                result.canPlayResult = aacSupport;
                result.recommendations.push('✅ Good compatibility - works on most modern browsers');
            } else {
                result.compatibility = 'limited';
                result.confidence = 'medium';
                result.recommendations.push('⚠️ Limited AAC support - may not work on older browsers');
            }
            break;
            
        case 'flac':
            // FLAC - limited browser support
            const flacSupport = testAudio.canPlayType('audio/flac');
            if (flacSupport === 'probably' || flacSupport === 'maybe') {
                result.compatibility = 'good';
                result.confidence = 'medium';
                result.canPlayResult = flacSupport;
                result.recommendations.push('🎵 High quality FLAC - supported by your browser');
            } else {
                result.compatibility = 'poor';
                result.confidence = 'high';
                result.recommendations.push('❌ FLAC not supported - try Chrome/Edge or select MP3 stations');
                result.recommendations.push('💡 Tip: Look for stations with MP3 format instead');
            }
            break;
            
        case 'opus':
            // Opus - modern codec with growing support
            const opusSupport = testAudio.canPlayType('audio/opus') || testAudio.canPlayType('audio/webm; codecs="opus"');
            if (opusSupport === 'probably' || opusSupport === 'maybe') {
                result.compatibility = 'good';
                result.confidence = 'medium';
                result.canPlayResult = opusSupport;
                result.recommendations.push('🔊 Modern Opus codec - supported by your browser');
            } else {
                result.compatibility = 'limited';
                result.confidence = 'medium';
                result.recommendations.push('⚠️ Opus limited support - may not work on all browsers');
            }
            break;
            
        case 'vorbis':
            // OGG Vorbis - variable support
            const vorbisSupport = testAudio.canPlayType('audio/ogg; codecs="vorbis"');
            if (vorbisSupport === 'probably' || vorbisSupport === 'maybe') {
                result.compatibility = 'fair';
                result.confidence = 'medium';
                result.canPlayResult = vorbisSupport;
                result.recommendations.push('🎼 OGG Vorbis - supported by your browser');
            } else {
                result.compatibility = 'limited';
                result.confidence = 'medium';
                result.recommendations.push('⚠️ OGG Vorbis limited support - try Firefox or Chrome');
            }
            break;
            
        default:
            result.compatibility = 'unknown';
            result.recommendations.push('❓ Unknown format - compatibility uncertain');
    }
    
    // Additional browser capability checks
    result.browserSupport = {
        mediaSource: window.MediaSource !== undefined,
        webAudio: window.AudioContext !== undefined,
        serviceWorker: 'serviceWorker' in navigator
    };
    
    // Test for CORS issues (async, non-blocking)
    testCORSAccess(station.url)
        .then(corsTest => {
            if (!corsTest.allowed && corsTest.isCORSError) {
                // Update cached result with CORS info
                const updatedResult = { ...result };
                updatedResult.compatibility = 'cors';
                updatedResult.confidence = 'high';
                updatedResult.recommendations = ['🚫 CORS blocked - station blocks web browser access', '💡 Try using a different browser or the station\'s mobile app'];
                compatibilityCache.set(cacheKey, updatedResult);
                
                // Trigger a UI refresh if needed
                console.log(`🚫 CORS detected for ${station.name}`);
            }
        })
        .catch(error => {
            // CORS test failed, but don't change the overall assessment
            console.warn('CORS test failed for', station.name, error);
        });
    
    // Cache the result
    compatibilityCache.set(cacheKey, result);
    
    return result;
}

/**
 * Test CORS access to a stream URL
 * @param {string} url - Stream URL
 * @returns {Promise<Object>} - CORS test result
 */
async function testCORSAccess(url, timeout = 3000) {
    return new Promise((resolve) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            resolve({ allowed: false, error: 'timeout' });
        }, timeout);

        fetch(url, { 
            method: 'HEAD',
            mode: 'cors',
            signal: controller.signal
        })
        .then(response => {
            clearTimeout(timeoutId);
            resolve({ allowed: true, status: response.status });
        })
        .catch(error => {
            clearTimeout(timeoutId);
            const isCORSError = error.message.includes('CORS') || 
                               error.message.includes('Access-Control-Allow-Origin') ||
                               error.name === 'TypeError';
            resolve({ 
                allowed: !isCORSError, 
                error: error.message,
                isCORSError 
            });
        });
    });
}

/**
 * Get compatibility icon and color for display
 * @param {string} compatibility - Compatibility level
 * @returns {Object} - Icon and color info
 */
export function getCompatibilityDisplay(compatibility) {
    const displays = {
        'excellent': { 
            icon: '🟢', 
            color: 'text-green-500', 
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            title: 'Excellent compatibility' 
        },
        'good': { 
            icon: '🟡', 
            color: 'text-yellow-500', 
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
            title: 'Good compatibility' 
        },
        'fair': { 
            icon: '🟠', 
            color: 'text-orange-500', 
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            title: 'Fair compatibility' 
        },
        'limited': { 
            icon: '🔴', 
            color: 'text-red-500', 
            bgColor: 'bg-red-100 dark:bg-red-900/20',
            title: 'Limited compatibility' 
        },
        'poor': { 
            icon: '❌', 
            color: 'text-red-600', 
            bgColor: 'bg-red-100 dark:bg-red-900/20',
            title: 'Poor compatibility - may not work' 
        },
        'cors': {
            icon: '🚫',
            color: 'text-red-700',
            bgColor: 'bg-red-200 dark:bg-red-800/30',
            title: 'CORS blocked - server blocks web access'
        },
        'unknown': { 
            icon: '❓', 
            color: 'text-gray-500', 
            bgColor: 'bg-gray-100 dark:bg-gray-900/20',
            title: 'Unknown compatibility' 
        }
    };
    
    return displays[compatibility] || displays['unknown'];
}

/**
 * Batch test multiple stations
 * @param {Array} stations - Array of station objects
 * @returns {Object} - Summary of compatibility results
 */
export function batchAssessCompatibility(stations) {
    const results = {
        total: stations.length,
        excellent: 0,
        good: 0,
        fair: 0,
        limited: 0,
        poor: 0,
        cors: 0,
        unknown: 0,
        details: []
    };
    
    stations.forEach(station => {
        const assessment = assessStreamCompatibility(station);
        results.details.push(assessment);
        results[assessment.compatibility]++;
    });
    
    console.log('🎵 Stream Compatibility Assessment:', {
        compatible: results.excellent + results.good,
        problematic: results.limited + results.poor + results.cors,
        corsBlocked: results.cors,
        total: results.total
    });
    
    return results;
}

/**
 * Clear compatibility cache
 */
export function clearCompatibilityCache() {
    compatibilityCache.clear();
    console.log('🗑️ Compatibility cache cleared');
}

/**
 * Get cache statistics
 */
export function getCompatibilityCacheStats() {
    return {
        size: compatibilityCache.size,
        entries: Array.from(compatibilityCache.keys())
    };
}
