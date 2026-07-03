import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const updateProjectSchema = z.object({
  metadata: z.object({
    title: z.string().min(1).max(200).optional(),
  }).optional(),
  characters: z.array(z.object({
    id: z.string(),
    name: z.string(),
    image: z.object({
      url: z.string(),
      width: z.number(),
      height: z.number(),
    }).optional(),
  })).optional(),
  characterRelations: z.array(z.object({
    id: z.string(),
    sourceId: z.string(),
    targetId: z.string(),
    type: z.enum(['familia', 'romance', 'enemistad', 'aliado', 'mentor']).optional(),
    label: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  canvas: z.object({
    viewport: z.object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    }).optional(),
    nodes: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({ x: z.number(), y: z.number() }),
      data: z.record(z.string(), z.unknown()),
    })).optional(),
    edges: z.array(z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional(),
      label: z.string().optional(),
    })).optional(),
  }).optional(),
  chapterManager: z.object({
    chapters: z.array(z.object({
      chapterId: z.string(),
      beats: z.array(z.object({
        id: z.string(),
        description: z.string(),
        linkedNodes: z.array(z.string()),
      })),
    })),
  }).optional(),
});

export const createSnapshotSchema = z.object({
  description: z.string().min(1).max(500).optional(),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().min(1),
});
