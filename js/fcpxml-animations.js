/**
 * FCPXML Page Animations (2025)
 * Handles interactive effects for the FCPXML converter page.
 * Entrance animations are managed by the View Transition API.
 */

const { animate } = Motion;

/**
 * Initialize FCPXML page's interactive animations.
 */
function initFCPXMLAnimations() {
    initInteractiveEffects();
}

/**
 * Adds animations for user interactions like clicks, focus, and drag-overs.
 */
function initInteractiveEffects() {
    animateManualInputToggle();
    animateUploadAreaDragOver();
    animateSettingsFocus();
}

/**
 * Smoothly expands and collapses the manual SRT input section.
 */
function animateManualInputToggle() {
    const toggleBtn = document.getElementById('toggleManualInput');
    const manualInputContainer = document.getElementById('manualInputContainer');
    const exitBtn = document.getElementById('exitManualInput');
    const uploadArea = document.getElementById('uploadArea');

    if (!toggleBtn || !manualInputContainer || !uploadArea) return;

    toggleBtn.addEventListener('click', () => {
        manualInputContainer.classList.remove('hidden');
        animate(manualInputContainer, { opacity: [0, 1] }, { duration: 0.3, easing: 'ease-out' });
        animate(uploadArea, { opacity: 0.5 }, { duration: 0.2 });
    });

    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            const animation = animate(manualInputContainer, { opacity: [1, 0] }, { duration: 0.2, easing: 'ease-in' });
            animation.finished.then(() => {
                manualInputContainer.classList.add('hidden');
            });
            animate(uploadArea, { opacity: 1 }, { duration: 0.2 });
        });
    }
}

/**
 * Provides visual feedback when a file is dragged over the upload area.
 */
function animateUploadAreaDragOver() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    const highlight = () => animate(uploadArea, { borderColor: '#0A84FF' }, { duration: 0.2, easing: 'ease-out' });
    const unhighlight = () => animate(uploadArea, { borderColor: '#4B5563' }, { duration: 0.2, easing: 'ease-out' });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        highlight();
    });
    uploadArea.addEventListener('dragleave', unhighlight);
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        unhighlight();
        animate(uploadArea, { opacity: [1, 0.8, 1] }, { duration: 0.3, easing: 'ease-out' });
    });
}

/**
 * Adds a subtle pulse effect when a user focuses on a form input.
 */
function animateSettingsFocus() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            const parent = input.closest('div');
            if (parent) {
                animate(parent, { opacity: [1, 0.95, 1] }, { duration: 0.3, easing: 'ease-out' });
            }
        });
    });
}

// Respects user's preference for reduced motion.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    // Initialize interactive animations as soon as the DOM is ready.
    // The previous setTimeout caused a noticeable delay and was unnecessary, as
    // the View Transition API handles the entrance animation separately.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFCPXMLAnimations);
    } else {
        initFCPXMLAnimations();
    }
}
