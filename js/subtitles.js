let currentTool = '';
let uploadedFile = null;

function openTool(toolType) {
    currentTool = toolType;
    const modal = document.getElementById('uploadModal');
    const modalTitle = document.getElementById('modalTitle');
    const fileTypes = document.getElementById('fileTypes');
    const fileInput = document.getElementById('fileInput');
    const additionalOptions = document.getElementById('additionalOptions');

    // Reset modal state
    uploadedFile = null;
    document.getElementById('processBtn').disabled = true;
    additionalOptions.classList.add('hidden');
    additionalOptions.innerHTML = '';

    // Configure modal based on tool type
    switch(toolType) {
        case 'lrcx-to-srt':
            modalTitle.textContent = 'Convert LRCX to SRT';
            fileTypes.textContent = 'Supported: .lrcx files';
            fileInput.accept = '.lrcx';
            break;
        case 'vtt-to-srt':
            modalTitle.textContent = 'Convert LRC/VTT to SRT';
            fileTypes.textContent = 'Supported: .lrc, .vtt files';
            fileInput.accept = '.lrc,.vtt';
            break;
        case 'srt-time-shift':
            modalTitle.textContent = 'Shift SRT Timing';
            fileTypes.textContent = 'Supported: .srt files';
            fileInput.accept = '.srt';
            additionalOptions.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Time Offset (seconds)</label>
                        <input type="number" id="timeOffset" step="0.1" placeholder="e.g., 2.5 (positive) or -1.5 (negative)"
                               class="w-full p-3 bg-fcp-dark border border-gray-600 rounded text-white placeholder-gray-400 focus:border-fcp-accent focus:outline-none">
                    </div>
                    <p class="text-sm text-gray-400">Positive values delay subtitles, negative values advance them.</p>
                    <div class="border-t border-gray-600 pt-4">
                        <button onclick="openAudioSync()" class="w-full bg-fcp-accent text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                            Advanced Audio Sync
                        </button>
                        <p class="text-xs text-gray-500 mt-2 text-center">Sync subtitles with audio playback for precise timing</p>
                    </div>
                </div>
            `;
            additionalOptions.classList.remove('hidden');
            break;
        case 'srt-merger':
            modalTitle.textContent = 'Merge SRT Files';
            fileTypes.textContent = 'Supported: .srt files (select multiple)';
            fileInput.accept = '.srt';
            fileInput.multiple = true;
            additionalOptions.innerHTML = `
                <div class="space-y-4">
                    <div id="fileList" class="hidden">
                        <label class="block text-sm font-medium text-gray-300 mb-2">File Order (drag to reorder)</label>
                        <div id="fileItems" class="space-y-2"></div>
                    </div>
                    <div class="hidden" id="timingControls">
                        <label class="block text-sm font-medium text-gray-300 mb-2">Gap Between Files (seconds)</label>
                        <input type="number" id="gapBetweenFiles" step="0.1" value="1.0" min="0"
                               class="w-full p-3 bg-fcp-dark border border-gray-600 rounded text-white placeholder-gray-400 focus:border-fcp-accent focus:outline-none">
                        <p class="text-sm text-gray-400 mt-1">Time gap added between merged subtitle files</p>
                    </div>
                </div>
            `;
            additionalOptions.classList.remove('hidden');
            break;
        case 'srt-cleaner':
            modalTitle.textContent = 'Clean SRT File';
            fileTypes.textContent = 'Supported: .srt files';
            fileInput.accept = '.srt';
            additionalOptions.innerHTML = `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-3">Cleaning Options</label>
                        <div class="grid grid-cols-1 gap-2 text-sm">
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="fixNumbering" checked class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                                <span class="text-gray-300">Fix subtitle numbering</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="removeEmpty" checked class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                                <span class="text-gray-300">Remove empty subtitles</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="removeDuplicates" class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                                <span class="text-gray-300">Remove duplicate subtitles</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="fixTiming" class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                                <span class="text-gray-300">Fix timing overlaps</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="removeSoundEffects" class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                                <span class="text-gray-300">Remove sound effects [MUSIC], (laughing)</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="fixCapitalization" class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                                <span class="text-gray-300">Fix ALL CAPS text</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="removeSpeakers" class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                                <span class="text-gray-300">Remove speaker names (JOHN:, [SPEAKER]:)</span>
                            </label>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" id="removeFormatting" class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                                <span class="text-gray-300">Remove HTML/formatting tags</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Minimum subtitle duration (seconds)</label>
                        <input type="number" id="minDuration" step="0.1" value="0.5" min="0"
                               class="w-full p-3 bg-fcp-dark border border-gray-600 rounded text-white placeholder-gray-400 focus:border-fcp-accent focus:outline-none">
                        <p class="text-xs text-gray-400 mt-1">Remove subtitles shorter than this duration</p>
                    </div>
                </div>
            `;
            additionalOptions.classList.remove('hidden');
            break;
        case 'bcc-to-srt':
            modalTitle.textContent = 'Convert BCC to SRT';
            fileTypes.textContent = 'Supported: .bcc files (Bilibili)';
            fileInput.accept = '.bcc';
            break;
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.add('hidden');
    currentTool = '';
    uploadedFile = null;

    // Reset file input safely
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
        fileInput.multiple = false;
    }

    // Reset upload area
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p class="text-gray-400 mb-2">Drop your file here or click to browse</p>
            <p id="fileTypes" class="text-sm text-gray-500">Supported: .lrcx files</p>
            <input type="file" id="fileInput" class="hidden" accept="">
        `;
    }

    // Reset process button
    const processBtn = document.getElementById('processBtn');
    if (processBtn) {
        processBtn.textContent = 'Process';
        processBtn.disabled = true;
    }
}

