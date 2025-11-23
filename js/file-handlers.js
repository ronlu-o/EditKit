// File Handlers - Upload, download, and drag-drop functionality

// Handle file upload processing
function handleFileUpload(files) {
    if (files.length === 0) return;
    if (typeof manualInputMode !== 'undefined' && manualInputMode) {
        return;
    }

    uploadedFile = files;
    if (typeof setManualInputToggleEnabled === 'function') {
        setManualInputToggleEnabled(false);
    }
    if (typeof enableActionButtons === 'function') {
        enableActionButtons(true);
    } else {
        const processBtn = document.getElementById('processBtn');
        if (processBtn) processBtn.disabled = false;
    }

    if (typeof updateProcessButtonState === 'function') {
        updateProcessButtonState();
    }

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

// Show draggable file list for SRT merger
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

// Reorder files in the merger
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

// Download or copy result utility
async function downloadFile(content, filename, mimeType) {
    // Guard against empty output
    if (!content || (typeof content === 'string' && content.trim().length === 0)) {
        if (typeof setProcessMessage === 'function') {
            setProcessMessage('Either your file was empty or it has an error. Nothing was exported in this run.', 'error');
        }
        if (typeof finishProcessing === 'function') finishProcessing();
        return false;
    }

    const mode = (typeof window.outputMode !== 'undefined') ? window.outputMode : 'download';
    console.log('downloadFile called with mode:', mode); // Debug
    const resetButtons = () => {
        if (typeof finishProcessing === 'function') {
            finishProcessing();
        } else if (typeof enableActionButtons === 'function') {
            enableActionButtons(true);
        }
    };

    const performDownload = (showSuccessToast = true) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (typeof setProcessMessage === 'function') {
            setProcessMessage('');
        }

        // Show download success toast only if requested (not when falling back from clipboard failure)
        if (showSuccessToast && typeof showToast === 'function') {
            showToast('✓ Download started');
        }
    };

    console.log('Clipboard available?', !!navigator.clipboard);
    console.log('Clipboard.writeText available?', !!(navigator.clipboard && navigator.clipboard.writeText));

    if (mode === 'copy' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            console.log('Attempting to write to clipboard...');
            await navigator.clipboard.writeText(content);
            console.log('Clipboard write successful!');
            if (typeof showCopySuccess === 'function') {
                showCopySuccess();
            }
            // Reset outputMode after successful copy
            if (typeof window.outputMode !== 'undefined') {
                window.outputMode = 'download';
            }
            resetButtons();
            return true;
        } catch (err) {
            console.error('Clipboard copy failed, falling back to download.', err);
            if (typeof showToast === 'function') {
                showToast('⚠ Clipboard access denied. Use HTTPS or localhost. Downloading instead...');
            }
            // Fall back to download WITHOUT showing success toast (error toast already explains what's happening)
            performDownload(false);
            if (typeof window.outputMode !== 'undefined') {
                window.outputMode = 'download';
            }
            resetButtons();
            return false;
        }
    } else if (mode === 'copy') {
        // Clipboard API not available
        console.log('Clipboard API not available - likely due to insecure context');
        if (typeof showToast === 'function') {
            showToast('⚠ Clipboard requires HTTPS or localhost. Downloading instead...');
        }
        // Fall back to download WITHOUT showing success toast
        performDownload(false);
        if (typeof window.outputMode !== 'undefined') {
            window.outputMode = 'download';
        }
        resetButtons();
        return false;
    }

    // Normal download mode
    performDownload(true);
    // Reset outputMode after download
    if (typeof window.outputMode !== 'undefined') {
        window.outputMode = 'download';
    }
    resetButtons();
    return true;
}

// Set up drag and drop event listeners
function setupDragAndDrop() {
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

    // Upload area click handler
    document.addEventListener('click', function(e) {
        if (e.target.closest('#uploadArea')) {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.click();
            }
        }
    });
}
