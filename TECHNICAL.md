# Documentación Técnica de PlotWeaver

## 1. Introducción

**PlotWeaver** es una herramienta de planificación narrativa para escritores que funciona como un "lienzo de tramas" digital. Permite gestionar historias complejas mediante nodos interconectados (representando escenas/tramas), personajes y capítulos, con un sistema de versiones basado en "Snapshots" para garantizar la seguridad del trabajo.

### Propósito
- Diseñar y visualizar estructuras narrativas completas
- Gestionar personajes y su aparición en diferentes tramas
- Organizar capítulos y sus escenas vinculadas
- Mantener historial de versiones inmutables

### Audiencia
Esta documentación está dirigida a desarrolladores que deseen entender, extender o mantener el proyecto.

---

## 2. Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|-------------|---------|----------|
| React | 19.2.4 | Framework UI |
| Vite | 8.0.4 | Build tool y HMR |
| Tailwind CSS | 4.2.2 | Estilos |
| @xyflow/react | 12.10.2 | Canvas interactivo |
| @tiptap/react | 3.22.4 | Editor de texto enriquecido |
| react-router-dom | 7.14.0 | Enrutamiento |
| html-to-image | 1.11.13 | Exportación a imagen |

### Backend
| Tecnología | Versión | Propósito |
|-------------|---------|----------|
| Node.js | - | Runtime |
| Express | 5.2.1 | Framework servidor |
| Mongoose | 9.4.1 | ODM MongoDB |
| TypeScript | 6.0.2 | Tipado estático |
| tsx | 4.21.0 | Ejecución TS |

---

## 3. Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (React)                        │
│  ┌──────────────┐   ┌─────────────────┐   ┌─────────────┐  │
│  │  Dashboard  │──▶│    Workspace    │◀──│  Sidebar   │  │
│  │  (Proyectos)│   │   (Canvas)     │   │(Personajes)│  │
│  └──────────────┘   └─────────────────┘   └─────────────┘  │
│         │                   │                   │           │
│         └───────────────────┴───────────────────┘           │
│                             │                                │
│                    ProjectContext                           │
│                    (Estado global)                         │
└─────────────────────────────┬──────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   lib/api.ts    │
                    │ (Llamadas HTTP) │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                      SERVIDOR (Express)                      │
│  ┌──────────────┐   ┌─────────────────┐   ┌─────────────┐  │
│  │ Project API │   │ Snapshot API   │   │  Health    │  │
│  │  /projects │   │  /snapshots    │   │  /health  │  │
│  └──────┬──────┘   └────────┬────────┘   └─────────────┘  │
│         │                   │                               │
│  ┌──────▼──────────────────▼──────┐                    │
│  │         Controladores               │                    │
│  │  projectController.ts             │                    │
│  │  snapshotController.ts          │                    │
│  └──────────────┬──────────────────────┘                    │
│                 │                                            │
│  ┌──────────────▼──────────────────────┐                    │
│  │       Modelos (Mongoose)           │                    │
│  │  Project, Snapshot, User          │                    │
│  └────────────────────┬───────────┘                       │
└───────────────────────┼─────────────────────────────────┘
                        │
                 ┌──────▼──────┐
                 │  MongoDB    │
                 └─────────────┘
```

### Flujo de Datos
1. El usuario interactúa con el canvas (React Flow)
2. Los cambios se reflejan en el estado local (React)
3. El `ProjectContext` detecta cambios y sincroniza con el servidor
4. El servidor procesa la petición y actualiza MongoDB
5. El sistema de Snapshots permite guardar versiones inmutables

---

## 4. Modelos de Datos

### 4.1 Frontend (TypeScript)

Ubicación: `client/src/context/projectTypes.ts`

```typescript
// Personaje dentro de un proyecto
interface ICharacter {
  id: string;
  name: string;
  image?: { url: string; width: number; height: number };
}

