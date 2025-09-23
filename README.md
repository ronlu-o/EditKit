# FCP Workflow Tools

A responsive web application providing essential workflow tools for Final Cut Pro video editors.

## Features

### Subtitle Tools
- **LRCX to SRT Converter** - Convert LRCX lyric files to SRT format with intelligent filtering
- **VTT to SRT Converter** - Convert WebVTT files to SRT format
- **SRT Time Shifter** - Adjust subtitle timing with precise offset controls
- **SRT Cleaner** - Remove formatting and fix encoding issues
- **SRT Merger** - Combine multiple SRT files
- **SRT Creator** - Create new subtitle files from scratch

### LUT Previewer
- Upload and preview .cube LUT files
- Apply LUTs to test images before Final Cut Pro import

### Project Management Tools
- Timeline calculators
- Frame rate converters
- Project organization utilities

## Technology

- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript
- **Python Runtime**: Pyodide for client-side Python processing
- **File Processing**: Native browser APIs with drag-and-drop support
- **Hosting**: Static site compatible (GitHub Pages, Netlify, Vercel)

## Development

### Project Structure
```
/
├── index.html              # Main landing page
├── subtitles.html         # Subtitle tools interface
├── js/
│   ├── main.js           # Navigation and common functionality
│   ├── python-converter.js # Pyodide Python runtime
│   └── subtitles.js      # Subtitle tool logic
└── python scripts/       # Reference Python implementations
```

### Running Locally
1. Clone the repository
2. Open `index.html` in a modern web browser
3. No build process required - runs entirely client-side

### Adding New Tools
1. Add tool card to appropriate page
2. Implement conversion logic in Python within `python-converter.js`
3. Add JavaScript handler in corresponding tool file

## Contributing

This project streamlines video editing workflows by providing browser-based tools that eliminate the need for desktop software installations.

## License

MIT License - Feel free to use and modify for your projects.