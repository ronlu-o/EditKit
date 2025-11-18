/**
 * Project Manager - FCPXML Analyzer
 * Parses and displays Final Cut Pro project data
 */

let fcpxmlData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeUpload();
});

/**
 * Initialize file upload handlers
 */
function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fcpxmlInput');
    const browseButton = document.getElementById('browseButton');
    const newAnalysisButton = document.getElementById('newAnalysisButton');

    // Browse button click
    browseButton.addEventListener('click', () => {
        fileInput.click();
    });

    // Upload area click
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-fcp-accent');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-fcp-accent');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-fcp-accent');

        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // New analysis button
    if (newAnalysisButton) {
        newAnalysisButton.addEventListener('click', () => {
            resetAnalyzer();
        });
    }
}

/**
 * Handle uploaded file
 */
function handleFile(file) {
    if (!file.name.endsWith('.fcpxml')) {
        alert('Please upload a valid FCPXML file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        parseFCPXML(e.target.result);
    };
    reader.readAsText(file);
}

/**
 * Parse FCPXML content
 */
function parseFCPXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
        alert('Error parsing FCPXML file. Please ensure it\'s a valid FCPXML file.');
        return;
    }

    fcpxmlData = xmlDoc;
    displayResults();
}

/**
 * Display all results
 */
function displayResults() {
    // Hide upload section, show results
    document.getElementById('uploadSection').classList.add('hidden');
    document.getElementById('resultsContainer').classList.remove('hidden');

    // Populate each section
    displayProjectStats();
    displayAssets();
    displayTimelineHealth();
    displayEffects();
}

/**
 * Display project tracking stats
 */
