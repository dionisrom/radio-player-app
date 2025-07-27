// Audio player functionality
import { ERROR_MESSAGES } from './config.js';
import { memoryManager } from './memory-manager.js';
import { initializeEqualizer } from './equalizer.js';
import { getBestCodec, getCodecInfoSync } from './codec-manager.js';

let audioContext, analyser, sourceNode;
let metadataPlayer;
let currentStation = null;
let retryCount = 0;
let maxRetries = 3;
let retryDelay = 2000; // 2 seconds

// Error handling callbacks
let onErrorCallback = null;
let onRetryCallback = null;

export function initAudioContext(audioElement) {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        
        // Register audio context with memory manager
        memoryManager.addAudioContext(audioContext);
        
        // Note: The ScriptProcessorNode deprecation warning comes from the AnalyserNode
        // but AnalyserNode is still the standard way to get frequency data for visualizations
        sourceNode = audioContext.createMediaElementSource(audioElement);
        
        // Initialize equalizer - it will handle the audio routing
        initializeEqualizer(audioContext, sourceNode);
        
        // Connect analyser in parallel for visualization
        sourceNode.connect(analyser);
        
        console.log('Audio context and equalizer initialized successfully');
        return { audioContext, analyser, sourceNode };
    } catch (error) {
        console.error("Audio context initialization failed:", error);
        if (onErrorCallback) {
            onErrorCallback(ERROR_MESSAGES.AUDIO_CONTEXT_FAILED, error);
        }
        return null;
    }
}

/**
 * Test stream compatibility without full playback
 * @param {string} url - Stream URL
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} - Compatibility test result
 */
export async function testStreamCompatibility(url, timeout = 5000) {
    const result = {
        url,
        canPlay: false,
        format: null,
        browserSupport: {},
        error: null,
        testMethod: null
    };

    try {
        // First, get MIME type information
        const mimeResult = await import('./codec-manager.js').then(module => 
            module.detectStreamMimeType(url, 3000)
        );
        
        if (mimeResult.mimeType) {
            result.format = mimeResult.format;
            
            // Test browser support for the MIME type
            const testAudio = document.createElement('audio');
            const canPlayResult = testAudio.canPlayType(mimeResult.mimeType);
            
            result.browserSupport = {
                mimeType: mimeResult.mimeType,
                canPlayType: canPlayResult,
                mediaSourceSupport: window.MediaSource && MediaSource.isTypeSupported(mimeResult.mimeType),
                webAudioSupport: window.AudioContext !== undefined
            };
            
            if (canPlayResult === 'probably' || canPlayResult === 'maybe') {
                result.canPlay = true;
                result.testMethod = 'canPlayType';
                console.log(`✅ Stream should be playable (${canPlayResult})`);
                return result;
            }
        }
        
        // If canPlayType doesn't give us confidence, do a quick load test
        console.log('🔍 Performing quick load test...');
        
        const testResult = await performQuickLoadTest(url, timeout);
        result.canPlay = testResult.success;
        result.error = testResult.error;
        result.testMethod = 'loadTest';
        
        if (testResult.success) {
            console.log('✅ Quick load test successful');
        } else {
            console.log('❌ Quick load test failed:', testResult.error);
        }
        
    } catch (error) {
        result.error = error.message;
        console.warn('⚠️ Stream compatibility test failed:', error);
    }
    
    return result;
}

/**
 * Perform a quick load test without full playback
 * @param {string} url - Stream URL
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} - Test result
 */
async function performQuickLoadTest(url, timeout) {
    return new Promise((resolve) => {
        const testAudio = document.createElement('audio');
        testAudio.preload = 'metadata';
        testAudio.muted = true; // Ensure no sound during test
        
        let resolved = false;
        
        const cleanup = () => {
            if (!resolved) {
                resolved = true;
                testAudio.src = '';
                testAudio.remove();
            }
        };
        
        const timeoutId = setTimeout(() => {
            cleanup();
            resolve({ success: false, error: 'Load test timeout' });
        }, timeout);
        
        testAudio.addEventListener('loadedmetadata', () => {
            clearTimeout(timeoutId);
            cleanup();
            resolve({ success: true, error: null });
        });
        
        testAudio.addEventListener('canplay', () => {
            clearTimeout(timeoutId);
            cleanup();
            resolve({ success: true, error: null });
        });
        
        testAudio.addEventListener('error', (event) => {
            clearTimeout(timeoutId);
            cleanup();
            const error = testAudio.error;
            const errorMessage = error ? `Error code: ${error.code}` : 'Unknown error';
            resolve({ success: false, error: errorMessage });
        });
        
        // Start the test
        testAudio.src = url;
        testAudio.load();
    });
}

