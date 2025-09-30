// app.js
let API_BASE = 'https://odia-dj.priyabrataghadai383.workers.dev/api'; // Alternate Server: https://odia-dj-music.onrender.com
let currentData = null;
let currentMode = 'browse';

// Server selector change
document.getElementById('serverSelector').addEventListener('change', (e) => {
    API_BASE = e.target.value; // update API base dynamically
    if (currentMode === 'search' && document.getElementById('searchInput').value.trim()) {
        loadSearchData(document.getElementById('searchInput').value.trim(), 1);
    } else {
        loadBrowseData(1);
    }
});

// Load initial browse data
window.addEventListener('DOMContentLoaded', () => {
    initializeMusicPlayer();
    loadBrowseData();
    setupEventListeners();
});

function setupEventListeners() {
    // Min score slider
    document.getElementById('minScore').addEventListener('input', (e) => {
        document.getElementById('minScoreValue').textContent = e.target.value;
    });
    
    // Random track button
    document.getElementById('randomBtn').addEventListener('click', loadRandomTrack);
    
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', () => {
        const query = document.getElementById('searchInput').value.trim();
        if (query) {
            currentMode = 'search';
            loadSearchData(query, 1);
        } else {
            currentMode = 'browse';
            loadBrowseData(1);
        }
    });
    
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });
    
    // Site selector change
    document.getElementById('siteSelector').addEventListener('change', () => {
        if (currentMode === 'search' && document.getElementById('searchInput').value.trim()) {
            loadSearchData(document.getElementById('searchInput').value.trim(), 1);
        } else {
            loadBrowseData(1);
        }
    });
}

function cleanForJavascript(str) {
    return str
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

function extractTrackId(url) {
    const match = url.match(/\/download\/(\d+)\//);
    return match ? match[1] : null;
}

function extractTrackName(url) {
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1].replace('.html', '');
    
    try {
        // Decode URL-encoded characters
        let cleanedName = decodeURIComponent(lastPart);
        
        // Replace all URL-encoded spaces and special characters
        cleanedName = cleanedName
            .replace(/%E2%80%86/g, ' ') // Special space
            .replace(/%E2%80%87/g, ' ') // Figure space
            .replace(/%E2%80%88/g, ' ') // Punctuation space
            .replace(/%E2%80%89/g, ' ') // Thin space
            .replace(/%E2%80%8A/g, ' ') // Hair space
            .replace(/%E2%80%8B/g, '') // Zero-width space
            .replace(/%E2%80%8C/g, '') // Zero-width non-joiner
            .replace(/%E2%80%8D/g, '') // Zero-width joiner
            .replace(/%E2%80%8E/g, '') // Left-to-right mark
            .replace(/%E2%80%8F/g, '') // Right-to-left mark
            .replace(/%E2%81%A0/g, '') // Word joiner
            .replace(/%20/g, ' ') // Regular space
            .replace(/%C2%A0/g, ' ') // Non-breaking space
            .replace(/\+/g, ' ') // Plus sign as space
            .replace(/\s+/g, ' ') // Multiple spaces to single space
            .trim();
        
        // Split by hyphens and format
        const words = cleanedName.split('-');
        const formattedName = words.map(word => {
            const trimmedWord = word.trim();
            if (!trimmedWord) return '';
            
            // Capitalize first letter, keep rest as is
            return trimmedWord.charAt(0).toUpperCase() + trimmedWord.slice(1);
        }).filter(word => word !== '').join(' ');
        
        return formattedName || 'Unknown Track';
    } catch (error) {
        // Fallback if decoding fails
        console.error('Error decoding track name:', error);
        return lastPart.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ') || 'Unknown Track';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function updateStats(data) {
    try {
        // Safely access nested properties with fallbacks
        const pagination = data?.pagination || {};
        const metadata = data?.metadata || {};
        
        const total = pagination.total || 0;
        const page = pagination.page || 1;
        const limit = pagination.limit || 20;
        
        
        // Update pagination info
        const start = ((page - 1) * limit) + 1;
        const end = Math.min(page * limit, total);
        
        
        
    } catch (error) {
        console.error('Error updating stats:', error);
        // Set default values if there's an error
        //setDefaultStats();
    }
    
    
    
}

// Helper function to safely update element text
function updateElementText(elementId, value) {
    try {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = formatNumber(value);
        }
    } catch (error) {
        console.error(`Error updating element ${elementId}:`, error);
    }
}

// Helper function to format numbers
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    return num.toLocaleString();
}