function displayProjectStats() {
    const container = document.getElementById('projectStats');

    // Get project data
    const project = fcpxmlData.querySelector('project');
    const sequence = fcpxmlData.querySelector('sequence');
    const projectName = project?.getAttribute('name') || 'Unknown Project';

    // Get timeline duration
    let duration = '0:00';
    if (sequence) {
        const durationAttr = sequence.getAttribute('duration');
        duration = formatDuration(durationAttr);
    }

    // Count clips
    const clips = fcpxmlData.querySelectorAll('spine > clip, spine > asset-clip');
    const clipCount = clips.length;

    // Count transitions
    const transitions = fcpxmlData.querySelectorAll('transition');
    const transitionCount = transitions.length;

    // Get resolution
    const format = fcpxmlData.querySelector('format');
    const width = format?.getAttribute('width') || '?';
    const height = format?.getAttribute('height') || '?';
    const resolution = `${width}×${height}`;

    // Create stat cards
    const stats = [
        { label: 'Project Name', value: projectName, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { label: 'Timeline Duration', value: duration, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { label: 'Total Clips', value: clipCount, icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z' },
        { label: 'Resolution', value: resolution, icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    ];

    container.innerHTML = stats.map(stat => `
        <div class="bg-fcp-dark p-4 rounded-lg border border-fcp-border">
            <div class="flex items-center mb-2">
                <svg class="w-5 h-5 text-fcp-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${stat.icon}"></path>
                </svg>
                <span class="text-sm text-fcp-text-secondary">${stat.label}</span>
            </div>
            <p class="text-2xl font-bold text-fcp-text">${stat.value}</p>
        </div>
    `).join('');
}

/**
 * Display asset management table
 */
function displayAssets() {
    const tbody = document.getElementById('assetsTableBody');
    const assets = fcpxmlData.querySelectorAll('asset');

    if (assets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center">No assets found</td></tr>';
        return;
    }

    const rows = Array.from(assets).map(asset => {
        const name = asset.getAttribute('name') || 'Unknown';
        const hasVideo = asset.getAttribute('hasVideo') === '1';
        const hasAudio = asset.getAttribute('hasAudio') === '1';

        // Determine type
        let type = '?';
        if (hasVideo && hasAudio) type = 'Video + Audio';
        else if (hasVideo) type = 'Video';
        else if (hasAudio) type = 'Audio';
        else type = 'Image';

        // Get duration
        const durationAttr = asset.getAttribute('duration');
        const duration = durationAttr ? formatDuration(durationAttr) : 'N/A';

        // Get codec
        const codecsElement = asset.querySelector('md[key="com.apple.proapps.spotlight.kMDItemCodecs"]');
        let codecs = 'N/A';
        if (codecsElement) {
            const codecStrings = codecsElement.querySelectorAll('string');
            codecs = Array.from(codecStrings).map(s => s.textContent).join(', ');
        }

        // Get ingest date
        const ingestElement = asset.querySelector('md[key="com.apple.proapps.mio.ingestDate"]');
        let ingestDate = 'N/A';
        if (ingestElement) {
            const dateValue = ingestElement.getAttribute('value');
            if (dateValue) {
                const date = new Date(dateValue);
                ingestDate = date.toLocaleDateString();
            }
        }

        return `
            <tr class="border-b border-fcp-border">
                <td class="py-3">${name}</td>
                <td class="py-3">${type}</td>
                <td class="py-3">${duration}</td>
                <td class="py-3 text-xs">${codecs}</td>
                <td class="py-3">${ingestDate}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;
}

/**
 * Display timeline health warnings and issues
 */
function displayTimelineHealth() {
    const container = document.getElementById('healthContainer');
    const warnings = [];
    const info = [];

    // Check for analysis markers (warnings)
    const analysisMarkers = fcpxmlData.querySelectorAll('analysis-marker');
    analysisMarkers.forEach(marker => {
        const type = marker.getAttribute('type');
        if (type === 'shake.excessive') {
            const clip = marker.closest('clip, asset-clip');
            const clipName = clip?.getAttribute('name') || 'Unknown clip';
            warnings.push({
                type: 'warning',
                message: `Excessive shake detected in "${clipName}"`
            });
        }
    });

    // Check for volume adjustments
    const volumeAdjustments = fcpxmlData.querySelectorAll('adjust-volume');
    if (volumeAdjustments.length > 0) {
        const adjustmentDetails = Array.from(volumeAdjustments).map(adj => {
            const amount = adj.getAttribute('amount');
            const clip = adj.closest('clip, asset-clip');
            const clipName = clip?.getAttribute('name') || 'Unknown';
            return `${clipName}: ${amount}`;
        });
        info.push({
            type: 'info',
            message: `Audio adjustments: ${adjustmentDetails.join(', ')}`
        });
    }

    // Check for color grading
    const colorFilters = fcpxmlData.querySelectorAll('filter-video[ref], filter-video-mask[ref]');
    const lutCount = Array.from(colorFilters).filter(f => {
        const effect = fcpxmlData.querySelector(`effect[uid="${f.getAttribute('ref')}"]`);
        return effect?.getAttribute('name')?.includes('LUT');
    }).length;

    const colorCorrectionCount = Array.from(colorFilters).filter(f => {
        const effect = fcpxmlData.querySelector(`effect[uid="${f.getAttribute('ref')}"]`);
        return effect?.getAttribute('name')?.includes('Color');
    }).length;

    if (lutCount > 0 || colorCorrectionCount > 0) {
        info.push({
            type: 'success',
            message: `Color grading: ${lutCount} LUT(s), ${colorCorrectionCount} Color Correction(s) applied`
        });
    }

    // Display results
    if (warnings.length === 0 && info.length === 0) {
        container.innerHTML = '<p class="text-fcp-text-secondary">No issues detected. Timeline looks healthy!</p>';
        return;
    }

    const items = [...warnings, ...info].map(item => {
        const colors = {
            warning: { bg: 'bg-yellow-900 bg-opacity-20', border: 'border-yellow-600', text: 'text-yellow-400' },
            info: { bg: 'bg-blue-900 bg-opacity-20', border: 'border-blue-600', text: 'text-blue-400' },
            success: { bg: 'bg-green-900 bg-opacity-20', border: 'border-green-600', text: 'text-green-400' }
        };
        const color = colors[item.type];

        return `
            <div class="flex items-start p-3 ${color.bg} border ${color.border} rounded-lg">
                <svg class="w-5 h-5 ${color.text} mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm ${color.text}">${item.message}</p>
            </div>
        `;
    }).join('');

    container.innerHTML = items;
}

/**
 * Display effects and color grading
 */
function displayEffects() {
    const container = document.getElementById('effectsContainer');
    const effects = fcpxmlData.querySelectorAll('effect');

    if (effects.length === 0) {
        container.innerHTML = '<p class="text-fcp-text-secondary">No effects found in project resources</p>';
        return;
    }

    // Group effects by type
    const effectsMap = new Map();
    effects.forEach(effect => {
        const name = effect.getAttribute('name');
        if (!effectsMap.has(name)) {
            effectsMap.set(name, {
                name: name,
                count: 0,
                uid: effect.getAttribute('uid')
            });
        }
        effectsMap.get(name).count++;
    });

    // Get detailed effect parameters from timeline
    const timeline = fcpxmlData.querySelector('spine');
    const detailedEffects = [];

    if (timeline) {
        // Find all applied filters with parameters
        const appliedFilters = timeline.querySelectorAll('filter-video[ref], filter-video-mask[ref]');

        appliedFilters.forEach(filter => {
            const effectUid = filter.getAttribute('ref');
            const effect = fcpxmlData.querySelector(`effect[uid="${effectUid}"]`);
            if (!effect) return;

            const effectName = effect.getAttribute('name');
            const clip = filter.closest('clip, asset-clip');
            const clipName = clip?.getAttribute('name') || 'Unknown';

            // Extract parameters
            const params = {};
            filter.querySelectorAll('param').forEach(param => {
                const key = param.getAttribute('key') || param.getAttribute('name');
                const value = param.getAttribute('value');
                if (key && value) {
                    params[key] = value;
                }
            });

            detailedEffects.push({
                clipName,
                effectName,
                params
            });
        });
    }

    // Group by effect type and show details
    const effectCards = [];

    // LUT effects with mix values
    const lutEffects = detailedEffects.filter(e => e.effectName?.includes('LUT'));
    if (lutEffects.length > 0) {
        const lutDetails = lutEffects.map(e =>
            `<li class="text-sm text-fcp-text-secondary">${e.clipName}: Mix ${e.params['Mix'] || 'N/A'}</li>`
        ).join('');
        effectCards.push(`
            <div class="bg-fcp-dark p-4 rounded-lg border border-fcp-border">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-fcp-text">Custom LUT</h3>
                    <span class="px-3 py-1 bg-fcp-accent bg-opacity-20 text-fcp-accent rounded-full text-sm">
                        ${lutEffects.length} clips
                    </span>
                </div>
                <ul class="space-y-1">${lutDetails}</ul>
            </div>
        `);
    }

    // Color Correction effects
    const colorEffects = detailedEffects.filter(e => e.effectName?.includes('Color Correction'));
    if (colorEffects.length > 0) {
        const colorDetails = colorEffects.map(e => {
            const sat = e.params['Saturation Global'];
            return `<li class="text-sm text-fcp-text-secondary">${e.clipName}${sat ? `: Saturation ${sat}` : ''}</li>`;
        }).join('');
        effectCards.push(`
            <div class="bg-fcp-dark p-4 rounded-lg border border-fcp-border">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-fcp-text">Color Correction</h3>
                    <span class="px-3 py-1 bg-green-900 bg-opacity-20 text-green-400 rounded-full text-sm">
                        ${colorEffects.length} clips
                    </span>
                </div>
                <ul class="space-y-1">${colorDetails}</ul>
            </div>
        `);
    }

    // Sharpen effects
    const sharpenEffects = detailedEffects.filter(e => e.effectName?.includes('Sharpen'));
    if (sharpenEffects.length > 0) {
        const sharpenDetails = sharpenEffects.map(e => {
            const amount = e.params['Amount'];
            return `<li class="text-sm text-fcp-text-secondary">${e.clipName}${amount ? `: Amount ${amount}` : ''}</li>`;
        }).join('');
        effectCards.push(`
            <div class="bg-fcp-dark p-4 rounded-lg border border-fcp-border">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-fcp-text">Sharpen</h3>
                    <span class="px-3 py-1 bg-purple-900 bg-opacity-20 text-purple-400 rounded-full text-sm">
                        ${sharpenEffects.length} clips
                    </span>
                </div>
                <ul class="space-y-1">${sharpenDetails}</ul>
            </div>
        `);
    }

    // Other effects
    const otherEffects = detailedEffects.filter(e =>
        !e.effectName?.includes('LUT') &&
        !e.effectName?.includes('Color Correction') &&
        !e.effectName?.includes('Sharpen')
    );
    if (otherEffects.length > 0) {
        const otherDetails = otherEffects.map(e =>
            `<li class="text-sm text-fcp-text-secondary">${e.clipName}: ${e.effectName}</li>`
        ).join('');
        effectCards.push(`
            <div class="bg-fcp-dark p-4 rounded-lg border border-fcp-border">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-fcp-text">Other Effects</h3>
                    <span class="px-3 py-1 bg-gray-700 bg-opacity-50 text-gray-300 rounded-full text-sm">
                        ${otherEffects.length} clips
                    </span>
                </div>
                <ul class="space-y-1">${otherDetails}</ul>
            </div>
        `);
    }

    container.innerHTML = effectCards.length > 0 ? effectCards.join('') : '<p class="text-fcp-text-secondary">No effects applied in timeline</p>';
}

/**
 * Get icon/badge text for effect type
 */
function getEffectIcon(effectName) {
    if (effectName.includes('LUT')) return 'LUT';
    if (effectName.includes('Color')) return 'Color';
    if (effectName.includes('Sharpen')) return 'Sharpen';
    if (effectName.includes('Blur')) return 'Blur';
    if (effectName.includes('Cross Dissolve')) return 'Transition';
    return 'Effect';
}

/**
 * Format duration from FCPXML format (e.g., "5203700/6000s") to readable format
 */
function formatDuration(durationStr) {
    if (!durationStr || durationStr === '0s') return '0:00';

    // Parse fraction (e.g., "5203700/6000s")
    const match = durationStr.match(/^(\d+)\/(\d+)s$/);
    if (!match) return durationStr;

    const numerator = parseInt(match[1]);
    const denominator = parseInt(match[2]);
    const totalSeconds = Math.floor(numerator / denominator);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
}

/**
 * Reset analyzer to initial state
 */
function resetAnalyzer() {
    fcpxmlData = null;
    document.getElementById('uploadSection').classList.remove('hidden');
    document.getElementById('resultsContainer').classList.add('hidden');
    document.getElementById('fcpxmlInput').value = '';
}
