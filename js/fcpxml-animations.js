/**
 * FCPXML Page Animations (2025)
 * Sequenced reveal that guides user through the form workflow
 */

const { animate, stagger, inView } = Motion;

/**
 * Initialize FCPXML page animations
 */
function initFCPXMLAnimations() {
    initHeaderAnimation();
    initFormSequence();
    initInteractiveEffects();
}

/**
 * Animate header section - fade only, no movement
 */
function initHeaderAnimation() {
    const h1 = document.querySelector('main h1');
    const paragraphs = document.querySelectorAll('main > div.text-center p');

    if (h1) {
        animate(
            h1,
            { opacity: [0, 1] },
            { duration: 0.5, easing: 'ease-out' }
        );
    }

    if (paragraphs.length > 0) {
        animate(
            paragraphs,
            { opacity: [0, 1] },
            {
                duration: 0.5,
                delay: stagger(0.05, { start: 0.1 }),
                easing: 'ease-out'
            }
        );
    }
}

/**
 * Sequenced form reveal that follows user workflow:
 * 1. Upload Area -> 2. Manual Input Toggle -> 3. Settings -> 4. Convert Button
 */
function initFormSequence() {
    const uploadArea = document.getElementById('uploadArea');
    const manualInputToggle = document.getElementById('toggleManualInput');
    const settingsGrid = document.querySelector('.grid');
    const convertBtn = document.getElementById('convertBtn');
    const credits = document.querySelector('main > div.text-center.mt-6');

    // 1. Upload area (most important interaction) - fade only
    if (uploadArea) {
        animate(
            uploadArea,
            { opacity: [0, 1] },
            { duration: 0.4, delay: 0.2, easing: 'ease-out' }
        );
    }

    // 2. Manual input toggle - fade only
    if (manualInputToggle) {
        animate(
            manualInputToggle,
            { opacity: [0, 1] },
            { duration: 0.3, delay: 0.3, easing: 'ease-out' }
        );
    }

    // 3. Settings grid - staggered reveal, fade only
    if (settingsGrid) {
        const settingElements = settingsGrid.querySelectorAll(':scope > div');
        animate(
            settingElements,
            { opacity: [0, 1] },
            {
                duration: 0.4,
                delay: stagger(0.05, { start: 0.4 }),
                easing: 'ease-out'
            }
        );
    }

    // 3b. Animate form labels independently for clarity
    const labels = document.querySelectorAll('.grid label');
    if (labels.length > 0) {
        animate(
            labels,
            { opacity: [0, 1] },
            {
                duration: 0.3,
                delay: stagger(0.03, { start: 0.45 }),
                easing: 'ease-out'
            }
        );
    }

    // 4. Convert button (final call-to-action) - fade only
    if (convertBtn) {
        animate(
            convertBtn,
            { opacity: [0, 1] },
            { duration: 0.4, delay: 0.7, easing: 'ease-out' }
        );
    }

    // 5. Credits (subtle, last)
    if (credits) {
        animate(
            credits,
            { opacity: [0, 1] },
            { duration: 0.3, delay: 0.8, easing: 'ease-out' }
        );
    }
}

/**
 * Interactive animations for form elements
 */
function initInteractiveEffects() {
    animateManualInputToggle();
    animateUploadAreaDragOver();
    animateSettingsFocus();
}

/**
 * Smooth expand/collapse for manual input section
 */
function animateManualInputToggle() {
    const toggleBtn = document.getElementById('toggleManualInput');
    const manualInputContainer = document.getElementById('manualInputContainer');
    const exitBtn = document.getElementById('exitManualInput');
    const uploadArea = document.getElementById('uploadArea');

    if (!toggleBtn || !manualInputContainer || !uploadArea) return;

    toggleBtn.addEventListener('click', () => {
        // Animate the reveal
        manualInputContainer.classList.remove('hidden');
        animate(
            manualInputContainer,
            { opacity: [0, 1], height: [0, 'auto'] },
            { duration: 0.3, easing: 'ease-out' }
        );

        // Fade out upload area
        animate(
            uploadArea,
            { opacity: 0.5, scale: 0.98 },
            { duration: 0.2 }
        );
    });

    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            // Animate the collapse
            const animation = animate(
                manualInputContainer,
                { opacity: [1, 0], height: ['auto', 0] },
                { duration: 0.2, easing: 'ease-in' }
            );

            if (animation && animation.finished) {
                animation.finished.then(() => {
                    manualInputContainer.classList.add('hidden');
                });
            }

            // Restore upload area
            animate(
                uploadArea,
                { opacity: 1, scale: 1 },
                { duration: 0.2 }
            );
        });
    }
}

/**
 * Enhanced drag-over animation for upload area
 */
function animateUploadAreaDragOver() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        animate(
            uploadArea,
            { scale: 1.02, borderColor: '#0A84FF' },
            { duration: 0.2, easing: 'ease-out' }
        );
    });

    uploadArea.addEventListener('dragleave', () => {
        animate(
            uploadArea,
            { scale: 1, borderColor: '#4B5563' },
            { duration: 0.2, easing: 'ease-out' }
        );
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        animate(
            uploadArea,
            { scale: [1.02, 0.98, 1] },
            { duration: 0.3, easing: [0.34, 1.56, 0.64, 1] }
        );
    });
}

/**
 * Subtle highlight for focused settings inputs
 */
function animateSettingsFocus() {
    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            const parent = input.closest('div');
            if (parent) {
                animate(
                    parent,
                    { scale: [1, 1.01, 1] },
                    { duration: 0.3, easing: 'ease-out' }
                );
            }
        });
    });
}

// Respect reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    // Initialize animations when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFCPXMLAnimations);
    } else {
        initFCPXMLAnimations();
    }
}