export function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

export function getAudioContext() {
    return audioContext;
}

export function getAnalyser() {
    return analyser;
}

export async function setupMetadata(station, audioElement, onMetadataUpdate) {
    if (metadataPlayer) {
        try {
            metadataPlayer.disconnect();
        } catch (error) {
            console.warn("Error disconnecting metadata player:", error);
        }
    }
    
    // Always provide fallback immediately - don't wait for metadata
    onMetadataUpdate(station.genre);
    
    // Get codec info for this station
    const codecInfo = getCodecInfoSync(station);
    console.log(`🎵 Station format info:`, codecInfo);
    
    // Get the best codec for this stream
    const codecResult = await getBestCodec(station.url, station.quality, true); // Use MIME detection
    if (!codecResult.success) {
        console.warn('❌ No suitable codec available for this stream format');
        console.log("Continuing without metadata parsing - using station genre");
        return;
    }
    
    const bestCodec = codecResult.format;
    console.log(`🎵 Using codec: ${bestCodec} for ${codecInfo.detectedFormat} stream`);
    
    // Log enhanced detection info if available
    if (codecResult.detectionInfo) {
        console.log('🔍 Enhanced detection details:', {
            confidence: codecResult.detectionInfo.confidence,
            mimeType: codecResult.detectionInfo.mimeTypeResult.mimeType,
            metadata: codecResult.detectionInfo.metadata
        });
    }
    
    if (typeof IcecastMetadataPlayer === 'undefined') {
        console.warn(ERROR_MESSAGES.METADATA_LIBRARY_MISSING);
        console.log("Continuing without metadata parsing - using station genre");
        return;
    }

    // Debug: Log how the library is exposed (only once to avoid spam)
    if (!window._metadataDebugLogged) {
        console.log('IcecastMetadataPlayer type:', typeof IcecastMetadataPlayer);
        console.log('IcecastMetadataPlayer.default type:', typeof IcecastMetadataPlayer.default);
        console.log('IcecastMetadataPlayer keys:', Object.keys(IcecastMetadataPlayer || {}));
        window._metadataDebugLogged = true;
    }

    // Try to set up metadata, but don't let it block audio playback
    setTimeout(() => {
        try {
            // Only set up metadata if audio is still playing and hasn't been changed
            if (audioElement.paused || audioElement.src !== station.url) {
                console.log('Audio state changed, skipping metadata setup');
                return;
            }

            // Try different ways the library might be exposed
            let Player;
            
            if (typeof IcecastMetadataPlayer !== 'undefined') {
                if (typeof IcecastMetadataPlayer.default === 'function') {
                    Player = IcecastMetadataPlayer.default;
                } else if (typeof IcecastMetadataPlayer === 'function') {
                    Player = IcecastMetadataPlayer;
                } else if (typeof IcecastMetadataPlayer.IcecastMetadataPlayer === 'function') {
                    Player = IcecastMetadataPlayer.IcecastMetadataPlayer;
                }
            }
            
            if (!Player) {
                throw new Error('IcecastMetadataPlayer constructor not found');
            }

            // IMPORTANT: Don't pass the audioElement to avoid conflicts
            // Let the metadata player create its own audio context
            metadataPlayer = new Player(station.url, {
                onMetadata: (metadata) => {
                    if (metadata && metadata.StreamTitle) {
                        console.log(`📻 Metadata received (${bestCodec}):`, metadata.StreamTitle);
                        onMetadataUpdate(metadata.StreamTitle);
                    }
                },
                onError: (error) => {
                    console.warn(`Metadata parsing error with ${bestCodec} (will use station info):`, error);
                    // Keep using station genre - don't update to error message
                },
                // Codec-specific options could be added here
                codec: bestCodec, // If the library supports codec specification
            });
            
            console.log(`Metadata player initialized successfully with ${bestCodec} codec (separate from main audio)`);
            
        } catch (error) {
            console.warn(`Failed to setup metadata player with ${bestCodec} (using fallback):`, error);
            // Continue using station genre as fallback
        }
    }, 2000); // Longer delay to ensure audio is stable
}

