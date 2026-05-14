import type { AuthRequest } from '../../middleware/auth.js';
import type { Response } from 'express';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fetchProject } from './index.js';

export const exportEpub = async (req: AuthRequest, res: Response) => {
  try {
    const project = await fetchProject(req, res);
    if (!project) return;

    const chapters = project.chapterManager.chapters.map((ch, i) => ({
      title: ch.chapterId,
      data: ch.manuscriptContent || '<p>(Sin contenido)</p>',
      beforeToc: i === 0,
    }));

    const title = project.metadata.title;

    const { default: EPub } = await import('epub-gen');

    const tmpDir = mkdtempSync(join(tmpdir(), 'plotweaver-epub-'));
    const outputPath = join(tmpDir, `${title.replace(/\s+/g, '_')}.epub`);

    const option = {
      title,
      author: 'PlotWeaver User',
      publisher: 'PlotWeaver',
      lang: 'es',
      tocTitle: 'Indice',
      appendChapterTitles: true,
      date: new Date().toISOString(),
      content: chapters,
    };

    await new Promise<void>((resolve, reject) => {
      const epub = new EPub(option, outputPath);
      epub.on('error', reject);
      epub.on('end', resolve);
      epub.on('done', resolve);
      epub.create();
    });

    const epubBuffer = readFileSync(outputPath);
    rmSync(tmpDir, { recursive: true, force: true });

    res.setHeader('Content-Type', 'application/epub+zip');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}_manuscrito.epub"`);
    res.send(epubBuffer);
  } catch (err) {
    console.error('Error exporting EPUB:', err);
    res.status(500).json({ status: 'error', message: 'Error al exportar EPUB' });
  }
};
