import { SnippetWithRelations } from '@/lib/data/snippets';
import { exportToMarkdown } from './formats';

/**
 * Simple PDF export using browser's print functionality
 * This creates an HTML page optimized for PDF printing
 */
export function generatePrintableHTML(snippet: SnippetWithRelations): string {
    const markdown = exportToMarkdown(snippet);
    const language = snippet.language?.name || 'text';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${snippet.title} - Snippet Export</title>
  <style>
    @page {
      margin: 2cm;
      size: A4;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    .metadata {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .metadata-item {
      display: flex;
      margin: 8px 0;
    }
    
    .metadata-label {
      font-weight: bold;
      min-width: 120px;
      color: #4b5563;
    }
    
    .metadata-value {
      color: #1f2937;
    }
    
    .code-section {
      margin: 30px 0;
    }
    
    .code-section h2 {
      color: #4b5563;
      font-size: 18px;
      margin-bottom: 10px;
    }
    
    pre {
      background: #1f2937;
      color: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      line-height: 1.5;
    }
    
    code {
      font-family: 'Courier New', Courier, monospace;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <h1>${snippet.title}</h1>
  
  ${snippet.description ? `<p style="font-size: 16px; color: #6b7280; margin-bottom: 20px;">${snippet.description}</p>` : ''}
  
  <div class="metadata">
    <div class="metadata-item">
      <span class="metadata-label">Language:</span>
      <span class="metadata-value">${language}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Category:</span>
      <span class="metadata-value">${snippet.category?.name || 'General'}</span>
    </div>
    ${snippet.folder ? `
    <div class="metadata-item">
      <span class="metadata-label">Folder:</span>
      <span class="metadata-value">${snippet.folder.name}</span>
    </div>
    ` : ''}
    ${snippet.tags.length > 0 ? `
    <div class="metadata-item">
      <span class="metadata-label">Tags:</span>
      <span class="metadata-value">${snippet.tags.map(st => st.tag.name).join(', ')}</span>
    </div>
    ` : ''}
    <div class="metadata-item">
      <span class="metadata-label">Created:</span>
      <span class="metadata-value">${new Date(snippet.createdAt).toLocaleDateString('tr-TR')}</span>
    </div>
    <div class="metadata-item">
      <span class="metadata-label">Views:</span>
      <span class="metadata-value">${snippet.viewCount}</span>
    </div>
  </div>
  
  <div class="code-section">
    <h2>Code</h2>
    <pre><code>${escapeHtml(snippet.code)}</code></pre>
  </div>
  
  <div class="footer">
    <p>Exported from Kapitto Snippet Manager on ${new Date().toLocaleDateString('tr-TR')}</p>
  </div>
  
  <script class="no-print">
    // Auto-trigger print dialog
    window.onload = function() {
      setTimeout(() => {
        window.print();
        // Close window after print dialog is dismissed
        setTimeout(() => {
          window.close();
        }, 100);
      }, 500);
    };
  </script>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
