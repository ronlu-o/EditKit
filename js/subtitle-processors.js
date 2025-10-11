// Subtitle Processors - All conversion and processing functions

// Process LRC to SRT conversion
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

// Process LRCX to SRT conversion
async function processLrcxToSrt(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const srtContent = await convertWithPython(content, 'lrcx-to-srt', { mode: lrcxConversionMode });
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

async function processLrcxTextToSrt(content) {
    try {
        const srtContent = await convertWithPython(content, 'lrcx-to-srt', { mode: lrcxConversionMode });
        downloadFile(srtContent, 'manual_input.srt', 'text/plain');
        closeModal();
    } catch (error) {
        console.error('Conversion error:', error);
        alert('Error converting text: ' + error.message);
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.textContent = 'Process';
            processBtn.disabled = false;
        }
    }
}

// Process VTT to SRT conversion
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

// Process VTT to SRT from manual text input
async function processVttToSrtText(content) {
    try {
        const srtContent = await convertWithPython(content, 'vtt-to-srt');
        downloadFile(srtContent, 'manual_input.srt', 'text/plain');
        closeModal();
    } catch (error) {
        console.error('Conversion error:', error);
        alert('Error converting text: ' + error.message);
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.textContent = 'Process';
            processBtn.disabled = false;
        }
    }
}

// Process SRT time shift
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

// Process SRT time shift from manual text input
async function processSrtTimeShiftText(content, offset) {
    try {
        const srtContent = await convertWithPython(content, 'srt-time-shift', { offset });
        downloadFile(srtContent, 'manual_input_shifted.srt', 'text/plain');
        closeModal();
    } catch (error) {
        console.error('Conversion error:', error);
        alert('Error processing text: ' + error.message);
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.textContent = 'Process';
            processBtn.disabled = false;
        }
    }
}

// Process SRT merger
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

// Process SRT cleaner
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

// Process SRT cleaner from manual text input
async function processSrtCleanerText(content) {
    try {
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
        downloadFile(cleanedContent, 'manual_input_cleaned.srt', 'text/plain');
        closeModal();
    } catch (error) {
        console.error('Cleaning error:', error);
        alert('Error cleaning text: ' + error.message);
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.textContent = 'Process';
            processBtn.disabled = false;
        }
    }
}

// Process BCC to SRT conversion
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

// Process LRCX Cleaner
async function processLrcxCleaner(file) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const cleanedContent = cleanLrcxContent(content);

            const extension = file.name.split('.').pop();
            downloadFile(cleanedContent, file.name.replace(/\.[^/.]+$/, `_cleaned.${extension}`), 'text/plain');
            closeModal();
        } catch (error) {
            console.error('Processing error:', error);
            alert('Error processing file: ' + error.message);
            document.getElementById('processBtn').textContent = 'Process';
            document.getElementById('processBtn').disabled = false;
        }
    };
    reader.readAsText(file);
}

// Process LRCX Cleaner from manual text input
async function processLrcxCleanerText(content) {
    try {
        const cleanedContent = cleanLrcxContent(content);
        downloadFile(cleanedContent, 'manual_input_cleaned.lrcx', 'text/plain');
        closeModal();
    } catch (error) {
        console.error('Processing error:', error);
        alert('Error processing text: ' + error.message);
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.textContent = 'Process';
            processBtn.disabled = false;
        }
    }
}

// Helper function to clean LRCX content
function cleanLrcxContent(content) {
    let lines = content.split('\n');

    // Get cleaning options
    const options = {
        removeTt: document.getElementById('removeTt')?.checked || false,
        removeMetadata: document.getElementById('removeMetadata')?.checked || false,
        removeEmptyLines: document.getElementById('removeEmptyLines')?.checked || false
    };

    // Apply filters
    if (options.removeTt) {
        lines = lines.filter(line => !line.includes('[tt]'));
    }

    if (options.removeMetadata) {
        // Remove metadata tags like [offset:], [al:], [ti:], [ar:], [by:], [re:], [ve:], etc.
        lines = lines.filter(line => {
            const metadataPattern = /^\[(offset|al|ti|ar|by|re|ve|length):/i;
            return !metadataPattern.test(line.trim());
        });
    }

    if (options.removeEmptyLines) {
        // Remove lines that have a timecode but no lyrics after it
        // Matches patterns like [00:24.207] or [00:24.207][tt] with nothing or only whitespace after
        lines = lines.filter(line => {
            const trimmedLine = line.trim();
            // Check if line is just timecodes with no text content
            const emptyTimecodePattern = /^(\[\d{2}:\d{2}\.\d{3}\])+(\[tt\])?(\s*)$/;
            return !emptyTimecodePattern.test(trimmedLine);
        });
    }

    // Remove any extra blank lines created by filtering
    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}
