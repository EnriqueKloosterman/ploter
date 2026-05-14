import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { fetchProject, buildProjectContext, getOpenAI, getModel, stripHtml } from './index.js';

export const summarize = async (req: AuthRequest, res: Response) => {
  try {
    const project = await fetchProject(req, res);
    if (!project) return;

    const chapterId = req.body.chapterId;
    let context: string;

    if (chapterId) {
      const chapter = project.chapterManager.chapters.find(c => c.chapterId === chapterId);
      if (!chapter) { res.status(400).json({ status: 'error', message: 'Capitulo no encontrado' }); return; }

      const chapterNodes = project.canvas.nodes.filter(n => n.data.chapterId === chapterId);
      const charsInChapter = new Set<string>();
      for (const n of chapterNodes) {
        n.data.characterTags?.forEach(t => charsInChapter.add(t));
      }

      context = [
        `Titulo: ${project.metadata.title}`,
        `Capitulo: ${chapter.chapterId}`,
        `Personajes en este capitulo: ${[...charsInChapter].join(', ') || '(ninguno)'}`,
        `Beats: ${chapter.beats?.map(b => b.description).join(', ') || '(ninguno)'}`,
        `Escenas (${chapterNodes.length}):`,
        ...chapterNodes.map(n => `- ${n.data.title || 'Sin titulo'}: ${n.data.content ? stripHtml(n.data.content).slice(0, 150) : ''}`),
        '',
        `Texto del manuscrito:\n${chapter.manuscriptContent ? stripHtml(chapter.manuscriptContent).slice(0, 2000) : '(Sin contenido)'}`,
      ].join('\n');
    } else {
      context = buildProjectContext(project);
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: 'Eres un asistente literario que resume contenido narrativo de forma clara y concisa. Responde en español.' },
        { role: 'user', content: `${chapterId ? 'Resume el siguiente capitulo' : 'Resume el siguiente proyecto literario'} en 3-5 parrafos, destacando los puntos clave de la trama:\n\n${context}` },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    res.json({ status: 'ok', data: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error('AI summarize error:', err);
    res.status(500).json({ status: 'error', message: 'Error al generar resumen', detail: err instanceof Error ? err.message : '' });
  }
};
