import os
import re
import pylrc  # Ensure you have pylrc installed: pip install pylrc
import sys
sys.dont_write_bytecode = True

def remove_timing_and_korean_lines_in_folder():
    current_folder = os.getcwd()
    
    tt_line_pattern = re.compile(r'\[.*\]\[tt\].*')  # Lines with [tt]
    korean_char_pattern = re.compile(r'[\u1100-\u11FF\uAC00-\uD7AF]')  # Korean Hangul and Jamo
    japanese_exclusive_pattern = re.compile(r'[\u3040-\u309F\u30A0-\u30FF]')  # Japanese Hiragana and Katakana only
    tr_zh_hans_pattern = re.compile(r'\[tr:zh-Hans\]')  # [tr:zh-Hans] tag
    
    for file_name in os.listdir(current_folder):
        if file_name.endswith(".lrc") or file_name.endswith(".lrcx"):
            file_path = os.path.join(current_folder, file_name)

            with open(file_path, 'r', encoding='utf-8') as file:
                lines = file.readlines()

            new_lines = []
            timestamps_seen = set()  # Track timestamps to detect duplicates

            for line in lines:
                # Skip lines with [tt] tag, Korean characters, or Japanese-exclusive Hiragana/Katakana
                if tt_line_pattern.search(line) or korean_char_pattern.search(line) or japanese_exclusive_pattern.search(line):
                    continue

                # Check for timestamp and Chinese translation tag
                timestamp_match = re.match(r'\[(\d{2}:\d{2}\.\d{2,3})\]', line)
                if timestamp_match:
                    timestamp = timestamp_match.group(1)
                    is_chinese_line = tr_zh_hans_pattern.search(line)

                    # If it's a Chinese line and the timestamp already exists in new_lines, skip it
                    if is_chinese_line and timestamp in timestamps_seen:
                        continue
                    
                    # If it's not a Chinese line, mark timestamp as seen
                    if not is_chinese_line:
                        timestamps_seen.add(timestamp)

                # Remove Chinese translation tag if it's still present
                line = tr_zh_hans_pattern.sub('', line)
                new_lines.append(line)

            with open(file_path, 'w', encoding='utf-8') as file:
                file.writelines(new_lines)
            print(f"Processed and cleaned: {file_name}")

def convertLRCtoSRT():
    input("Press Enter to start the LRC to SRT conversion...")
    current_folder = os.getcwd()
    
    for file_name in os.listdir(current_folder):
        if file_name.endswith(".lrc") or file_name.endswith(".lrcx"):
            file_path = os.path.join(current_folder, file_name)
            
            # Read LRC content
            with open(file_path, 'r', encoding='utf-8') as file:
                lrc_string = file.read()
            
            # Parse LRC content
            subs = pylrc.parse(lrc_string)
            srt_string = subs.toSRT()  # Convert to SRT format
            
            # Save to .srt file
            srt_file_path = file_path[:-4] + ".srt"
            with open(srt_file_path, 'w', encoding='utf-8') as srt_file:
                srt_file.write(srt_string)

            # Optional: Normalize unintended line breaks in the .srt output
            with open(srt_file_path, 'r', encoding='utf-8') as srt_file:
                lines = srt_file.readlines()

            fixed_lines = []
            buffer = []
            for line in lines:
                if line.strip() == "":
                    if buffer:
                        # Join subtitle lines into one if needed
                        if len(buffer) >= 3 and '-->' in buffer[1]:
                            joined_text = " ".join(l.strip() for l in buffer[2:])
                            fixed_lines.extend([buffer[0], buffer[1], joined_text, ""])
                        buffer = []
                else:
                    buffer.append(line)
            if buffer:
                if len(buffer) >= 3 and '-->' in buffer[1]:
                    joined_text = " ".join(l.strip() for l in buffer[2:])
                    fixed_lines.extend([buffer[0], buffer[1], joined_text, ""])

            with open(srt_file_path, 'w', encoding='utf-8') as srt_file:
                srt_file.write("\n".join(fixed_lines))

            print(f"Converted {file_name} to {srt_file_path}")
            from fixsrt import fix_srt_file
            fix_srt_file(srt_file_path, srt_file_path)

# Run the functions
remove_timing_and_korean_lines_in_folder()
convertLRCtoSRT()
