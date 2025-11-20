#!/usr/bin/env python3
"""
srt2fcpxml - Convert SRT subtitle files to Final Cut Pro XML format
Python implementation compatible with Pyodide (browser execution)
Uses only pure Python - no C dependencies

Based on the original Go implementation by GanymedeNil:
https://github.com/GanymedeNil/srt2fcpxml

Python port with additional features and browser compatibility.
"""

import argparse
import os
import re
import sys
from dataclasses import dataclass
from datetime import timedelta
from typing import List, Tuple, Union
from xml.etree.ElementTree import Element, ElementTree, tostring
from xml.dom import minidom


@dataclass
class SubtitleItem:
    """Represents a single subtitle entry"""
    index: int
    start: timedelta
    end: timedelta
    text: str


class SRTParser:
    """Pure Python SRT parser - no external dependencies"""

    TIME_PATTERN = re.compile(
        r'(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})'
    )

    @staticmethod
    def parse_time(hours: str, minutes: str, seconds: str, milliseconds: str) -> timedelta:
        """Convert SRT time format to timedelta"""
        return timedelta(
            hours=int(hours),
            minutes=int(minutes),
            seconds=int(seconds),
            milliseconds=int(milliseconds)
        )

    @classmethod
    def parse(cls, content: str) -> List[SubtitleItem]:
        """Parse SRT file content into subtitle items"""
        subtitles = []
        blocks = content.strip().split('\n\n')

        for block in blocks:
            lines = block.strip().split('\n')
            if len(lines) < 3:
                continue

            # Parse index
            try:
                index = int(lines[0].strip())
            except ValueError:
                continue

            # Parse timing
            match = cls.TIME_PATTERN.match(lines[1])
            if not match:
                continue

            start = cls.parse_time(*match.groups()[:4])
            end = cls.parse_time(*match.groups()[4:])

            # Parse text (remaining lines)
            text = '\n'.join(lines[2:])

            subtitles.append(SubtitleItem(
                index=index,
                start=start,
                end=end,
                text=text
            ))

        return subtitles


class FrameRateCalculator:
    """Handle frame rate calculations for fcpxml"""

    @staticmethod
    def round_custom(value: float, decimals: int = 0) -> float:
        """Custom rounding to match Go's math.Trunc behavior"""
        multiplier = 10 ** decimals
        return int((value + 0.5 / multiplier) * multiplier) / multiplier

    @staticmethod
    def frame_map_string(frame_rate: Union[int, float]) -> str:
        """Convert frame rate to fcpxml duration format string"""
        if isinstance(frame_rate, float):
            # For float frame rates (23.98, 29.97, 59.94)
            rounded = FrameRateCalculator.round_custom(frame_rate, 0)
            return f"1001/{int(rounded * 1000)}"
        else:
            # For integer frame rates
            return f"100/{frame_rate * 100}"

    @staticmethod
    def frame_map(frame_rate: Union[int, float]) -> float:
        """Calculate frame duration as decimal"""
        if isinstance(frame_rate, float):
            rounded = FrameRateCalculator.round_custom(frame_rate, 0)
            return 1001 / (rounded * 1000)
        else:
            return 100 / (frame_rate * 100)

    @staticmethod
    def frame_duration(frame_rate: Union[int, float]) -> float:
        """Get frame rate as float"""
        return float(frame_rate)

    @staticmethod
    def frame_duration_format(frame_rate: Union[int, float]) -> Tuple[float, float]:
        """Get molecular and denominator for frame duration calculations"""
        if isinstance(frame_rate, float):
            rounded = FrameRateCalculator.round_custom(frame_rate, 0)
            return 1001, rounded * 1000
        else:
            return 100, float(frame_rate * 100)


