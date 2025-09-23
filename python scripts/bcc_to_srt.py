#!/usr/bin/env python3
"""
BCC to SRT Converter
Converts Bilibili BCC subtitle format to standard SRT format.
"""

import json
import sys
import os
from pathlib import Path


def seconds_to_srt_time(seconds):
    """Convert seconds (float) to SRT time format HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    milliseconds = int((seconds % 1) * 1000)

    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"


def convert_bcc_to_srt(bcc_content):
    """Convert BCC JSON content to SRT format"""
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

        return '\n'.join(srt_lines)

    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format in BCC file: {e}")
    except KeyError as e:
        raise ValueError(f"Missing required field in BCC file: {e}")


def convert_bcc_file(input_path, output_path=None):
    """Convert a BCC file to SRT format"""
    input_path = Path(input_path)

    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if not input_path.suffix.lower() == '.bcc':
        raise ValueError("Input file must have .bcc extension")

    # Generate output path if not provided
    if output_path is None:
        output_path = input_path.with_suffix('.srt')
    else:
        output_path = Path(output_path)

    try:
        # Read BCC file
        with open(input_path, 'r', encoding='utf-8') as f:
            bcc_content = f.read()

        # Convert to SRT
        srt_content = convert_bcc_to_srt(bcc_content)

        # Write SRT file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(srt_content)

        print(f"✅ Successfully converted {input_path.name} to {output_path.name}")
        return output_path

    except Exception as e:
        print(f"❌ Error converting {input_path.name}: {e}")
        return None


def batch_convert_folder(folder_path):
    """Convert all BCC files in a folder"""
    folder_path = Path(folder_path)

    if not folder_path.exists():
        raise FileNotFoundError(f"Folder not found: {folder_path}")

    bcc_files = list(folder_path.glob('*.bcc'))

    if not bcc_files:
        print(f"No BCC files found in {folder_path}")
        return

    print(f"Found {len(bcc_files)} BCC file(s) to convert:")

    converted = 0
    for bcc_file in bcc_files:
        print(f"Converting {bcc_file.name}...")
        if convert_bcc_file(bcc_file):
            converted += 1

    print(f"\n🎉 Converted {converted}/{len(bcc_files)} files successfully!")


def main():
    if len(sys.argv) < 2:
        print("BCC to SRT Converter")
        print("Usage:")
        print("  python bcc_to_srt.py <input.bcc> [output.srt]")
        print("  python bcc_to_srt.py <folder_path>  # Convert all BCC files in folder")
        print("\nExamples:")
        print("  python bcc_to_srt.py bili_1758659100053.bcc")
        print("  python bcc_to_srt.py subtitles.bcc output.srt")
        print("  python bcc_to_srt.py ./subtitle_folder/")
        return

    input_path = Path(sys.argv[1])

    try:
        if input_path.is_dir():
            # Batch convert folder
            batch_convert_folder(input_path)
        elif input_path.suffix.lower() == '.bcc':
            # Convert single file
            output_path = sys.argv[2] if len(sys.argv) > 2 else None
            convert_bcc_file(input_path, output_path)
        else:
            print("❌ Please provide a .bcc file or folder containing .bcc files")

    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()