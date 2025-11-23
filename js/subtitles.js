// Main Subtitle Tools Controller - UI interactions and modal management

let currentTool = '';
let uploadedFile = null;
let manualInputMode = false;
let manualInputContent = '';
let lrcxConversionMode = 'intelligent';

// Make outputMode globally accessible so file-handlers.js can read it
window.outputMode = 'download';

const PROCESS_LABEL = 'Process';

function updateProcessButtonLabel() {
    const processBtn = document.getElementById('processBtn');
    if (!processBtn) return;
    processBtn.textContent = 'Process';
}

function setProcessingState(isProcessing) {
    const processBtn = document.getElementById('processBtn');
    const outputToggle = document.getElementById('outputToggle');

    if (isProcessing) {
        setProcessMessage('');
        if (processBtn) {
            processBtn.textContent = 'Processing...';
            processBtn.disabled = true;
        }
        if (outputToggle) outputToggle.disabled = true;
    } else {
        if (processBtn) {
            updateProcessButtonLabel();
            // Don't change disabled state - let enableActionButtons handle it
        }
        // Don't change outputToggle disabled state - let enableActionButtons handle it
    }
}

function enableActionButtons(enable) {
    const processBtn = document.getElementById('processBtn');
    const outputToggle = document.getElementById('outputToggle');

    if (processBtn) processBtn.disabled = !enable;
    if (outputToggle) outputToggle.disabled = !enable;
}

function finishProcessing() {
    // Don't reset outputMode here - let downloadFile handle the reset after completion
    enableActionButtons(true);
    updateProcessButtonLabel();
}


function setManualInputToggleEnabled(enabled) {
    const toggle = document.getElementById('toggleManualInput');
    if (!toggle) return;
    toggle.disabled = !enabled;
    toggle.classList.toggle('opacity-50', !enabled);
    toggle.classList.toggle('pointer-events-none', !enabled);
}

function showCopySuccess() {
    const processBtn = document.getElementById('processBtn');
    if (!processBtn) return;
    const original = processBtn.textContent;
    processBtn.textContent = 'Copied!';
    showToast('✓ Copied to clipboard');
    setTimeout(() => {
        updateProcessButtonLabel();
    }, 900);
}