export async function playStation(station, audioElement) {
    console.log(`🎵 Starting playback for: ${station.name} (${station.url})`);
    console.log(`Audio element state - readyState: ${audioElement.readyState}, networkState: ${audioElement.networkState}, paused: ${audioElement.paused}`);
    
    currentStation = station;
    retryCount = 0; // Reset retry count for new station
    
    // Stop current playback and reset
    audioElement.pause();
    audioElement.currentTime = 0;
    
    // Get the best codec for this stream
    const codecResult = await getBestCodec(station.url, station.quality, true);
    if (!codecResult.success) {
        console.warn('❌ No suitable codec available, trying direct playback');
        return attemptDirectPlayback(audioElement, station);
    }
    
    const bestCodec = codecResult.format;
    console.log(`🎵 Using codec: ${bestCodec} for playback`);
    
    // Try codec-enhanced playback first, fall back to direct playback
    try {
        return await attemptCodecPlayback(audioElement, station, bestCodec, codecResult.detectionInfo);
    } catch (error) {
        console.warn(`⚠️ Codec playback failed, falling back to direct playback:`, error);
        return attemptDirectPlayback(audioElement, station);
    }
}

async function attemptCodecPlayback(audioElement, station, codec, detectionInfo) {
    console.log(`🎯 Attempting codec-enhanced playback with: ${codec}`);
    
    // For formats that HTML5 audio can handle directly, use direct playback
    const directPlaybackFormats = ['mpeg', 'aac'];
    if (directPlaybackFormats.includes(codec)) {
        console.log(`📻 Using direct HTML5 audio playback for ${codec}`);
        return attemptDirectPlayback(audioElement, station);
    }
    
    // For formats that need special handling (FLAC, Opus, Vorbis)
    const specialFormats = ['flac', 'opus', 'vorbis'];
    if (specialFormats.includes(codec)) {
        console.log(`🔧 Attempting special codec handling for ${codec}`);
        
        // Check if we can use MediaSource API
        if (window.MediaSource && MediaSource.isTypeSupported(`audio/${codec}`)) {
            console.log(`✅ MediaSource API supports ${codec}`);
            return attemptMediaSourcePlayback(audioElement, station, codec);
        } else {
            console.log(`⚠️ MediaSource API doesn't support ${codec}, trying direct playback`);
            return attemptDirectPlayback(audioElement, station);
        }
    }
    
    // Fallback to direct playback
    return attemptDirectPlayback(audioElement, station);
}

async function attemptMediaSourcePlayback(audioElement, station, codec) {
    return new Promise((resolve, reject) => {
        try {
            // Create MediaSource
            const mediaSource = new MediaSource();
            const url = URL.createObjectURL(mediaSource);
            
            audioElement.src = url;
            
            mediaSource.addEventListener('sourceopen', async () => {
                try {
                    // Create source buffer
                    const mimeType = `audio/${codec}`;
                    const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                    
                    // Fetch the stream
                    const response = await fetch(station.url);
                    const reader = response.body.getReader();
                    
                    // Read and append chunks
                    const pump = async () => {
                        const { done, value } = await reader.read();
                        
                        if (done) {
                            if (mediaSource.readyState === 'open') {
                                mediaSource.endOfStream();
                            }
                            return;
                        }
                        
                        if (sourceBuffer.updating) {
                            sourceBuffer.addEventListener('updateend', () => {
                                pump();
                            }, { once: true });
                        } else {
                            sourceBuffer.appendBuffer(value);
                            setTimeout(pump, 100); // Small delay to avoid overwhelming
                        }
                    };
                    
                    pump();
                    
                    // Start playback
                    audioElement.play().then(() => {
                        console.log('✅ MediaSource playback started successfully');
                        resolve();
                    }).catch(reject);
                    
                } catch (error) {
                    console.error('❌ MediaSource setup failed:', error);
                    reject(error);
                }
            });
            
            mediaSource.addEventListener('error', (error) => {
                console.error('❌ MediaSource error:', error);
                reject(error);
            });
            
        } catch (error) {
            console.error('❌ MediaSource creation failed:', error);
            reject(error);
        }
    });
}

