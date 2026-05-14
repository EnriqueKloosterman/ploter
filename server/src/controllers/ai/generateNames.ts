import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { fetchProject, getOpenAI, getModel } from './index.js';

export const generateNames = async (req: AuthRequest, res: Response) => {
  try {
    const project = await fetchProject(req, res);
    if (!project) return;

    const existingNames = project.characters.map(c => c.name).join(', ');
    const genre = project.metadata.title || '';
    const count = Math.min(Math.max(Number(req.body.count) || 5, 1), 20);
    const style = req.body.style || '';

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: 'Eres un generador de nombres de personajes literarios. Responde SOLO con una lista numerada, un nombre por linea.' },
        { role: 'user', content: `Genera ${count} nombres de personaje${style ? ` con estilo ${style}` : ''} para una obra titulada "${genre}". Nombres existentes: ${existingNames || '(ninguno)'}. Los nombres deben ser variados y coherentes con el tono de la obra.` },
      ],
      temperature: 0.9,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const names = raw.split('\n').filter(l => l.trim() && /^\d+\./.test(l.trim())).map(l => l.replace(/^\d+\.\s*/, '').trim());

    res.json({ status: 'ok', data: names.length > 0 ? names : [raw.trim()] });
  } catch (err) {
    console.error('AI generate names error:', err);
    res.status(500).json({ status: 'error', message: 'Error al generar nombres', detail: err instanceof Error ? err.message : '' });
  }
};