function showLrcxTooltip(e) {
    e?.preventDefault();
    const messageLines = [
        '<span class="font-semibold text-white">Original:</span> Original, non-translated lines only.',
        '<span class="font-semibold text-white">Translations:</span> Translated lyrics lines only.',
        '<span class="font-semibold text-white">Intelligent:</span> Keep base lyrics if the line is English;',
        '&emsp;&emsp;&emsp;&emsp;&emsp;&ensp;&thinsp;Keep translated lines if not.'
    ];
    const existing = document.getElementById('lrcx-tooltip');
    const tooltip = existing || document.createElement('div');
    tooltip.id = 'lrcx-tooltip';
    tooltip.className = 'fixed z-50 max-w-xs bg-black/85 backdrop-blur-sm text-gray-200 text-[11px] rounded-lg shadow-xl border border-fcp-border px-2.5 py-1.5';
    tooltip.innerHTML = messageLines.join('<br>');
    tooltip.style.opacity = '0';
    if (!existing) {
        document.body.appendChild(tooltip);
    }
    tooltip.classList.remove('hidden');

    const rect = e.currentTarget.getBoundingClientRect();
    // Position below and centered on the info pill
    const top = rect.bottom + window.scrollY + 6;
    const left = Math.min(
        window.scrollX + window.innerWidth - tooltip.offsetWidth - 16,
        rect.left + window.scrollX - tooltip.offsetWidth / 2 + rect.width / 2
    );
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${Math.max(window.scrollX + 8, left)}px`;
    tooltip.style.opacity = '1';
}

function hideLrcxTooltip() {
    const tooltip = document.getElementById('lrcx-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
}

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
    enableActionButtons(false);
    setManualInputToggleEnabled(true);
    setProcessingState(false);
    hideOutputMenu();
    window.outputMode = 'download';
    updateProcessButtonLabel();
    setProcessMessage('');
    additionalOptions.classList.add('hidden');
    additionalOptions.innerHTML = '';
    manualInputMode = false;
    manualInputContent = '';
    lrcxConversionMode = 'intelligent';
    toggleUploadAreaAccessibility(false);
    setManualInputToggleEnabled(true);

    // Configure modal based on tool type
    switch(toolType) {
        case 'lrcx-to-srt':
            modalTitle.textContent = 'Convert LRCX to SRT';
            fileTypes.textContent = 'Supported: .lrcx files';
            fileInput.accept = '.lrcx';
            additionalOptions.innerHTML = `
                <div id="lrcxOptions" class="space-y-6">
                    <div>
                        <div class="flex items-center gap-2 mb-2">
                            <p class="text-sm font-medium text-gray-300">Output mode</p>
                            <button
                                type="button"
                                class="w-5 h-5 flex items-center justify-center rounded-full bg-white/15 border border-fcp-border/70 text-fcp-accent text-[9px] leading-none hover:border-fcp-accent hover:text-white transition-colors"
                                aria-label="Output mode info"
                                onmouseenter="showLrcxTooltip(event)"
                                onmouseleave="hideLrcxTooltip()"
                            >
                                i
                            </button>
                        </div>
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
            additionalOptions.innerHTML = `
                <div id="manualInputSection" class="space-y-4">
                    <button id="toggleManualInput" type="button" class="w-full bg-fcp-accent text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                        Paste LRC/VTT manually
                    </button>
                    <div id="manualInputContainer" class="hidden space-y-3 border border-gray-600 rounded-lg p-4 bg-fcp-dark">
                        <div class="flex items-center justify-between">
                            <label for="manualInputTextarea" class="text-sm font-medium text-gray-300">Manual LRC/VTT content</label>
                            <button id="exitManualInput" type="button" class="text-sm text-gray-400 hover:text-white">Back to file upload</button>
                        </div>
                        <textarea id="manualInputTextarea" rows="10" placeholder="Paste your .lrc or .vtt file contents here" class="w-full p-3 bg-black border border-gray-700 rounded text-white placeholder-gray-500 focus:border-fcp-accent focus:outline-none"></textarea>
                        <p class="text-xs text-gray-500">Your pasted text stays in this browser tab only.</p>
                    </div>
                </div>
            `;
            additionalOptions.classList.remove('hidden');
            initializeGenericManualInputControls();
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
        case 'lrcx-cleaner':
            setupLrcxCleanerModal(additionalOptions);
            break;
        case 'srt-line-splitter':
            setupLineSplitterModal(additionalOptions);
            break;
        case 'subtitle-text-extractor':
            setupTextExtractorModal(additionalOptions);
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
                        <input type="checkbox" id="makeContinuous" class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                        <span class="text-gray-300">Make subtitles continuous (extend until next line)</span>
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
            <div id="manualInputSection" class="space-y-4 border-t border-gray-600 pt-4">
                <button id="toggleManualInput" type="button" class="w-full bg-fcp-accent text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                    Paste SRT manually
                </button>
                <div id="manualInputContainer" class="hidden space-y-3 border border-gray-600 rounded-lg p-4 bg-fcp-dark">
                    <div class="flex items-center justify-between">
                        <label for="manualInputTextarea" class="text-sm font-medium text-gray-300">Manual SRT content</label>
                        <button id="exitManualInput" type="button" class="text-sm text-gray-400 hover:text-white">Back to file upload</button>
                    </div>
                    <textarea id="manualInputTextarea" rows="10" placeholder="Paste your .srt file contents here" class="w-full p-3 bg-black border border-gray-700 rounded text-white placeholder-gray-500 focus:border-fcp-accent focus:outline-none"></textarea>
                    <p class="text-xs text-gray-500">Your pasted text stays in this browser tab only.</p>
                </div>
            </div>
        </div>
    `;
    additionalOptions.classList.remove('hidden');
    initializeGenericManualInputControls();
}

// Setup LRCX cleaner modal options
function setupLrcxCleanerModal(additionalOptions) {
    const modalTitle = document.getElementById('modalTitle');
    const fileTypes = document.getElementById('fileTypes');
    const fileInput = document.getElementById('fileInput');

    modalTitle.textContent = 'Clean LRC/LRCX File';
    fileTypes.textContent = 'Supported: .lrc, .lrcx files';
    fileInput.accept = '.lrc,.lrcx';

    additionalOptions.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-3">Cleaning Options</label>
                <div class="grid grid-cols-1 gap-2 text-sm">
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" id="removeTt" checked class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                        <span class="text-gray-300">Remove [tt] translation timing lines</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" id="removeMetadata" checked class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                        <span class="text-gray-300">Remove metadata tags ([offset:], [al:], [ti:], [ar:], etc.)</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" id="removeEmptyLines" checked class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                        <span class="text-gray-300">Remove empty lines (timecodes with no lyrics)</span>
                    </label>
                </div>
            </div>
            <div id="manualInputSection" class="space-y-4 border-t border-gray-600 pt-4">
                <button id="toggleManualInput" type="button" class="w-full bg-fcp-accent text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                    Paste LRC/LRCX manually
                </button>
                <div id="manualInputContainer" class="hidden space-y-3 border border-gray-600 rounded-lg p-4 bg-fcp-dark">
                    <div class="flex items-center justify-between">
                        <label for="manualInputTextarea" class="text-sm font-medium text-gray-300">Manual LRC/LRCX content</label>
                        <button id="exitManualInput" type="button" class="text-sm text-gray-400 hover:text-white">Back to file upload</button>
                    </div>
                    <textarea id="manualInputTextarea" rows="10" placeholder="Paste your .lrc or .lrcx file contents here" class="w-full p-3 bg-black border border-gray-700 rounded text-white placeholder-gray-500 focus:border-fcp-accent focus:outline-none"></textarea>
                    <p class="text-xs text-gray-500">Your pasted text stays in this browser tab only.</p>
                </div>
            </div>
        </div>
    `;
    additionalOptions.classList.remove('hidden');
    initializeGenericManualInputControls();
}

