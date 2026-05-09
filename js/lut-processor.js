// LUT Processing Engine — WebGL2 renderer
class LUTProcessor {
    constructor() {
        this.luts = new Map();
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.vao = null;
        this.imageTexture = null;
        this.lutTexture = null;
        this.originalImage = null;
        this._lutDirty = true;
        this._combinedLUT = null; // { bytes: Uint8Array, size: number }
        this._uniforms = {};
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
                const values = line.split(/\s+/).map(parseFloat);
                if (values.length >= 3 && !values.some(isNaN)) {
                    lutData.push(values.slice(0, 3));
                }
            }
        }

        if (size === 0) size = Math.round(Math.cbrt(lutData.length));

        if (lutData.length !== size * size * size) {
            throw new Error(`Invalid LUT data: expected ${size * size * size} entries, got ${lutData.length}`);
        }

        return { title, size, domainMin, domainMax, data: lutData, enabled: true, intensity: 1.0 };
    }

    setCanvas(canvas) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
        if (!gl) throw new Error('WebGL2 is not supported in this browser');
        this.gl = gl;
        this._initGL();
        console.log('[LUTProcessor] WebGL2 renderer active —', gl.getParameter(gl.VERSION));
    }

    _initGL() {
        const gl = this.gl;

        const vert = `#version 300 es
            in vec2 aPos;
            out vec2 vUV;
            void main() {
                vUV = aPos * 0.5 + 0.5;
                vUV.y = 1.0 - vUV.y;
                gl_Position = vec4(aPos, 0.0, 1.0);
            }`;

        // Fragment shader: LUT lookup via hardware-trilinear 3D texture sample,
        // then global intensity blend, brightness offset, and saturation adjustment.
        const frag = `#version 300 es
            precision highp float;
            uniform sampler2D uImage;
            uniform highp sampler3D uLUT;
            uniform float uLUTSize;
            uniform bool uHasLUT;
            uniform float uIntensity;
            uniform float uBrightness;
            uniform float uSaturation;
            in vec2 vUV;
            out vec4 fragColor;
            void main() {
                vec4 src = texture(uImage, vUV);
                vec3 rgb = src.rgb;
                vec3 orig = rgb;
                if (uHasLUT) {
                    // Remap to texel centers to avoid edge-clamping artifacts
                    float scale = (uLUTSize - 1.0) / uLUTSize;
                    float bias  = 0.5 / uLUTSize;
                    rgb = texture(uLUT, rgb * scale + bias).rgb;
                }
                rgb = mix(orig, rgb, uIntensity);
                rgb = clamp(rgb + uBrightness, 0.0, 1.0);
                float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
                rgb = clamp(mix(vec3(luma), rgb, uSaturation), 0.0, 1.0);
                fragColor = vec4(rgb, src.a);
            }`;

        const vs = this._compile(gl.VERTEX_SHADER, vert);
        const fs = this._compile(gl.FRAGMENT_SHADER, frag);
        this.program = this._link(vs, fs);

        gl.useProgram(this.program);
        for (const name of ['uImage', 'uLUT', 'uLUTSize', 'uHasLUT', 'uIntensity', 'uBrightness', 'uSaturation']) {
            this._uniforms[name] = gl.getUniformLocation(this.program, name);
        }

        // Full-screen quad — two triangles via TRIANGLE_STRIP
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(this.program, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        gl.bindVertexArray(null);

        this.imageTexture = gl.createTexture();
        this.lutTexture = gl.createTexture();
    }

    _compile(type, src) {
        const gl = this.gl;
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
    }

    _link(vs, fs) {
        const gl = this.gl;
        const p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        return p;
    }

    loadImage(imageElement) {
        const { naturalWidth: nw, naturalHeight: nh } = imageElement;
        const aspect = nw / nh;

        let sw = nw, sh = nh, sx = 0, sy = 0;
        if (aspect > 21 / 9)      { sh = Math.round(nw / (21 / 9)); sy = (nh - sh) / 2; }
        else if (aspect < 9 / 21) { sw = Math.round(nh * (9 / 21)); sx = (nw - sw) / 2; }

        this.canvas.width  = sw;
        this.canvas.height = sh;

        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        if (sx || sy || sw !== nw || sh !== nh) {
            // Crop via offscreen 2D canvas before uploading to GPU
            const off = document.createElement('canvas');
            off.width = sw; off.height = sh;
            off.getContext('2d').drawImage(imageElement, sx, sy, sw, sh, 0, 0, sw, sh);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);
        }

        this.originalImage = imageElement;
    }

    // Combine all enabled LUTs into a single 3D LUT on the CPU.
    // Cost is O(size^3) per LUT — ~36k iterations for a 33-point LUT, not millions of pixels.
    _buildCombinedLUT() {
        const active = this.getAllLUTs().filter(l => l.enabled);
        if (!active.length) { this._combinedLUT = null; return; }

        const size  = active[0].size;
        const total = size * size * size;
        const rgb   = new Float32Array(total * 3);

        // Identity LUT as starting point
        for (let b = 0; b < size; b++)
        for (let g = 0; g < size; g++)
        for (let r = 0; r < size; r++) {
            const i = (b * size * size + g * size + r) * 3;
            rgb[i]     = r / (size - 1);
            rgb[i + 1] = g / (size - 1);
            rgb[i + 2] = b / (size - 1);
        }

        // Apply each LUT in sequence, blending by per-LUT intensity
        for (const lut of active) {
            for (let i = 0; i < total; i++) {
                const [nr, ng, nb] = this._trilinear(lut, rgb[i*3], rgb[i*3+1], rgb[i*3+2]);
                rgb[i*3]   += lut.intensity * (nr - rgb[i*3]);
                rgb[i*3+1] += lut.intensity * (ng - rgb[i*3+1]);
                rgb[i*3+2] += lut.intensity * (nb - rgb[i*3+2]);
            }
        }

        const bytes = new Uint8Array(total * 3);
        for (let i = 0; i < total * 3; i++) {
            bytes[i] = Math.round(Math.min(1, Math.max(0, rgb[i])) * 255);
        }
        this._combinedLUT = { bytes, size };
    }

    _trilinear(lut, r, g, b) {
        const sz = lut.size, d = lut.data;
        r = Math.max(lut.domainMin[0], Math.min(lut.domainMax[0], r));
        g = Math.max(lut.domainMin[1], Math.min(lut.domainMax[1], g));
        b = Math.max(lut.domainMin[2], Math.min(lut.domainMax[2], b));

        const ri = r * (sz - 1), gi = g * (sz - 1), bi = b * (sz - 1);
        const r0 = Math.floor(ri), r1 = Math.min(r0 + 1, sz - 1);
        const g0 = Math.floor(gi), g1 = Math.min(g0 + 1, sz - 1);
        const b0 = Math.floor(bi), b1 = Math.min(b0 + 1, sz - 1);
        const rf = ri - r0, gf = gi - g0, bf = bi - b0;

        const idx  = (r, g, b) => b * sz * sz + g * sz + r;
        const lerp = (a, b, t) => [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];

        return lerp(
            lerp(lerp(d[idx(r0,g0,b0)], d[idx(r1,g0,b0)], rf), lerp(d[idx(r0,g1,b0)], d[idx(r1,g1,b0)], rf), gf),
            lerp(lerp(d[idx(r0,g0,b1)], d[idx(r1,g0,b1)], rf), lerp(d[idx(r0,g1,b1)], d[idx(r1,g1,b1)], rf), gf),
            bf
        );
    }

    _uploadLUT() {
        if (!this._combinedLUT) return;
        const gl = this.gl;
        const { bytes, size } = this._combinedLUT;
        gl.bindTexture(gl.TEXTURE_3D, this.lutTexture);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB8, size, size, size, 0, gl.RGB, gl.UNSIGNED_BYTE, bytes);
    }

    processImage(globalIntensity = 1.0, brightnessOffset = 0, saturationFactor = 1.0) {
        if (!this.originalImage) throw new Error('No image loaded');
        const gl = this.gl;

        if (this._lutDirty) {
            this._buildCombinedLUT();
            this._uploadLUT();
            this._lutDirty = false;
        }

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
        gl.uniform1i(this._uniforms.uImage, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_3D, this.lutTexture);
        gl.uniform1i(this._uniforms.uLUT, 1);

        gl.uniform1f(this._uniforms.uLUTSize,    this._combinedLUT ? this._combinedLUT.size : 33);
        gl.uniform1i(this._uniforms.uHasLUT,     this._combinedLUT ? 1 : 0);
        gl.uniform1f(this._uniforms.uIntensity,  globalIntensity);
        gl.uniform1f(this._uniforms.uBrightness, brightnessOffset / 255);
        gl.uniform1f(this._uniforms.uSaturation, saturationFactor);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);

        return null;
    }

    exportImage(format = 'image/jpeg', quality = 0.92) {
        return new Promise(resolve => {
            this.canvas ? this.canvas.toBlob(resolve, format, quality) : resolve(null);
        });
    }

    reset() {
        if (this.originalImage) this.processImage();
    }

    addLUT(filename, content) {
        const lut = this.parseCubeLUT(content, filename);
        this.luts.set(filename, lut);
        this._lutDirty = true;
        return lut;
    }

    removeLUT(filename) {
        const ok = this.luts.delete(filename);
        this._lutDirty = true;
        return ok;
    }

    getAllLUTs()          { return Array.from(this.luts.values()); }
    getLUT(filename)      { return this.luts.get(filename); }

    updateLUT(filename, properties) {
        const lut = this.luts.get(filename);
        if (lut) { Object.assign(lut, properties); this._lutDirty = true; }
        return lut;
    }
}
