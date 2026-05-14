import type { AuthRequest } from '../../middleware/auth.js';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { fetchProject, compileManuscript } from './index.js';

export const exportPdf = async (req: AuthRequest, res: Response) => {
  try {
    const project = await fetchProject(req, res);
    if (!project) return;

    const chapters = compileManuscript(project.chapterManager.chapters);
    const title = project.metadata.title;

    const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 }, info: { Title: title, Creator: 'PlotWeaver' } });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    doc.on('end', () => {
      const pdf = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}_manuscrito.pdf"`);
      res.send(pdf);
    });

    doc.fontSize(28).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('#666').text('Generado por PlotWeaver', { align: 'center' });
    doc.addPage();

    for (const ch of chapters) {
      if (ch.index > 1) doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#059669').text(ch.title);
      doc.moveDown(0.5);

      const paragraphs = ch.text.split('\n').filter(Boolean);
      for (const p of paragraphs) {
        doc.fontSize(11).font('Helvetica').fillColor('#1e293b').text(p, { align: 'justify', indent: 0 });
        doc.moveDown(0.3);
      }
    }

    doc.end();
  } catch (err) {
    console.error('Error exporting PDF:', err);
    res.status(500).json({ status: 'error', message: 'Error al exportar PDF' });
  }
};
