#!/usr/bin/env node
/**
 * build.mjs — Markdown-to-HTML build for davidjivan.net
 *
 * Reads .md files from content/posts/, compiles to posts/*.html
 * using the site's component library classes. Auto-generates posts.json.
 *
 * Usage:
 *   node build.mjs              # build all posts
 *   node build.mjs --watch      # rebuild on change (TODO)
 *   node build.mjs my-slug      # build one post
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

const SITE = import.meta.dirname;
const CONTENT_DIR = join(SITE, 'content', 'posts');
const OUTPUT_DIR = join(SITE, 'posts');

// ── FRONTMATTER PARSER ────────────────────────────────────────
function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('Missing frontmatter');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    // parse arrays: [a, b, c]
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }
    // strip matching wrapper quotes only
    if (typeof val === 'string' && val.length >= 2) {
      if ((val[0] === '"' && val[val.length - 1] === '"') ||
          (val[0] === "'" && val[val.length - 1] === "'")) {
        val = val.slice(1, -1);
      }
    }
    meta[key] = val;
  }
  return { meta, body: m[2] };
}

// ── INLINE MARKDOWN ───────────────────────────────────────────
function inlineMarkdown(text) {
  // Bold: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // HTML entities — pass through (already encoded in source)
  return text;
}

// ── BLOCK PARSER ──────────────────────────────────────────────
// Custom block syntax:
//
//   :::divider
//   :::callout          ... :::end
//   :::callout-accent   ... :::end
//   :::thesis           ... :::end
//   :::colophon         ... :::end
//   :::blockquote       ... :::end
//   :::disclaim-list    ... :::end
//
//   :::timeline
//   - when: 500 BCE
//     who: Heraclitus
//     active: true
//     body: The Logos...
//   :::end
//
//   :::cards
//   - who: Aristotle
//     year: 4th c. BCE
//     label: potential vs. actual
//     body: Text here...
//     quote: Optional aside
//   :::end
//
//   :::hinge
//   - tag: Reading A
//     title: God as a being
//     body: The supreme entity...
//   - tag: Reading B
//     title: God as Being
//     body: Not the largest item...
//   cap: Every round turns on this fork.
//   :::end
//
//   :::toc
//   1. [Section name](#anchor)
//   2. [Another section](#anchor2)
//   :::end
//
//   :::text-cards
//   - num: 01
//     title: Romans 8:19–22
//     greek: Optional greek
//     sections:
//       - label: Text
//         text: The passage text...
//       - label: What it claims
//         text: Explanation...
//     note: Optional edition note
//     questions:
//       - First question?
//       - Second question?
//   :::end
//
//   :::flag-cards
//   - num: 01
//     title: Flag title
//     text: Flag body text
//   :::end
//
//   :::parallel
//   label: Comparison title
//   - left: Column A label
//     right: Column A text
//   :::end
//
//   :::transmission
//   label: Transmission title
//   - name: Channel name
//     desc: Channel description
//   :::end
//
//   > blockquote (standard markdown)
//   ## heading (becomes article h2 with // prefix via CSS)

function parseBlocks(body) {
  const lines = body.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '') { i++; continue; }

    // Custom blocks
    if (line.trim().startsWith(':::')) {
      const blockType = line.trim().slice(3).trim();

      // Self-closing blocks
      if (blockType === 'divider') {
        blocks.push({ type: 'divider' });
        i++;
        continue;
      }

      // Collect block content until :::end
      const content = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::end') {
        content.push(lines[i]);
        i++;
      }
      i++; // skip :::end

      blocks.push({ type: blockType, content: content.join('\n') });
      continue;
    }

    // Standard markdown blockquote
    if (line.trim().startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
      continue;
    }

    // Heading
    if (line.trim().startsWith('## ')) {
      blocks.push({ type: 'h2', content: line.trim().slice(3) });
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty, non-special lines)
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' &&
           !lines[i].trim().startsWith(':::') &&
           !lines[i].trim().startsWith('## ') &&
           !lines[i].trim().startsWith('> ')) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'p', content: paraLines.join(' ') });
    }
  }

  return blocks;
}

// ── YAML-ISH ITEM PARSER (for structured blocks) ─────────────
function parseItems(content) {
  const items = [];
  let current = null;
  let currentKey = null;
  let topLevelFields = {};

  for (const line of content.split('\n')) {
    // New item
    if (line.match(/^- \w+:/)) {
      if (current) items.push(current);
      current = {};
      currentKey = null;
      const m = line.match(/^- (\w+):\s*(.*)$/);
      if (m) {
        currentKey = m[1];
        current[m[1]] = m[2];
      }
      continue;
    }

    // Top-level field (no dash prefix, before any items or between)
    if (!line.startsWith('  ') && !line.startsWith('-') && line.match(/^\w+:\s*.+/)) {
      const m = line.match(/^(\w+):\s*(.+)$/);
      if (m) topLevelFields[m[1]] = m[2];
      continue;
    }

    // Sub-field of current item
    if (current && line.match(/^\s+\w+:/)) {
      const m = line.match(/^\s+(\w+):\s*(.*)$/);
      if (m) {
        currentKey = m[1];
        current[m[1]] = m[2];
      }
      continue;
    }

    // Sub-list items (e.g., questions, sections)
    if (current && line.match(/^\s+- /)) {
      const val = line.replace(/^\s+- /, '').trim();
      // If inside a sections: key, handle specially
      if (currentKey === 'sections' || (current.sections && !Array.isArray(current.sections))) {
        if (!Array.isArray(current.sections)) current.sections = [];
        // Check if it's a label: line
        const m = val.match(/^(\w+):\s*(.*)$/);
        if (m) {
          current.sections.push({ [m[1]]: m[2] });
        }
        continue;
      }
      if (currentKey === 'questions' || current.questions) {
        if (!Array.isArray(current.questions)) current.questions = [];
        current.questions.push(val);
        continue;
      }
      // Generic list under current key
      if (currentKey && !Array.isArray(current[currentKey])) {
        current[currentKey] = current[currentKey] ? [current[currentKey]] : [];
      }
      if (currentKey) current[currentKey].push(val);
      continue;
    }

    // Continuation line
    if (current && currentKey && line.match(/^\s{4,}/)) {
      current[currentKey] += ' ' + line.trim();
    }
  }

  if (current) items.push(current);
  return { items, fields: topLevelFields };
}

// ── STRUCTURED BLOCK PARSERS ──────────────────────────────────
// For text-cards with multi-level structure
function parseTextCards(content) {
  const cards = [];
  let current = null;
  let currentKey = null;
  let currentSection = null;

  for (const line of content.split('\n')) {
    // New card
    if (line.match(/^- \w+:/)) {
      if (current) cards.push(current);
      current = { sections: [], questions: [] };
      currentKey = null;
      currentSection = null;
      const m = line.match(/^- (\w+):\s*(.*)$/);
      if (m) {
        currentKey = m[1];
        current[m[1]] = m[2];
      }
      continue;
    }

    if (!current) continue;

    // Indented key
    if (line.match(/^\s{2,4}\w+:/)) {
      const m = line.match(/^\s+(\w+):\s*(.*)$/);
      if (m) {
        currentKey = m[1];
        if (m[1] === 'sections' || m[1] === 'questions') {
          // Just a header, content follows
        } else if (m[1] === 'note') {
          current.note = m[2];
        } else {
          current[m[1]] = m[2];
        }
      }
      continue;
    }

    // Section item under sections:
    if (currentKey === 'sections' && line.match(/^\s+- label:/)) {
      const m = line.match(/^\s+- label:\s*(.*)$/);
      if (m) {
        currentSection = { label: m[1], text: '' };
        current.sections.push(currentSection);
      }
      continue;
    }

    if (currentSection && line.match(/^\s+text:/)) {
      const m = line.match(/^\s+text:\s*(.*)$/);
      if (m) currentSection.text = m[1];
      continue;
    }

    // Question items
    if (currentKey === 'questions' && line.match(/^\s+- /)) {
      current.questions.push(line.replace(/^\s+- /, '').trim());
      continue;
    }

    // Continuation of text
    if (currentSection && line.match(/^\s{8,}/)) {
      currentSection.text += ' ' + line.trim();
    } else if (currentKey && current[currentKey] && typeof current[currentKey] === 'string' && line.match(/^\s{4,}/)) {
      current[currentKey] += ' ' + line.trim();
    }
  }

  if (current) cards.push(current);
  return cards;
}

// ── BLOCK RENDERERS ──────────────────────────────────────────
function renderBlock(block, index, totalBlocks) {
  switch (block.type) {
    case 'p': {
      const cls = index === 0 ? ' class="reveal" style="--i:0"' : '';
      return `  <p${cls}>${inlineMarkdown(block.content)}</p>\n`;
    }

    case 'h2':
      return `  <h2>${inlineMarkdown(block.content)}</h2>\n`;

    case 'divider':
      return '  <div class="divider">\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500</div>\n';

    case 'blockquote':
      return `  <blockquote>\n    <p>${inlineMarkdown(block.content)}</p>\n  </blockquote>\n`;

    case 'callout':
      return `  <div class="callout">\n    ${inlineMarkdown(block.content)}\n  </div>\n`;

    case 'callout-accent':
      return `  <div class="callout callout--accent">\n    ${inlineMarkdown(block.content)}\n  </div>\n`;

    case 'thesis': {
      const lines = block.content.split('\n').filter(l => l.trim());
      const quote = lines[0] || '';
      const close = lines.slice(1).join(' ') || '';
      return `  <div class="thesis reveal">\n    <div class="thesis-mark">&ldquo;</div>\n    <p class="thesis-quote">${inlineMarkdown(quote)}</p>\n    <p class="thesis-close">${inlineMarkdown(close)}</p>\n  </div>\n`;
    }

    case 'colophon': {
      return `  <div class="colophon reveal">\n    <p>${inlineMarkdown(block.content.trim())}</p>\n  </div>\n`;
    }

    case 'disclaim-list': {
      const items = block.content.split('\n')
        .filter(l => l.trim().startsWith('- '))
        .map(l => l.trim().slice(2));
      return `  <ul class="disclaim-list">\n${items.map(it => `    <li>${inlineMarkdown(it)}</li>`).join('\n')}\n  </ul>\n`;
    }

    case 'timeline': {
      const { items } = parseItems(block.content);
      const html = items.map(it => {
        const active = it.active === 'true' ? ' tl-item--active' : '';
        return `    <div class="tl-item${active}">\n      <div class="tl-when">${it.when || ''}</div>\n      <span class="tl-who">${it.who || ''}</span>\n      <p class="tl-body">${inlineMarkdown(it.body || '')}</p>\n    </div>`;
      }).join('\n');
      return `  <div class="timeline">\n${html}\n  </div>\n`;
    }

    case 'cards': {
      const { items } = parseItems(block.content);
      const html = items.map(it => {
        let card = `    <div class="card reveal">\n`;
        if (it.who) card += `      <div class="card-who">${it.who}</div>\n`;
        if (it.year) card += `      <div class="card-year">${it.year}</div>\n`;
        if (it.label) card += `      <div class="card-label">${it.label}</div>\n`;
        if (it.body) card += `      <p class="card-body">${inlineMarkdown(it.body)}`;
        if (it.quote) card += `\n      <span class="card-quote">${inlineMarkdown(it.quote)}</span>`;
        if (it.body) card += `</p>\n`;
        card += `    </div>`;
        return card;
      }).join('\n');
      return `  <div class="cards">\n${html}\n  </div>\n`;
    }

    case 'hinge': {
      const { items, fields } = parseItems(block.content);
      let html = `  <div class="hinge">\n`;
      for (const it of items) {
        html += `    <div class="hinge-cell">\n`;
        if (it.tag) html += `      <div class="hinge-tag">${it.tag}</div>\n`;
        if (it.title) html += `      <div class="hinge-title">${it.title}</div>\n`;
        if (it.body) html += `      <p class="hinge-body">${inlineMarkdown(it.body)}</p>\n`;
        html += `    </div>\n`;
      }
      html += `  </div>\n`;
      if (fields.cap) html += `  <p class="hinge-cap">${inlineMarkdown(fields.cap)}</p>\n`;
      return html;
    }

    case 'toc': {
      const items = block.content.split('\n')
        .filter(l => l.trim())
        .map(l => {
          const m = l.match(/(\d+)\.\s*\[([^\]]+)\]\(([^)]+)\)/);
          if (m) return { num: m[1], text: m[2], href: m[3] };
          const m2 = l.match(/(\d+)\.\s*(.*)/);
          if (m2) return { num: m2[1], text: m2[2], href: null };
          return null;
        })
        .filter(Boolean);
      let html = `  <div class="toc">\n    <div class="toc-label">Contents</div>\n    <ol class="toc-list">\n`;
      for (const it of items) {
        const inner = it.href
          ? `<a href="${it.href}"><span class="toc-num">${it.num.padStart(2, '0')}</span> ${it.text}</a>`
          : `<span class="toc-num">${it.num.padStart(2, '0')}</span> ${it.text}`;
        html += `      <li class="toc-item">${inner}</li>\n`;
      }
      html += `    </ol>\n  </div>\n`;
      return html;
    }

    case 'text-cards': {
      const cards = parseTextCards(block.content);
      let html = `  <div class="text-cards">\n`;
      for (const card of cards) {
        html += `    <div class="text-card">\n`;
        html += `      <div class="text-card-header" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.text-card-toggle').textContent=this.nextElementSibling.classList.contains('open')?'−':'+';">\n`;
        html += `        <span class="text-card-num">${card.num || ''}</span>\n`;
        html += `        <span class="text-card-title">${card.title || ''}</span>\n`;
        if (card.greek) html += `        <span class="text-card-greek">${card.greek}</span>\n`;
        html += `        <span class="text-card-toggle">+</span>\n`;
        html += `      </div>\n`;
        html += `      <div class="text-card-body">\n`;
        for (const sec of card.sections || []) {
          html += `        <div class="tc-section">\n`;
          html += `          <div class="tc-label">${sec.label}</div>\n`;
          html += `          <div class="tc-text">${inlineMarkdown(sec.text)}</div>\n`;
          html += `        </div>\n`;
        }
        if (card.note) {
          html += `        <div class="tc-note">${inlineMarkdown(card.note)}</div>\n`;
        }
        if (card.questions && card.questions.length > 0) {
          html += `        <div class="tc-section">\n          <div class="tc-label">Questions</div>\n          <ul class="tc-questions">\n`;
          for (const q of card.questions) {
            html += `            <li>${inlineMarkdown(q)}</li>\n`;
          }
          html += `          </ul>\n        </div>\n`;
        }
        html += `      </div>\n    </div>\n`;
      }
      html += `  </div>\n`;
      return html;
    }

    case 'flag-cards': {
      const { items } = parseItems(block.content);
      return items.map(it =>
        `  <div class="flag-card">\n    <span class="flag-num">${it.num || ''}</span>\n    <div class="flag-body">\n      <div class="flag-title">${it.title || ''}</div>\n      <div class="flag-text">${inlineMarkdown(it.text || '')}</div>\n    </div>\n  </div>\n`
      ).join('');
    }

    case 'parallel': {
      const { items, fields } = parseItems(block.content);
      let html = `  <div class="parallel-box">\n`;
      if (fields.label) html += `    <div class="parallel-label">${fields.label}</div>\n`;
      html += `    <div class="parallel-list">\n`;
      for (const it of items) {
        html += `      <div class="parallel-row">\n        <div class="parallel-col-label">${it.left || ''}</div>\n        <div class="parallel-col-text">${inlineMarkdown(it.right || '')}</div>\n      </div>\n`;
      }
      html += `    </div>\n  </div>\n`;
      return html;
    }

    case 'transmission': {
      const { items, fields } = parseItems(block.content);
      let html = `  <div class="transmission-box">\n`;
      if (fields.label) html += `    <div class="transmission-label">${fields.label}</div>\n`;
      html += `    <div class="channel-list">\n`;
      for (const it of items) {
        html += `      <div class="channel">\n        <div class="channel-name">${it.name || ''}</div>\n        <div class="channel-desc">${inlineMarkdown(it.desc || '')}</div>\n      </div>\n`;
      }
      html += `    </div>\n  </div>\n`;
      return html;
    }

    case 'source-list': {
      const { items } = parseItems(block.content);
      let html = `  <div class="source-list">\n`;
      for (const it of items) {
        html += `    <div class="source-card">\n`;
        if (it.title) html += `      <div class="source-title">${it.title}</div>\n`;
        if (it.author) html += `      <div class="source-author">${it.author}</div>\n`;
        if (it.desc) html += `      <div class="source-desc">${inlineMarkdown(it.desc)}</div>\n`;
        html += `    </div>\n`;
      }
      html += `  </div>\n`;
      return html;
    }

    case 'sequence': {
      const { items } = parseItems(block.content);
      let html = `  <div class="sequence-list">\n`;
      for (const it of items) {
        html += `    <div class="sequence-step">\n      <span class="seq-num">${it.num || ''}</span>\n      <div class="seq-body">\n        <div class="seq-title">${it.title || ''}</div>\n        <div class="seq-detail">${inlineMarkdown(it.detail || '')}</div>\n`;
        if (it.pages) html += `        <span class="seq-pages">${it.pages}</span>\n`;
        html += `      </div>\n    </div>\n`;
      }
      html += `  </div>\n`;
      return html;
    }

    default:
      // Raw HTML passthrough
      return `  ${block.content}\n`;
  }
}

// ── HTML TEMPLATE ─────────────────────────────────────────────
function template(meta, articleHtml) {
  const tags = Array.isArray(meta.tags) ? meta.tags : [meta.tags].filter(Boolean);
  const eyebrow = [...tags, meta.date].filter(Boolean).join(' &middot; ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.title.replace(/"/g, '&quot;')} &mdash; David Jivan</title>
<meta name="description" content="${(meta.description || '').replace(/"/g, '&quot;')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<script defer src="/track.js"></script>
</head>
<body>

<div class="topbar topbar--sticky">
  <a class="topbar-logo" href="/">David Jivan</a>
  <a class="topbar-back" href="/">&larr; home</a>
</div>

<div class="post-header">
  <div class="post-eyebrow">${eyebrow}</div>
  <h1 class="post-title">${meta.title.replace(/"/g, '&quot;')}</h1>
  <div class="post-meta">David Jivan &middot; davidjivan.net</div>
</div>

<div class="article">

${articleHtml}
  <div class="post-footer">
    <div class="author-line">David Jivan &middot; ${meta.date || ''}</div>
    <a class="back-link" href="/">davidjivan.net</a>
  </div>

</div>

<script src="/components.js"></script>
</body>
</html>
`;
}

// ── BUILD ONE POST ────────────────────────────────────────────
function buildPost(slug) {
  const mdPath = join(CONTENT_DIR, `${slug}.md`);
  const src = readFileSync(mdPath, 'utf-8');
  const { meta, body } = parseFrontmatter(src);
  meta.slug = slug;

  const blocks = parseBlocks(body);
  const articleHtml = blocks.map((b, i) => renderBlock(b, i, blocks.length)).join('\n');
  const html = template(meta, articleHtml);

  const outPath = join(OUTPUT_DIR, `${slug}.html`);
  writeFileSync(outPath, html);
  console.log(`  built → posts/${slug}.html`);

  return meta;
}

// ── BUILD ALL ─────────────────────────────────────────────────
function buildAll(filter) {
  if (!existsSync(CONTENT_DIR)) {
    console.error(`No content directory at ${CONTENT_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.log('No .md files found in content/posts/');
    return;
  }

  const slugs = filter
    ? files.filter(f => f.replace('.md', '') === filter).map(f => f.replace('.md', ''))
    : files.map(f => f.replace('.md', ''));

  console.log(`Building ${slugs.length} post(s)...\n`);

  const metas = [];
  for (const slug of slugs) {
    try {
      const meta = buildPost(slug);
      metas.push(meta);
    } catch (e) {
      console.error(`  ERROR building ${slug}: ${e.message}`);
    }
  }

  // Only regenerate posts.json on full builds
  if (!filter && metas.length > 0) {
    // Read existing posts.json to preserve order and any entries not in content/
    let existing = [];
    const postsJsonPath = join(SITE, 'posts.json');
    if (existsSync(postsJsonPath)) {
      existing = JSON.parse(readFileSync(postsJsonPath, 'utf-8'));
    }

    // Build a map of new metadata by slug
    const newMap = new Map(metas.map(m => [m.slug, m]));

    // Update existing entries with new metadata
    const updated = existing.map(entry => {
      if (newMap.has(entry.slug)) {
        const m = newMap.get(entry.slug);
        newMap.delete(entry.slug);
        return {
          title: m.title,
          slug: m.slug,
          date: m.date,
          tags: Array.isArray(m.tags) ? m.tags : [m.tags].filter(Boolean),
        };
      }
      return entry;
    });

    // Add any new posts not in existing
    for (const [slug, m] of newMap) {
      updated.push({
        title: m.title,
        slug: m.slug,
        date: m.date,
        tags: Array.isArray(m.tags) ? m.tags : [m.tags].filter(Boolean),
      });
    }

    writeFileSync(postsJsonPath, JSON.stringify(updated, null, 2) + '\n');
    console.log(`\n  updated → posts.json (${updated.length} entries)`);
  }

  console.log('\nDone.');
}

// ── CLI ───────────────────────────────────────────────────────
const filter = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
buildAll(filter);
