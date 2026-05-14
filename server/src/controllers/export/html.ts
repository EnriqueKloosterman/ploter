import type { AuthRequest } from '../../middleware/auth.js';
import type { Response } from 'express';
import { fetchProject, compileManuscript } from './index.js';

export const exportHtml = async (req: AuthRequest, res: Response) => {
  try {
    const project = await fetchProject(req, res);
    if (!project) return;

    const chapters = compileManuscript(project.chapterManager.chapters);
    const title = project.metadata.title;

    const chapterHtml = chapters.map(ch => `
      <section style="margin-bottom: 2em; page-break-before: always;">
        <h2 style="color: #34d399; border-bottom: 1px solid #334155; padding-bottom: 0.3em;">${ch.title}</h2>
        <div style="font-size: 11pt; line-height: 1.8;">${ch.html}</div>
      </section>
    `).join('\n');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Manuscrito</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 2em; background: #0f172a; color: #e2e8f0; line-height: 1.8; font-size: 11pt; }
    h1 { color: #f1f5f9; font-size: 2em; margin-bottom: 0.5em; }
    h2 { color: #34d399; font-size: 1.4em; margin-top: 1.5em; margin-bottom: 0.5em; }
    h3 { color: #94a3b8; font-size: 1.1em; margin-top: 1.2em; margin-bottom: 0.4em; }
    p { margin: 0.6em 0; text-align: justify; }
    blockquote { border-left: 3px solid #475569; padding-left: 1em; margin: 1em 0; color: #94a3b8; font-style: italic; }
    ul, ol { margin: 0.6em 0; padding-left: 1.5em; }
    li { margin: 0.3em 0; }
    strong { color: #f1f5f9; }
    .title-page { text-align: center; padding-top: 30vh; }
    .title-page h1 { font-size: 2.5em; margin-bottom: 0.3em; }
    .title-page p { color: #64748b; text-align: center; font-size: 1em; }
    .toc { margin: 2em 0; }
    .toc a { color: #34d399; text-decoration: none; display: block; padding: 0.3em 0; border-bottom: 1px solid #1e293b; }
    .toc a:hover { color: #6ee7b7; }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${title}</h1>
    <p>Generado por PlotWeaver</p>
  </div>
  <div style="page-break-before: always;">
    <h2 style="color: #f1f5f9; border-bottom: 1px solid #334155; padding-bottom: 0.3em;">Indice</h2>
    <div class="toc">
      ${chapters.map(ch => `<a href="#ch${ch.index}">${ch.index}. ${ch.title}</a>`).join('\n')}
    </div>
  </div>
  ${chapterHtml}
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}_manuscrito.html"`);
    res.send(html);
  } catch (err) {
    console.error('Error exporting HTML:', err);
    res.status(500).json({ status: 'error', message: 'Error al exportar HTML' });
  }
};
