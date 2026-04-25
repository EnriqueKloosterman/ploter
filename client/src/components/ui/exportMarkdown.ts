import type { IChapter, INode, IProject } from '../../context/projectTypes';

const htmlToMarkdown = (html: string) => {
  if (!html) return '';

  let markdown = html;
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<p><\/p>/gi, '\n\n');
  markdown = markdown.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<[^>]*>?/gm, '');

  return markdown.trim();
};

export const exportProjectToMarkdown = (project: IProject) => {
  let markdown = `# ${project.metadata?.title || 'Proyecto sin titulo'}\n\n`;

  const nodes: INode[] = project.canvas?.nodes || [];
  const chapters: IChapter[] = project.chapterManager?.chapters || [];
  const mappedNodeIds = new Set<string>();

  chapters.forEach((chapter) => {
    markdown += `## ${chapter.chapterId}\n\n`;
    const linkedNodes = nodes.filter((node) => node.data?.chapterId === chapter.chapterId);

    if (linkedNodes.length === 0) {
      markdown += '*Sin escenas asignadas a este capitulo.*\n\n';
    }

    linkedNodes.forEach((node) => {
      mappedNodeIds.add(node.id);
      markdown += `### ${node.data?.title || 'Escena sin titulo'}\n\n`;
      const content = htmlToMarkdown(node.data?.content || '');
      markdown += content ? `${content}\n\n` : '*Sin contenido.*\n\n';
    });
  });

  const unassignedNodes = nodes.filter((node) => !mappedNodeIds.has(node.id));
  if (unassignedNodes.length > 0) {
    markdown += '## Escenas sin asignar\n\n';
    unassignedNodes.forEach((node) => {
      markdown += `### ${node.data?.title || 'Escena sin titulo'}\n\n`;
      const content = htmlToMarkdown(node.data?.content || '');
      markdown += content ? `${content}\n\n` : '*Sin contenido.*\n\n';
    });
  }

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.metadata?.title || 'Manuscrito'}.md`.replace(/\s+/g, '_');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
