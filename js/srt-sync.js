let srtFile = null;
let audioFile = null;
let audioPlayer = null;
let subtitles = [];
let currentOffset = 0;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    audioPlayer = document.getElementById('audioPlayer');

    // Check if SRT file was passed from subtitle page
    const storedSrtFile = localStorage.getItem('srtSyncFile');
    if (storedSrtFile) {
        const fileData = JSON.parse(storedSrtFile);
        if (fileData.content) {
            loadSrtFromData(fileData.name, fileData.content);
        }
        localStorage.removeItem('srtSyncFile'); // Clean up
    }

    // Set up file upload handlers
    setupFileUploads();
    setupAudioControls();
    setupTimingControls();
});

function setupFileUploads() {
    // SRT Upload
    const srtUpload = document.getElementById('srtUpload');
    const srtInput = document.getElementById('srtInput');

    srtUpload.addEventListener('click', () => srtInput.click());
    srtUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        srtUpload.classList.add('border-fcp-accent');
    });
    srtUpload.addEventListener('dragleave', (e) => {
        e.preventDefault();
        srtUpload.classList.remove('border-fcp-accent');
    });
    srtUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        srtUpload.classList.remove('border-fcp-accent');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.toLowerCase().endsWith('.srt')) {
            loadSrtFile(files[0]);
        }
    });
    srtInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadSrtFile(e.target.files[0]);
        }
    });

    // Audio Upload
    const audioUpload = document.getElementById('audioUpload');
    const audioInput = document.getElementById('audioInput');

    audioUpload.addEventListener('click', () => audioInput.click());
    audioUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        audioUpload.classList.add('border-fcp-accent');
    });
    audioUpload.addEventListener('dragleave', (e) => {
        e.preventDefault();
        audioUpload.classList.remove('border-fcp-accent');
    });
    audioUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        audioUpload.classList.remove('border-fcp-accent');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            loadAudioFile(files[0]);
        }
    });
    audioInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            loadAudioFile(e.target.files[0]);
        }
    });
}

function loadSrtFile(file) {
    srtFile = file;
    const reader = new FileReader();
    reader.onload = function(e) {
        loadSrtFromData(file.name, e.target.result);
    };
    reader.readAsText(file);
}

function loadSrtFromData(filename, content) {
    try {
        subtitles = parseSrt(content);

        // Update UI
        document.getElementById('srtInfo').innerHTML = `
            <div class="flex items-center text-green-400">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path>
                </svg>
                ${filename} loaded (${subtitles.length} subtitles)
            </div>
        `;
        document.getElementById('srtInfo').classList.remove('hidden');

        checkReadyState();
    } catch (error) {
        alert('Error parsing SRT file: ' + error.message);
    }
}

function loadAudioFile(file) {
    audioFile = file;
    const url = URL.createObjectURL(file);
    audioPlayer.src = url;

    audioPlayer.addEventListener('loadedmetadata', () => {
        document.getElementById('audioInfo').innerHTML = `
            <div class="flex items-center text-green-400">
                <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path>
                </svg>
                ${file.name} loaded (${formatTime(audioPlayer.duration)})
            </div>
        `;
        document.getElementById('audioInfo').classList.remove('hidden');
        document.getElementById('totalTime').textContent = formatTime(audioPlayer.duration);

        checkReadyState();
        renderSubtitleBlocks();
    });
}

function checkReadyState() {
    if (srtFile && audioFile && audioPlayer.duration) {
        document.getElementById('playerSection').classList.remove('hidden');
        document.getElementById('subtitleSection').classList.remove('hidden');
        document.getElementById('controlsSection').classList.remove('hidden');
        document.getElementById('downloadBtn').disabled = false;

        renderSubtitleBlocks();
    }
}

function setupAudioControls() {
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const timeline = document.getElementById('timeline');
    const speedSelect = document.getElementById('playbackSpeed');

    playBtn.addEventListener('click', () => audioPlayer.play());
    pauseBtn.addEventListener('click', () => audioPlayer.pause());

    speedSelect.addEventListener('change', (e) => {
        audioPlayer.playbackRate = parseFloat(e.target.value);
    });

    // Timeline click to seek
    timeline.addEventListener('click', (e) => {
        const rect = timeline.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * audioPlayer.duration;
    });

    // Audio time update
    audioPlayer.addEventListener('timeupdate', () => {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        const percent = (currentTime / duration) * 100;

        timeline.style.setProperty('--progress', percent + '%');
        document.getElementById('currentTime').textContent = formatTime(currentTime);

        updateSubtitlePreview(currentTime);
    });
}