// File upload handling
document.addEventListener('DOMContentLoaded', function() {
    // Use event delegation for dynamically created elements
    document.addEventListener('click', function(e) {
        if (e.target.closest('#uploadArea')) {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.click();
            }
        }
    });

    // Drag and drop with event delegation
    document.addEventListener('dragover', function(e) {
        if (e.target.closest('#uploadArea')) {
            e.preventDefault();
            e.target.closest('#uploadArea').classList.add('border-fcp-accent');
        }
    });

    document.addEventListener('dragleave', function(e) {
        if (e.target.closest('#uploadArea')) {
            e.preventDefault();
            e.target.closest('#uploadArea').classList.remove('border-fcp-accent');
        }
    });

    document.addEventListener('drop', function(e) {
        const uploadArea = e.target.closest('#uploadArea');
        if (uploadArea) {
            e.preventDefault();
            uploadArea.classList.remove('border-fcp-accent');

            // No special handling needed for BCC converter

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files);
            }
        }
    });

    // File input change with event delegation
    document.addEventListener('change', function(e) {
        if (e.target.id === 'fileInput') {
            handleFileUpload(e.target.files);
        }
    });
});

function handleFileUpload(files) {
    if (files.length === 0) return;

    uploadedFile = files;
    document.getElementById('processBtn').disabled = false;

    // Update upload area to show file info
    const uploadArea = document.getElementById('uploadArea');
    if (files.length === 1) {
        uploadArea.innerHTML = `
            <svg class="w-12 h-12 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-green-400 mb-2">File ready: ${files[0].name}</p>
            <p class="text-sm text-gray-500">Click Process to convert</p>
        `;
    } else {
        uploadArea.innerHTML = `
            <svg class="w-12 h-12 text-green-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-green-400 mb-2">${files.length} files ready</p>
            <p class="text-sm text-gray-500">Click Process to merge</p>
        `;

        // Show file list and timing controls for SRT merger
        if (currentTool === 'srt-merger') {
            showFileList(files);
        }
    }
}

function showFileList(files) {
    const fileList = document.getElementById('fileList');
    const fileItems = document.getElementById('fileItems');
    const timingControls = document.getElementById('timingControls');

    fileItems.innerHTML = '';

    Array.from(files).forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'bg-fcp-dark p-3 rounded border border-gray-600 cursor-move flex items-center justify-between';
        fileItem.draggable = true;
        fileItem.dataset.index = index;

        fileItem.innerHTML = `
            <div class="flex items-center space-x-3">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
                </svg>
                <span class="text-white">${index + 1}. ${file.name}</span>
            </div>
            <div class="text-sm text-gray-400">
                ${(file.size / 1024).toFixed(1)} KB
            </div>
        `;

        // Drag and drop handlers
        fileItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            fileItem.classList.add('opacity-50');
        });

        fileItem.addEventListener('dragend', () => {
            fileItem.classList.remove('opacity-50');
        });

        fileItem.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileItem.classList.add('border-fcp-accent');
        });

        fileItem.addEventListener('dragleave', () => {
            fileItem.classList.remove('border-fcp-accent');
        });

        fileItem.addEventListener('drop', (e) => {
            e.preventDefault();
            fileItem.classList.remove('border-fcp-accent');

            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const targetIndex = parseInt(fileItem.dataset.index);

            if (draggedIndex !== targetIndex) {
                reorderFiles(draggedIndex, targetIndex);
            }
        });

        fileItems.appendChild(fileItem);
    });

    fileList.classList.remove('hidden');
    timingControls.classList.remove('hidden');
}