// Set default stats in case of error
function setDefaultStats() {
    const defaultStats = {
        totalTracks: '0',
        totalTracksHeader: '0',
        currentPage: '1',
        totalPages: '0',
        domainEntries: '0'
    };
    
    Object.keys(defaultStats).forEach(key => {
        updateElementText(key, defaultStats[key]);
    });
}

async function loadRandomTrack() {
    showLoading();
    const site = document.getElementById('siteSelector').value;
    
    try {
        const response = await fetch(`${API_BASE}/browse?site=${site}&page=1&limit=100`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.data.length);
            const randomTrack = data.data[randomIndex];
            
            // Display only the random track
            currentData = {
                ...data,
                data: [randomTrack]
            };
            setPlaylist([randomTrack]);
            displayResults(currentData);
            
            document.getElementById('pagination').classList.add('hidden');
            
            // Auto-play the random track safely
            const trackId = extractTrackId(randomTrack.url);
            const trackName = extractTrackName(randomTrack.url);
            const downloadUrl = `https://${data.metadata.domain}/files/download/id/${trackId}`;
            
            Play(trackId, downloadUrl, trackName, site);
        }
    } catch (error) {
        showError('Failed to load random track. Make sure the API is running.');
        console.error(error);
    }
}
async function loadBrowseData(page = 1) {
    // Smooth scroll to top
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
    showLoading();
    const site = document.getElementById('siteSelector').value;
    const limit = document.getElementById('limitSelector').value;
    
    try {
        const response = await fetch(`${API_BASE}/browse?site=${site}&page=${page}&limit=${limit}`);
        const data = await response.json();
        
        if (data.success) {
            currentData = data;
            setPlaylist(data.data);
            displayResults(data);
            updateStats(data);
            setupPagination(data.pagination, page);
        }
    } catch (error) {
        showError('Failed to load data. Make sure the API is running.');
    }
}

async function loadSearchData(query, page = 1) {
    // Smooth scroll to top
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
    showLoading();
    const site = document.getElementById('siteSelector').value;
    const limit = document.getElementById('limitSelector').value;
    const minScore = document.getElementById('minScore').value;
    
    try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&site=${site}&page=${page}&limit=${limit}&min_score=${minScore}`);
        const data = await response.json();
        
        if (data.success) {
            currentData = data;
            setPlaylist(data.data);
            displayResults(data);
            updateStats(data);
            setupPagination(data.pagination, page);
        }
    } catch (error) {
        showError('Failed to search. Make sure the API is running.');
    }
}

function displayResults(data) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';
    
    if (!data.data || data.data.length === 0) {
        container.innerHTML = `
        
            <div class="col-span-3 bg-dark-300 rounded-2xl p-12 text-center border border-gray-700">
                <i class="fas fa-music text-5xl text-gray-500 mb-4"></i>
                <p class="text-2xl text-gray-400">No tracks found</p>
                <p class="text-gray-500 mt-2">Try adjusting your search criteria or browse a different site</p>
            </div>
            
        `;
        return;
    }
    
    data.data.forEach((track, index) => {
        const trackId = extractTrackId(track.url);
        const trackName = extractTrackName(track.url);
        const downloadUrl = trackId ? `https://${data.metadata.domain}/files/download/id/${trackId}` : '#';
        const isPlaying = currentlyPlaying === trackId;
        
        const card = document.createElement('div');
        card.className = `bg-dark-300 rounded-2xl shadow-lg p-6 border border-gray-700 hover:border-indigo-400 transition ${isPlaying ? 'border-indigo-500' : ''}`;
        card.id = `card-${trackId}`;
        
        card.innerHTML = `
            <div class="flex flex-col h-full">
                <div class="flex items-start gap-3 mb-4">
                    <span class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        ${(data.pagination.page - 1) * data.pagination.limit + index + 1}
                    </span>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-semibold text-white line-clamp-2 break-words" title="${trackName}">${trackName}</h3>
                    </div>
                </div>
                
                <div class="space-y-2 text-sm mb-4 flex-1">
                    <p class="text-gray-400 flex items-center">
                        <i class="fas fa-calendar-alt mr-2 text-indigo-400 flex-shrink-0"></i>
                        <span class="font-semibold">Upload :</span> 
                        <span class="ml-1">${formatDate(track.last_modified)}</span>
                    </p>
                    <p class="text-gray-400 flex items-center">
                        <i class="fas fa-database mr-2 text-blue-400 flex-shrink-0"></i>
                        <span class="font-semibold">From :</span> 
                        <span class="ml-1 truncate">${data.metadata.domain}</span>
                    </p>
                </div>
                
                <div class="flex gap-2 pt-4">
                    ${trackId ? `
                        <button onclick="togglePreview('${trackId}', '${downloadUrl}', '${cleanForJavascript(trackName)}', '${data.metadata.domain}')" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2">
                            <i class="fas fa-play" id="play-icon-${trackId}"></i>
                            <span id="play-text-${trackId}">Play</span>
                        </button>
                    ` : ''}
                    ${trackId ? `
                        <a href="${downloadUrl}" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition text-center flex items-center justify-center gap-2" target="_blank">
                            <i class="fas fa-download"></i>
                            <span>Download</span>
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
        
        
        
        container.appendChild(card);
    });
}