class FcpXMLBuilder:
    """Build Final Cut Pro XML structure"""

    def __init__(self, project_name: str, frame_rate: Union[int, float],
                 width: int = 1920, height: int = 1080,
                 alignment: str = 'center', y_position: int = -420,
                 event_name: str = '_fcpxmls'):
        self.project_name = project_name
        self.event_name = event_name
        self.frame_rate = frame_rate
        self.width = width
        self.height = height
        self.alignment = alignment.lower()
        self.y_position = y_position
        self.calc = FrameRateCalculator()

        # Calculate frame rate properties
        self.frame_rate_float = self.calc.frame_duration(frame_rate)
        self.frame_duration_compute = self.calc.frame_map(frame_rate)
        self.frame_molecular, self.frame_denominator = self.calc.frame_duration_format(frame_rate)
        self.project_start = 3.6 * self.frame_denominator * self.frame_molecular

        # Alignment mappings
        self.alignment_map = {
            'left': '0 (Left)',
            'center': '1 (Center)',
            'right': '2 (Right)'
        }

        # X position based on alignment
        self.x_position_map = {
            'left': -840.0,
            'center': 0,
            'right': 840.0
        }

    def create_format_element(self) -> Element:
        """Create format resource element"""
        frame_duration_str = self.calc.frame_map_string(self.frame_rate)
        format_name = f"FFVideoFormat{self.width}x{self.height}p{int(self.frame_rate_float * 100)}"

        format_elem = Element('format', {
            'id': 'r1',
            'name': format_name,
            'frameDuration': f'{frame_duration_str}s',
            'width': str(self.width),
            'height': str(self.height),
            'colorSpace': '1-1-1 (Rec. 709)'
        })
        return format_elem

    def create_effect_element(self) -> Element:
        """Create effect resource element"""
        return Element('effect', {
            'id': 'r2',
            'name': 'Basic Title',
            'uid': '.../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti'
        })

    def create_title_element(self, subtitle: SubtitleItem) -> Element:
        """Create title element for a subtitle"""
        start_seconds = subtitle.start.total_seconds()
        end_seconds = subtitle.end.total_seconds()
        duration_seconds = end_seconds - start_seconds

        # Calculate timing values
        offset = (self.calc.round_custom(start_seconds * self.frame_rate_float, 0) *
                 self.frame_molecular + self.project_start)
        duration = (self.calc.round_custom(duration_seconds * self.frame_rate_float, 0) *
                   self.frame_molecular * 120000.0 / self.frame_denominator)

        title = Element('title', {
            'name': subtitle.text.replace('\n', ' ')[:50],  # Shortened for display
            'lane': '1',
            'offset': f'{int(offset)}/{int(self.frame_denominator)}s',
            'ref': 'r2',
            'duration': f'{int(duration)}/120000s',
            'start': f'{int(self.project_start)}/{int(self.frame_denominator)}s'
        })

        # Add parameters
        alignment_value = self.alignment_map.get(self.alignment, '1 (Center)')
        x_position = self.x_position_map.get(self.alignment, 0)
        self._add_param(title, 'Position', '9999/999166631/999166633/1/100/101', f'{x_position} {self.y_position}')
        self._add_param(title, 'Alignment', '9999/999166631/999166633/2/354/999169573/401', alignment_value)
        self._add_param(title, 'Flatten', '9999/999166631/999166633/2/351', '1')

        # Add text element (MUST come before text-style-def per DTD)
        text_elem = Element('text')
        text_style_ref = Element('text-style', {'ref': f'ts{subtitle.index}'})
        text_style_ref.text = subtitle.text
        text_elem.append(text_style_ref)
        title.append(text_elem)

        # Add text-style-def (MUST come after text per DTD)
        text_style_def = Element('text-style-def', {'id': f'ts{subtitle.index}'})
        text_style = Element('text-style', {
            'font': 'Helvetica',
            'fontSize': '72',
            'fontFace': 'Regular',
            'fontColor': '1 1 1 1',
            'alignment': 'center'
        })
        text_style_def.append(text_style)
        title.append(text_style_def)

        return title

    def _add_param(self, parent: Element, name: str, key: str, value: str):
        """Add parameter element to parent"""
        param = Element('param', {'name': name, 'key': key, 'value': value})
        parent.append(param)

    def build(self, subtitles: List[SubtitleItem]) -> Element:
        """Build complete fcpxml structure"""
        if not subtitles:
            raise ValueError("No subtitles provided")

        # Calculate total duration
        total_duration = subtitles[-1].end.total_seconds()
        duration_frames = self.calc.round_custom(total_duration * self.frame_rate_float, 0)
        duration_str = f'{int(duration_frames * self.frame_molecular)}/{int(self.frame_denominator)}s'

        # Root element
        fcpxml = Element('fcpxml', {'version': '1.7'})

        # Resources
        resources = Element('resources')
        resources.append(self.create_format_element())
        resources.append(self.create_effect_element())
        fcpxml.append(resources)

        # Library structure
        library = Element('library')
        event = Element('event', {'name': self.event_name})
        project = Element('project', {'name': self.project_name})
        sequence = Element('sequence', {
            'format': 'r1',
            'duration': duration_str,
            'tcStart': '0s',
            'tcFormat': 'NDF',
            'audioLayout': 'stereo',
            'audioRate': '48k'
        })
        spine = Element('spine')

        # Gap element containing all titles
        gap = Element('gap', {
            'name': '空隙',
            'offset': '0s',
            'duration': duration_str,
            'start': f'{int(self.project_start)}/{int(self.frame_denominator)}s'
        })

        # Add all subtitle titles
        for subtitle in subtitles:
            gap.append(self.create_title_element(subtitle))

        # Build hierarchy
        spine.append(gap)
        sequence.append(spine)
        project.append(sequence)
        event.append(project)
        library.append(event)
        fcpxml.append(library)

        return fcpxml


