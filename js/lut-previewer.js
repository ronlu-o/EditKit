// LUT Previewer Interface
class LUTPreviewer {
    constructor() {
        this.processor = new LUTProcessor();
        this.currentImage = null;
        this.globalIntensity = 1.0;
        this.globalSliderTimeout = null;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Get DOM elements
        this.imageUploadArea = document.getElementById('imageUploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.lutUploadArea = document.getElementById('lutUploadArea');
        this.lutInput = document.getElementById('lutInput');
        this.canvasContainer = document.getElementById('canvasContainer');
        this.previewCanvas = document.getElementById('previewCanvas');
        this.uploadPrompt = document.getElementById('uploadPrompt');
        this.lutList = document.getElementById('lutList');
        this.globalIntensitySlider = document.getElementById('globalIntensity');
        this.globalIntensityValue = document.getElementById('globalIntensityValue');
        this.resetBtn = document.getElementById('resetBtn');
        this.downloadBtn = document.getElementById('downloadBtn');

        // Set up canvas in processor
        this.processor.setCanvas(this.previewCanvas);
    }

    setupEventListeners() {
        // Image upload
        this.imageUploadArea.addEventListener('click', () => this.imageInput.click());
        this.imageUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.imageUploadArea.addEventListener('drop', (e) => this.handleImageDrop(e));
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

        // LUT upload
        this.lutUploadArea.addEventListener('click', () => this.lutInput.click());
        this.lutUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.lutUploadArea.addEventListener('drop', (e) => this.handleLUTDrop(e));
        this.lutInput.addEventListener('change', (e) => this.handleLUTUpload(e));

        // Global controls
        this.globalIntensitySlider.addEventListener('input', (e) => this.handleGlobalIntensityChange(e));
        this.resetBtn.addEventListener('click', () => this.resetImage());
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('border-fcp-accent');
    }

    handleImageDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('border-fcp-accent');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.loadImage(files[0]);
        }
    }

    handleLUTDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('border-fcp-accent');
        const files = e.dataTransfer.files;
        this.loadLUTFiles(files);
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        }
    }

    handleLUTUpload(e) {
        this.loadLUTFiles(e.target.files);
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.processor.loadImage(img);
                this.showCanvas();
                this.enableControls();
                this.processCurrentImage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    loadLUTFiles(files) {
        Array.from(files).forEach(file => {
            if (file.name.toLowerCase().endsWith('.cube')) {
                this.loadLUTFile(file);
            }
        });
    }

    loadLUTFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const lut = this.processor.addLUT(file.name, e.target.result);
                this.addLUTToUI(file.name, lut);
                this.processCurrentImage();
            } catch (error) {
                this.showError(`Failed to load LUT ${file.name}: ${error.message}`);
            }
        };
        reader.readAsText(file);
    }

    addLUTToUI(filename, lut) {
        // Remove "no LUTs" message if present
        const noLUTsMessage = this.lutList.querySelector('.text-center');
        if (noLUTsMessage) {
            noLUTsMessage.remove();
        }

        const lutItem = document.createElement('div');
        lutItem.className = 'bg-fcp-dark p-4 rounded border border-gray-600';
        lutItem.dataset.filename = filename;

        lutItem.innerHTML = `
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                    <input type="checkbox" id="lut-${filename}" checked
                           class="w-4 h-4 text-fcp-accent bg-gray-700 border-gray-600 rounded focus:ring-fcp-accent">
                    <label for="lut-${filename}" class="text-white font-medium truncate">${filename.replace('.cube', '')}</label>
                </div>
                <button class="text-gray-400 hover:text-red-400 transition-colors" onclick="lutPreviewer.removeLUT('${filename}')">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="space-y-2">
                <div class="flex justify-between text-sm text-gray-400">
                    <span>Intensity</span>
                    <span class="intensity-value">100%</span>
                </div>
                <input type="range" class="lut-intensity w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                       min="0" max="100" value="100" data-filename="${filename}">
            </div>
        `;

        this.lutList.appendChild(lutItem);

        // Add event listeners
        const checkbox = lutItem.querySelector('input[type="checkbox"]');
        const slider = lutItem.querySelector('.lut-intensity');
        const valueDisplay = lutItem.querySelector('.intensity-value');

        checkbox.addEventListener('change', () => {
            this.processor.updateLUT(filename, { enabled: checkbox.checked });
            this.processCurrentImage();
        });

        // Debounce slider input to reduce lag
        let sliderTimeout;
        slider.addEventListener('input', () => {
            const intensity = slider.value / 100;
            this.processor.updateLUT(filename, { intensity });
            valueDisplay.textContent = `${slider.value}%`;

            // Clear existing timeout and set new one
            clearTimeout(sliderTimeout);
            sliderTimeout = setTimeout(() => {
                this.processCurrentImage();
            }, 100); // 100ms debounce
        });
    }

    removeLUT(filename) {
        this.processor.removeLUT(filename);
        const lutItem = this.lutList.querySelector(`[data-filename="${filename}"]`);
        if (lutItem) {
            lutItem.remove();
        }

        // Show "no LUTs" message if list is empty
        if (this.lutList.children.length === 0) {
            this.showNoLUTsMessage();
        }

        this.processCurrentImage();
    }

    showNoLUTsMessage() {
        this.lutList.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <svg class="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <p class="text-sm">No LUTs uploaded yet</p>
            </div>
        `;
    }

    handleGlobalIntensityChange(e) {
        this.globalIntensity = e.target.value / 100;
        const value = parseInt(e.target.value);

        // Show middle value only between 1-99%
        if (value > 0 && value < 100) {
            this.globalIntensityValue.textContent = `${value}%`;
            this.globalIntensityValue.classList.remove('hidden');
        } else {
            this.globalIntensityValue.classList.add('hidden');
        }

        // Debounce global intensity slider too
        clearTimeout(this.globalSliderTimeout);
        this.globalSliderTimeout = setTimeout(() => {
            this.processCurrentImage();
        }, 100);
    }

    showCanvas() {
        this.uploadPrompt.classList.add('hidden');
        this.previewCanvas.classList.remove('hidden');
    }

    enableControls() {
        this.resetBtn.disabled = false;
        this.downloadBtn.disabled = false;
    }

    processCurrentImage() {
        if (this.currentImage) {
            try {
                this.processor.processImage(this.globalIntensity);
            } catch (error) {
                this.showError('Error processing image: ' + error.message);
            }
        }
    }

    resetImage() {
        this.globalIntensitySlider.value = 100;
        this.globalIntensity = 1.0;
        this.globalIntensityValue.textContent = '100%';

        // Reset all LUT intensities and enable states
        const lutItems = this.lutList.querySelectorAll('[data-filename]');
        lutItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const slider = item.querySelector('.lut-intensity');
            const valueDisplay = item.querySelector('.intensity-value');
            const filename = item.dataset.filename;

            checkbox.checked = true;
            slider.value = 100;
            valueDisplay.textContent = '100%';

            this.processor.updateLUT(filename, { enabled: true, intensity: 1.0 });
        });

        // Re-process the image with all LUTs enabled
        this.processCurrentImage();
    }

    toggleAllLUTs(enabled) {
        const lutItems = this.lutList.querySelectorAll('[data-filename]');
        lutItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const filename = item.dataset.filename;

            checkbox.checked = enabled;
            this.processor.updateLUT(filename, { enabled });
        });
        this.processCurrentImage();
    }

    async downloadImage() {
        try {
            const blob = await this.processor.exportImage('image/jpeg', 0.92);
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'lut-preview.jpg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            this.showError('Error downloading image: ' + error.message);
        }
    }

    showError(message) {
        // Simple error display - could be enhanced with a toast system
        alert(message);
        console.error(message);
    }
}

// Initialize the LUT previewer when DOM is loaded
let lutPreviewer;
document.addEventListener('DOMContentLoaded', function() {
    lutPreviewer = new LUTPreviewer();
});