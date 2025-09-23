// Python runtime management for subtitle converters
let pyodide = null;
let pythonReady = false;

// Initialize Pyodide
async function initializePython() {
    if (pythonReady) return pyodide;

    console.log('Loading Python runtime...');
    pyodide = await loadPyodide();

    // Load Python conversion scripts
    pyodide.runPython(`
import re
from io import StringIO

def convert_lrcx_to_srt(lrcx_content):
    """Convert LRCX content to SRT format matching doubleLRCXtoSRT.py logic"""
    lines = lrcx_content.strip().split('\\n')

    # Filter lines exactly like the Python script
    tt_line_pattern = re.compile(r'\\[.*\\]\\[tt\\].*')  # Lines with [tt]
    korean_char_pattern = re.compile(r'[\\u1100-\\u11FF\\uAC00-\\uD7AF]')  # Korean Hangul and Jamo
    japanese_exclusive_pattern = re.compile(r'[\\u3040-\\u309F\\u30A0-\\u30FF]')  # Japanese Hiragana and Katakana
    tr_zh_hans_pattern = re.compile(r'\\[tr:zh-Hans\\]')  # [tr:zh-Hans] tag

    filtered_lines = []
    timestamps_seen = set()

    for line in lines:
        # Skip lines with [tt] tag, Korean characters, or Japanese-exclusive characters
        if (tt_line_pattern.search(line) or
            korean_char_pattern.search(line) or
            japanese_exclusive_pattern.search(line)):
            continue

        # Check for timestamp and Chinese translation tag
        timestamp_match = re.match(r'\\[(\\d{2}:\\d{2}\\.\\d{2,3})\\]', line)
        if timestamp_match:
            timestamp = timestamp_match.group(1)
            is_chinese_line = tr_zh_hans_pattern.search(line)

            # If it's a Chinese line and timestamp already exists, skip it
            if is_chinese_line and timestamp in timestamps_seen:
                continue

            # If it's not a Chinese line, mark timestamp as seen
            if not is_chinese_line:
                timestamps_seen.add(timestamp)

        # Remove Chinese translation tag
        line = tr_zh_hans_pattern.sub('', line)
        filtered_lines.append(line)

    # Now convert filtered lines to SRT
    srt_lines = []
    subtitle_index = 1

    for i, line in enumerate(filtered_lines):
        line = line.strip()
        if not line:
            continue

        # Match timestamp format [mm:ss.xx] or [mm:ss.xxx]
        match = re.match(r'^\\[(\\d{1,2}):(\\d{2})\\.(\\d{2,3})\\](.*)$', line)
        if match:
            minutes = int(match.group(1))
            seconds = int(match.group(2))
            centiseconds = int(match.group(3))
            text = match.group(4).strip()

            # Handle 3-digit milliseconds vs 2-digit centiseconds
            if len(match.group(3)) == 3:
                centiseconds = centiseconds // 10

            if text:  # Only process lines with actual text content
                # Convert to total milliseconds
                start_time_ms = (minutes * 60 + seconds) * 1000 + centiseconds * 10

                # Find next subtitle for end time calculation
                end_time_ms = start_time_ms + 3000  # Default 3 seconds

                for j in range(i + 1, len(filtered_lines)):
                    next_line = filtered_lines[j].strip()
                    if next_line:
                        next_match = re.match(r'^\\[(\\d{1,2}):(\\d{2})\\.(\\d{2,3})\\](.*)$', next_line)
                        if next_match and next_match.group(4).strip():  # Next line has text
                            next_minutes = int(next_match.group(1))
                            next_seconds = int(next_match.group(2))
                            next_centiseconds = int(next_match.group(3))
                            if len(next_match.group(3)) == 3:
                                next_centiseconds = next_centiseconds // 10
                            next_start_ms = (next_minutes * 60 + next_seconds) * 1000 + next_centiseconds * 10
                            end_time_ms = min(end_time_ms, next_start_ms - 100)
                            break

                # Format as SRT
                start_time_str = format_srt_time(start_time_ms)
                end_time_str = format_srt_time(end_time_ms)

                srt_lines.append(f"{subtitle_index}")
                srt_lines.append(f"{start_time_str} --> {end_time_str}")
                srt_lines.append(text)
                srt_lines.append("")  # Empty line between subtitles

                subtitle_index += 1

    return '\\n'.join(srt_lines)

def format_srt_time(milliseconds):
    """Format milliseconds as SRT time format HH:MM:SS,mmm"""
    hours = milliseconds // 3600000
    minutes = (milliseconds % 3600000) // 60000
    seconds = (milliseconds % 60000) // 1000
    ms = milliseconds % 1000

    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{ms:03d}"

def convert_vtt_to_srt(vtt_content):
    """Convert VTT content to SRT format"""
    lines = vtt_content.strip().split('\\n')
    srt_lines = []
    subtitle_index = 1

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Skip VTT headers and empty lines
        if line.startswith('WEBVTT') or line.startswith('NOTE') or not line:
            i += 1
            continue

        # Look for time format: 00:00:00.000 --> 00:00:03.000
        if '-->' in line:
            # Convert VTT time format to SRT (. to ,)
            time_line = line.replace('.', ',')

            srt_lines.append(f"{subtitle_index}")
            srt_lines.append(time_line)

            # Get subtitle text (next non-empty lines)
            i += 1
            subtitle_text = []
            while i < len(lines) and lines[i].strip():
                subtitle_text.append(lines[i].strip())
                i += 1

            srt_lines.extend(subtitle_text)
            srt_lines.append("")  # Empty line
            subtitle_index += 1
        else:
            i += 1

    return '\\n'.join(srt_lines)

def shift_srt_time(srt_content, offset_seconds):
    """Shift all timestamps in SRT by offset_seconds"""
    lines = srt_content.strip().split('\\n')
    result_lines = []

    offset_ms = int(offset_seconds * 1000)

    for line in lines:
        if '-->' in line:
            # Parse and shift times
            parts = line.split(' --> ')
            if len(parts) == 2:
                start_time = parts[0].strip()
                end_time = parts[1].strip()

                start_ms = parse_srt_time(start_time) + offset_ms
                end_ms = parse_srt_time(end_time) + offset_ms

                # Ensure times don't go negative
                start_ms = max(0, start_ms)
                end_ms = max(start_ms + 100, end_ms)

                new_start = format_srt_time(start_ms)
                new_end = format_srt_time(end_ms)

                result_lines.append(f"{new_start} --> {new_end}")
            else:
                result_lines.append(line)
        else:
            result_lines.append(line)

    return '\\n'.join(result_lines)

def parse_srt_time(time_str):
    """Parse SRT time format HH:MM:SS,mmm to milliseconds"""
    time_str = time_str.strip()
    hours, minutes, seconds_ms = time_str.split(':')
    seconds, ms = seconds_ms.split(',')

    total_ms = (int(hours) * 3600 + int(minutes) * 60 + int(seconds)) * 1000 + int(ms)
    return total_ms

def clean_srt(srt_content):
    """Clean SRT file by removing formatting and fixing common issues"""
    lines = srt_content.strip().split('\\n')
    result_lines = []

    for line in lines:
        # Remove HTML tags and formatting
        clean_line = re.sub(r'<[^>]+>', '', line)
        # Remove extra whitespace
        clean_line = ' '.join(clean_line.split())
        result_lines.append(clean_line)

    return '\\n'.join(result_lines)

def convert_bcc_to_srt(bcc_content):
    """Convert Bilibili BCC format to SRT format"""
    import json

    try:
        # Parse JSON content
        bcc_data = json.loads(bcc_content)

        # Extract subtitle entries from the 'body' field
        subtitles = bcc_data.get('body', [])

        if not subtitles:
            raise ValueError("No subtitle data found in BCC file")

        srt_lines = []

        for i, subtitle in enumerate(subtitles, 1):
            # Extract timing and content
            start_time = subtitle.get('from', 0)
            end_time = subtitle.get('to', 0)
            content = subtitle.get('content', '').strip()

            # Skip empty content
            if not content:
                continue

            # Convert times to SRT format
            start_srt = seconds_to_srt_time(start_time)
            end_srt = seconds_to_srt_time(end_time)

            # Format as SRT entry
            srt_lines.append(f"{i}")
            srt_lines.append(f"{start_srt} --> {end_srt}")
            srt_lines.append(content)
            srt_lines.append("")  # Empty line between entries

        return '\\n'.join(srt_lines)

    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format in BCC file: {str(e)}")
    except Exception as e:
        raise ValueError(f"Error processing BCC file: {str(e)}")

def seconds_to_srt_time(seconds):
    """Convert seconds (float) to SRT time format HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    milliseconds = int((seconds % 1) * 1000)

    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"

# Test function to verify Python is working
def test_python():
    return "Python runtime loaded successfully!"
    `);

    pythonReady = true;
    console.log('Python runtime ready!');
    return pyodide;
}

// Convert using Python
async function convertWithPython(content, converterType, options = {}) {
    if (!pythonReady) {
        await initializePython();
    }

    // Set the content in Python
    pyodide.globals.set("input_content", content);

    let result;
    switch(converterType) {
        case 'lrcx-to-srt':
            result = pyodide.runPython(`convert_lrcx_to_srt(input_content)`);
            break;
        case 'vtt-to-srt':
            result = pyodide.runPython(`convert_vtt_to_srt(input_content)`);
            break;
        case 'srt-time-shift':
            pyodide.globals.set("offset", options.offset);
            result = pyodide.runPython(`shift_srt_time(input_content, offset)`);
            break;
        case 'srt-cleaner':
            result = pyodide.runPython(`clean_srt(input_content)`);
            break;
        case 'bcc-to-srt':
            result = pyodide.runPython(`convert_bcc_to_srt(input_content)`);
            break;
        default:
            throw new Error(`Unknown converter type: ${converterType}`);
    }

    return result;
}

// Initialize Python when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Start loading Python in background
    initializePython().catch(console.error);
});