def prettify_xml(elem: Element) -> str:
    """Return a pretty-printed XML string"""
    rough_string = tostring(elem, encoding='unicode')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="    ")


def parse_frame_rate(fd_str: str) -> Union[int, float]:
    """Parse frame rate string to int or float"""
    if '.' in fd_str:
        return float(fd_str)
    else:
        return int(fd_str)


def main():
    """Main entry point matching Go CLI arguments"""
    parser = argparse.ArgumentParser(
        description='Convert SRT subtitle files to Final Cut Pro XML format'
    )
    parser.add_argument(
        '-srt',
        type=str,
        required=True,
        help='SRT subtitle file path'
    )
    parser.add_argument(
        '-fd',
        type=str,
        default='60',
        help='Frame rate: 23.98, 24, 25, 29.97, 30, 50, 59.94, 60 (default: 60)'
    )
    parser.add_argument(
        '-width',
        type=int,
        default=1920,
        help='Width resolution (default: 1920)'
    )
    parser.add_argument(
        '-height',
        type=int,
        default=1080,
        help='Height resolution (default: 1080)'
    )
    parser.add_argument(
        '-align',
        type=str,
        default='center',
        choices=['left', 'center', 'right'],
        help='Text alignment: left, center, or right (default: center)'
    )
    parser.add_argument(
        '-y',
        type=int,
        default=-420,
        help='Vertical position offset (default: -420)'
    )
    parser.add_argument(
        '-project',
        type=str,
        default=None,
        help='Project name (default: SRT filename without extension)'
    )
    parser.add_argument(
        '-event',
        type=str,
        default='_FCPXMLs',
        help='Event name (default: _FCPXMLs)'
    )
    parser.add_argument(
        '-output',
        type=str,
        default=None,
        help='Explicit output path (used by browser/pyodide runtime)'
    )

    args = parser.parse_args()

    # Validate frame rate
    supported_rates = ['23.98', '24', '25', '29.97', '30', '50', '59.94', '60']
    if args.fd not in supported_rates:
        print(f"Warning: Frame rate {args.fd} may not be supported. Supported rates: {', '.join(supported_rates)}")

    # Check if SRT file exists
    if not os.path.isfile(args.srt):
        print(f"Error: SRT file not found: {args.srt}")
        sys.exit(1)

    try:
        # Read and parse SRT file
        with open(args.srt, 'r', encoding='utf-8') as f:
            srt_content = f.read()

        subtitles = SRTParser.parse(srt_content)

        if not subtitles:
            print("Error: No valid subtitles found in SRT file")
            sys.exit(1)

        print(f"Parsed {len(subtitles)} subtitles")

        # Parse frame rate
        frame_rate = parse_frame_rate(args.fd)

        # Get project name from file or use provided name
        project_name = args.project if args.project else os.path.splitext(os.path.basename(args.srt))[0]

        # Build fcpxml
        builder = FcpXMLBuilder(
            project_name=project_name,
            frame_rate=frame_rate,
            width=args.width,
            height=args.height,
            alignment=args.align,
            y_position=args.y,
            event_name=args.event
        )
        fcpxml_element = builder.build(subtitles)

        # Generate XML string
        xml_declaration = '<?xml version="1.0" encoding="UTF-8" ?>\n<!DOCTYPE fcpxml>\n\n'
        xml_content = prettify_xml(fcpxml_element)

        # Remove the extra XML declaration from prettify_xml
        if xml_content.startswith('<?xml'):
            xml_content = '\n'.join(xml_content.split('\n')[1:])

        final_xml = xml_declaration + xml_content

        # Write output file
        # Prefer explicit output path when provided (browser uses this)
        if args.output:
            output_file = args.output
        else:
            # When running in Pyodide (browser), the virtual FS is under /
            # and sys.platform is "emscripten". Always write to a stable path
            # so the JS side knows where to read from, regardless of project name.
            if os.path.abspath(args.srt) == '/input.srt' or sys.platform == 'emscripten':
                # Running in Pyodide - always use /input.fcpxml
                output_file = '/input.fcpxml'
            else:
                # Running as CLI - use project name for file
                input_dir = os.path.dirname(os.path.abspath(args.srt))
                output_file = os.path.join(input_dir, f'{project_name}.fcpxml')

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(final_xml)

        print(f"Successfully created: {output_file}")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