function attemptDirectPlayback(audioElement, station) {
    // Set the source and load
    console.log('Setting new source and loading...');
    audioElement.src = station.url;
    audioElement.load(); // Force reload of the new source
    
    console.log(`After load - readyState: ${audioElement.readyState}, networkState: ${audioElement.networkState}`);
    
    // Dispatch loading event
    document.dispatchEvent(new CustomEvent('stationLoading', {
        detail: { stationName: station.name }
    }));
    
    return attemptPlayback(audioElement, station);
}

function attemptPlayback(audioElement, station) {
    // Wait a moment for the audio element to initialize with new source
    return new Promise((resolve, reject) => {
        const playWhenReady = () => {
            console.log(`🎮 Attempting to play - readyState: ${audioElement.readyState}, paused: ${audioElement.paused}`);
            audioElement.play()
                .then(() => {
                    console.log('✅ Playback started successfully');
                    console.log(`Final state - readyState: ${audioElement.readyState}, paused: ${audioElement.paused}, currentTime: ${audioElement.currentTime}`);
                    
                    // Dispatch loaded event
                    document.dispatchEvent(new CustomEvent('stationLoaded', {
                        detail: { stationName: station.name }
                    }));
                    
                    resolve();
                })
                .catch(error => {
                    console.error("❌ Playback failed:", error);
                    
                    const errorType = getAudioErrorType(error, audioElement);
                    
                    if (retryCount < maxRetries && shouldRetry(errorType)) {
                        retryCount++;
                        console.log(`🔄 Retrying playback (${retryCount}/${maxRetries}) in ${retryDelay}ms...`);
                        
                        if (onRetryCallback) {
                            onRetryCallback(retryCount, maxRetries, station);
                        }
                        
                        setTimeout(() => {
                            // Reload the source before retry
                            console.log('🔄 Reloading source before retry...');
                            audioElement.load();
                            setTimeout(() => {
                                attemptPlayback(audioElement, station)
                                    .then(resolve)
                                    .catch(reject);
                            }, 500); // Small delay after load
                        }, retryDelay);
                    } else {
                        // Max retries reached or non-retryable error
                        const userFriendlyMessage = getUserFriendlyErrorMessage(errorType);
                        if (onErrorCallback) {
                            onErrorCallback(userFriendlyMessage, error, station);
                        }
                        reject(new Error(userFriendlyMessage));
                    }
                });
        };
        
        // Check if audio is already ready to play
        if (audioElement.readyState >= 2) { // HAVE_CURRENT_DATA or higher
            console.log('🟢 Audio already ready, playing immediately');
            playWhenReady();
        } else {
            console.log('🟡 Audio not ready, waiting for canplay event...');
            // Wait for audio to be ready
            const onCanPlay = () => {
                console.log('🟢 Received canplay event');
                audioElement.removeEventListener('canplay', onCanPlay);
                audioElement.removeEventListener('error', onError);
                audioElement.removeEventListener('loadeddata', onLoadedData);
                playWhenReady();
            };
            
            const onLoadedData = () => {
                console.log('🟢 Received loadeddata event');
                audioElement.removeEventListener('canplay', onCanPlay);
                audioElement.removeEventListener('error', onError);
                audioElement.removeEventListener('loadeddata', onLoadedData);
                playWhenReady();
            };
            
            const onError = (event) => {
                console.error('🔴 Audio loading error event:', event);
                audioElement.removeEventListener('canplay', onCanPlay);
                audioElement.removeEventListener('error', onError);
                audioElement.removeEventListener('loadeddata', onLoadedData);
                
                const error = audioElement.error || new Error('Audio loading failed');
                const errorType = getAudioErrorType(error, audioElement);
                
                if (retryCount < maxRetries && shouldRetry(errorType)) {
                    retryCount++;
                    console.log(`🔄 Retrying after load error (${retryCount}/${maxRetries})`);
                    
                    setTimeout(() => {
                        audioElement.load();
                        setTimeout(() => {
                            attemptPlayback(audioElement, station)
                                .then(resolve)
                                .catch(reject);
                        }, 500);
                    }, retryDelay);
                } else {
                    const userFriendlyMessage = getUserFriendlyErrorMessage(errorType);
                    if (onErrorCallback) {
                        onErrorCallback(userFriendlyMessage, error, station);
                    }
                    reject(new Error(userFriendlyMessage));
                }
            };
            
            audioElement.addEventListener('canplay', onCanPlay);
            audioElement.addEventListener('loadeddata', onLoadedData); // Sometimes this fires before canplay
            audioElement.addEventListener('error', onError);
            
            // Set a timeout to prevent infinite waiting
            setTimeout(() => {
                if (audioElement.readyState < 2) {
                    console.warn('⚠️ Audio loading timeout - attempting to play anyway');
                    audioElement.removeEventListener('canplay', onCanPlay);
                    audioElement.removeEventListener('error', onError);
                    audioElement.removeEventListener('loadeddata', onLoadedData);
                    playWhenReady();
                }
            }, 10000); // 10 second timeout
        }
    });
}

