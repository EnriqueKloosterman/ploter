import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useProject } from '../../context/useProject';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

const countWords = (html: string) => {
  const text = stripHtml(html).trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
};

const countChars = (html: string) => stripHtml(html).replace(/\s/g, '').length;

interface ChapterEditorProps {
  chapterId: string;
  manuscriptContent?: string;
  onSave: (chapterId: string, content: string) => void;
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({ chapterId, manuscriptContent, onSave }) => {
  const timerRef = useRef<number | null>(null);
  const prevContentRef = useRef(manuscriptContent);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: 'Comienza a escribir tu manuscrito aqui...',
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-slate-600 before:float-left before:pointer-events-none cursor-text',
      }),
    ],
    content: manuscriptContent || '',
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      prevContentRef.current = html;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        onSave(chapterId, html);
      }, 1000);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[120px] text-sm leading-relaxed text-slate-200',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== (manuscriptContent || '')) {
      editor.commands.setContent(manuscriptContent || '', { emitUpdate: false });
    }
  }, [manuscriptContent, editor]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (prevContentRef.current) {
        onSave(chapterId, prevContentRef.current);
      }
    };
  }, [chapterId, onSave]);

  if (!editor) return null;

  const words = countWords(editor.getHTML());
  const chars = countChars(editor.getHTML());

  return (
    <div className="border border-slate-700/30 rounded-xl overflow-hidden bg-slate-800/30">
      <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/60 border-b border-slate-700/20">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-0.5 text-xs rounded font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-700/50 text-blue-200' : 'text-slate-400 hover:bg-slate-700'}`}
          title="Titulo"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-0.5 text-xs rounded font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-700/50 text-blue-200' : 'text-slate-400 hover:bg-slate-700'}`}
          title="Subtitulo"
        >
          H3
        </button>
        <span className="text-slate-700 text-xs">|</span>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-0.5 text-xs rounded font-bold ${editor.isActive('bold') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          title="Negrita"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-0.5 text-xs rounded italic ${editor.isActive('italic') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          title="Cursiva"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-0.5 text-xs rounded ${editor.isActive('bulletList') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          title="Lista"
        >
          &bull;
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-0.5 text-xs rounded ${editor.isActive('blockquote') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
          title="Cita"
        >
          &ldquo;
        </button>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-500">
          <span>{words} palabras</span>
          <span>{chars} chars</span>
        </div>
      </div>
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

const ManuscriptEditor: React.FC = () => {
  const { project, updateChapterManuscript } = useProject();
  const { chapters } = project.chapterManager;
  const { nodes } = project.canvas;

  const handleSaveManuscript = useCallback((chapterId: string, content: string) => {
    updateChapterManuscript(chapterId, content);
  }, [updateChapterManuscript]);

  const totalWords = useMemo(() => {
    return chapters.reduce((sum, ch) => sum + countWords(ch.manuscriptContent || ''), 0);
  }, [chapters]);

  const totalChars = useMemo(() => {
    return chapters.reduce((sum, ch) => sum + countChars(ch.manuscriptContent || ''), 0);
  }, [chapters]);

  const handleExportHtml = useCallback(() => {
    const htmlParts = chapters.map((ch) => {
      const content = ch.manuscriptContent || '<p style="color: #666;">(Sin contenido)</p>';
      return `<section style="margin-bottom: 2em;">
        <h1 style="color: #34d399; border-bottom: 1px solid #333; padding-bottom: 0.3em;">${ch.chapterId}</h1>
        ${content}
      </section>`;
    });

    const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.metadata.title} - Manuscrito</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 2em; background: #0f172a; color: #e2e8f0; line-height: 1.8; }
    h1 { color: #34d399; }
    p { margin: 0.8em 0; }
  </style>
</head>
<body>
  <h1 style="text-align: center; font-size: 2em; margin-bottom: 2em;">${project.metadata.title}</h1>
  ${htmlParts.join('\n')}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.title.replace(/\s+/g, '_')}_manuscrito.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chapters, project.metadata.title]);

  const handleExportText = useCallback(() => {
    const textParts = chapters.map((ch) => {
      const content = stripHtml(ch.manuscriptContent || '');
      return `=== ${ch.chapterId} ===\n\n${content}`;
    });

    const fullText = `${project.metadata.title}\n${'='.repeat(project.metadata.title.length)}\n\n${textParts.join('\n\n')}`;

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.title.replace(/\s+/g, '_')}_manuscrito.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chapters, project.metadata.title]);

  if (chapters.length === 0) {
    return (
      <div className="h-full w-full bg-slate-900 flex items-center justify-center">
        <p className="text-slate-500 italic">No hay capitulos. Crea capitulos desde el panel lateral para empezar a escribir.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-900 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 border-b border-slate-700/50 shrink-0">
        <span className="text-xs font-medium text-slate-400">Manuscrito</span>
        <span className="text-xs text-slate-600">|</span>
        <span className="text-xs text-slate-500">{totalWords} palabras</span>
        <span className="text-xs text-slate-500">{totalChars} caracteres</span>
        <span className="text-xs text-slate-600">|</span>
        <span className="text-xs text-slate-500">{chapters.length} capitulos</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleExportText}
            className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
            title="Exportar como texto plano"
          >
            TXT
          </button>
          <button
            onClick={handleExportHtml}
            className="px-3 py-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            title="Exportar como HTML"
          >
            HTML
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-6 px-4 space-y-10">
          <h1 className="text-2xl font-bold text-slate-100 text-center border-b border-slate-700/40 pb-4">
            {project.metadata.title}
          </h1>

          {chapters.map((ch, idx) => {
            const chNodes = nodes.filter((n) => n.data.chapterId === ch.chapterId);

            return (
              <div key={ch.chapterId} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono w-6 text-right">{idx + 1}</span>
                  <h2 className="text-lg font-bold text-emerald-300">{ch.chapterId}</h2>
                </div>

                {/* Beats summary */}
                {ch.beats && ch.beats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-9">
                    {ch.beats.map((beat) => (
                      <span key={beat.id} className="text-[10px] text-amber-300 bg-amber-900/20 border border-amber-700/20 px-2 py-0.5 rounded">
                        {beat.description}
                      </span>
                    ))}
                  </div>
                )}

                {/* Scene list (collapsible reference) */}
                {chNodes.length > 0 && (
                  <details className="ml-9 text-xs text-slate-500">
                    <summary className="cursor-pointer hover:text-slate-300 transition-colors">
                      {chNodes.length} escena{chNodes.length !== 1 ? 's' : ''} vinculada{chNodes.length !== 1 ? 's' : ''}
                    </summary>
                    <ul className="mt-1 space-y-0.5 pl-4 list-disc list-inside">
                      {chNodes.map((n) => (
                        <li key={n.id} className="text-slate-600">{n.data.title}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Manuscript editor */}
                <div className="ml-9">
                  <ChapterEditor
                    chapterId={ch.chapterId}
                    manuscriptContent={ch.manuscriptContent}
                    onSave={handleSaveManuscript}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ManuscriptEditor;
