/**
 * Motion One Animations for EditKit
 * Smooth, performant animations using Motion One library
 */

// Import motion functions from CDN-loaded Motion One
const { animate, stagger, inView, timeline } = Motion;

/**
 * Initialize all animations on page load
 */
function initAnimations() {
    initHeroAnimations();
    initToolCardAnimations();
    initNavAnimations();
    // Mobile menu handled by main.js to avoid conflicts
    initFooterAnimations();
    initHoverEffects();
}

/**
 * Hero section entrance animations - subtle fade only (2025 best practices)
 */
function initHeroAnimations() {
    const hero = document.querySelector('#home');
    if (!hero) return;

    const title = hero.querySelector('h2');
    const subtitle = hero.querySelector('p');

    // Subtle fade-in for title - no movement
    if (title) {
        animate(
            title,
            { opacity: [0.7, 1] },
            { duration: 0.5, easing: 'ease-out' }
        );
    }

    // Subtle fade-in for subtitle with slight delay
    if (subtitle) {
        animate(
            subtitle,
            { opacity: [0.7, 1] },
            { duration: 0.5, delay: 0.1, easing: 'ease-out' }
        );
    }
}

/**
 * Tool cards staggered entrance - subtle fade only, no movement
 */
function initToolCardAnimations() {
    const cards = document.querySelectorAll('#home .grid > a');
    if (cards.length === 0) return;

    // Modern approach: subtle fade-in with very slight stagger
    animate(
        cards,
        { opacity: [0.8, 1] },
        {
            duration: 0.4,
            delay: stagger(0.05, { start: 0.2 }),
            easing: 'ease-out'
        }
    );
}

/**
 * Navigation bar entrance - no animation (accessibility best practice)
 */
function initNavAnimations() {
    // Navigation should appear instantly for accessibility
    // No animations on nav elements - users need immediate access to navigation
}

/**
 * Footer - no animation (static secondary content)
 */
function initFooterAnimations() {
    // Footer should be static - no animation needed for secondary navigation
}

/**
 * Smooth mobile menu toggle animations
 */
function initMobileMenuAnimations() {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuButton || !mobileMenu) return;

    menuButton.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.contains('hidden');

        if (isHidden) {
            // Show menu with animation
            mobileMenu.classList.remove('hidden');
            animate(
                mobileMenu,
                { opacity: [0, 1], height: [0, 'auto'] },
                { duration: 0.3, easing: [0.22, 1, 0.36, 1] }
            );
        } else {
            // Hide menu with animation
            const animation = animate(
                mobileMenu,
                { opacity: [1, 0] },
                { duration: 0.3, easing: [0.22, 1, 0.36, 1] }
            );

            if (animation && animation.finished) {
                animation.finished.then(() => {
                    mobileMenu.classList.add('hidden');
                });
            } else {
                mobileMenu.classList.add('hidden');
            }
        }
    });
}

/**
 * Hover effects for interactive elements
 */
function initHoverEffects() {
    // Tool card hover effects - scale from center
    const toolCards = document.querySelectorAll('#home .grid > a');
    toolCards.forEach(card => {
        const icon = card.querySelector('.bg-fcp-accent');

        card.addEventListener('mouseenter', () => {
            animate(card, { scale: 1.03 }, { duration: 0.15, easing: 'ease-out' });
            if (icon) {
                animate(icon, { rotate: 5, scale: 1.1 }, { duration: 0.15 });
            }
        });

        card.addEventListener('mouseleave', () => {
            animate(card, { scale: 1 }, { duration: 0.15, easing: 'ease-out' });
            if (icon) {
                animate(icon, { rotate: 0, scale: 1 }, { duration: 0.15 });
            }
        });
    });

    // Navigation link hover effects - removed, handled by CSS hover:scale-105

    // Logo hover effect
    const logo = document.querySelector('nav a.flex');
    if (logo) {
        const logoImg = logo.querySelector('img');

        logo.addEventListener('mouseenter', () => {
            if (logoImg) {
                animate(logoImg, { rotate: 360 }, { duration: 0.6, easing: 'ease-in-out' });
            }
        });
    }

    // GitHub link hover effect
    const githubLink = document.querySelector('footer a[href*="github"]');
    if (githubLink) {
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
}

/**
 * Utility: Animate modal entrance (for use in other pages)
 */
function animateModalOpen(modalElement) {
    if (!modalElement) return;

    const modalContent = modalElement.querySelector('[class*="modal-content"], [class*="bg-fcp-gray"]');

    animate(
        modalElement,
        { opacity: [0, 1] },
        { duration: 0.2 }
    );

    if (modalContent) {
        animate(
            modalContent,
            { scale: [0.9, 1], y: [20, 0] },
            { duration: 0.3, easing: [0.34, 1.56, 0.64, 1] } // Bounce effect
        );
    }
}

/**
 * Utility: Animate modal exit (for use in other pages)
 */
function animateModalClose(modalElement) {
    if (!modalElement) return Promise.resolve();

    const modalContent = modalElement.querySelector('[class*="modal-content"], [class*="bg-fcp-gray"]');

    const animations = [
        animate(
            modalElement,
            { opacity: [1, 0] },
            { duration: 0.2 }
        )
    ];

    if (modalContent) {
        animations.push(
            animate(
                modalContent,
                { scale: [1, 0.9], y: [0, 20] },
                { duration: 0.2, easing: 'ease-in' }
            )
        );
    }

    return Promise.all(animations.map(a => a.finished));
}

/**
 * Utility: File drop zone pulse animation
 */
function animateDropZonePulse(element) {
    if (!element) return;

    animate(
        element,
        { scale: [1, 1.02, 1] },
        { duration: 0.3, easing: 'ease-in-out' }
    );
}

/**
 * Utility: Success feedback animation
 */
function animateSuccess(element) {
    if (!element) return;

    animate(
        element,
        { scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7, 1] },
        { duration: 0.5, easing: 'ease-in-out' }
    );
}

/**
 * Utility: Loading spinner animation
 */
function animateLoadingSpinner(element) {
    if (!element) return;

    return animate(
        element,
        { rotate: [0, 360] },
        { duration: 1, repeat: Infinity, easing: 'linear' }
    );
}

// Initialize animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
} else {
    initAnimations();
}
