
import { SnippetWithRelations } from '@/lib/data/snippets';

export function exportToJSON(snippet: SnippetWithRelations): string {
    const exportData = {
        id: snippet.id,
        title: snippet.title,
        description: snippet.description,
        code: snippet.code,
        language: snippet.language?.name || null,
        category: snippet.category?.name || null,
        folder: snippet.folder?.name || null,
        tags: snippet.tags.map(st => st.tag.name),
        isPublic: snippet.isPublic,
        isFavorite: snippet.isFavorite,
        viewCount: snippet.viewCount,
        createdAt: snippet.createdAt.toISOString(),
        updatedAt: snippet.updatedAt.toISOString(),
        versions: snippet.versions.map(v => ({
            version: `${v.major}.${v.minor}`,
            title: v.title,
            isMajor: v.isMajor,
            createdAt: v.createdAt.toISOString(),
        })),
    };

    return JSON.stringify(exportData, null, 2);
}

export function exportToMarkdown(snippet: SnippetWithRelations): string {
    const language = snippet.language?.monacoId || snippet.language?.name.toLowerCase() || 'text';
    const tags = snippet.tags.map(st => st.tag.name).join(', ');
    const latestVersion = snippet.versions[0];
    const version = latestVersion ? `v${latestVersion.major}.${latestVersion.minor}` : 'v1.0';

    return `# ${snippet.title}

${snippet.description || '_No description provided_'}

---

**Metadata:**
- **Language:** ${snippet.language?.name || 'N/A'}
- **Category:** ${snippet.category?.name || 'General'}
- **Folder:** ${snippet.folder?.name || 'N/A'}
- **Tags:** ${tags || 'None'}
- **Version:** ${version}
- **Created:** ${new Date(snippet.createdAt).toLocaleDateString('tr-TR')}
- **Views:** ${snippet.viewCount}

---

## Code

\`\`\`${language}
${snippet.code}
\`\`\`

---

_Exported from Kapitto Snippet Manager_
`;
}

export function getSnippetFilename(snippet: SnippetWithRelations): string {
    const sanitized = snippet.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const timestamp = new Date().toISOString().split('T')[0];

    return `snippet_${sanitized}_${timestamp}`;
}