function getAudioErrorType(playbackError, audioElement) {
    // Check for HTML5 audio errors
    if (audioElement.error) {
        switch (audioElement.error.code) {
            case audioElement.error.MEDIA_ERR_ABORTED:
                return 'ABORTED';
            case audioElement.error.MEDIA_ERR_NETWORK:
                return 'NETWORK';
            case audioElement.error.MEDIA_ERR_DECODE:
                return 'DECODE';
            case audioElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                return 'UNSUPPORTED';
            default:
                return 'UNKNOWN';
        }
    }
    
    // Check for common playback errors
    if (playbackError) {
        const errorMessage = playbackError.message.toLowerCase();
        
        if (playbackError.name === 'NotSupportedError') {
            return 'UNSUPPORTED';
        } else if (playbackError.name === 'NotAllowedError') {
            return 'NOT_ALLOWED';
        } else if (playbackError.name === 'AbortError') {
            return 'ABORTED';
        } else if (errorMessage.includes('cors') || errorMessage.includes('cross-origin')) {
            return 'CORS';
        } else if (errorMessage.includes('codec') || errorMessage.includes('source')) {
            return 'CODEC';
        } else if (errorMessage.includes('network')) {
            return 'NETWORK';
        } else {
            return 'UNKNOWN';
        }
    }
    
    return 'UNKNOWN';
}

function shouldRetry(errorType) {
    // Only retry for network-related errors
    return ['NETWORK', 'ABORTED'].includes(errorType);
}

function getUserFriendlyErrorMessage(errorType) {
    const messages = {
        'NETWORK': 'Network error: Unable to connect to the radio station. Please check your internet connection.',
        'UNSUPPORTED': 'Format not supported: This audio format is not supported by your browser. Try a different station or update your browser.',
        'DECODE': 'Audio decoding error: The audio stream could not be decoded. This may be a codec compatibility issue.',
        'NOT_ALLOWED': 'Playback blocked: Please click the play button to start audio.',
        'ABORTED': 'Playback was interrupted. Please try again.',
        'CORS': '🚫 CORS Blocked: This station blocks web browser access due to server security settings. This is not an issue with your setup. Try:\n• Using the station\'s official mobile app\n• Trying a different browser\n• Selecting a station with better web compatibility (look for 🟢 indicators)',
        'CODEC': 'Codec error: Unable to load the required audio codec for this stream format.',
        'UNKNOWN': 'An unknown error occurred while trying to play the station.'
    };
    
    return messages[errorType] || messages['UNKNOWN'];
}

