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
            fileInput.accept = '';
            break;
        case 'vtt-to-srt':
            modalTitle.textContent = 'Convert VTT to SRT';
            fileTypes.textContent = 'Supported: .vtt files';
            fileInput.accept = '.vtt';
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
                </div>
            `;
            additionalOptions.classList.remove('hidden');
            break;
        case 'srt-merger':
            modalTitle.textContent = 'Merge SRT Files';
            fileTypes.textContent = 'Supported: .srt files (select multiple)';
            fileInput.accept = '.srt';
            fileInput.multiple = true;
            break;
        case 'srt-cleaner':
            modalTitle.textContent = 'Clean SRT File';
            fileTypes.textContent = 'Supported: .srt files';
            fileInput.accept = '.srt';
            break;
        case 'srt-creator':
            modalTitle.textContent = 'Create New SRT';
            fileTypes.textContent = 'No file upload needed';
            document.getElementById('uploadArea').innerHTML = `
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <p class="text-gray-400 mb-2">Create a new SRT file from scratch</p>
                <p class="text-sm text-gray-500">Click Process to start the editor</p>
            `;
            document.getElementById('processBtn').disabled = false;
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
        if (e.target.closest('#uploadArea') && currentTool !== 'srt-creator') {
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

            if (currentTool === 'srt-creator') return;

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
    }
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
            processVttToSrt(uploadedFile[0]);
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
        case 'srt-creator':
            openSrtCreator();
            break;
    }
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
        let match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2})\](.*)$/);

        // Format 2: [mm:ss.xxx] (3-digit centiseconds)
        if (!match) {
            match = line.match(/^\[(\d{2}):(\d{2})\.(\d{3})\](.*)$/);
        }

        // Format 3: [m:ss.xx] (single digit minutes)
        if (!match) {
            match = line.match(/^\[(\d{1}):(\d{2})\.(\d{2})\](.*)$/);
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
                    const nextMatch = lines[j].match(/^\[(\d{2}):(\d{2})\.(\d{2})\]/);
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

function processSrtMerger(files) {
    // Placeholder for SRT merger
    alert(`SRT merger for ${files.length} files coming soon!`);
    closeModal();
}

async function processSrtCleaner(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const srtContent = await convertWithPython(content, 'srt-cleaner');
            downloadFile(srtContent, file.name.replace(/\.[^/.]+$/, "_cleaned.srt"), 'text/plain');
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

function openSrtCreator() {
    // Placeholder for SRT creator
    alert('SRT creator interface coming soon!');
    closeModal();
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