// Setup line splitter modal options
function setupLineSplitterModal(additionalOptions) {
    const modalTitle = document.getElementById('modalTitle');
    const fileTypes = document.getElementById('fileTypes');
    const fileInput = document.getElementById('fileInput');

    modalTitle.textContent = 'Split Long Subtitle Lines';
    fileTypes.textContent = 'Supported: .srt files';
    fileInput.accept = '.srt';

    additionalOptions.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Maximum Characters Per Line</label>
                <input type="range" id="maxCharsPerLine" min="10" max="80" value="40" step="1"
                       class="w-full h-2 bg-fcp-dark rounded-lg appearance-none cursor-pointer accent-fcp-accent">
                <div class="flex justify-between text-sm text-gray-400 mt-1">
                    <span>10</span>
                    <span id="maxCharsDisplay" class="text-fcp-accent font-semibold">40</span>
                    <span>80</span>
                </div>
                <p class="text-sm text-gray-400 mt-2">Lines longer than this will be split at word boundaries to improve readability.</p>
            </div>
            <div class="bg-fcp-dark p-3 rounded border border-gray-600">
                <p class="text-xs text-gray-400">
                    <strong class="text-gray-300">Smart splitting:</strong> For English, keeps complete words intact. For Chinese/Japanese/Korean, splits at punctuation marks (。！？，、) or at the character limit.
                </p>
            </div>
            <div id="manualInputSection" class="space-y-4 border-t border-gray-600 pt-4">
                <button id="toggleManualInput" type="button" class="w-full bg-fcp-accent text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                    Paste SRT manually
                </button>
                <div id="manualInputContainer" class="hidden space-y-3 border border-gray-600 rounded-lg p-4 bg-fcp-dark">
                    <div class="flex items-center justify-between">
                        <label for="manualInputTextarea" class="text-sm font-medium text-gray-300">Manual SRT content</label>
                        <button id="exitManualInput" type="button" class="text-sm text-gray-400 hover:text-white">Back to file upload</button>
                    </div>
                    <textarea id="manualInputTextarea" rows="10" placeholder="Paste your .srt file contents here" class="w-full p-3 bg-black border border-gray-700 rounded text-white placeholder-gray-500 focus:border-fcp-accent focus:outline-none"></textarea>
                    <p class="text-xs text-gray-500">Your pasted text stays in this browser tab only.</p>
                </div>
            </div>
        </div>
    `;
    additionalOptions.classList.remove('hidden');

    // Setup slider update
    const slider = document.getElementById('maxCharsPerLine');
    const display = document.getElementById('maxCharsDisplay');
    if (slider && display) {
        slider.addEventListener('input', (e) => {
            display.textContent = e.target.value;
        });
    }

    initializeGenericManualInputControls();
}

// Setup text extractor modal options
function setupTextExtractorModal(additionalOptions) {
    const modalTitle = document.getElementById('modalTitle');
    const fileTypes = document.getElementById('fileTypes');
    const fileInput = document.getElementById('fileInput');

    modalTitle.textContent = 'Extract Subtitle Text';
    fileTypes.textContent = 'Supported: .srt, .vtt, .lrc files';
    fileInput.accept = '.srt,.vtt,.lrc';

    additionalOptions.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-3">Extraction Options</label>
                <div class="grid grid-cols-1 gap-2 text-sm">
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" id="includeTimestamps" class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                        <span class="text-gray-300">Include timestamps</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" id="addLineNumbers" class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                        <span class="text-gray-300">Add line numbers</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" id="addBlankLines" class="rounded bg-fcp-dark border-gray-600 text-fcp-accent focus:ring-fcp-accent">
                        <span class="text-gray-300">Add blank lines between subtitles</span>
                    </label>
                </div>
            </div>
            <div class="bg-fcp-dark p-3 rounded border border-gray-600">
                <p class="text-xs text-gray-400">
                    Extract just the text from subtitle files for proofreading, script editing, or archiving dialogue.
                </p>
            </div>
            <div id="manualInputSection" class="space-y-4 border-t border-gray-600 pt-4">
                <button id="toggleManualInput" type="button" class="w-full bg-fcp-accent text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors">
                    Paste subtitle content manually
                </button>
                <div id="manualInputContainer" class="hidden space-y-3 border border-gray-600 rounded-lg p-4 bg-fcp-dark">
                    <div class="flex items-center justify-between">
                        <label for="manualInputTextarea" class="text-sm font-medium text-gray-300">Manual subtitle content</label>
                        <button id="exitManualInput" type="button" class="text-sm text-gray-400 hover:text-white">Back to file upload</button>
                    </div>
                    <textarea id="manualInputTextarea" rows="10" placeholder="Paste your subtitle file contents here" class="w-full p-3 bg-black border border-gray-700 rounded text-white placeholder-gray-500 focus:border-fcp-accent focus:outline-none"></textarea>
                    <p class="text-xs text-gray-500">Your pasted text stays in this browser tab only.</p>
                </div>
            </div>
        </div>
    `;
    additionalOptions.classList.remove('hidden');
    initializeGenericManualInputControls();
}

