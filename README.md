# <img src="logo.png" alt="EditKit Logo" width="40" height="40" align="left"> EditKit

**Browser-Based Workflow Tools for Video Editors.**

[🌐 **Visit EditKit**](https://editkit.net/)

No installations, no servers, and no data collection; just powerful tools that run instantly in your web browser.

## Why EditKit?

EditKit solves common file and preparation tasks without ever leaving your machine.

* **⚡ Zero Setup:** Open the page and start working immediately.
* **🔒 Privacy First:** Your files never leave your machine; all processing happens client-side.
* **🆓 Free & Open Source:** The tools are free forever and built on an MIT License.

## Tools Included

Utilities that streamline other content creators' video workflow.

* **Subtitle Converters:** Convert, merge, sync, and clean subtitle files (SRT, VTT, LRCX, etc.).
* **SRT to FCPXML:** Convert subtitle files to Final Cut Pro XML title format with customizable settings.
* **LUT Previewer:** Instantly test `.cube` LUT files on your images before applying them in your main editor.

## Why I Built This

I've been stylizing and batch producing subtitles ever since I started creating content. There weren't many free softwares that helped with my workflow, so I started writing Python scripts to handle subtitle conversions, timing adjustments, and format cleanups: mostly piecing code together with limited programming knowledge from self-teaching.

These tools come from those scripts, dating all the way back to 2022. And now that I've got more technological knowledge, I believe it was the adequate time to publish them.

## Tech Stack

EditKit is built entirely from static assets, making it fast and easy to host:

* **Frontend:** HTML, CSS (Tailwind), and JavaScript.
* **Core Logic:** Pyodide for complex Python processing running directly in the browser.

## Contributing

Contributions are always welcomed! If you found a bug or have a great feature idea, please [open an issue here](https://github.com/ronlu-o/EditKit/issues) or submit a pull request.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/ronapps)

## Credits & Acknowledgments

* **SRT to FCPXML converter** is based on [srt2fcpxml](https://github.com/GanymedeNil/srt2fcpxml) by GanymedeNil, ported to Python with browser compatibility and additional features.
