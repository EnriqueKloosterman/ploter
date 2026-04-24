// Helper para convertir el HTML de TipTap a Markdown básico
const htmlToMarkdown = (html: string) => {
  if (!html) return '';
  let md = html;
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<p><\/p>/gi, '\n\n');
  md = md.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<[^>]*>?/gm, ''); // Eliminar cualquier otra etiqueta HTML sobrante
  return md.trim();
};

export const exportProjectToMarkdown = (project: any) => {
  let markdown = `# ${project.metadata?.title || 'Proyecto Sin Título'}\n\n`;

  const nodes = project.canvas?.nodes || [];
  const chapters = project.chapterManager?.chapters || [];
  const mappedNodeIds = new Set<string>();

  // 1. Recorrer y estructurar Capítulos
  chapters.forEach((chapter: any) => {
    markdown += `## ${chapter.chapterId}\n\n`;
    const linkedNodes = nodes.filter((n: any) => n.data?.chapterId === chapter.chapterId);
    
    if (linkedNodes.length === 0) {
      markdown += `*Sin escenas asignadas a este capítulo.*\n\n`;
    }

    linkedNodes.forEach((node: any) => {
      mappedNodeIds.add(node.id);
      markdown += `### ${node.data?.title || 'Escena sin título'}\n\n`;
      const content = htmlToMarkdown(node.data?.content || '');
      markdown += content ? `${content}\n\n` : `*Sin contenido.*\n\n`;
    });
  });

  // 2. Recopilar escenas "huérfanas" (Sin asignar a un capítulo)
  const unassignedNodes = nodes.filter((n: any) => !mappedNodeIds.has(n.id));
  if (unassignedNodes.length > 0) {
    markdown += `## Escenas sin asignar\n\n`;
    unassignedNodes.forEach((node: any) => {
      markdown += `### ${node.data?.title || 'Escena sin título'}\n\n`;
      const content = htmlToMarkdown(node.data?.content || '');
      markdown += content ? `${content}\n\n` : `*Sin contenido.*\n\n`;
    });
  }

  // 3. Generar el archivo y forzar la descarga en el navegador
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  // Nombre del archivo basado en el título del proyecto
  link.download = `${project.metadata?.title || 'Manuscrito'}.md`.replace(/\s+/g, '_');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};