// Close modal and reset state
function closeModal() {
    const modal = document.getElementById('uploadModal');
    modal.classList.add('hidden');
    currentTool = '';
    uploadedFile = null;
    manualInputMode = false;
    manualInputContent = '';
    window.outputMode = 'download';
    hideOutputMenu();
    setProcessMessage('');
    setManualInputToggleEnabled(true);

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
    setProcessingState(false);
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
    const uploadArea = document.getElementById('uploadArea');

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

    if (uploadArea) {
        uploadArea.classList.add('opacity-50', 'pointer-events-none');
        uploadArea.setAttribute('aria-disabled', 'true');
    }

    setManualInputToggleEnabled(false);
    uploadedFile = null;
    updateProcessButtonState();
}

function deactivateManualInput() {
    manualInputMode = false;
    manualInputContent = '';

    const container = document.getElementById('manualInputContainer');
    const textarea = document.getElementById('manualInputTextarea');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    if (textarea) {
        textarea.value = '';
    }

    if (container) {
        container.classList.add('hidden');
    }

    if (fileInput) {
        fileInput.value = '';
    }

    if (uploadArea) {
        uploadArea.classList.remove('opacity-50', 'pointer-events-none');
        uploadArea.removeAttribute('aria-disabled');
    }

    toggleUploadAreaAccessibility(false);
    setManualInputToggleEnabled(true);
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

// Generic manual input controls for other tools
function initializeGenericManualInputControls() {
    const toggleButton = document.getElementById('toggleManualInput');
    const exitButton = document.getElementById('exitManualInput');
    const textarea = document.getElementById('manualInputTextarea');

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
            updateGenericProcessButtonState();
        });
    }
}

function updateProcessButtonState() {
    if (currentTool !== 'lrcx-to-srt') return;
    const hasInput = manualInputMode ? manualInputContent.trim().length > 0 : (uploadedFile && uploadedFile.length > 0);
    enableActionButtons(hasInput);
}

function updateGenericProcessButtonState() {
    const hasInput = manualInputMode ? manualInputContent.trim().length > 0 : (uploadedFile && uploadedFile.length > 0);
    enableActionButtons(hasInput);
}

function setProcessMessage(message, type = 'info') {
    const el = document.getElementById('processMessage');
    if (!el) return;
    if (!message) {
        el.classList.add('hidden');
        el.textContent = '';
        el.classList.remove('text-red-400', 'text-fcp-accent', 'text-gray-300');
        return;
    }
    el.textContent = message;
    el.classList.remove('text-red-400', 'text-fcp-accent', 'text-gray-300');
    if (type === 'error') {
        el.classList.add('text-red-400');
    } else if (type === 'info') {
        el.classList.add('text-fcp-accent');
    } else {
        el.classList.add('text-gray-300');
    }
    el.classList.remove('hidden');
}

