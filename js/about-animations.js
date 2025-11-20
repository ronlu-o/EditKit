/**
 * Modern About Page Animations (2025)
 * Fast reveal and sequential section animations (NOT slow typewriter!)
 */

const { animate, stagger, inView } = Motion;

/**
 * Initialize about page animations
 */
function initAboutAnimations() {
    initFastReveal();
    initSectionAnimations();
    initFooterAnimations();
}

/**
 * Modern "Fast Reveal" effect for main heading
 * Simple and elegant - no complex word splitting
 */
function initFastReveal() {
    const mainHeading = document.querySelector('main h1');
    if (!mainHeading) return;

    // Simple fade-in with slight slide
    animate(
        mainHeading,
        { opacity: [0, 1], y: [20, 0] },
        { duration: 0.6, easing: [0.22, 1, 0.36, 1] }
    );

    // Animate the intro paragraph that comes right after h1 (inside .prose div)
    const proseContainer = document.querySelector('main .prose');
    const introParagraph = proseContainer?.querySelector('p:first-of-type');
    if (introParagraph) {
        animate(
            introParagraph,
            { opacity: [0, 1], y: [15, 0] },
            { duration: 0.5, delay: 0.2, easing: 'ease-out' }
        );
    }
}

/**
 * Alternative: Highlight Reveal Effect
 * Uncomment this and comment out initFastReveal() to use instead
 */
function initHighlightReveal() {
    const mainHeading = document.querySelector('h1');
    if (!mainHeading) return;

    // Wrap text in a container with gradient overlay
    const text = mainHeading.textContent;
    mainHeading.innerHTML = `
        <span style="position: relative; display: inline-block;">
            <span style="position: relative; z-index: 1;">${text}</span>
            <span style="
                position: absolute;
                top: 0;
                left: 0;
                width: 0%;
                height: 100%;
                background: linear-gradient(90deg, rgba(10, 132, 255, 0.3), rgba(48, 209, 88, 0.3));
                z-index: 0;
            " class="highlight-wipe"></span>
        </span>
    `;

    const highlight = mainHeading.querySelector('.highlight-wipe');

    // Animate highlight sweep
    animate(
        highlight,
        { width: ['0%', '100%'] },
        { duration: 1, easing: [0.22, 1, 0.36, 1] }
    );
}

/**
 * Sequential section reveal on scroll
 * Each H2 and its content animates in together
 */
function initSectionAnimations() {
    // Find all section headings (H2) and their content
    const sections = document.querySelectorAll('main h2');

    sections.forEach((heading, index) => {
        // Get all elements until the next H2
        const sectionContent = [];
        let currentElement = heading.nextElementSibling;

        while (currentElement && currentElement.tagName !== 'H2') {
            sectionContent.push(currentElement);
            currentElement = currentElement.nextElementSibling;
        }

        // Create a section group
        const sectionElements = [heading, ...sectionContent];

        // Animate as user scrolls to this section
        inView(
            heading,
            () => {
                // Heading animates first
                animate(
                    heading,
                    {
                        opacity: [0, 1],
                        y: [30, 0],
                        x: [-5, 0]
                    },
                    { duration: 0.5, easing: [0.22, 1, 0.36, 1] }
                );

                // Content follows with stagger
                if (sectionContent.length > 0) {
                    animate(
                        sectionContent,
                        { opacity: [0, 1], y: [20, 0] },
                        {
                            duration: 0.4,
                            delay: stagger(0.1, { start: 0.2 }),
                            easing: 'ease-out'
                        }
                    );
                }
            },
            { amount: 0.3, margin: '0px 0px -100px 0px' }
        );
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
 * Animate the first paragraph with highlight effect
 */
function initIntroHighlight() {
    const firstParagraph = document.querySelector('main p');
    if (!firstParagraph) return;

    // Wrap each sentence or phrase
    const text = firstParagraph.innerHTML;
    const sentences = text.split('. ').filter(s => s.trim());

    firstParagraph.innerHTML = sentences
        .map(sentence => `<span class="sentence" style="opacity: 0;">${sentence}${sentence === sentences[sentences.length - 1] ? '' : '. '}</span>`)
        .join('');

    const sentenceSpans = firstParagraph.querySelectorAll('.sentence');

    // Animate sentences with highlight sweep
    sentenceSpans.forEach((span, index) => {
        setTimeout(() => {
            // Create highlight element
            const highlight = document.createElement('span');
            highlight.style.cssText = `
                position: absolute;
                left: 0;
                top: 0;
                width: 0%;
                height: 100%;
                background: rgba(10, 132, 255, 0.2);
                z-index: -1;
            `;

            span.style.position = 'relative';
            span.style.display = 'inline-block';
            span.appendChild(highlight);

            // Fade in text
            animate(span, { opacity: [0, 1] }, { duration: 0.2 });

            // Sweep highlight
            animate(
                highlight,
                { width: ['0%', '100%', '100%', '0%'] },
                { duration: 0.8, easing: 'ease-in-out' }
            );
        }, index * 400);
    });
}

// Respect reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    // Initialize animations when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAboutAnimations);
    } else {
        initAboutAnimations();
    }
}
