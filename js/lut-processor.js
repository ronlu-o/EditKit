// LUT Processing Engine
class LUTProcessor {
    constructor() {
        this.luts = new Map(); // Store parsed LUT data
        this.canvas = null;
        this.ctx = null;
        this.originalImageData = null;
        this.currentImageData = null;
    }

    // Parse .cube LUT file format
    parseCubeLUT(content, filename) {
        const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

        let size = 0;
        let title = filename.replace('.cube', '');
        let domainMin = [0, 0, 0];
        let domainMax = [1, 1, 1];
        let lutData = [];

        for (const line of lines) {
            if (line.startsWith('TITLE')) {
                title = line.split('"')[1] || title;
            } else if (line.startsWith('LUT_3D_SIZE')) {
                size = parseInt(line.split(' ')[1]);
            } else if (line.startsWith('DOMAIN_MIN')) {
                domainMin = line.split(' ').slice(1).map(parseFloat);
            } else if (line.startsWith('DOMAIN_MAX')) {
                domainMax = line.split(' ').slice(1).map(parseFloat);
            } else if (!line.match(/^[A-Z_]/)) {
                // Data line - should contain 3 float values
                const values = line.split(/\s+/).map(parseFloat);
                if (values.length >= 3 && !values.some(isNaN)) {
                    lutData.push(values.slice(0, 3));
                }
            }
        }

        if (size === 0) {
            // Try to infer size from data length
            const dataLength = lutData.length;
            size = Math.round(Math.cbrt(dataLength));
        }

        if (lutData.length !== size * size * size) {
            throw new Error(`Invalid LUT data: expected ${size * size * size} entries, got ${lutData.length}`);
        }

        return {
            title,
            size,
            domainMin,
            domainMax,
            data: lutData,
            enabled: true,
            intensity: 1.0
        };
    }

    // Apply LUT to image data
    applyLUT(imageData, lut, intensity = 1.0) {
        if (!lut.enabled || intensity === 0) return imageData;

        const data = imageData.data;
        const result = new ImageData(new Uint8ClampedArray(data), imageData.width, imageData.height);
        const lutSize = lut.size;
        const lutData = lut.data;

        for (let i = 0; i < data.length; i += 4) {
            // Normalize RGB values to 0-1 range
            let r = data[i] / 255;
            let g = data[i + 1] / 255;
            let b = data[i + 2] / 255;

            // Clamp to domain
            r = Math.max(lut.domainMin[0], Math.min(lut.domainMax[0], r));
            g = Math.max(lut.domainMin[1], Math.min(lut.domainMax[1], g));
            b = Math.max(lut.domainMin[2], Math.min(lut.domainMax[2], b));

            // Map to LUT coordinates
            const rIndex = (r * (lutSize - 1));
            const gIndex = (g * (lutSize - 1));
            const bIndex = (b * (lutSize - 1));

            // Get integer and fractional parts for interpolation
            const rLow = Math.floor(rIndex);
            const gLow = Math.floor(gIndex);
            const bLow = Math.floor(bIndex);

            const rHigh = Math.min(rLow + 1, lutSize - 1);
            const gHigh = Math.min(gLow + 1, lutSize - 1);
            const bHigh = Math.min(bLow + 1, lutSize - 1);

            const rFrac = rIndex - rLow;
            const gFrac = gIndex - gLow;
            const bFrac = bIndex - bLow;

            // Trilinear interpolation
            const c000 = this.getLUTValue(lutData, lutSize, rLow, gLow, bLow);
            const c001 = this.getLUTValue(lutData, lutSize, rLow, gLow, bHigh);
            const c010 = this.getLUTValue(lutData, lutSize, rLow, gHigh, bLow);
            const c011 = this.getLUTValue(lutData, lutSize, rLow, gHigh, bHigh);
            const c100 = this.getLUTValue(lutData, lutSize, rHigh, gLow, bLow);
            const c101 = this.getLUTValue(lutData, lutSize, rHigh, gLow, bHigh);
            const c110 = this.getLUTValue(lutData, lutSize, rHigh, gHigh, bLow);
            const c111 = this.getLUTValue(lutData, lutSize, rHigh, gHigh, bHigh);

            // Interpolate along x-axis
            const c00 = this.interpolate(c000, c100, rFrac);
            const c01 = this.interpolate(c001, c101, rFrac);
            const c10 = this.interpolate(c010, c110, rFrac);
            const c11 = this.interpolate(c011, c111, rFrac);

            // Interpolate along y-axis
            const c0 = this.interpolate(c00, c10, gFrac);
            const c1 = this.interpolate(c01, c11, gFrac);

            // Interpolate along z-axis
            const finalColor = this.interpolate(c0, c1, bFrac);

            // Apply intensity blending
            const newR = r + intensity * (finalColor[0] - r);
            const newG = g + intensity * (finalColor[1] - g);
            const newB = b + intensity * (finalColor[2] - b);

            // Convert back to 0-255 range
            result.data[i] = Math.round(newR * 255);
            result.data[i + 1] = Math.round(newG * 255);
            result.data[i + 2] = Math.round(newB * 255);
            result.data[i + 3] = data[i + 3]; // Preserve alpha
        }

        return result;
    }

