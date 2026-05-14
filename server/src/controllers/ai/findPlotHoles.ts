import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { fetchProject, buildProjectContext, getOpenAI, getModel } from './index.js';

export const findPlotHoles = async (req: AuthRequest, res: Response) => {
  try {
    const project = await fetchProject(req, res);
    if (!project) return;

    const context = buildProjectContext(project);

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: 'Eres un editor literario experto en detectar inconsistencias narrativas, huecos argumentales y problemas de estructura. Responde en español.' },
        { role: 'user', content: `Analiza el siguiente proyecto literario y detecta posibles huecos argumentales, inconsistencias o problemas narrativos:\n\n${context}\n\nPara cada problema encontrado, indica: 1) Que problema es, 2) Donde ocurre, 3) Sugerencia para resolverlo.` },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    res.json({ status: 'ok', data: completion.choices[0]?.message?.content || '' });
  } catch (err) {
    console.error('AI plot holes error:', err);
    res.status(500).json({ status: 'error', message: 'Error al analizar huecos argumentales', detail: err instanceof Error ? err.message : '' });
  }
};
