import { describe, it, expect } from 'vitest';
import { sanitizeRichTextHtml } from '../src/lib/sanitizeHtml';

describe('sanitizeRichTextHtml', () => {
  it('returns fallback for empty input', () => {
    expect(sanitizeRichTextHtml('', 'fallback')).toBe('fallback');
    expect(sanitizeRichTextHtml(undefined, 'fallback')).toBe('fallback');
  });

  it('returns fallback for empty paragraph', () => {
    expect(sanitizeRichTextHtml('<p></p>', 'fallback')).toBe('fallback');
  });

  it('strips script tag but keeps its text content', () => {
    expect(sanitizeRichTextHtml('<p><script>alert(1)</script></p>', 'fallback')).toBe('<p>alert(1)</p>');
  });

  it('preserves allowed tags and strips disallowed ones', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeRichTextHtml(input);
    expect(result).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('strips script tags but keeps content', () => {
    const input = '<p>text <script>alert(1)</script> after</p>';
    const result = sanitizeRichTextHtml(input);
    expect(result).toBe('<p>text alert(1) after</p>');
  });

  it('strips style tags but keeps content', () => {
    const input = '<p>hello <style>body{color:red}</style> world</p>';
    const result = sanitizeRichTextHtml(input);
    expect(result).toBe('<p>hello body{color:red} world</p>');
  });

  it('allows <strong>, <em>, <ul>, <ol>, <li>', () => {
    const input = '<ul><li><strong>bold</strong> and <em>italic</em></li></ul>';
    const result = sanitizeRichTextHtml(input);
    expect(result).toBe('<ul><li><strong>bold</strong> and <em>italic</em></li></ul>');
  });

  it('converts <br> to <br />', () => {
    const input = '<p>line1<br>line2</p>';
    const result = sanitizeRichTextHtml(input);
    expect(result).toBe('<p>line1<br />line2</p>');
  });

  it('removes attributes from allowed tags', () => {
    const input = '<p class="big" style="color:red">text</p>';
    const result = sanitizeRichTextHtml(input);
    expect(result).toBe('<p>text</p>');
  });

  it('escapes HTML in text nodes', () => {
    const input = '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>';
    const result = sanitizeRichTextHtml(input);
    expect(result).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('handles nested disallowed tags — div closes p implicitly in HTML', () => {
    const input = '<p>a <div>b <span>c</span></div> d</p>';
    const result = sanitizeRichTextHtml(input);
    expect(result).toBe('<p>a </p>b c d<p></p>');
  });

  it('caches results', () => {
    const input = '<p>cached content</p>';
    const first = sanitizeRichTextHtml(input);
    const second = sanitizeRichTextHtml(input);
    expect(first).toBe(second);
  });

  it('returns plain text for tags without html wrapper', () => {
    const input = 'just text';
    expect(sanitizeRichTextHtml(input)).toBe('just text');
  });
});
