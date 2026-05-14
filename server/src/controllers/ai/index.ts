import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import Project from '../../models/Project.js';
import OpenAI from 'openai';

let _openai: OpenAI | null = null;
let _model: string | null = null;

export const initAI = () => {
  if (_openai) return;
  const key = process.env.OPENAI_API_KEY || 'no-key-required';
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  if (!process.env.OPENAI_BASE_URL && !process.env.OPENAI_API_KEY) {
    throw new Error('Configura OPENAI_API_KEY (nube) u OPENAI_BASE_URL (local, ej: LM Studio u Ollama) en el .env del servidor.');
  }
  _openai = new OpenAI({ apiKey: key, baseURL });
  _model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
};

export const getModel = (): string => {
  initAI();
  return _model!;
};

export const getOpenAI = (): OpenAI => {
  initAI();
  return _openai!;
};

export const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export const buildProjectContext = (project: {
  metadata: { title: string };
  characters: { name: string; biography?: string; appearance?: string; psychology?: string; backstory?: string }[];
  canvas: { nodes: { id: string; data: { title?: string; content?: string; chapterId?: string; characterTags?: string[] } }[] };
  chapterManager: { chapters: { chapterId: string; beats: { description: string }[]; manuscriptContent?: string }[] };
}) => {
  const parts: string[] = [];
  parts.push(`Titulo del proyecto: ${project.metadata.title}`);
  parts.push('');

  if (project.characters.length > 0) {
    parts.push('--- PERSONAJES ---');
    for (const c of project.characters) {
      parts.push(`- ${c.name}${c.biography ? `: ${c.biography}` : ''}`);
    }
    parts.push('');
  }

  if (project.canvas.nodes.length > 0) {
    parts.push('--- ESCENAS (NODOS DEL GRAFO) ---');
    for (const n of project.canvas.nodes) {
      const ch = n.data.chapterId ? `[Cap: ${n.data.chapterId}]` : '';
      const chars = n.data.characterTags?.length ? `Personajes: ${n.data.characterTags.join(', ')}` : '';
      const content = n.data.content ? stripHtml(n.data.content).slice(0, 200) : '';
      parts.push(`- ${n.data.title || 'Sin titulo'} ${ch} ${chars}${content ? ` — ${content}...` : ''}`);
    }
    parts.push('');
  }

  if (project.chapterManager.chapters.length > 0) {
    parts.push('--- CAPITULOS ---');
    for (const ch of project.chapterManager.chapters) {
      const beats = ch.beats?.length ? ` (Beats: ${ch.beats.map(b => b.description).join(', ')})` : '';
      const text = ch.manuscriptContent ? stripHtml(ch.manuscriptContent).slice(0, 300) : '(Sin contenido)';
      parts.push(`- ${ch.chapterId}${beats}: "${text}..."`);
    }
    parts.push('');
  }

  return parts.join('\n');
};

export const fetchProject = async (req: AuthRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ status: 'error', message: 'No autenticado' }); return null; }
  const project = await Project.findOne({ 'metadata.projectId': String(req.params.projectId), authorId: String(req.user.userId) });
  if (!project) { res.status(404).json({ status: 'error', message: 'Proyecto no encontrado' }); return null; }
  return project;
};

export { suggestPlot } from './suggestPlot.js';
export { generateNames } from './generateNames.js';
export { findPlotHoles } from './findPlotHoles.js';
export { summarize } from './summarize.js';