function reorderFiles(fromIndex, toIndex) {
    const filesArray = Array.from(uploadedFile);
    const [movedFile] = filesArray.splice(fromIndex, 1);
    filesArray.splice(toIndex, 0, movedFile);

    // Update uploadedFile with new order
    const dt = new DataTransfer();
    filesArray.forEach(file => dt.items.add(file));
    uploadedFile = dt.files;

    // Refresh the file list display
    showFileList(uploadedFile);
}

function processFile() {
    if (!uploadedFile && currentTool !== 'srt-creator') {
        alert('Please upload a file first');
        return;
    }

    // Show processing state
    const processBtn = document.getElementById('processBtn');
    processBtn.textContent = 'Processing...';
    processBtn.disabled = true;

    // Process based on tool type
    switch(currentTool) {
        case 'lrcx-to-srt':
            processLrcxToSrt(uploadedFile[0]);
            break;
        case 'vtt-to-srt':
            const file = uploadedFile[0];
            if (file.name.toLowerCase().endsWith('.lrc')) {
                processLrcToSrt(file);
            } else {
                processVttToSrt(file);
            }
            break;
        case 'srt-time-shift':
            const offset = parseFloat(document.getElementById('timeOffset').value);
            if (isNaN(offset)) {
                alert('Please enter a valid time offset');
                processBtn.textContent = 'Process';
                processBtn.disabled = false;
                return;
            }
            processSrtTimeShift(uploadedFile[0], offset);
            break;
        case 'srt-merger':
            processSrtMerger(uploadedFile);
            break;
        case 'srt-cleaner':
            processSrtCleaner(uploadedFile[0]);
            break;
        case 'bcc-to-srt':
            processBccToSrt(uploadedFile[0]);
            break;
    }
}

async function processLrcToSrt(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const srtContent = convertLrcToSrt(content);
            downloadFile(srtContent, file.name.replace(/\.[^/.]+$/, ".srt"), 'text/plain');
            closeModal();
        } catch (error) {
            console.error('Conversion error:', error);
            alert('Error converting file: ' + error.message);
            document.getElementById('processBtn').textContent = 'Process';
            document.getElementById('processBtn').disabled = false;
        }
    };
    reader.readAsText(file);
}

function convertLrcToSrt(lrcContent) {
    const lines = lrcContent.split(/\r?\n/);
    let srtContent = '';
    const subtitles = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Fixed regex: removed escape backslashes for square brackets
        const match = line.match(/^\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)$/);

        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            let milliseconds = parseInt(match[3]);
            const text = match[4].trim();

            // Handle 2-digit centiseconds vs 3-digit milliseconds
            if (match[3].length === 2) {
                milliseconds = milliseconds * 10; // Convert centiseconds to milliseconds
            }

            if (text) {
                const startTime = (minutes * 60 + seconds) * 1000 + milliseconds;
                subtitles.push({ startTime, text });
            }
        }
    }

    for (let i = 0; i < subtitles.length; i++) {
        const subtitle = subtitles[i];
        const nextSubtitle = subtitles[i + 1];
        const endTime = nextSubtitle ? nextSubtitle.startTime : subtitle.startTime + 2000; // 2 seconds duration for last subtitle

        srtContent += `${i + 1}\n`;
        srtContent += `${formatSrtTime(subtitle.startTime)} --> ${formatSrtTime(endTime)}\n`;
        srtContent += `${subtitle.text}\n\n`;
    }

    return srtContent;
}

