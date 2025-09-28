// Main Subtitle Tools Controller - UI interactions and modal management

let currentTool = '';
let uploadedFile = null;
let manualInputMode = false;
let manualInputContent = '';
let lrcxConversionMode = 'intelligent';

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
    manualInputMode = false;
    manualInputContent = '';
    lrcxConversionMode = 'intelligent';
    toggleUploadAreaAccessibility(false);

    // Configure modal based on tool type
    switch(toolType) {
        case 'lrcx-to-srt':
            modalTitle.textContent = 'Convert LRCX to SRT';
            fileTypes.textContent = 'Supported: .lrcx files';
            fileInput.accept = '.lrcx';
            additionalOptions.innerHTML = `
                <div id="lrcxOptions" class="space-y-6">
                    <div>
                        <p class="text-sm font-medium text-gray-300 mb-2">Output mode</p>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button data-lrcx-mode="original" type="button" class="lrcx-mode-btn px-3 py-2 border border-gray-600 rounded text-sm text-gray-300 hover:border-fcp-accent transition-colors">Original</button>
                            <button data-lrcx-mode="intelligent" type="button" class="lrcx-mode-btn px-3 py-2 border border-gray-600 rounded text-sm text-gray-300 hover:border-fcp-accent transition-colors">Intelligent</button>
                            <button data-lrcx-mode="translation-only" type="button" class="lrcx-mode-btn px-3 py-2 border border-gray-600 rounded text-sm text-gray-300 hover:border-fcp-accent transition-colors">Translations</button>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">Choose which lines to keep when generating the SRT.</p>
                    </div>
                    <div id="manualInputSection" class="space-y-4">
                        <button id="toggleManualInput" type="button" class="w-full bg-fcp-accent text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                            Paste LRCX manually
                        </button>
                        <div id="manualInputContainer" class="hidden space-y-3 border border-gray-600 rounded-lg p-4 bg-fcp-dark">
                            <div class="flex items-center justify-between">
                                <label for="manualInputTextarea" class="text-sm font-medium text-gray-300">Manual LRCX content</label>
                                <button id="exitManualInput" type="button" class="text-sm text-gray-400 hover:text-white">Back to file upload</button>
                            </div>
                            <textarea id="manualInputTextarea" rows="10" placeholder="Paste your .lrcx file contents here" class="w-full p-3 bg-black border border-gray-700 rounded text-white placeholder-gray-500 focus:border-fcp-accent focus:outline-none"></textarea>
                            <p class="text-xs text-gray-500">Your pasted text stays in this browser tab only.</p>
                        </div>
                    </div>
                </div>
            `;
            additionalOptions.classList.remove('hidden');
            initializeLrcxControls();
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
    manualInputMode = false;
    manualInputContent = '';

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
        uploadArea.classList.remove('opacity-50');
        uploadArea.classList.remove('pointer-events-none');
        uploadArea.removeAttribute('aria-disabled');
    }

    // Reset process button
    const processBtn = document.getElementById('processBtn');
    if (processBtn) {
        processBtn.textContent = 'Process';
        processBtn.disabled = true;
    }
}

function initializeLrcxControls() {
    const toggleButton = document.getElementById('toggleManualInput');
    const exitButton = document.getElementById('exitManualInput');
    const textarea = document.getElementById('manualInputTextarea');
    const modeButtons = document.querySelectorAll('.lrcx-mode-btn');

    if (toggleButton) {
        toggleButton.addEventListener('click', (event) => {
            event.preventDefault();
            activateManualInput();
        });
    }

    if (exitButton) {
        exitButton.addEventListener('click', (event) => {
            event.preventDefault();
            deactivateManualInput();
        });
    }

    if (textarea) {
        textarea.addEventListener('input', (event) => {
            manualInputContent = event.target.value;
            updateProcessButtonState();
        });
    }

    modeButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const { lrcxMode } = event.currentTarget.dataset;
            if (lrcxMode) {
                setLrcxConversionMode(lrcxMode);
            }
        });
    });

    updateLrcxModeButtons();
}

function activateManualInput() {
    manualInputMode = true;
    const container = document.getElementById('manualInputContainer');
    const textarea = document.getElementById('manualInputTextarea');
    const fileInput = document.getElementById('fileInput');

    if (container) {
        container.classList.remove('hidden');
    }

    toggleUploadAreaAccessibility(true);

    if (textarea) {
        textarea.focus();
        manualInputContent = textarea.value;
    }

    if (fileInput) {
        fileInput.value = '';
    }

    uploadedFile = null;
    updateProcessButtonState();
}

function deactivateManualInput() {
    manualInputMode = false;
    manualInputContent = '';

    const container = document.getElementById('manualInputContainer');
    const textarea = document.getElementById('manualInputTextarea');

    if (textarea) {
        textarea.value = '';
    }

    if (container) {
        container.classList.add('hidden');
    }

    toggleUploadAreaAccessibility(false);
    updateProcessButtonState();
}

function toggleUploadAreaAccessibility(disable) {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    if (disable) {
        uploadArea.classList.add('opacity-50');
        uploadArea.classList.add('pointer-events-none');
        uploadArea.setAttribute('aria-disabled', 'true');
    } else {
        uploadArea.classList.remove('opacity-50');
        uploadArea.classList.remove('pointer-events-none');
        uploadArea.removeAttribute('aria-disabled');
    }
}

function setLrcxConversionMode(mode) {
    const normalizedMode = typeof mode === 'string' ? mode.toLowerCase() : 'intelligent';
    const allowedModes = new Set(['original', 'intelligent', 'translation-only']);
    lrcxConversionMode = allowedModes.has(normalizedMode) ? normalizedMode : 'intelligent';
    updateLrcxModeButtons();
}

function updateLrcxModeButtons() {
    const modeButtons = document.querySelectorAll('.lrcx-mode-btn');
    modeButtons.forEach((button) => {
        const buttonMode = button.dataset.lrcxMode;
        if (buttonMode === lrcxConversionMode) {
            button.classList.add('bg-fcp-accent', 'text-white', 'border-transparent');
            button.classList.remove('text-gray-300', 'border-gray-600');
        } else {
            button.classList.remove('bg-fcp-accent', 'text-white', 'border-transparent');
            button.classList.add('text-gray-300', 'border-gray-600');
        }
    });
}

function updateProcessButtonState() {
    const processBtn = document.getElementById('processBtn');
    if (!processBtn || currentTool !== 'lrcx-to-srt') return;

    if (manualInputMode) {
        processBtn.disabled = manualInputContent.trim().length === 0;
    } else {
        processBtn.disabled = !uploadedFile || uploadedFile.length === 0;
    }
}

// Process file based on current tool
function processFile() {
    if (!uploadedFile && currentTool !== 'srt-creator' && !(currentTool === 'lrcx-to-srt' && manualInputMode)) {
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
            if (manualInputMode) {
                processLrcxTextToSrt(manualInputContent);
            } else {
                processLrcxToSrt(uploadedFile[0]);
            }
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
