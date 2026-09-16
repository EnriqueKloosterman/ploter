import fs from 'fs';
import { createRequire } from 'module';
import type { AuthRequest } from '../../middleware/auth.js';
import type { Response } from 'express';
import { Compiler } from 'inkjs/full';
import { fetchProject } from './index.js';

const require = createRequire(import.meta.url);

const assembleProjectInk = (project: {
  canvas: { nodes: { data?: { chapterId?: string; inkContent?: string } }[] };
  chapterManager: { chapters: { chapterId: string }[] };
}): string => {
  const chapterOrder = new Map(
    project.chapterManager.chapters.map((ch, i) => [ch.chapterId, i] as const)
  );
  const sorted = [...project.canvas.nodes].sort((a, b) => {
    const aIdx = chapterOrder.get(a.data?.chapterId || '');
    const bIdx = chapterOrder.get(b.data?.chapterId || '');
    if (aIdx === undefined && bIdx === undefined) return 0;
    if (aIdx === undefined) return 1;
    if (bIdx === undefined) return -1;
    return aIdx - bIdx;
  });
  return sorted
    .map((node) => node.data?.inkContent)
    .filter((content): content is string => typeof content === 'string' && content.trim().length > 0)
    .map((content) => content.trim())
    .join('\n\n');
};

const loadInkEngineSource = (): string => {
  const enginePath = require.resolve('inkjs');
  return fs.readFileSync(enginePath, 'utf8');
};

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildPlayerHtml = (title: string, storyJson: string, engineSource: string): string => {
  const safeTitle = escapeHtml(title);
  const storyJsonLiteral = JSON.stringify(storyJson).replace(/<\//g, '<\\/');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle} - Historia Interactiva</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Georgia, 'Times New Roman', serif; background: #0f172a; color: #e2e8f0; line-height: 1.8; min-height: 100vh; display: flex; justify-content: center; padding: 2em 1em; }
#app { max-width: 680px; width: 100%; display: flex; flex-direction: column; gap: 1.5em; }
h1 { color: #f1f5f9; font-size: 1.6em; text-align: center; border-bottom: 1px solid #334155; padding-bottom: 0.5em; }
#story { display: flex; flex-direction: column; gap: 0.9em; }
#story p { white-space: pre-wrap; }
#story .choice-marker { color: #34d399; font-size: 0.85em; border-left: 2px solid #065f46; padding-left: 0.8em; font-family: system-ui, sans-serif; }
#story .end-marker { text-align: center; color: #475569; font-size: 0.75em; letter-spacing: 0.3em; text-transform: uppercase; font-family: system-ui, sans-serif; margin-top: 1em; }
#choices { display: flex; flex-direction: column; gap: 0.6em; }
#choices button { font-family: system-ui, sans-serif; font-size: 0.9em; text-align: left; padding: 0.7em 1em; border-radius: 10px; border: 1px solid #334155; background: #1e293b; color: #e2e8f0; cursor: pointer; transition: all 0.15s ease; }
#choices button:hover { background: #064e3b; border-color: #059669; transform: translateY(-1px); }
#footer { display: flex; justify-content: center; padding-top: 1em; }
#restart { font-family: system-ui, sans-serif; font-size: 0.8em; padding: 0.5em 1.2em; border-radius: 999px; border: 1px solid #334155; background: transparent; color: #94a3b8; cursor: pointer; }
#restart:hover { color: #e2e8f0; border-color: #64748b; }
.empty { color: #64748b; font-style: italic; text-align: center; }
.credit { text-align: center; color: #334155; font-size: 0.7em; font-family: system-ui, sans-serif; }
</style>
</head>
<body>
<div id="app">
  <h1>${safeTitle}</h1>
  <div id="story"></div>
  <div id="choices"></div>
  <div id="footer"><button id="restart" type="button">&#8634; Reiniciar</button></div>
  <p class="credit">Generado por PlotWeaver</p>
</div>
<script>${engineSource}</script>
<script>window.__INK_STORY_JSON__ = ${storyJsonLiteral};</script>
<script>
(function () {
  var storyEl = document.getElementById('story');
  var choicesEl = document.getElementById('choices');
  var restartBtn = document.getElementById('restart');
  var story = null;

  var escapeHtml = function (text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  var startStory = function () {
    storyEl.innerHTML = '';
    choicesEl.innerHTML = '';
    try {
      story = new inkjs.Story(JSON.parse(window.__INK_STORY_JSON__));
      continueFlow();
    } catch (err) {
      storyEl.innerHTML = '<p class="empty">No se pudo cargar la historia.</p>';
    }
  };

  var continueFlow = function () {
    while (story.canContinue) {
      var text = story.Continue();
      if (text && text.trim()) {
        var p = document.createElement('p');
        p.textContent = text.trim();
        storyEl.appendChild(p);
      }
    }
    var choices = story.currentChoices;
    if (choices.length === 0 && !story.canContinue) {
      var end = document.createElement('p');
      end.className = 'end-marker';
      end.textContent = 'Fin';
      storyEl.appendChild(end);
      return;
    }
    choices.forEach(function (choice) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = choice.text;
      btn.addEventListener('click', function () {
        var marker = document.createElement('p');
        marker.className = 'choice-marker';
        marker.textContent = '\\u203A ' + choice.text;
        storyEl.appendChild(marker);
        choicesEl.innerHTML = '';
        story.ChooseChoiceIndex(choice.index);
        continueFlow();
      });
      choicesEl.appendChild(btn);
    });
  };

  restartBtn.addEventListener('click', startStory);

  if (!window.__INK_STORY_JSON__) {
    storyEl.innerHTML = '<p class="empty">Este proyecto no tiene scripts Ink todavia. Escribe contenido en el Ink Studio y vuelve a exportar.</p>';
    restartBtn.style.display = 'none';
    return;
  }
  startStory();
})();
</script>
</body>
</html>`;
};

export const exportHtmlPlayable = async (req: AuthRequest, res: Response) => {
  try {
    const project = await fetchProject(req, res);
    if (!project) return;

    const title = project.metadata.title;
    const source = assembleProjectInk(project);

    let storyJson = '';
    if (source.trim()) {
      const compiler = new Compiler(source);
      let story;
      try {
        story = compiler.Compile();
      } catch {
        res.status(422).json({ status: 'error', message: 'El script Ink contiene errores', detail: compiler.errors });
        return;
      }
      if (compiler.errors.length > 0) {
        res.status(422).json({ status: 'error', message: 'El script Ink contiene errores', detail: compiler.errors });
        return;
      }
      storyJson = story.ToJson() as string;
    }

    const engineSource = loadInkEngineSource();
    const html = buildPlayerHtml(title, storyJson, engineSource);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}_historia_interactiva.html"`);
    res.send(html);
  } catch (err) {
    console.error('Error exporting playable HTML:', err);
    res.status(500).json({ status: 'error', message: 'Error al exportar HTML jugable' });
  }
};
