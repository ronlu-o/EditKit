// SRT Utilities - Parsing, formatting, and validation functions

// Parse SRT time format to seconds
function parseSrtTimeToSeconds(timeStr) {
    const [time, ms] = timeStr.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + (parseInt(ms) / 1000);
}

// Format seconds to SRT time format
function formatSrtTimeFromSeconds(totalSeconds) {
    // Round to avoid floating-point precision issues
    const roundedSeconds = Math.round(totalSeconds * 1000) / 1000;

    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const seconds = Math.floor(roundedSeconds % 60);
    const milliseconds = Math.round((roundedSeconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

// Legacy format function (for existing code compatibility)
function formatSrtTime(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = milliseconds % 1000;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// Parse SRT content into structured data
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

// Convert LRC format to SRT
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

// Clean SRT file with various options
function cleanSrtFile(content, options) {
    // Parse SRT content similar to the Python script
    const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line);
    const blocks = [];
    let i = 0;

    // Extract subtitle blocks
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

    // Make subtitles continuous if requested
    if (options.makeContinuous) {
        for (let i = 0; i < cleanedBlocks.length - 1; i++) {
            const current = cleanedBlocks[i];
            const next = cleanedBlocks[i + 1];

            // Extend current subtitle to start of next subtitle
            current.endTime = next.startTime;
            current.timestamp = `${formatSrtTimeFromSeconds(current.startTime)} --> ${formatSrtTimeFromSeconds(current.endTime)}`;
        }
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
        result += `${index + 1}\n`;
        result += `${block.timestamp}\n`;
        result += `${block.text}\n\n`;
    });

    return result;
}

// Utility function to read file content as promise
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Split a subtitle text line into two parts at the optimal position
function splitSubtitleLine(text, maxChars) {
    if (text.length <= maxChars) {
        return [text];
    }

    // Check if text contains CJK characters (Chinese, Japanese, Korean)
    const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text);

    // Try to find a good split point
    let splitPos = maxChars;

    // First, try to split at a sentence boundary
    // For CJK: 。！？，、
    // For English: . ! ? (with optional space after)
    const cjkPunctuation = /[。！？]/;
    const englishPunctuation = /[.!?]\s+/g;

    if (hasCJK) {
        // Look for CJK sentence endings
        for (let i = Math.min(maxChars, text.length - 1); i > maxChars * 0.4; i--) {
            if (cjkPunctuation.test(text[i])) {
                return [text.slice(0, i + 1).trim(), text.slice(i + 1).trim()];
            }
        }

        // Look for CJK commas as secondary option
        const cjkComma = /[，、]/;
        for (let i = Math.min(maxChars, text.length - 1); i > maxChars * 0.4; i--) {
            if (cjkComma.test(text[i])) {
                return [text.slice(0, i + 1).trim(), text.slice(i + 1).trim()];
            }
        }

        // For CJK without punctuation, just split at maxChars (no spaces needed)
        return [text.slice(0, maxChars).trim(), text.slice(maxChars).trim()];
    } else {
        // English text handling
        const sentenceMatch = text.slice(0, maxChars).match(englishPunctuation);
        if (sentenceMatch) {
            const lastSentence = text.slice(0, maxChars).lastIndexOf(sentenceMatch[sentenceMatch.length - 1]);
            if (lastSentence > maxChars * 0.3) { // At least 30% of max chars
                splitPos = lastSentence + sentenceMatch[sentenceMatch.length - 1].length;
                return [text.slice(0, splitPos).trim(), text.slice(splitPos).trim()];
            }
        }

        // If no sentence boundary, try to split at a word boundary (space)
        let searchStart = Math.min(maxChars, text.length - 1);

        // Look backwards from maxChars to find a space - search more aggressively
        for (let i = searchStart; i > 0; i--) {
            if (text[i] === ' ') {
                // Make sure we're not splitting into a tiny word at the end
                const firstPart = text.slice(0, i);
                const secondPart = text.slice(i + 1);

                // If the second part is just 1-2 characters, keep looking backward
                if (secondPart.trim().length <= 2 && i > maxChars * 0.5) {
                    continue;
                }

                return [firstPart.trim(), secondPart.trim()];
            }
        }

        // Look forward from maxChars to find a space (if no good backward split)
        for (let i = maxChars; i < text.length; i++) {
            if (text[i] === ' ') {
                return [text.slice(0, i).trim(), text.slice(i + 1).trim()];
            }
        }

        // Last resort: split at maxChars (no good word boundary found)
        return [text.slice(0, maxChars).trim(), text.slice(maxChars).trim()];
    }
}

// Process subtitle line splitting
function processSrtLineSplit(content, maxChars) {
    const subtitles = parseSrtContent(content);
    const newSubtitles = [];

    subtitles.forEach(subtitle => {
        const lines = subtitle.text.split('\n');
        let needsSplitting = false;

        // Check if any line exceeds the max character limit
        for (const line of lines) {
            if (line.length > maxChars) {
                needsSplitting = true;
                break;
            }
        }

        if (!needsSplitting) {
            // Keep subtitle as-is
            newSubtitles.push(subtitle);
        } else {
            // Process each line and split if needed
            const allLines = [];
            for (const line of lines) {
                if (line.length > maxChars) {
                    const splitLines = splitSubtitleLine(line, maxChars);
                    allLines.push(...splitLines);
                } else {
                    allLines.push(line);
                }
            }

            // If we have multiple lines now, we might need to split into multiple subtitle entries
            // For simplicity, we'll combine them back with newlines if they fit reasonably
            const combinedText = allLines.join('\n');

            // Calculate duration per character for time splitting
            const duration = subtitle.endTime - subtitle.startTime;
            const originalLength = subtitle.text.replace(/\n/g, ' ').length;
            const timePerChar = duration / originalLength;

            // If the combined text is reasonable, keep as one subtitle
            // Otherwise, split into two separate subtitle entries
            if (allLines.length <= 2) {
                newSubtitles.push({
                    startTime: subtitle.startTime,
                    endTime: subtitle.endTime,
                    text: combinedText
                });
            } else {
                // Split into two subtitle entries at the middle time
                const midpoint = allLines.length / 2;
                const firstHalf = allLines.slice(0, Math.ceil(midpoint));
                const secondHalf = allLines.slice(Math.ceil(midpoint));

                const firstText = firstHalf.join(' ');
                const secondText = secondHalf.join(' ');

                // Calculate split time based on text length proportion
                const firstLength = firstText.length;
                const totalLength = firstText.length + secondText.length;
                const splitTime = subtitle.startTime + (duration * (firstLength / totalLength));

                newSubtitles.push({
                    startTime: subtitle.startTime,
                    endTime: splitTime,
                    text: firstHalf.join('\n')
                });

                newSubtitles.push({
                    startTime: splitTime,
                    endTime: subtitle.endTime,
                    text: secondHalf.join('\n')
                });
            }
        }
    });

    // Generate SRT content
    let result = '';
    newSubtitles.forEach((subtitle, index) => {
        result += `${index + 1}\n`;
        result += `${formatSrtTimeFromSeconds(subtitle.startTime)} --> ${formatSrtTimeFromSeconds(subtitle.endTime)}\n`;
        result += `${subtitle.text}\n\n`;
    });

    return result;
}