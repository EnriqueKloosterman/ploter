import type { AuthRequest } from '../../middleware/auth.js';
import type { Response } from 'express';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { fetchProject, compileManuscript } from './index.js';

export const exportDocx = async (req: AuthRequest, res: Response) => {
  try {
    const project = await fetchProject(req, res);
    if (!project) return;

    const chapters = compileManuscript(project.chapterManager.chapters);
    const title = project.metadata.title;

    const children: Paragraph[] = [
      new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `Generado por PlotWeaver`, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: '', size: 1 })] }),
    ];

    for (const ch of chapters) {
      children.push(new Paragraph({ text: ch.title, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }));

      const paragraphs = ch.text.split('\n').filter(Boolean);
      for (const p of paragraphs) {
        children.push(new Paragraph({
          spacing: { after: 120 },
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: p, size: 22 })],
        }));
      }
    }

    const doc = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}_manuscrito.docx"`);
    res.send(buffer);
  } catch (err) {
    console.error('Error exporting DOCX:', err);
    res.status(500).json({ status: 'error', message: 'Error al exportar DOCX' });
  }
};
