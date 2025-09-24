// Main Subtitle Tools Controller - UI interactions and modal management

let currentTool = '';
let uploadedFile = null;

// Open tool modal with specific configuration
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
            setupTimeShiftModal(additionalOptions);
            break;
        case 'srt-merger':
            setupMergerModal(fileInput, additionalOptions);
            break;
        case 'srt-cleaner':
            setupCleanerModal(additionalOptions);
            break;
        case 'bcc-to-srt':
            modalTitle.textContent = 'Convert BCC to SRT';
            fileTypes.textContent = 'Supported: .bcc files (Bilibili)';
            fileInput.accept = '.bcc';
            break;
    }

    modal.classList.remove('hidden');
}

// Setup time shift modal options
function setupTimeShiftModal(additionalOptions) {
    const modal = document.getElementById('uploadModal');
    const modalTitle = document.getElementById('modalTitle');
    const fileTypes = document.getElementById('fileTypes');
    const fileInput = document.getElementById('fileInput');

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
}

// Setup merger modal options
function setupMergerModal(fileInput, additionalOptions) {
    const modalTitle = document.getElementById('modalTitle');
    const fileTypes = document.getElementById('fileTypes');

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
}

// Setup cleaner modal options
function setupCleanerModal(additionalOptions) {
    const modalTitle = document.getElementById('modalTitle');
    const fileTypes = document.getElementById('fileTypes');
    const fileInput = document.getElementById('fileInput');

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
}

// Close modal and reset state
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

// Process file based on current tool
function processFile() {
    if (!uploadedFile && currentTool !== 'srt-creator') {
        alert('Please upload a file first');
        return;
    }

    // Show processing state
    const processBtn = document.getElementById('processBtn');
    processBtn.textContent = 'Processing...';
    processBtn.disabled = true;

    // Route to appropriate processor
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

// Open advanced audio sync page
function openAudioSync() {
    // Store the uploaded SRT file for the audio sync page
    if (uploadedFile && uploadedFile[0]) {
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up drag and drop');
    setupDragAndDrop();

    // Make sure openTool is globally available
    window.openTool = openTool;
    window.processFile = processFile;
    window.closeModal = closeModal;
    window.openAudioSync = openAudioSync;
    console.log('Global functions set up');
});