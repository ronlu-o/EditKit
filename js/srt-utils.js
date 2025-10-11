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