    // Get LUT value at specific coordinates
    getLUTValue(lutData, size, r, g, b) {
        const index = b * size * size + g * size + r;
        return lutData[index] || [0, 0, 0];
    }

    // Linear interpolation between two color values
    interpolate(color1, color2, factor) {
        return [
            color1[0] + factor * (color2[0] - color1[0]),
            color1[1] + factor * (color2[1] - color1[1]),
            color1[2] + factor * (color2[2] - color1[2])
        ];
    }

    // Apply multiple LUTs in sequence
    applyMultipleLUTs(imageData, activeLUTs, globalIntensity = 1.0) {
        let result = new ImageData(
            new Uint8ClampedArray(imageData.data),
            imageData.width,
            imageData.height
        );

        for (const lut of activeLUTs) {
            const effectiveIntensity = lut.intensity * globalIntensity;
            result = this.applyLUT(result, lut, effectiveIntensity);
        }

        return result;
    }

    // Add LUT to collection
    addLUT(filename, content) {
        try {
            const lut = this.parseCubeLUT(content, filename);
            this.luts.set(filename, lut);
            return lut;
        } catch (error) {
            console.error(`Failed to parse LUT ${filename}:`, error);
            throw error;
        }
    }

    // Remove LUT from collection
    removeLUT(filename) {
        return this.luts.delete(filename);
    }

    // Get all LUTs
    getAllLUTs() {
        return Array.from(this.luts.values());
    }

    // Get LUT by filename
    getLUT(filename) {
        return this.luts.get(filename);
    }

    // Update LUT properties
    updateLUT(filename, properties) {
        const lut = this.luts.get(filename);
        if (lut) {
            Object.assign(lut, properties);
        }
        return lut;
    }

    // Set canvas for processing
    setCanvas(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    // Load and store original image
    loadImage(imageElement) {
        if (!this.canvas || !this.ctx) {
            throw new Error('Canvas not set');
        }

        const naturalWidth = imageElement.naturalWidth;
        const naturalHeight = imageElement.naturalHeight;
        const aspectRatio = naturalWidth / naturalHeight;

        // Cap aspect ratio to 21:9 for horizontal and 9:21 for vertical
        const maxHorizontalAspect = 21 / 9; // ~2.33
        const maxVerticalAspect = 9 / 21; // ~0.43

        let width = naturalWidth;
        let height = naturalHeight;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = naturalWidth;
        let sourceHeight = naturalHeight;

        if (aspectRatio > maxHorizontalAspect) {
            // Too wide - crop to 21:9
            sourceHeight = Math.round(naturalWidth / maxHorizontalAspect);
            sourceY = (naturalHeight - sourceHeight) / 2;
            height = sourceHeight;
        } else if (aspectRatio < maxVerticalAspect) {
            // Too tall - crop to 9:21
            sourceWidth = Math.round(naturalHeight * maxVerticalAspect);
            sourceX = (naturalWidth - sourceWidth) / 2;
            width = sourceWidth;
        }

        // Resize canvas to match calculated dimensions
        this.canvas.width = width;
        this.canvas.height = height;

        // Draw image (with cropping if needed, using center crop)
        this.ctx.drawImage(
            imageElement,
            sourceX, sourceY,
            sourceWidth, sourceHeight,
            0, 0,
            width, height
        );

        // Store original image data
        this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.currentImageData = new ImageData(
            new Uint8ClampedArray(this.originalImageData.data),
            this.originalImageData.width,
            this.originalImageData.height
        );
    }

    // Process current image with active LUTs
    processImage(globalIntensity = 1.0) {
        if (!this.originalImageData) {
            throw new Error('No image loaded');
        }

        const activeLUTs = this.getAllLUTs().filter(lut => lut.enabled);
        this.currentImageData = this.applyMultipleLUTs(this.originalImageData, activeLUTs, globalIntensity);

        // Update canvas
        if (this.ctx) {
            this.ctx.putImageData(this.currentImageData, 0, 0);
        }

        return this.currentImageData;
    }

    // Reset to original image
    reset() {
        if (this.originalImageData && this.ctx) {
            this.currentImageData = new ImageData(
                new Uint8ClampedArray(this.originalImageData.data),
                this.originalImageData.width,
                this.originalImageData.height
            );
            this.ctx.putImageData(this.currentImageData, 0, 0);
        }
    }

    // Export processed image as blob
    exportImage(format = 'image/jpeg', quality = 0.92) {
        return new Promise((resolve) => {
            if (this.canvas) {
                this.canvas.toBlob(resolve, format, quality);
            } else {
                resolve(null);
            }
        });
    }
}