function hideOutputMenu() {
    const menu = document.getElementById('outputMenu');
    const toggle = document.getElementById('outputToggle');
    if (menu) menu.classList.add('hidden');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function toggleOutputMenu() {
    const menu = document.getElementById('outputMenu');
    const toggle = document.getElementById('outputToggle');
    if (!menu || !toggle) return;

    if (toggle.disabled) return;

    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
        menu.classList.remove('hidden');
        toggle.setAttribute('aria-expanded', 'true');
    } else {
        hideOutputMenu();
    }
}

function setOutputMode(mode) {
    window.outputMode = mode === 'copy' ? 'copy' : 'download';
    console.log('Output mode set to:', window.outputMode); // Debug
    hideOutputMenu();

    // Immediately trigger processing
    processFile();
}

let toastTimeout = null;
function showToast(message, duration = 3500) {
    if (!message) return;
    if (toastTimeout) {
        clearTimeout(toastTimeout);
        toastTimeout = null;
    }
    let toast = document.getElementById('ek-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ek-toast';
        toast.className = 'fixed bottom-4 right-4 max-w-sm bg-black bg-opacity-80 backdrop-blur-sm text-white text-sm rounded-lg shadow-lg border border-fcp-border p-4 z-50 transition-opacity duration-300';
        toast.style.opacity = '0';
        document.body.appendChild(toast);
    }
    toast.textContent = message;

    // Fade in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });

    // Fade out after duration
    toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}

// Process file based on current tool
function processFile() {
    const manualInputTools = ['lrcx-to-srt', 'lrcx-cleaner', 'vtt-to-srt', 'srt-cleaner', 'srt-line-splitter', 'subtitle-text-extractor'];
    const supportsManualInput = manualInputTools.includes(currentTool) && manualInputMode;

    if (!uploadedFile && currentTool !== 'srt-creator' && !supportsManualInput) {
        alert('Please upload a file first');
        return;
    }

    setProcessingState(true);

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
            if (manualInputMode) {
                processVttToSrtText(manualInputContent);
            } else {
                const file = uploadedFile[0];
                if (file.name.toLowerCase().endsWith('.lrc')) {
                    processLrcToSrt(file);
                } else {
                    processVttToSrt(file);
                }
            }
            break;
        case 'srt-time-shift':
            const offset = parseFloat(document.getElementById('timeOffset').value);
            if (isNaN(offset)) {
                alert('Please enter a valid time offset');
                finishProcessing();
                return;
            }
            processSrtTimeShift(uploadedFile[0], offset);
            break;
        case 'srt-merger':
            processSrtMerger(uploadedFile);
            break;
        case 'srt-cleaner':
            if (manualInputMode) {
                processSrtCleanerText(manualInputContent);
            } else {
                processSrtCleaner(uploadedFile[0]);
            }
            break;
        case 'bcc-to-srt':
            processBccToSrt(uploadedFile[0]);
            break;
        case 'lrcx-cleaner':
            if (manualInputMode) {
                processLrcxCleanerText(manualInputContent);
            } else {
                processLrcxCleaner(uploadedFile[0]);
            }
            break;
        case 'srt-line-splitter':
            if (manualInputMode) {
                processSrtLineSplitterText(manualInputContent);
            } else {
                processSrtLineSplitter(uploadedFile[0]);
            }
            break;
        case 'subtitle-text-extractor':
            if (manualInputMode) {
                processSubtitleTextExtractorText(manualInputContent);
            } else {
                processSubtitleTextExtractor(uploadedFile[0]);
            }
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
    setupDragAndDrop();

    // Make sure openTool is globally available
    window.openTool = openTool;
    window.processFile = processFile;
    window.closeModal = closeModal;
    window.openAudioSync = openAudioSync;

    const outputToggle = document.getElementById('outputToggle');
    const outputMenu = document.getElementById('outputMenu');
    if (outputToggle) {
        outputToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling to document listener
            toggleOutputMenu();
        });
    }
    if (outputMenu) {
        outputMenu.querySelectorAll('[data-output]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent event from bubbling to document listener
                const mode = e.currentTarget.getAttribute('data-output');
                setOutputMode(mode);
            });
        });
    }
    document.addEventListener('click', (e) => {
        const toggle = document.getElementById('outputToggle');
        const menu = document.getElementById('outputMenu');
        if (!menu || !toggle) return;
        if (!menu.classList.contains('hidden')) {
            const withinMenu = menu.contains(e.target);
            const withinToggle = toggle.contains(e.target);
            if (!withinMenu && !withinToggle) {
                hideOutputMenu();
            }
        }
    });
    updateProcessButtonLabel();
});
