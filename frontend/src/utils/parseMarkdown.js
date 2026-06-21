export function parseMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const html = [];
  let inList = false;

  for (let raw of lines) {
    const line = raw;

    if (!line.trim()) {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      html.push('<br/>');
      continue;
    }

    if (/^\*\s+/.test(line)) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      const inner = line.replace(/^\*\s+/, '');
      html.push(`<li>${inlineMarkdown(inner)}</li>`);
      continue;
    }

    if (inList) {
      html.push('</ul>');
      inList = false;
    }

    if (/^\*\*(.+)\*\*$/.test(line.trim())) {
      const inner = line.trim().replace(/^\*\*/, '').replace(/\*\*$/, '');
      html.push(`<p class="md-heading">${inlineMarkdown(inner)}</p>`);
      continue;
    }

    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  if (inList) html.push('</ul>');

  return html.join('');
}

function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>');
}
