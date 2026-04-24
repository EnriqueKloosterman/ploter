import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder = 'Escribe aquí...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-slate-500 before:float-left before:pointer-events-none cursor-text',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Menú de formato simple */}
      <div className="flex gap-1 border-b border-slate-700/50 pb-1 mb-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-0.5 text-xs rounded font-bold ${editor.isActive('bold') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          title="Negrita"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-0.5 text-xs rounded italic ${editor.isActive('italic') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          title="Cursiva"
        >
          I
        </button>
      </div>
      
      {/* Área de texto - Clases 'nowheel' y 'nodrag' son obligatorias en React Flow */}
      <div className="nowheel nodrag bg-slate-900/50 p-2 rounded max-h-40 overflow-y-auto custom-scrollbar text-sm text-slate-200">
        <EditorContent editor={editor} className="outline-none" />
      </div>
    </div>
  );
};

export default RichTextEditor;