function setupTimingControls() {
    const offsetSlider = document.getElementById('offsetSlider');
    const offsetInput = document.getElementById('offsetInput');

    offsetSlider.addEventListener('input', (e) => {
        currentOffset = parseFloat(e.target.value);
        offsetInput.value = currentOffset;
        renderSubtitleBlocks();
    });

    offsetInput.addEventListener('input', (e) => {
        currentOffset = parseFloat(e.target.value) || 0;
        offsetSlider.value = currentOffset;
        renderSubtitleBlocks();
    });
}

function adjustOffset(amount) {
    currentOffset += amount;
    currentOffset = Math.round(currentOffset * 10) / 10; // Round to 1 decimal
    document.getElementById('offsetSlider').value = currentOffset;
    document.getElementById('offsetInput').value = currentOffset;
    renderSubtitleBlocks();
}

function parseSrt(content) {
    const lines = content.trim().split(/\r?\n/);
    const subtitles = [];
    let currentSubtitle = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (/^\d+$/.test(line)) {
            // Subtitle number
            if (currentSubtitle) {
                subtitles.push(currentSubtitle);
            }
            currentSubtitle = { index: parseInt(line), text: [] };
        } else if (line.includes('-->')) {
            // Timing line
            const [startStr, endStr] = line.split('-->').map(s => s.trim());
            currentSubtitle.startTime = parseSrtTime(startStr);
            currentSubtitle.endTime = parseSrtTime(endStr);
        } else if (line && currentSubtitle) {
            // Text line
            currentSubtitle.text.push(line);
        }
    }

    if (currentSubtitle) {
        subtitles.push(currentSubtitle);
    }

    // Join text lines
    subtitles.forEach(sub => {
        sub.text = sub.text.join('\n');
    });

    return subtitles;
}

function parseSrtTime(timeStr) {
    const [time, ms] = timeStr.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + (parseInt(ms) / 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatSrtTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function renderSubtitleBlocks() {
    if (!audioPlayer.duration || !subtitles.length) return;

    const container = document.getElementById('subtitleBlocks');
    container.innerHTML = '';

    const duration = audioPlayer.duration;

    subtitles.forEach((subtitle, index) => {
        const adjustedStart = subtitle.startTime + currentOffset;
        const adjustedEnd = subtitle.endTime + currentOffset;

        // Skip subtitles that are completely outside the audio duration
        if (adjustedEnd < 0 || adjustedStart > duration) return;

        const startPercent = Math.max(0, (adjustedStart / duration) * 100);
        const endPercent = Math.min(100, (adjustedEnd / duration) * 100);
        const widthPercent = endPercent - startPercent;

        const block = document.createElement('div');
        block.className = 'subtitle-block';
        block.style.left = startPercent + '%';
        block.style.width = widthPercent + '%';
        block.title = subtitle.text;

        block.addEventListener('click', () => {
            audioPlayer.currentTime = Math.max(0, adjustedStart);
        });

        container.appendChild(block);
    });
}

function updateSubtitlePreview(currentTime) {
    const adjustedTime = currentTime;
    let activeSubtitle = null;

    for (const subtitle of subtitles) {
        const adjustedStart = subtitle.startTime + currentOffset;
        const adjustedEnd = subtitle.endTime + currentOffset;

        if (adjustedTime >= adjustedStart && adjustedTime <= adjustedEnd) {
            activeSubtitle = subtitle;
            break;
        }
    }

    const preview = document.getElementById('subtitlePreview');
    if (activeSubtitle) {
        preview.textContent = activeSubtitle.text;
        preview.style.opacity = '1';
    } else {
        preview.textContent = 'No subtitle active';
        preview.style.opacity = '0.5';
    }
}

// Download synced SRT
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!subtitles.length) return;

    let srtContent = '';
    subtitles.forEach((subtitle, index) => {
        const adjustedStart = subtitle.startTime + currentOffset;
        const adjustedEnd = subtitle.endTime + currentOffset;

        srtContent += `${index + 1}\n`;
        srtContent += `${formatSrtTime(adjustedStart)} --> ${formatSrtTime(adjustedEnd)}\n`;
        srtContent += `${subtitle.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = srtFile ? srtFile.name.replace('.srt', '_synced.srt') : 'synced_subtitles.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});