// Datos de un nodo (tarjeta de trama)
interface INodeData {
  title?: string;
  content?: string;
  color?: string;
  categoryTags?: string[];
  characterTags?: string[];
  chapterId?: string;
}

// Nodo en el canvas
interface INode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: INodeData;
}

// Conexión entre nodos
interface IEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

// Beat (escena dentro de un capítulo)
interface IBeat {
  id: string;
  description: string;
  linkedNodes: string[];
}

// Capítulo
interface IChapter {
  chapterId: string;
  beats: IBeat[];
}

// Proyecto completo
interface IProject {
  metadata: {
    projectId: string;
    title: string;
    createdAt: string;
    lastModified: string;
  };
  characters: ICharacter[];
  canvas: {
    viewport: { x: number; y: number; zoom: number };
    nodes: INode[];
    edges: IEdge[];
  };
  chapterManager: {
    chapters: IChapter[];
  };
  trashBin: {
    nodes: INode[];
    edges: IEdge[];
  };
}
```

### 4.2 Backend (Mongoose)

Ubicación: `server/src/models/Project.ts`

El esquema de MongoDB replica la estructura del tipo `IProject` con algunas diferencias:

- Usa `Schema.Types.ObjectId` para referencias
- Usa `Date` en lugar de `string` para fechas
- Añade `authorId` referenciando al modelo `User`

### 4.3 Snapshot (Versiones)

Ubicación: `server/src/models/Snapshot.ts`

```typescript
interface ISnapshot extends Document {
  projectId: mongoose.Types.ObjectId;
  description: string;
  projectData: Partial<IProject>;
  createdAt: Date;
}
```

> **Principio de Diseño**: Los Snapshots guardan un clon inmutable del estado completo del proyecto. Una versión guardada nunca se sobrescribe; se crea una nueva entrada.

---

## 5. Endpoints de la API

### 5.1 Projects API

| Método | Endpoint | Descripción |
|--------|----------|------------|
| GET | `/api/projects` | Lista todos los proyectos |
| POST | `/api/projects` | Crea un nuevo proyecto |
| GET | `/api/projects/:projectId` | Obtiene un proyecto por ID |
| PUT | `/api/projects/:projectId` | Actualiza un proyecto |
| DELETE | `/api/projects/:projectId` | Elimina un proyecto |

#### GET /api/projects
```json
{
  "status": "success",
  "data": [{
    "metadata": {
      "projectId": "proj_123456",
      "title": "Mi Historia",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastModified": "2024-01-02T00:00:00.000Z"
    }
  }]
}
```

#### POST /api/projects
```json
{ "title": "Nueva Historia" }
```

#### PUT /api/projects/:projectId
```json
{
  "metadata": { "title": "Título actualizado" },
  "canvas": { "nodes": [...], "edges": [...] },
  "characters": [...],
  "chapterManager": { "chapters": [...] }
}
```

### 5.2 Snapshots API

| Método | Endpoint | Descripción |
|--------|----------|------------|
| GET | `/api/snapshots/:projectId` | Lista versiones del proyecto |
| POST | `/api/snapshots/:projectId` | Crea una nueva versión |

#### POST /api/snapshots/:projectId
```json
{ "description": "Guardado antes del capítulo 3" }
```

```json
{
  "status": "success",
  "data": {
    "_id": "snap_...",
    "projectId": "proj_...",
    "description": "Guardado antes del capítulo 3",
    "projectData": { },
    "createdAt": "2024-01-02T00:00:00.000Z"
  }
}
```

### 5.3 Health Check

| Método | Endpoint | Descripción |
|--------|----------|------------|
| GET | `/api/health` | Verifica que el servidor funciona |

---

## 6. Estructura del Proyecto

```
plotDesigner/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/
│   │   │   │   ├── CanvasArea.tsx
│   │   │   │   ├── PlotCardNode.tsx
│   │   │   │   ├── PlotNodeModal.tsx
│   │   │   │   └── EdgeModal.tsx
│   │   │   ├── Dashboard/
│   │   │   ├── Sidebar/
│   │   │   │   ├── CharacterPanel.tsx
│   │   │   │   ├── ChapterPanel.tsx
│   │   │   │   └── SidebarArea.tsx
│   │   │   └── ui/
│   │   │       ├── RichTextEditor.tsx
│   │   │       ├── ConfirmModal.tsx
│   │   │       ├── ShortcutsModal.tsx
│   │   │       └── exportMarkdown.ts
│   │   ├── context/
│   │   │   ├── ProjectContext.tsx
│   │   │   ├── useProject.ts
│   │   │   └── projectTypes.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── sanitizeHtml.ts
│   │   ├── App.tsx
│   │   ├── Workspace.tsx
│   │   └── main.tsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── controllers/
│   │   │   ├── projectController.ts
│   │   │   └── snapshotController.ts
│   │   ├── models/
│   │   │   ├── Project.ts
│   │   │   ├── Snapshot.ts
│   │   │   └── User.ts
│   │   ├── routes/
│   │   │   ├── projectRoutes.ts
│   │   │   └── snapshotRoutes.ts
│   │   └── app.ts
│   └── package.json
│
└── docs/
    └── context.md
