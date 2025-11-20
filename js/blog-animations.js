/**
 * Modern Blog Page Animations (2025)
 * Staggered sequential reveals with scroll triggers
 */

const { animate, stagger, inView } = Motion;

/**
 * Initialize blog animations
 */
function initBlogAnimations() {
    initPageTitleAnimation();
    initBlogPostAnimations();
    initHoverEffects();
    initFooterAnimations();
}

/**
 * Animate the main "Blog" page title
 */
function initPageTitleAnimation() {
    const pageTitle = document.querySelector('main > h1');

    if (pageTitle) {
        animate(
            pageTitle,
            { opacity: [0, 1], y: [-20, 0] },
            { duration: 0.5, easing: 'ease-out' }
        );
    }
}

/**
 * Staggered sequential reveal for blog posts
 */
function initBlogPostAnimations() {
    // Select blog posts - they're dynamically loaded into #blog-posts
    const blogPosts = document.querySelectorAll('#blog-posts > article');

    if (blogPosts.length === 0) {
        console.log('No blog posts found for animation. Waiting for dynamic content...');
        return;
    }

    console.log(`Found ${blogPosts.length} blog posts to animate`);

    // Animate each blog post as it enters viewport
    blogPosts.forEach((post, index) => {
        inView(
            post,
            () => {
                // Get ALL text elements in the post
                const badge = post.querySelector('div.inline-block'); // PINNED badge
                const title = post.querySelector('h3, h2');
                const meta = post.querySelector('time');
                const content = post.querySelector('.text-fcp-text-secondary');

                // Sequential animation timeline
                const delay = index * 0.05; // Slight delay between posts

                // 1. Container fades in and slides up
                animate(
                    post,
                    { opacity: [0, 1], y: [20, 0] },
                    { duration: 0.4, delay, easing: 'ease-out' }
                );

                // 2. PINNED badge (if exists)
                if (badge) {
                    animate(
                        badge,
                        { opacity: [0, 1], scale: [0.8, 1] },
                        { duration: 0.3, delay: delay + 0.05, easing: 'ease-out' }
                    );
                }

                // 3. Title slides in from left
                if (title) {
                    animate(
                        title,
                        { opacity: [0, 1], x: [-10, 0] },
                        { duration: 0.4, delay: delay + 0.1, easing: 'ease-out' }
                    );
                }

                // 4. Meta/date fades in
                if (meta) {
                    animate(
                        meta,
                        { opacity: [0, 1] },
                        { duration: 0.3, delay: delay + 0.15, easing: 'ease-out' }
                    );
                }

                // 5. Content div fades in
                if (content) {
                    animate(
                        content,
                        { opacity: [0, 1] },
                        { duration: 0.4, delay: delay + 0.2, easing: 'ease-out' }
                    );
                }
            },
            { amount: 0.2, margin: '0px 0px -50px 0px' }
        );
    });
}

/**
 * Hover effects for blog posts
 */
function initHoverEffects() {
    const blogPosts = document.querySelectorAll('#blog-posts > article');

    blogPosts.forEach(post => {
        const title = post.querySelector('h3, h2');

        // Only add hover if post is clickable
        const isClickable = post.tagName === 'A' || post.onclick;

        if (isClickable) {
            post.addEventListener('mouseenter', () => {
                // Gentle lift effect
                animate(post, { y: -4, scale: 1.01 }, { duration: 0.2, easing: 'ease-out' });

                // Title color shift (if exists)
                if (title) {
                    animate(title, { color: '#0A84FF' }, { duration: 0.2 });
                }
            });

            post.addEventListener('mouseleave', () => {
                animate(post, { y: 0, scale: 1 }, { duration: 0.2, easing: 'ease-out' });

                if (title) {
                    animate(title, { color: '#F2F2F7' }, { duration: 0.2 });
                }
            });
        }
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
 * Reading progress bar (for future use in full blog posts)
 */
function initReadingProgressBar() {
    const article = document.querySelector('article');
    if (!article) return;

    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #0A84FF, #30D158);
        z-index: 9999;
        transition: width 0.1s ease-out;
    `;
    document.body.prepend(progressBar);

    // Update progress on scroll
    window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = (window.scrollY / scrollHeight) * 100;
        progressBar.style.width = Math.min(scrollProgress, 100) + '%';
    });
}

// Make initBlogAnimations globally accessible so blog.js can call it after posts are loaded
window.initBlogAnimations = initBlogAnimations;

// Respect reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Note: Animations will be triggered by blog.js after posts are loaded
// This is here as a fallback if blog.js doesn't call it
if (!prefersReducedMotion) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initReadingProgressBar();
        });
    } else {
        initReadingProgressBar();
    }
}
