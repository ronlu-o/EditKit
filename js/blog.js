// Blog posts data

const blogPosts = [
    {
        id: 2,
        title: "What Are .lrcx files?",
        date: "2025-09-30",
        content: `This solution is exclusive to Mac users, as these are special lyrics files from the software https://github.com/MxIris-LyricsX-Project/LyricsX.

These files are an evolvement of normal .lrc files, providing translation and precise timestamp layers. Its origins proved to be difficult to trace as the format is not widely documented. Please let me know if you have more information about this.`
    },
    {
        id: 1,
        title: "Welcome to EditKit Blog",
        date: "2025-09-28",
        content: `This is the first post on the EditKit blog. Here I'll be sharing thoughts on video editing workflows, tool development, and the creative process.`
    }
];

// Blog post renderer
function loadBlogPosts() {
    const postsContainer = document.getElementById('blog-posts');

    try {
        const posts = blogPosts;

        if (posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-fcp-text-secondary">No posts yet. Check back soon!</p>
                </div>
            `;
            return;
        }

        // Sort posts by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render posts
        postsContainer.innerHTML = posts.map(post => `
            <article class="bg-fcp-gray p-6 rounded-lg border border-fcp-border hover:border-fcp-accent transition-all">
                <h2 class="text-2xl font-semibold text-fcp-text mb-2">${escapeHtml(post.title)}</h2>
                <time class="text-sm text-fcp-text-secondary mb-4 block">${formatDate(post.date)}</time>
                <div class="text-fcp-text-secondary whitespace-pre-wrap">${formatContent(post.content)}</div>
            </article>
        `).join('');

    } catch (error) {
        console.error('Error loading blog posts:', error);
        postsContainer.innerHTML = `
            <div class="bg-fcp-gray p-6 rounded-lg border border-fcp-destructive">
                <p class="text-fcp-destructive">Failed to load blog posts. Please try again later.</p>
            </div>
        `;
    }
}

// Format date to readable string
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format content - converts URLs to clickable links
function formatContent(text) {
    // Escape HTML first
    let escaped = escapeHtml(text);

    // Convert URLs to clickable links (exclude trailing punctuation)
    const urlRegex = /(https?:\/\/[^\s]+?)([.,;:!?)]*)(\s|$)/g;
    escaped = escaped.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-fcp-accent hover:underline">$1</a>$2$3');

    return escaped;
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadBlogPosts);