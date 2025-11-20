/**
 * Universal Page Animations for EditKit
 * Works across all tool pages (Color Grader, FCPXML, About, Blog, etc.)
 * Modern 2025 approach: subtle fades, no layout shifts
 */

const { animate, stagger, inView } = Motion;

/**
 * Initialize page animations
 */
function initPageAnimations() {
    initHeaderAnimations();
    initContentAnimations();
    initHoverEffects();
}

/**
 * Header animations - subtle fade-in
 */
function initHeaderAnimations() {
    // Find header section (works with different structures)
    const header = document.querySelector('.text-center.py-6, .text-center.py-12, header');
    if (!header) return;

    const title = header.querySelector('h1');
    const paragraphs = header.querySelectorAll('p');

    // Animate title
    if (title) {
        animate(
            title,
            { opacity: [0.7, 1] },
            { duration: 0.5, easing: 'ease-out' }
        );
    }

    // Animate description paragraphs
    if (paragraphs.length > 0) {
        animate(
            paragraphs,
            { opacity: [0.7, 1] },
            {
                duration: 0.5,
                delay: stagger(0.05, { start: 0.1 }),
                easing: 'ease-out'
            }
        );
    }
}

/**
 * Content section animations
 */
function initContentAnimations() {
    // Animate main content areas
    const mainContent = document.querySelectorAll('main > div.bg-fcp-gray, main > .grid');

    if (mainContent.length > 0) {
        animate(
            mainContent,
            { opacity: [0.8, 1] },
            {
                duration: 0.4,
                delay: stagger(0.1, { start: 0.3 }),
                easing: 'ease-out'
            }
        );
    }

    // Animate file upload areas
    const uploadAreas = document.querySelectorAll('#uploadArea, [id*="upload"]');
    uploadAreas.forEach(area => {
        // Add drag-over animations
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            animate(
                area,
                { scale: 1.02, borderColor: '#0A84FF' },
                { duration: 0.2 }
            );
        });

        area.addEventListener('dragleave', () => {
            animate(
                area,
                { scale: 1, borderColor: '#4B5563' },
                { duration: 0.2 }
            );
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            animate(
                area,
                {
                    scale: [1.02, 1],
                    borderColor: ['#30D158', '#4B5563']
                },
                { duration: 0.4, easing: 'ease-out' }
            );
        });
    });
}

/**
 * Hover effects for interactive elements
 */
function initHoverEffects() {
    // Button hover effects
    const buttons = document.querySelectorAll('button:not([disabled])');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            animate(button, { scale: 1.02 }, { duration: 0.15 });
        });

        button.addEventListener('mouseleave', () => {
            animate(button, { scale: 1 }, { duration: 0.15 });
        });
    });

    // Link hover effects (excluding nav links which are handled elsewhere)
    const contentLinks = document.querySelectorAll('main a:not(nav a)');
    contentLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            animate(link, { x: 2 }, { duration: 0.15 });
        });

        link.addEventListener('mouseleave', () => {
            animate(link, { x: 0 }, { duration: 0.15 });
        });
    });

    // Card hover effects (for any card-like elements)
    const cards = document.querySelectorAll('.bg-fcp-gray:not(nav)');
    cards.forEach(card => {
        // Only add hover if it's clickable
        if (card.onclick || card.closest('a')) {
            card.addEventListener('mouseenter', () => {
                animate(card, { scale: 1.02 }, { duration: 0.15 });
            });

            card.addEventListener('mouseleave', () => {
                animate(card, { scale: 1 }, { duration: 0.15 });
            });
        }
    });
}

/**
 * Animate canvas elements (for Color Grader)
 */
function initCanvasAnimations() {
    const canvas = document.querySelector('#previewCanvas');
    if (!canvas) return;

    // Fade in canvas when image is loaded
    inView(
        canvas,
        () => {
            animate(
                canvas,
                { opacity: [0.8, 1] },
                { duration: 0.4, easing: 'ease-out' }
            );
        },
        { amount: 0.3 }
    );
}

/**
 * Slider animations (for color grading controls)
 */
function initSliderAnimations() {
    const sliders = document.querySelectorAll('input[type="range"]');

    sliders.forEach(slider => {
        slider.addEventListener('input', () => {
            // Skip the global intensity label on Color Grader to avoid text jitter
            // if (slider.id === 'globalIntensity') return;
            // Subtle pulse on slider change
            const label = slider.previousElementSibling || slider.nextElementSibling;
            if (label) {
                animate(
                    label,
                    { scale: [1, 1.05, 1], transformOrigin: 'left center' },
                    { duration: 0.28, easing: 'ease-out' }
                );
            }
        });
    });
}

/**
 * Footer animations - GitHub link hover
 */
function initFooterAnimations() {
    const githubLink = document.querySelector('footer a[href*="github"]');
    if (!githubLink) return;

    const githubIcon = githubLink.querySelector('svg');

    githubLink.addEventListener('mouseenter', () => {
        animate(githubLink, { x: 3 }, { duration: 0.2 });
        if (githubIcon) {
            animate(githubIcon, { scale: 1.1 }, { duration: 0.2 });
        }
    });

    githubLink.addEventListener('mouseleave', () => {
        animate(githubLink, { x: 0 }, { duration: 0.2 });
        if (githubIcon) {
            animate(githubIcon, { scale: 1 }, { duration: 0.2 });
        }
    });
}

/**
 * Success/error feedback animations
 */
function showSuccessAnimation(element) {
    if (!element) return;

    animate(
        element,
        {
            backgroundColor: ['#2A2A2D', '#30D15830', '#2A2A2D'],
            borderColor: ['#3A3A3E', '#30D158', '#3A3A3E']
        },
        { duration: 0.6 }
    );
}

function showErrorAnimation(element) {
    if (!element) return;

    animate(
        element,
        {
            x: [-10, 10, -10, 10, 0],
            borderColor: ['#3A3A3E', '#FF453A', '#3A3A3E']
        },
        { duration: 0.5, easing: 'ease-in-out' }
    );
}

// Export functions for use in other scripts
window.showSuccessAnimation = showSuccessAnimation;
window.showErrorAnimation = showErrorAnimation;

// Initialize animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initPageAnimations();
        initCanvasAnimations();
        initSliderAnimations();
        initFooterAnimations();
    });
} else {
    initPageAnimations();
    initCanvasAnimations();
    initSliderAnimations();
    initFooterAnimations();
}
