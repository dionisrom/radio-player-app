// Bottom controls for mobile devices
// Provides mobile-friendly playback controls at the bottom of the screen

/**
 * Initialize bottom controls for mobile devices
 * @param {HTMLAudioElement} audioPlayer - The main audio player element
 */
export function initBottomControls(audioPlayer) {
    const bottomControls = document.getElementById('mobile-bottom-controls');
    if (!bottomControls) return;

    // Get control buttons
    const playPauseBtn = bottomControls.querySelector('#mobile-play-pause-btn');
    const playIcon = bottomControls.querySelector('#mobile-play-icon');
    const pauseIcon = bottomControls.querySelector('#mobile-pause-icon');
    const muteBtn = bottomControls.querySelector('#mobile-mute-btn');
    const volumeUpIcon = bottomControls.querySelector('#mobile-volume-up-icon');
    const volumeMuteIcon = bottomControls.querySelector('#mobile-volume-mute-icon');
    const favoriteBtn = bottomControls.querySelector('#mobile-favorite-btn');
    const equalizerBtn = bottomControls.querySelector('#mobile-equalizer-btn');
    const shareBtn = bottomControls.querySelector('#mobile-share-btn');

    // Set initial state based on audio player
    updateBottomControlsState();

    // Add event listeners
    playPauseBtn.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play().catch(error => {
                console.error('Error playing audio:', error);
            });
        } else {
            audioPlayer.pause();
        }
    });

    muteBtn.addEventListener('click', () => {
        audioPlayer.muted = !audioPlayer.muted;
        updateBottomControlsState();
    });

    // Match the desktop favorite button
    favoriteBtn.addEventListener('click', () => {
        const currentStation = document.querySelector('.station-item.active');
        if (currentStation) {
            const desktopFavBtn = currentStation.querySelector('.favorite-btn');
            if (desktopFavBtn) {
                desktopFavBtn.click();
                
                // Update favorite button state
                const isFavorite = desktopFavBtn.querySelector('.fa-star').classList.contains('fas');
                favoriteBtn.innerHTML = `<i class="fa-heart ${isFavorite ? 'fas' : 'far'}"></i>`;
                favoriteBtn.classList.toggle('active', isFavorite);
            }
        }
    });

    // Match the desktop equalizer button
    equalizerBtn.addEventListener('click', () => {
        const desktopEqBtn = document.getElementById('equalizer-btn');
        if (desktopEqBtn) {
            desktopEqBtn.click();
        }
    });

    // Share functionality
    shareBtn.addEventListener('click', () => {
        const currentStation = document.querySelector('.station-item.active');
        if (currentStation && navigator.share) {
            const stationName = currentStation.dataset.stationName;
            
            navigator.share({
                title: `Listen to ${stationName}`,
                text: `Check out ${stationName} on Hi-Fi Radio!`,
                url: window.location.href
            }).catch(error => {
                console.warn('Error sharing:', error);
            });
        }
    });

    // Update bottom controls when audio player state changes
    audioPlayer.addEventListener('play', updateBottomControlsState);
    audioPlayer.addEventListener('pause', updateBottomControlsState);
    audioPlayer.addEventListener('volumechange', updateBottomControlsState);

    // Also update when active station changes
    document.addEventListener('stationchange', () => {
        updateActiveStationDisplay();
    });

    // Update bottom controls state based on audio player
    function updateBottomControlsState() {
        if (!bottomControls) return;

        // Update play/pause button
        if (audioPlayer.paused) {
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            bottomControls.classList.remove('is-playing');
            bottomControls.classList.add('is-paused');
        } else {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            bottomControls.classList.add('is-playing');
            bottomControls.classList.remove('is-paused');
        }

        // Update mute button
        if (audioPlayer.muted) {
            volumeUpIcon.classList.add('hidden');
            volumeMuteIcon.classList.remove('hidden');
            bottomControls.classList.add('is-muted');
            bottomControls.classList.remove('is-unmuted');
        } else {
            volumeUpIcon.classList.remove('hidden');
            volumeMuteIcon.classList.add('hidden');
            bottomControls.classList.remove('is-muted');
            bottomControls.classList.add('is-unmuted');
        }

        // Update favorite button state
        updateActiveStationDisplay();
    }

    // Update favorite button based on active station
    function updateActiveStationDisplay() {
        const currentStation = document.querySelector('.station-item.active');
        if (currentStation && favoriteBtn) {
            const favoriteIcon = currentStation.querySelector('.favorite-star');
            if (favoriteIcon) {
                const isFavorite = favoriteIcon.classList.contains('fas');
                favoriteBtn.innerHTML = `<i class="fa-heart ${isFavorite ? 'fas' : 'far'}"></i>`;
                favoriteBtn.classList.toggle('active', isFavorite);
            }
        }
    }
}

/**
 * Update the bottom controls to reflect the current playback state
 * @param {boolean} isPlaying - Whether audio is currently playing
 */
export function updateBottomControlsPlayState(isPlaying) {
    const bottomControls = document.getElementById('mobile-bottom-controls');
    if (!bottomControls) return;

    const playIcon = bottomControls.querySelector('#mobile-play-icon');
    const pauseIcon = bottomControls.querySelector('#mobile-pause-icon');

    if (isPlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        bottomControls.classList.add('is-playing');
        bottomControls.classList.remove('is-paused');
    } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        bottomControls.classList.remove('is-playing');
        bottomControls.classList.add('is-paused');
    }
}

/**
 * Update the active station in bottom controls
 * @param {string} stationName - Name of the active station
 */
export function updateBottomControlsStation(stationName) {
    const bottomControls = document.getElementById('mobile-bottom-controls');
    if (!bottomControls) return;

    const favoriteBtn = bottomControls.querySelector('#mobile-favorite-btn');
    if (!favoriteBtn) return;

    const station = document.querySelector(`[data-station-name="${stationName}"]`);
    if (station) {
        const favoriteIcon = station.querySelector('.favorite-star');
        if (favoriteIcon) {
            const isFavorite = favoriteIcon.classList.contains('fas');
            favoriteBtn.innerHTML = `<i class="fa-heart ${isFavorite ? 'fas' : 'far'}"></i>`;
            favoriteBtn.classList.toggle('active', isFavorite);
        }
    }
}