async function processLrcxToSrt(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const srtContent = await convertWithPython(content, 'lrcx-to-srt');
            downloadFile(srtContent, file.name.replace(/\.[^/.]+$/, ".srt"), 'text/plain');
            closeModal();
        } catch (error) {
            console.error('Conversion error:', error);
            alert('Error converting file: ' + error.message);
            document.getElementById('processBtn').textContent = 'Process';
            document.getElementById('processBtn').disabled = false;
        }
    };
    reader.readAsText(file);
}

function convertLrcxToSrt(lrcxContent) {
    const lines = lrcxContent.split('\n');
    let srtContent = '';
    let subtitleIndex = 1;

    console.log('Processing LRCX content, total lines:', lines.length);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Try multiple LRCX timestamp formats
        // Format 1: [mm:ss.xx] (original)
        let match = line.match(/^\\[(\d{2}):(\d{2})\.(\d{2})\\](.*)$/);

        // Format 2: [mm:ss.xxx] (3-digit centiseconds)
        if (!match) {
            match = line.match(/^\\[(\d{2}):(\d{2})\.(\d{3})\\](.*)$/);
        }

        // Format 3: [m:ss.xx] (single digit minutes)
        if (!match) {
            match = line.match(/^\\[(\d{1}):(\d{2})\.(\d{2})\\](.*)$/);
        }

        if (match) {
            console.log('Found match:', line);
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
let centiseconds = parseInt(match[3]);
            const text = match[4].trim();

            // Handle 3-digit milliseconds vs 2-digit centiseconds
            if (match[3].length === 3) {
                centiseconds = Math.floor(centiseconds / 10); // Convert to centiseconds
            }

            if (text) {
                // Convert to total milliseconds
                const startTime = (minutes * 60 + seconds) * 1000 + centiseconds * 10;

                // Estimate end time (3 seconds later or next subtitle)
                let endTime = startTime + 3000;

                // Check if there's a next subtitle
                for (let j = i + 1; j < lines.length; j++) {
                    const nextMatch = lines[j].match(/^\\[(\d{2}):(\d{2})\.(\d{2})\\]/);
                    if (nextMatch) {
                        const nextMinutes = parseInt(nextMatch[1]);
                        const nextSeconds = parseInt(nextMatch[2]);
                        const nextCentiseconds = parseInt(nextMatch[3]);
                        const nextStartTime = (nextMinutes * 60 + nextSeconds) * 1000 + nextCentiseconds * 10;
                        endTime = Math.min(endTime, nextStartTime - 100);
                        break;
                    }
                }

                // Format as SRT
                srtContent += `${subtitleIndex}\n`;
                srtContent += `${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n`;
                srtContent += `${text}\n\n`;
                subtitleIndex++;
            }
        }
    }

    console.log('Generated SRT content length:', srtContent.length);
    console.log('Total subtitles created:', subtitleIndex - 1);

    if (srtContent.length === 0) {
        console.log('No matches found. First few lines of input:');
        lines.slice(0, 5).forEach((line, i) => {
            console.log(`Line ${i}: "${line}"`);
        });
    }

    return srtContent;
}

function formatSrtTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = milliseconds % 1000;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

async function processVttToSrt(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const srtContent = await convertWithPython(content, 'vtt-to-srt');
            downloadFile(srtContent, file.name.replace(/\.[^/.]+$/, ".srt"), 'text/plain');
            closeModal();
        } catch (error) {
            console.error('Conversion error:', error);
            alert('Error converting file: ' + error.message);
            document.getElementById('processBtn').textContent = 'Process';
            document.getElementById('processBtn').disabled = false;
        }
    };
    reader.readAsText(file);
}

async function processSrtTimeShift(file, offset) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const srtContent = await convertWithPython(content, 'srt-time-shift', { offset });
            downloadFile(srtContent, file.name.replace(/\.[^/.]+$/, "_shifted.srt"), 'text/plain');
            closeModal();
        } catch (error) {
            console.error('Conversion error:', error);
            alert('Error processing file: ' + error.message);
            document.getElementById('processBtn').textContent = 'Process';
            document.getElementById('processBtn').disabled = false;
        }
    };
    reader.readAsText(file);
}

