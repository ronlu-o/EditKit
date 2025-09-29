// Blog posts data

const blogPosts = [


    {
        id: 3,
        title: "What Are .lrcx files?",
        date: "2025-09-30",
        content: `It's a specialized lyrics format from https://github.com/MxIris-LyricsX-Project/LyricsX.

These files are an evolvement of normal .lrc files, providing translation and precise timestamp layers within lines. Its origins proved to be difficult to trace as the format is not widely documented, mostly appearing on Chinese internet. The format LyricsX uses may differ variously from previous implementations.


**Example of .lrcx content:**
\`\`\`[02:09.318]Let me love you
[02:09.318][tt]<0,0><374,4><688,7><1080,12><1969,15><2369>
[02:09.318][tr:zh-Hans]让我爱你
[02:11.687]Let me love you
[02:11.687][tr:zh-Hans]让我爱你
[02:11.687][tt]<0,0><383,4><716,7><1092,12><2081,15><2473>\`\`\``
    },
    {
        id: 2,
        title: "Where do I get subtitles?",
        date: "2025-09-26",
        content: `As someone who works primarily with music videos, the best way would be to fetch subtitles (.srt format) from official sources like YouTube's captions.

If you wanted to make .srt subtitles for your own videos, you could use tools like **Aegisub** for manual edits or **CapCut** for auto-generated captions. Wrappers for OpenAI's **Whisper** model also exist as a great tool, and these tools all export to .srt/.vtt format which most editing software and video sites support.

As for .lrc lyrics files, there are resources for fetching those easily found online, but the legality of this process is in a gray area. Always ensure you have the right to use and distribute any subtitles or lyrics you find or create.`
    },
    {
        id: 1,
        title: "Welcome to the EditKit Blog",
        date: "2025-09-25",
        content: `I'll be sharing thoughts on video editing workflows, tool development, and the creative process.`
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
                <div class="text-fcp-text-secondary">${formatContent(post.content)}</div>
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

// Format content - converts URLs to clickable links and supports basic markdown
function formatContent(text) {
    // Escape HTML first
    let escaped = escapeHtml(text);

    // Convert code blocks (```...```)
    escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre class="bg-fcp-dark p-4 rounded mt-3 mb-3 overflow-x-auto"><code class="text-sm text-fcp-text font-mono whitespace-pre">$1</code></pre>');

    // Convert bold (**text**) - do this before italics
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="text-fcp-text font-semibold">$1</strong>');

    // Convert italics (*text*)
    escaped = escaped.replace(/\*([^*]+?)\*/g, '<em class="italic">$1</em>');

    // Convert URLs to clickable links (exclude trailing punctuation)
    const urlRegex = /(https?:\/\/[^\s]+?)([.,;:!?)]*)(\s|$)/g;
    escaped = escaped.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-fcp-accent hover:underline">$1</a>$2$3');

    // Convert triple line breaks to larger spacing
    escaped = escaped.replace(/\n\n\n/g, '\n\n<div class="mb-4"></div>\n\n');

    // Convert double line breaks to paragraphs
    escaped = escaped.split('\n\n').map(para => para.trim() ? `<p class="mb-2">${para.trim()}</p>` : '').join('');

    // Convert single line breaks to <br>
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
}

// Load posts when page loads
document.addEventListener('DOMContentLoaded', loadBlogPosts);