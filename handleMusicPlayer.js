let currentlyPlaying = null;
let playlist = [];
let currentTrackIndex = -1;
let audioElement = null;
let playPromise = null; // keep track of the last play() promise


// Initialize the music player
function initializeMusicPlayer() {
    audioElement = new Audio();
    // Audio events
    audioElement.addEventListener("ended", handleAudioEnded);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("loadedmetadata", updateTimeLabels);
    
    setupNowPlayingEvents();
}

// Setup Now Playing bar events
function setupNowPlayingEvents() {
    document.getElementById("nowPlayingPlayPause")?.addEventListener("click", toggleNowPlaying);
    document.getElementById("nowPlayingPrev")?.addEventListener("click", playPreviousTrack);
    document.getElementById("nowPlayingNext")?.addEventListener("click", playNextTrack);
    
    const seekbar = document.getElementById("seekbar");
    seekbar?.addEventListener("input", () => {
        if (!audioElement.duration) return;
        const seekTo = (seekbar.value / 100) * audioElement.duration;
        audioElement.currentTime = seekTo;
        updateTimeLabels();
    });
}

// Update seekbar and time labels
function handleTimeUpdate() {
    if (!audioElement.duration) return;
    const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
    document.getElementById("seekbar").value = progressPercent;
    updateTimeLabels();
}

function updateTimeLabels() {
    const currentTimeLabel = document.getElementById("nowPlayingCurrentTime");
    const durationLabel = document.getElementById("nowPlayingDuration");
    if (currentTimeLabel) currentTimeLabel.textContent = formatTime(audioElement.currentTime);
    if (durationLabel) durationLabel.textContent = formatTime(audioElement.duration);
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
}

// Play/Pause logic
function togglePreview(trackId, url, trackName, siteName) {
    if (currentlyPlaying === trackId) {
        if (isPlaying()) pauseAudio();
        else playAudio(trackId, url, trackName, siteName);
    } else {
        playAudio(trackId, url, trackName, siteName);
    }
}

async function playAudio(trackId, url, trackName, siteName) {
    if (!url) return console.error("Invalid audio URL");
    
    if (currentlyPlaying && currentlyPlaying !== trackId) {
        updateCardUI(currentlyPlaying, false);
        audioElement.pause();
        audioElement.currentTime = 0;
    }
    
    currentlyPlaying = trackId;
    audioElement.src = url;
    
    // Cancel any pending playPromise
    if (playPromise) {
        try {
            await playPromise;
        } catch (_) {
            // ignore errors from previous play
        }
    }
    
    try {
        playPromise = audioElement.play();
        await playPromise; // wait for play to actually start
        updateCardUI(trackId, true);
        updateNowPlayingBar(true, trackName, siteName);
        currentTrackIndex = playlist.findIndex(track => extractTrackId(track.url) === trackId);
    } catch (err) {
        console.error("Error playing audio:", err);
        updateCardUI(trackId, false);
    } finally {
        playPromise = null;
    }
}

// Update individual track card UI
function updateCardUI(trackId, playing) {
    const icon = document.getElementById(`play-icon-${trackId}`);
    const text = document.getElementById(`play-text-${trackId}`);
    const card = document.getElementById(`card-${trackId}`);
    
    if (playing) {
        icon && (icon.className = "fas fa-pause");
        text && (text.textContent = "Pause");
        card && card.classList.add("playing");
        document.getElementById("nowPlayingAnimation")?.classList.remove("paused");
    } else {
        icon && (icon.className = "fas fa-play");
        text && (text.textContent = "Play");
        card && card.classList.remove("playing");
        document.getElementById("nowPlayingAnimation")?.classList.add("paused");
    }
}

// Update Now Playing bar
function updateNowPlayingBar(playing, trackName = "", siteName = "") {
    const bar = document.getElementById("nowPlaying");
    const animation = document.getElementById("nowPlayingAnimation");
    const icon = document.getElementById("nowPlayingIcon");
    const title = document.getElementById("nowPlayingTitle");
    const site = document.getElementById("nowPlayingSite");
    
    // Always show the bar if a track is selected
    if (currentlyPlaying) {
        bar?.classList.remove("hidden");
        title && (title.textContent = trackName || title.textContent);
        site && (site.textContent = siteName || site.textContent);
        
        if (playing) {
            icon && (icon.className = "fas fa-pause");
            animation?.classList.remove("paused");
        } else {
            icon && (icon.className = "fas fa-play");
            animation?.classList.add("paused"); // freeze wave
        }
    } else {
        // Hide bar only if no track is selected
        bar?.classList.add("hidden");
    }
}
// Toggle play/pause from Now Playing bar
function pauseAudio() {
    if (audioElement) {
        audioElement.pause();
        updateNowPlayingBar(false);
        if (currentlyPlaying) updateCardUI(currentlyPlaying, false);
    }
}

function toggleNowPlaying() {
    if (!currentlyPlaying || !audioElement) return;
    
    if (audioElement.paused) {
        audioElement.play().then(() => {
            updateCardUI(currentlyPlaying, true);
            updateNowPlayingBar(true);
        }).catch(err => console.error(err));
    } else {
        pauseAudio(); // ensure pauseAudio exists in same scope
    }
}

// Track navigation
function playPreviousTrack() {
    if (!playlist.length) return;
    currentTrackIndex = (currentTrackIndex <= 0) ? playlist.length - 1 : currentTrackIndex - 1;
    playTrackByIndex(currentTrackIndex);
}

function playNextTrack() {
    if (!playlist.length) return;
    currentTrackIndex = (currentTrackIndex >= playlist.length - 1) ? 0 : currentTrackIndex + 1;
    playTrackByIndex(currentTrackIndex);
}

function playTrackByIndex(index) {
    const track = playlist[index];
    if (!track) return;
    const trackId = extractTrackId(track.url);
    const trackName = extractTrackName(track.url);
    const siteName = document.getElementById("siteSelector")?.value;
    const downloadUrl = `https://${currentData.metadata.domain}/files/download/id/${trackId}`;
    playAudio(trackId, downloadUrl, trackName, siteName);
    currentTrackIndex = index;
}

// Playlist management
function setPlaylist(newPlaylist) {
    playlist = newPlaylist;
    currentTrackIndex = -1;
}

function handleAudioEnded() {
    updateCardUI(currentlyPlaying, false);
    playNextTrack();
}

// Audio state helpers
function isPlaying() {
    return audioElement && !audioElement.paused;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    initializeMusicPlayer();
});