function setupPagination(pagination, currentPage) {
    const paginationDiv = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageNumbers = document.getElementById('pageNumbers');
    
    paginationDiv.classList.remove('hidden');
    
    prevBtn.disabled = !pagination.has_prev;
    nextBtn.disabled = !pagination.has_next;
    
    prevBtn.onclick = () => {
        if (currentMode === 'search') {
            loadSearchData(document.getElementById('searchInput').value, currentPage - 1);
        } else {
            loadBrowseData(currentPage - 1);
        }
    };
    
    nextBtn.onclick = () => {
        if (currentMode === 'search') {
            loadSearchData(document.getElementById('searchInput').value, currentPage + 1);
        } else {
            loadBrowseData(currentPage + 1);
        }
    };
    
    // Page numbers
    pageNumbers.innerHTML = '';
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(pagination.pages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = `px-4 py-2 rounded-2xl font-semibold transition ${
            i === currentPage 
                ? 'bg-indigo-600 text-white' 
                : 'bg-dark-300 text-gray-300 hover:bg-dark-200 border border-gray-700'
        }`;
        btn.onclick = () => {
            if (currentMode === 'search') {
                loadSearchData(document.getElementById('searchInput').value, i);
            } else {
                loadBrowseData(i);
            }
        };
        pageNumbers.appendChild(btn);
    }
}

function showLoading() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';
    
    for (let i = 0; i < 6; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'bg-dark-300 rounded-xl shadow-lg p-6 border border-gray-700';
        skeleton.innerHTML = `
            <div class="animate-pulse">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-dark-200 rounded-full shimmer"></div>
                    <div class="h-6 bg-dark-200 rounded w-3/4 shimmer"></div>
                </div>
                <div class="space-y-2 mb-4">
                    <div class="h-4 bg-dark-200 rounded w-full shimmer"></div>
                    <div class="h-4 bg-dark-200 rounded w-2/3 shimmer"></div>
                </div>
                <div class="flex gap-2 pt-4">
                    <div class="h-10 bg-dark-200 rounded flex-1 shimmer"></div>
                    <div class="h-10 bg-dark-200 rounded flex-1 shimmer"></div>
                </div>
            </div>
        `;
        container.appendChild(skeleton);
    }
}

function showError(message) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
        <div class="col-span-3 bg-red-900 bg-opacity-20 border-2 border-red-800 rounded-2xl p-8 text-center">
            <i class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
            <p class="text-red-300 text-lg font-semibold">${message}</p>
            <p class="text-red-400 mt-2">Please check if the API server is running.</p>
        </div>
    `;
}

const toggleBtn = document.getElementById('toggleAdvanced');
const advanced = document.getElementById('advancedOptions');
toggleBtn.addEventListener('click', () => {
    if (advanced.style.maxHeight && advanced.style.maxHeight !== '0px') {
        advanced.style.maxHeight = '0';
    } else {
        advanced.style.maxHeight = advanced.scrollHeight + 'px';
    }
});

// Sync range input value display
const minScore = document.getElementById('minScore');
const minScoreValue = document.getElementById('minScoreValue');
minScore.addEventListener('input', () => {
    minScoreValue.textContent = minScore.value;
});