// Callback setters
export function setErrorCallback(callback) {
    onErrorCallback = callback;
}

export function setRetryCallback(callback) {
    onRetryCallback = callback;
}

// Connection timeout handling
export function addConnectionTimeout(audioElement, timeoutMs = 15000) {
    let timeoutId;
    
    const clearExistingTimeout = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };
    
    // Set timeout when loading starts
    memoryManager.addEventListener(audioElement, 'loadstart', () => {
        clearExistingTimeout();
        timeoutId = setTimeout(() => {
            if (audioElement.readyState < 2) { // HAVE_CURRENT_DATA
                audioElement.src = ''; // Stop loading
                const error = new Error('Connection timeout');
                if (onErrorCallback) {
                    onErrorCallback('Connection timeout: The station is taking too long to respond.', error);
                }
            }
        }, timeoutMs);
        
        // Register timeout with memory manager
        memoryManager.addTimeout(timeoutId);
    });
    
    // Clear timeout when data starts loading or playback begins
    memoryManager.addEventListener(audioElement, 'loadeddata', clearExistingTimeout);
    memoryManager.addEventListener(audioElement, 'canplay', clearExistingTimeout);
    memoryManager.addEventListener(audioElement, 'playing', clearExistingTimeout);
    
    // Add buffering event listeners
    memoryManager.addEventListener(audioElement, 'waiting', () => {
        console.log('Audio waiting for more data - buffering');
        // Dispatch buffering event when waiting for data
        document.dispatchEvent(new CustomEvent('stationBuffering', {
            detail: { reason: 'Buffering' }
        }));
    });
    
    memoryManager.addEventListener(audioElement, 'playing', () => {
        console.log('Audio resumed after buffering');
        // Dispatch resumed event when playback resumes after buffering
        document.dispatchEvent(new CustomEvent('stationResumed'));
    });
    
    memoryManager.addEventListener(audioElement, 'stalled', () => {
        console.log('Audio download stalled');
        // Dispatch buffering event with stalled reason
        document.dispatchEvent(new CustomEvent('stationBuffering', {
            detail: { reason: 'Connection stalled' }
        }));
    });
}

// Offline mode detection
export function addOfflineDetection(onOffline, onOnline) {
    window.addEventListener('offline', () => {
        console.log('Connection lost');
        if (onOffline) {
            onOffline();
        }
    });

    window.addEventListener('online', () => {
        console.log('Connection restored');
        if (onOnline) {
            onOnline();
        }
    });
}

// Stream quality monitoring
export function addStreamQualityMonitoring(audioElement, onQualityChange) {
    let lastBitrate = null;
    let lastBufferHealth = null;
    
    const checkQuality = () => {
        if (audioElement.buffered.length > 0) {
            const bufferEnd = audioElement.buffered.end(audioElement.buffered.length - 1);
            const currentTime = audioElement.currentTime;
            const bufferHealth = bufferEnd - currentTime;
            
            // Monitor buffer health
            if (lastBufferHealth !== null) {
                const healthChange = bufferHealth - lastBufferHealth;
                if (bufferHealth < 2 && healthChange < 0) {
                    // Poor connection detected
                    if (onQualityChange) {
                        onQualityChange('poor', bufferHealth);
                    }
                } else if (bufferHealth > 5) {
                    // Good connection
                    if (onQualityChange) {
                        onQualityChange('good', bufferHealth);
                    }
                }
            }
            
            lastBufferHealth = bufferHealth;
        }
    };
    
    // Check quality every 5 seconds during playback
    const qualityCheckInterval = setInterval(() => {
        if (!audioElement.paused && !audioElement.ended) {
            checkQuality();
        }
    }, 5000);
    
    // Clean up interval when audio element is removed or playback ends
    audioElement.addEventListener('ended', () => {
        clearInterval(qualityCheckInterval);
    });
    
    return qualityCheckInterval;
}

export function getCurrentStation() {
    return currentStation;
}

export function getStreamCodecInfo(station) {
    if (!station) return null;
    return getCodecInfoSync(station);
}
