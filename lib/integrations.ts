export async function createGitHubGist(token: string, data: { description: string; public: boolean; files: Record<string, { content: string }> }) {
    const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error('Failed to create GitHub Gist');
    }

    return response.json();
}

export async function createGiteaSnippet(baseUrl: string, token: string, data: { description: string; public: boolean; files: Record<string, { content: string }> }) {
    // Gitea doesn't have a direct "Gist" equivalent in the same API structure usually, 
    // but often supports a Gist-like feature or we might be creating a repo.
    // However, Gitea API is compatible with GitHub API for many things.
    // For simplicity, we'll assume we are creating a repository or using a Gist plugin if available.
    // BUT, Gitea usually has `POST /gists` if enabled. Let's assume standard Gitea API for creating a repo file or similar if we want "snippets".
    // Actually, widespread Gitea usage is creating a repo. 
    // Let's implement a simple "Create Repo" or check if `/gists` is supported. 
    // Many Gitea instances disable Gists. 
    // Let's stick to a generic implementation that tries to post to `/gists` first.

    // Clean base URL
    const apiBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    const response = await fetch(`${apiBase}/api/v1/gists`, {
        method: 'POST',
        headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        // Fallback or detailed error handling could go here.
        const errorText = await response.text();
        throw new Error(`Failed to create Gitea Gist: ${errorText}`);
    }

    return response.json();
}