async function processSrtMerger(files) {
    try {
        const gapBetweenFiles = parseFloat(document.getElementById('gapBetweenFiles').value) || 1.0;

        const allSubtitles = [];
        let currentTimeOffset = 0;

        // Process each file in order
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const content = await readFileContent(file);
            const subtitles = parseSrtContent(content);

            // Find the maximum end time of current file
            let maxEndTime = 0;

            subtitles.forEach((subtitle, index) => {
                // Adjust timing with current offset
                const adjustedStartTime = subtitle.startTime + currentTimeOffset;
                const adjustedEndTime = subtitle.endTime + currentTimeOffset;

                allSubtitles.push({
                    startTime: adjustedStartTime,
                    endTime: adjustedEndTime,
                    text: subtitle.text,
                    originalFile: file.name
                });

                maxEndTime = Math.max(maxEndTime, adjustedEndTime);
            });

            // Update offset for next file (max end time + gap)
            currentTimeOffset = maxEndTime + gapBetweenFiles;
        }

        // Generate merged SRT content
        let mergedSrtContent = '';
        allSubtitles.forEach((subtitle, index) => {
            mergedSrtContent += `${index + 1}\n`;
            mergedSrtContent += `${formatSrtTimeFromSeconds(subtitle.startTime)} --> ${formatSrtTimeFromSeconds(subtitle.endTime)}\n`;
            mergedSrtContent += `${subtitle.text}\n\n`;
        });

        // Download merged file
        const mergedFileName = `merged_${files.length}_subtitles.srt`;
        downloadFile(mergedSrtContent, mergedFileName, 'text/plain');
        closeModal();

    } catch (error) {
        console.error('Merge error:', error);
        alert('Error merging files: ' + error.message);
        document.getElementById('processBtn').textContent = 'Process';
        document.getElementById('processBtn').disabled = false;
    }
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function parseSrtContent(content) {
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
            currentSubtitle = { text: [] };
        } else if (line.includes('-->')) {
            // Timing line
            const [startStr, endStr] = line.split('-->').map(s => s.trim());
            currentSubtitle.startTime = parseSrtTimeToSeconds(startStr);
            currentSubtitle.endTime = parseSrtTimeToSeconds(endStr);
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

function parseSrtTimeToSeconds(timeStr) {
    const [time, ms] = timeStr.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + (parseInt(ms) / 1000);
}

function formatSrtTimeFromSeconds(totalSeconds) {
    // Round to avoid floating-point precision issues
    const roundedSeconds = Math.round(totalSeconds * 1000) / 1000;

    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const seconds = Math.floor(roundedSeconds % 60);
    const milliseconds = Math.round((roundedSeconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

async function processSrtCleaner(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;

            // Get cleaning options
            const options = {
                fixNumbering: document.getElementById('fixNumbering')?.checked || false,
                removeDuplicates: document.getElementById('removeDuplicates')?.checked || false,
                removeEmpty: document.getElementById('removeEmpty')?.checked || false,
                fixTiming: document.getElementById('fixTiming')?.checked || false,
                removeSoundEffects: document.getElementById('removeSoundEffects')?.checked || false,
                fixCapitalization: document.getElementById('fixCapitalization')?.checked || false,
                removeSpeakers: document.getElementById('removeSpeakers')?.checked || false,
                removeFormatting: document.getElementById('removeFormatting')?.checked || false,
                minDuration: parseFloat(document.getElementById('minDuration')?.value || '0.5')
            };

            const cleanedContent = cleanSrtFile(content, options);
            downloadFile(cleanedContent, file.name.replace(/\.[^/.]+$/, "_cleaned.srt"), 'text/plain');
            closeModal();
        } catch (error) {
            console.error('Cleaning error:', error);
            alert('Error cleaning file: ' + error.message);
            document.getElementById('processBtn').textContent = 'Process';
            document.getElementById('processBtn').disabled = false;
        }
    };
    reader.readAsText(file);
}

function cleanSrtFile(content, options) {
    // Parse SRT content similar to your Python script
    const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line);
    const blocks = [];
    let i = 0;

    // Extract subtitle blocks (similar to your Python logic)
    while (i < lines.length) {
        if (/^\d+$/.test(lines[i])) {  // Skip existing number
            i++;
        }
        if (i < lines.length && lines[i].includes('-->')) {
            const timestamp = lines[i];
            i++;
            const textLines = [];
            while (i < lines.length && !/^\d+$/.test(lines[i]) && !lines[i].includes('-->')) {
                textLines.push(lines[i]);
                i++;
            }
            if (textLines.length > 0) {
                blocks.push({ timestamp, textLines });
            }
        } else {
            i++;
        }
    }

    // Clean each block
    let cleanedBlocks = blocks.map(block => {
        let { timestamp, textLines } = block;
        let text = textLines.join('\n');

        // Parse timing
        const [startTime, endTime] = timestamp.split('-->').map(t => t.trim());
        const startSeconds = parseSrtTimeToSeconds(startTime);
        const endSeconds = parseSrtTimeToSeconds(endTime);
        const duration = endSeconds - startSeconds;

        // Apply cleaning options
        if (options.removeEmpty && (!text || text.trim() === '')) {
            return null;
        }

        if (options.minDuration && duration < options.minDuration) {
            return null;
        }

        if (options.removeSoundEffects) {
            // Remove sound effects in brackets and parentheses
            text = text.replace(/\[.*?\]/g, '');
            text = text.replace(/\(.*?\)/g, '');
        }

        if (options.removeSpeakers) {
            // Remove speaker names like "JOHN:", "[SPEAKER 1]:", etc.
            text = text.replace(/^[A-Z\s]+:\s*/gm, '');
            text = text.replace(/^\[.*?\]:\s*/gm, '');
        }

        if (options.removeFormatting) {
            // Remove HTML-like tags
            text = text.replace(/<[^>]*>/g, '');
            text = text.replace(/&[a-zA-Z0-9#]+;/g, ' '); // HTML entities
        }

        if (options.fixCapitalization) {
            // Fix ALL CAPS text (but preserve intentional caps like acronyms)
            text = text.replace(/\b[A-Z]{4,}\b/g, match => {
                // Don't change if it's likely an acronym (short words)
                if (match.length <= 4) return match;
                return match.charAt(0) + match.slice(1).toLowerCase();
            });
        }

        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();

        if (!text) return null;

        return {
            startTime: startSeconds,
            endTime: endSeconds,
            timestamp,
            text
        };
    }).filter(block => block !== null);

    // Remove duplicates if requested
    if (options.removeDuplicates) {
        const seen = new Set();
        cleanedBlocks = cleanedBlocks.filter(block => {
            const key = block.text.toLowerCase().trim();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // Fix timing overlaps if requested
    if (options.fixTiming) {
        for (let i = 0; i < cleanedBlocks.length - 1; i++) {
            const current = cleanedBlocks[i];
            const next = cleanedBlocks[i + 1];

            if (current.endTime > next.startTime) {
                // Adjust current block to end 100ms before next starts
                const newEndTime = Math.max(current.startTime + 0.5, next.startTime - 0.1);
                current.endTime = newEndTime;
                current.timestamp = `${formatSrtTimeFromSeconds(current.startTime)} --> ${formatSrtTimeFromSeconds(current.endTime)}`;
            }
        }
    }

    // Generate cleaned SRT content
    let result = '';
    cleanedBlocks.forEach((block, index) => {
        if (options.fixNumbering) {
            result += `${index + 1}\n`;
        } else {
            result += `${index + 1}\n`;  // Always fix numbering for consistency
        }
        result += `${block.timestamp}\n`;
        result += `${block.text}\n\n`;
    });

    return result;
}

async function processBccToSrt(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const srtContent = await convertWithPython(content, 'bcc-to-srt');
            downloadFile(srtContent, file.name.replace(/\.[^/.]+$/, ".srt"), 'text/plain');
            closeModal();
        } catch (error) {
            console.error('Conversion error:', error);
            alert('Error converting BCC file: ' + error.message);
            document.getElementById('processBtn').textContent = 'Process';
            document.getElementById('processBtn').disabled = false;
        }
    };
    reader.readAsText(file);
}

function openAudioSync() {
    // Store the uploaded SRT file for the audio sync page
    if (uploadedFile && uploadedFile[0]) {
        localStorage.setItem('srtSyncFile', JSON.stringify({
            name: uploadedFile[0].name,
            content: null // Will be loaded on the sync page
        }));

        // Store file content
        const reader = new FileReader();
        reader.onload = function(e) {
            const fileData = {
                name: uploadedFile[0].name,
                content: e.target.result
            };
            localStorage.setItem('srtSyncFile', JSON.stringify(fileData));
            window.open('srt-sync.html', '_blank');
        };
        reader.readAsText(uploadedFile[0]);
    } else {
        window.open('srt-sync.html', '_blank');
    }
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
