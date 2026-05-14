import type { AuthRequest } from '../../middleware/auth.js';
import type { Response } from 'express';
import { fetchProject, compileManuscript } from './index.js';

export const exportFountain = async (req: AuthRequest, res: Response) => {
  try {
    const project = await fetchProject(req, res);
    if (!project) return;

    const chars = project.characters || [];
    const chapters = compileManuscript(project.chapterManager.chapters);
    const title = project.metadata.title;

    const lines: string[] = [
      `Title: ${title}`,
      'Credit: Written by',
      'Author: PlotWeaver User',
      'Format: fountain',
      'Source: PlotWeaver',
      '',
      '=====',
      '',
    ];

    for (const ch of chapters) {
      lines.push('');
      lines.push(`** ${ch.title.toUpperCase()} **`);
      lines.push('');

      const paragraphs = ch.text.split('\n').filter(Boolean);
      for (const p of paragraphs) {
        const upper = p.toUpperCase().trim();
        const isCharName = chars.some(c => upper === c.name.toUpperCase());
        if (isCharName) {
          lines.push(p.toUpperCase());
          lines.push('');
        } else if (upper.startsWith('INT.') || upper.startsWith('EXT.') || upper.startsWith('INT/EXT.')) {
          lines.push(p.toUpperCase());
          lines.push('');
        } else {
          lines.push(p);
          lines.push('');
        }
      }
    }

    const fountain = lines.join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}.fountain"`);
    res.send(fountain);
  } catch (err) {
    console.error('Error exporting Fountain:', err);
    res.status(500).json({ status: 'error', message: 'Error al exportar Fountain' });
  }
};