```

---

## 7. Guía de Uso

### 7.1 Requisitos Previos
- Node.js (recomendado ≥ 18)
- pnpm
- MongoDB (local o remoto)

### 7.2 Instalación
```bash
cd client && pnpm install
cd server && pnpm install
```

### 7.3 Ejecución
**Servidor:**
```bash
cd server && pnpm dev
#Disponible en http://localhost:5000
```

**Cliente:**
```bash
cd client && pnpm dev
#Disponible en http://localhost:5173
```

### 7.4 Uso del Canvas

#### Crear nodos
- Botón "+ Añadir tarjeta" en la barra superior
- Arrastrar desde un nodo existente al hacer clic en el canvas

#### Editar nodos
- Click en un nodo para abrir el modal de edición
- Modificar título, contenido, color y etiquetas

#### Conectar nodos
- Arrastrar desde el punto de conexión (handle) de un nodo hacia otro

#### Editar conexiones
- Click en una arista para editarla
- Añadir etiqueta descriptiva

#### Exportar
- Botón "P" para exportar el canvas como imagen PNG

### 7.5 Sistema de Versiones
Los snapshots permiten guardar estados inmutables del proyecto:
1. Acceder al panel de capítulos
2. Seleccionar "Guardar Snapshot"
3. Añadir una descripción

---

## 8. Componentes Clave

### 8.1 ProjectContext
Proveedor de estado global que maneja:
- Datos del proyecto actual
- Sincronización con el servidor
- Estados de guardado (isSaving, hasUnsavedChanges)
- CRUD de nodos, aristas, personajes y capítulos

### 8.2 PlotCardNode
Nodo personalizado de React Flow que muestra:
- Título de la escena
- Vista previa del contenido
- Color de categoría
- Etiquetas de personajes

### 8.3 CanvasArea
Componente principal del lienzo que:
- Gestiona el estado de nodos y aristas
- Maneja eventos de conexionado
- Proporciona controls y minimap
- Exporta a imagen

---

## 9. Consideraciones Técnicas

### 9.1 Rendimiento
- Los componentes de nodos usan memoización para grandes volúmenes
- El viewport se guarda para preservar la posición al recargar

### 9.2 Type Safety
- Interfaces compartidas entre frontend y backend
- Validación de campos en el servidor (pickProjectUpdateFields)

### 9.3 Inmutabilidad
- Snapshots son append-only: nunca se modifican
- El estado local se sincroniza con el servidor de forma no bloqueante

---

## 10. Referencias

- Documento de Diseño (SDD): `docs/context.md`
- Canvas: https://reactflow.dev/
- Estilos: https://tailwindcss.com/