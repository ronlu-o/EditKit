/**
 * Motion One Animations for Subtitle Tools Page
 * Handles modal transitions, file drop animations, and processing feedback
 */

const { animate, stagger, inView } = Motion;

let processingAnimation = null;

/**
 * Initialize subtitle page animations
 */
function initSubtitleAnimations() {
    initPageLoadAnimations();
    initToolCardAnimations();
    initFileDropZoneAnimations();
    initHoverEffects();
    overrideModalFunctions();
}

/**
 * Page load animations
 */
function initPageLoadAnimations() {
    // Animate header - subtle fade only, no movement to avoid layout shift
    const header = document.querySelector('.text-center.py-12');
    if (header) {
        const title = header.querySelector('h1');
        const subtitle = header.querySelector('p');

        if (title) {
            animate(
                title,
                { opacity: [0.7, 1] },
                { duration: 0.5, easing: 'ease-out' }
            );
        }

        if (subtitle) {
            animate(
                subtitle,
                { opacity: [0.7, 1] },
                { duration: 0.5, delay: 0.1, easing: 'ease-out' }
            );
        }
    }
}

/**
 * Tool cards staggered entrance
 */
function initToolCardAnimations() {
    const cards = document.querySelectorAll('.grid > div[onclick]');
    if (cards.length === 0) return;

    // Subtle fade-in only, no movement to avoid layout shift
    animate(
        cards,
        { opacity: [0.8, 1] },
        {
            duration: 0.4,
            delay: stagger(0.03, { start: 0.2 }),
            easing: 'ease-out'
        }
    );
}

/**
 * Tool card hover effects
 */
function initHoverEffects() {
    const cards = document.querySelectorAll('.grid > div[onclick]');

    cards.forEach(card => {
        const icon = card.querySelector('.bg-fcp-accent');

        card.addEventListener('mouseenter', () => {
            animate(card, { scale: 1.03 }, { duration: 0.15, easing: 'ease-out' });
            if (icon) {
                animate(icon, { rotate: 5 }, { duration: 0.15 });
            }
        });

        card.addEventListener('mouseleave', () => {
            animate(card, { scale: 1 }, { duration: 0.15, easing: 'ease-out' });
            if (icon) {
                animate(icon, { rotate: 0 }, { duration: 0.15 });
            }
        });
    });
}

/**
 * File drop zone animations
 */
function initFileDropZoneAnimations() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    // Dragover effect
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        animate(
            uploadArea,
            { scale: 1.05, borderColor: '#0A84FF' },
            { duration: 0.2 }
        );
    });

    // Dragleave effect
    uploadArea.addEventListener('dragleave', () => {
        animate(
            uploadArea,
            { scale: 1, borderColor: '#4B5563' },
            { duration: 0.2 }
        );
    });

    // Drop effect
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();

        // Success pulse animation
        animate(
            uploadArea,
            {
                scale: [1.05, 1],
                borderColor: ['#30D158', '#4B5563']
            },
            { duration: 0.4, easing: 'ease-out' }
        );
    });
}

/**
 * Override modal open/close functions with animations
 */
function overrideModalFunctions() {
    // Store original functions
    window._originalOpenModal = window.openTool;
    window._originalCloseModal = window.closeModal;

    // Override openTool function
    window.openTool = function(toolType) {
        // Call original function first
        if (window._originalOpenModal) {
            window._originalOpenModal(toolType);
        }

        // Animate modal entrance
        const modal = document.getElementById('uploadModal');
        const modalContent = modal.querySelector('.bg-fcp-gray');

        if (modal && modalContent) {
            // Remove hidden class
            modal.classList.remove('hidden');

            // Animate backdrop
            animate(
                modal,
                { opacity: [0, 1] },
                { duration: 0.2 }
            );

            // Animate modal content with bounce
            animate(
                modalContent,
                {
                    scale: [0.8, 1.05, 1],
                    y: [30, -5, 0],
                    opacity: [0, 1]
                },
                { duration: 0.4, easing: [0.34, 1.56, 0.64, 1] }
            );
        }
    };

    // Override closeModal function
    window.closeModal = function() {
        const modal = document.getElementById('uploadModal');
        const modalContent = modal.querySelector('.bg-fcp-gray');

        if (modal && modalContent) {
            // Animate exit
            const animations = [
                animate(
                    modal,
                    { opacity: [1, 0] },
                    { duration: 0.2, delay: 0.1 }
                ),
                animate(
                    modalContent,
                    { scale: [1, 0.9], y: [0, 20], opacity: [1, 0] },
                    { duration: 0.2 }
                )
            ];

            Promise.all(animations.map(a => a.finished)).then(() => {
                // Call original close function after animation
                if (window._originalCloseModal) {
                    window._originalCloseModal();
                }
                modal.classList.add('hidden');
            });
        } else {
            // Fallback if elements not found
            if (window._originalCloseModal) {
                window._originalCloseModal();
            }
        }
    };
}

/**
 * Show processing animation on process button
 */
function showProcessingAnimation() {
    const processBtn = document.getElementById('processBtn');
    if (!processBtn) return;

    const originalText = processBtn.innerHTML;

    // Create spinner element
    processBtn.innerHTML = `
        <div class="flex items-center justify-center space-x-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
        </div>
    `;

    // Pulse animation
    processingAnimation = animate(
        processBtn,
        { scale: [1, 1.05, 1] },
        { duration: 1, repeat: Infinity, easing: 'ease-in-out' }
    );

    return originalText;
}

/**
 * Hide processing animation
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
 * Success feedback animation
 */
function showSuccessFeedback() {
    const modal = document.getElementById('uploadModal');
    const modalContent = modal?.querySelector('.bg-fcp-gray');

    if (modalContent) {
        // Flash green border
        animate(
            modalContent,
            {
                borderColor: ['#3A3A3E', '#30D158', '#3A3A3E'],
                scale: [1, 1.02, 1]
            },
            { duration: 0.6, easing: 'ease-in-out' }
        );
    }
}

/**
 * Error feedback animation
 */
function showErrorFeedback() {
    const modal = document.getElementById('uploadModal');
    const modalContent = modal?.querySelector('.bg-fcp-gray');

    if (modalContent) {
        // Shake animation with red border
        animate(
            modalContent,
            {
                x: [-10, 10, -10, 10, 0],
                borderColor: ['#3A3A3E', '#FF453A', '#3A3A3E']
            },
            { duration: 0.5, easing: 'ease-in-out' }
        );
    }
}

/**
 * Animate file upload success
 */
function animateFileUploadSuccess() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    animate(
        uploadArea,
        {
            backgroundColor: ['#2A2A2D', '#30D15830', '#2A2A2D'],
            borderColor: ['#4B5563', '#30D158', '#4B5563']
        },
        { duration: 0.6 }
    );
}

// Make functions globally accessible for use in other scripts
window.showProcessingAnimation = showProcessingAnimation;
window.hideProcessingAnimation = hideProcessingAnimation;
window.showSuccessFeedback = showSuccessFeedback;
window.showErrorFeedback = showErrorFeedback;
window.animateFileUploadSuccess = animateFileUploadSuccess;

// Initialize animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubtitleAnimations);
} else {
    initSubtitleAnimations();
}
