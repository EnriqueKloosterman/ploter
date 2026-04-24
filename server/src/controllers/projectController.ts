import Project from '../models/Project.js';
import User from '../models/User.js';

// Seed initial mock from SDD if empty
const createMockProjectIfEmpty = async (projectId: string) => {
  let project = await Project.findOne({ 'metadata.projectId': projectId });
  
  if (!project) {
    // Check if author exists or create mock author
    let user = await User.findOne({ authorId: 'auth_9921' });
    if (!user) {
      user = await User.create({
        authorId: 'auth_9921',
        name: 'Enrique',
        globalSettings: { theme: 'dark', canvasGrid: true },
        authorLibrary: {
          globalTags: [{ tagId: 'gt_1', label: 'Giro', color: '#800080' }],
          globalCharacters: []
        }
      });
    }

    // Create the project seeding from the SDD JSON
    project = await Project.create({
      authorId: user._id,
      metadata: {
        projectId: projectId,
        title: "Crónicas del Vacío",
      },
      characters: [
        {
          id: "char_001",
          name: "Kaelen",
          image: { url: "https://via.placeholder.com/150", width: 150, height: 150 }
        }
      ],
      canvas: {
        viewport: { x: 120.5, y: -45.0, zoom: 0.75 },
        nodes: [
          {
            id: "node_1",
            type: "plot_card",
            position: { x: 250, y: 100 },
            data: {
              title: "La Decisión",
              content: "Kaelen debe decidir si entregar el artefacto o huir.",
              color: "orange",
              characterTags: ["char_001"],
              categoryTags: ["gt_1"]
            }
          },
          {
            id: "node_2",
            type: "plot_card",
            position: { x: 600, y: 150 },
            data: {
              title: "La Huida",
              content: "Comienza la persecución en el vacío.",
              color: "red",
              characterTags: ["char_001"]
            }
          }
        ],
        edges: [
          {
            id: "edge_1-2",
            source: "node_1",
            target: "node_2",
            sourceHandle: "output_right_1",
            targetHandle: "input_left",
            label: "Decide huir"
          }
        ]
      },
      chapterManager: {
        chapters: [
          {
            chapterId: "chap_1",
            beats: [{ id: "b1", description: "El descubrimiento", linkedNodes: ["node_1"] }]
          }
        ]
      },
      trashBin: { nodes: [], edges: [] }
    });
  }

  return project;
};

// GET /api/projects/:projectId
export const getProjectById = async (req: any, res: any) => {
  try {
    const { projectId } = req.params;
    
    // Auto-seed para pruebas tempranas de la app
    const project = await createMockProjectIfEmpty(projectId);

    res.json({
      status: 'success',
      data: project
    });
  } catch (error: any) {
    console.error("Error Fetching Project: ", error);
    res.status(500).json({ status: 'error', message: 'Error retrieving project' });
  }
};

// PUT /api/projects/:projectId
export const updateProject = async (req: any, res: any) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body; 

    // Resolver ConflictingUpdateOperators de MongoDB
    if (updateData.metadata) {
      updateData.metadata.lastModified = new Date();
    } else {
      updateData['metadata.lastModified'] = new Date();
    }

    // Find and update project using MongoDB mapping
    const project = await Project.findOneAndUpdate(
      { 'metadata.projectId': projectId },
      { $set: updateData },
      { new: true } 
    );

    if (!project) {
      return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
    }

    res.json({
      status: 'success',
      data: project
    });
  } catch (error: any) {
    console.error("Error Updating Project: ", error);
    res.status(500).json({ status: 'error', message: 'Fallo al actualizar proyecto' });
  }
};

// DELETE /api/projects/:projectId
export const deleteProject = async (req: any, res: any) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findOneAndDelete({ 'metadata.projectId': projectId });
    
    if (!project) {
      return res.status(404).json({ status: 'error', message: 'Project no encontrado' });
    }

    res.json({
      status: 'success',
      message: 'Proyecto eliminado con éxito'
    });
  } catch (error: any) {
    console.error("Error Deleting Project: ", error);
    res.status(500).json({ status: 'error', message: 'Fallo al eliminar proyecto' });
  }
};

// GET /api/projects
export const getAllProjects = async (req: any, res: any) => {
  try {
    // Only return metadata for the dashboard
    const projects = await Project.find({}, 'metadata.projectId metadata.title metadata.lastModified metadata.createdAt').sort({ 'metadata.lastModified': -1 });
    res.json({
      status: 'success',
      data: projects
    });
  } catch (error: any) {
    console.error("Error Fetching Projects List: ", error);
    res.status(500).json({ status: 'error', message: 'Error retrieving projects' });
  }
};

// POST /api/projects
export const createProject = async (req: any, res: any) => {
  try {
    const { title } = req.body;
    
    let user = await User.findOne({ authorId: 'auth_9921' });
    if (!user) {
      user = await User.create({
        authorId: 'auth_9921',
        name: 'Enrique',
        globalSettings: { theme: 'dark', canvasGrid: true },
        authorLibrary: {
          globalTags: [],
          globalCharacters: []
        }
      });
    }

    const newProjectId = `proj_${Date.now()}`;
    const newProject = await Project.create({
      authorId: user._id,
      metadata: {
        projectId: newProjectId,
        title: title || 'Historia Sin Título',
      },
      characters: [],
      canvas: {
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [],
        edges: []
      },
      chapterManager: {
        chapters: []
      },
      trashBin: { nodes: [], edges: [] }
    });

    res.status(201).json({
      status: 'success',
      data: newProject
    });
  } catch (error: any) {
    console.error("Error Creating Project: ", error);
    res.status(500).json({ status: 'error', message: 'Fallo al crear el proyecto' });
  }
};
