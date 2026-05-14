import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { fetchProject, buildProjectContext, getOpenAI, getModel } from './index.js';

export const suggestPlot = async (req: AuthRequest, res: Response) => {
  try {
    const project = await fetchProject(req, res);
    if (!project) return;

    const context = buildProjectContext(project);
    const focus = req.body.focus || '';

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: 'Eres un asistente de escritura creativa experto en narrativa y estructura de tramas. Responde en español de forma concisa y util.' },
        { role: 'user', content: `Basandote en el siguiente proyecto literario, sugiere 3 giros argumentales o desarrollos de trama interesantes:\n\n${context}${focus ? `\n\nArea de enfoque: ${focus}` : ''}` },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    res.json({ status: 'ok', data: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error('AI suggest plot error:', err);
    res.status(500).json({ status: 'error', message: 'Error al generar sugerencias de trama', detail: err instanceof Error ? err.message : '' });
  }
};
