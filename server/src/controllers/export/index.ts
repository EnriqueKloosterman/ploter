import type { AuthRequest } from '../../middleware/auth.js';
import type { Response } from 'express';
import Project from '../../models/Project.js';

export const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export interface ChapterData {
  index: number;
  title: string;
  html: string;
  text: string;
}

export const compileManuscript = (chapters: { chapterId: string; manuscriptContent?: string }[]): ChapterData[] => {
  return chapters.map((ch, i) => ({
    index: i + 1,
    title: ch.chapterId,
    html: ch.manuscriptContent || '<p>(Sin contenido)</p>',
    text: stripHtml(ch.manuscriptContent || '(Sin contenido)'),
  }));
};

export const fetchProject = async (req: AuthRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ status: 'error', message: 'No autenticado' }); return null; }
  const project = await Project.findOne({ 'metadata.projectId': String(req.params.projectId), authorId: String(req.user.userId) });
  if (!project) { res.status(404).json({ status: 'error', message: 'Proyecto no encontrado' }); return null; }
  return project;
};

export { exportHtml } from './html.js';
export { exportFountain } from './fountain.js';
export { exportDocx } from './docx.js';
export { exportPdf } from './pdf.js';
export { exportEpub } from './epub.js';
