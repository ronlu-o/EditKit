/**
 * Motion One Animations for Subtitle Tools Page
 * Handles modal transitions, file drop animations, and processing feedback.
 * Entrance animations are managed by the View Transition API.
 */

const { animate } = Motion;

let processingAnimation = null;

/**
 * Initialize subtitle page's interactive animations.
 */
function initSubtitleAnimations() {
    initFileDropZoneAnimations();
    initHoverEffects();
    overrideModalFunctions();
}

/**
 * Adds hover effects to the tool cards.
 */
function initHoverEffects() {
    const cards = document.querySelectorAll('.grid > div[onclick]');
    cards.forEach(card => {
        const icon = card.querySelector('.bg-fcp-accent');
        card.addEventListener('mouseenter', () => {
            animate(card, { opacity: 0.9 }, { duration: 0.15, easing: 'ease-out' });
            if (icon) animate(icon, { rotate: 5 }, { duration: 0.15 });
        });
        card.addEventListener('mouseleave', () => {
            animate(card, { opacity: 1 }, { duration: 0.15, easing: 'ease-out' });
            if (icon) animate(icon, { rotate: 0 }, { duration: 0.15 });
        });
    });
}

/**
 * Provides visual feedback when a file is dragged over the upload area.
 */
function initFileDropZoneAnimations() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        animate(uploadArea, { borderColor: '#0A84FF' }, { duration: 0.2 });
    });

    uploadArea.addEventListener('dragleave', () => {
        animate(uploadArea, { borderColor: '#4B5563' }, { duration: 0.2 });
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        animate(uploadArea, {
            opacity: [1, 0.8, 1],
            borderColor: ['#30D158', '#4B5563']
        }, { duration: 0.4, easing: 'ease-out' });
    });
}

/**
 * Overrides the default modal functions to add open/close animations.
 */
function overrideModalFunctions() {
    window._originalOpenModal = window.openTool;
    window._originalCloseModal = window.closeModal;

    window.openTool = function(toolType) {
        if (window._originalOpenModal) window._originalOpenModal(toolType);

        const modal = document.getElementById('uploadModal');
        const modalContent = modal?.querySelector('.bg-fcp-gray');
        if (modal && modalContent) {
            modal.classList.remove('hidden');
            animate(modal, { opacity: [0, 1] }, { duration: 0.2 });
            animate(modalContent, { y: [30, 0], opacity: [0, 1] }, { duration: 0.3, easing: 'ease-out' });
        }
    };

    window.closeModal = function() {
        const modal = document.getElementById('uploadModal');
        const modalContent = modal?.querySelector('.bg-fcp-gray');
        if (modal && modalContent) {
            const animations = [
                animate(modal, { opacity: [1, 0] }, { duration: 0.2, delay: 0.1 }),
                animate(modalContent, { y: [0, 20], opacity: [1, 0] }, { duration: 0.2 })
            ];
            Promise.all(animations.map(a => a.finished)).then(() => {
                if (window._originalCloseModal) window._originalCloseModal();
                modal.classList.add('hidden');
            });
        } else if (window._originalCloseModal) {
            window._originalCloseModal();
        }
    };
}

/**
 * Shows a processing spinner and animation on the process button.
 */
function showProcessingAnimation() {
    const processBtn = document.getElementById('processBtn');
    if (!processBtn) return;

    const originalText = processBtn.innerHTML;
    processBtn.innerHTML = `
        <div class="flex items-center justify-center space-x-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
        </div>
    `;

    processingAnimation = animate(processBtn, { opacity: [1, 0.8, 1] }, { duration: 1, repeat: Infinity, easing: 'ease-in-out' });
    return originalText;
}

/**
 * Hides the processing animation and restores the button's original text.
 */
function hideProcessingAnimation(originalText = 'Process') {
    const processBtn = document.getElementById('processBtn');
    if (!processBtn) return;

    if (processingAnimation) {
        processingAnimation.stop();
        processingAnimation = null;
    }
    processBtn.innerHTML = originalText;
}

/**
 * Flashes the modal border green to indicate success.
 */
function showSuccessFeedback() {
    const modalContent = document.querySelector('#uploadModal .bg-fcp-gray');
    if (modalContent) {
        animate(modalContent, { borderColor: ['#3A3A3E', '#30D158', '#3A3A3E'] }, { duration: 0.6, easing: 'ease-in-out' });
    }
}

/**
 * Shakes the modal and flashes the border red to indicate an error.
 */
function showErrorFeedback() {
    const modalContent = document.querySelector('#uploadModal .bg-fcp-gray');
    if (modalContent) {
        animate(modalContent, {
            x: [-10, 10, -10, 10, 0],
            borderColor: ['#3A3A3E', '#FF453A', '#3A3A3E']
        }, { duration: 0.5, easing: 'ease-in-out' });
    }
}

/**
 * Animates the upload area to confirm a successful file drop.
 */
function animateFileUploadSuccess() {
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        animate(uploadArea, {
            backgroundColor: ['#2A2A2D', '#30D15830', '#2A2A2D'],
            borderColor: ['#4B5563', '#30D158', '#4B5563']
        }, { duration: 0.6 });
    }
}

// Make functions globally accessible
window.showProcessingAnimation = showProcessingAnimation;
window.hideProcessingAnimation = hideProcessingAnimation;
window.showSuccessFeedback = showSuccessFeedback;
window.showErrorFeedback = showErrorFeedback;
window.animateFileUploadSuccess = animateFileUploadSuccess;

// Respects user's preference for reduced motion.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    // Initialize interactive animations as soon as the DOM is ready.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSubtitleAnimations);
    } else {
        initSubtitleAnimations();
    }
}
