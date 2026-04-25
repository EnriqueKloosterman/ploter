const ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'EM', 'UL', 'OL', 'LI']);

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const sanitizeNode = (node: ChildNode): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const sanitizedChildren = Array.from(element.childNodes).map(sanitizeNode).join('');

  if (!ALLOWED_TAGS.has(element.tagName)) {
    return sanitizedChildren;
  }

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'br') {
    return '<br />';
  }

  return `<${tagName}>${sanitizedChildren}</${tagName}>`;
};

export const sanitizeRichTextHtml = (html?: string, fallback = '') => {
  if (!html || html === '<p></p>') {
    return fallback;
  }

  if (typeof window === 'undefined') {
    return fallback || escapeHtml(html);
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');
  const sanitized = Array.from(document.body.childNodes).map(sanitizeNode).join('').trim();

  return sanitized || fallback;
};
