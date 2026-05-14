# Plan de Features — PlotWeaver

Basado en análisis del codebase (13/05/2026). Priorización por impacto vs esfuerzo.

---

## Fase 0 — Pendientes de ROADMAP (Base)

Antes de añadir features, hay items del ROADMAP existente que desbloquean trabajo futuro:

| # | Ítem | Prioridad | Esfuerzo |
|---|---|---|---|
| 0.1 | Tests en `sanitizeHtml.ts` y `exportMarkdown.ts` (lógica pura) | 🔴 | 1 día |
| 0.2 | Server `"typecheck": "tsc --noEmit"` en package.json | 🟡 | 15 min |
| 0.3 | Tipar `req: any, res: any` en controladores (`Request`/`Response`) | 🟡 | 1 día |
| 0.4 | Tipar `globalCharacters: any[]` en `User.ts` | 🟢 | 30 min |
| 0.5 | `project: IProject` no-nullable en context (eliminar cast) | 🟡 | 1 día |
| 0.6 | `db.ts` — evitar `process.exit(1)`, lanzar error manejable | 🟡 | 30 min |
| 0.7 | Validar `.env` al arrancar el server | 🟡 | 30 min |

> **Nota**: Si el tiempo es limitado, 0.2, 0.4, 0.6, 0.7 son triviales. 0.1, 0.3, 0.5 requieren más cuidado.

---

## Fase 1 — Completada (13/05/2026)

Todos los 10 items de Fase 1 implementados y build verificado.

| # | Feature | Estado |
|---|---|---|
| 1.1 | Persistir tipo de arista | ✅ `IEdge.type` en shared types + Mongoose + EdgeModal |
| 1.2 | Botones Undo/Redo | ✅ Barra superior del canvas |
| 1.3 | Duplicar nodo | ✅ Botón "Duplicar" en PlotNodeModal |
| 1.4 | Colapsar sidebar | ✅ Toggle `◀`/`▶` con transición |
| 1.5 | Búsqueda en nodos | ✅ Input search + dimming de no-matching |
| 1.6 | Estadísticas del proyecto | ✅ Componente `ProjectStats` en sidebar |
| 1.7 | Pantalla completa | ✅ Fullscreen API toggle |
| 1.8 | Zoom indicator | ✅ Badge `%` en barra |
| 1.9 | Fondo canvas variable | ✅ Ciclo Dots → Lines → Cross |
| 1.10 | Atajo nuevo capítulo | ✅ Tecla `C` |

---

## Fase 2 — Features Medios (Alto Valor)

Requieren más desarrollo pero aportan valor significativo al usuario.

### 1.1 Persistir tipo de arista

**Problema**: `EdgeModal` permite elegir tipo (Normal / Causa-Efecto / Conflicto) y lo muestra con colores, pero `IEdge` no tiene campo `type`. Se pierde al recargar.

**Qué hacer**:
1. Añadir `type?: 'normal' | 'causa' | 'conflicto'` a `IEdge` en `packages/shared/src/index.ts`
2. Añadir `type` al schema de `Project.ts` (embedded en `canvas.edges`)
3. Leer `edge.type` en `EdgeModal` para inicializar el selector
4. Escribir `edge.type` en `handleSaveEdge`

**Archivos**: `packages/shared/src/index.ts`, `server/src/models/Project.ts`, `client/src/components/Canvas/EdgeModal.tsx`, `client/src/context/projectTypes.ts`

**Esfuerzo**: ⏱ 30 min

---

### 1.2 Botones Undo/Redo en UI

**Problema**: Undo/redo solo funciona por teclado (Ctrl+Z/Y). No hay indicación visual para usuarios que no conocen los atajos.

**Qué hacer**:
1. Añadir botones `↩` y `↪` (o flechas de deshacer/rehacer) en la barra superior del canvas
2. Usar `canUndo`/`canRedo` del context para disabled state

**Archivos**: `client/src/components/Canvas/CanvasArea.tsx`

**Esfuerzo**: ⏱ 30 min

---

### 1.3 Duplicar nodo

**Problema**: No hay forma de duplicar una tarjeta existente. El usuario tiene que crear una nueva y rellenar los campos manualmente.

**Qué hacer**:
1. Añadir botón "Duplicar" en `PlotNodeModal`
2. Copiar `data` del nodo actual, generar nuevo `id: 'node_' + Date.now()`
3. Posición desplazada (+20px x/y)
4. Llamar `onAddNode` con los datos copiados

**Archivos**: `client/src/components/Canvas/PlotNodeModal.tsx`, `client/src/components/Canvas/CanvasArea.tsx` (exponer `handleAddNode` o pasar callback)

**Esfuerzo**: ⏱ 1 hora

---

### 1.4 Colapsar sidebar

**Problema**: Sidebar fijo de 320px. En proyectos pequeños sobra espacio, en proyectos grandes se necesita más canvas.

**Qué hacer**:
1. Añadir botón de colapso (flecha doble `◀`/`▶`) en el borde del sidebar
2. Controlar ancho con estado local: 320px vs 0
3. Animación CSS `transition: width 0.2s`

**Archivos**: `client/src/components/Sidebar/SidebarArea.tsx`

**Esfuerzo**: ⏱ 30 min

---

### 1.5 Búsqueda en nodos

**Problema**: No hay forma de buscar texto entre todos los nodos del proyecto. En proyectos con 50+ nodos es difícil encontrar uno específico.

**Qué hacer**:
1. Añadir campo de búsqueda en la barra del canvas o sidebar
2. Filtro cliente-side: recorre `project.canvas.nodes`, compara título y contenido (extraer texto plano del HTML)
3. Resaltar nodos coincidentes (cambio de opacidad/sombra)

**Archivos**: `client/src/components/Canvas/CanvasArea.tsx`, `client/src/components/Sidebar/SidebarArea.tsx`

**Esfuerzo**: ⏱ 1-2 días

---

### 1.6 Estadísticas del proyecto

**Problema**: No hay métricas. El usuario no sabe cuántos nodos, personajes o palabras tiene.

**Qué hacer**:
1. Panel pequeño (o badge) en canvas/sidebar:
   - N° de nodos
   - N° de personajes
   - N° de capítulos
   - Total de caracteres/palabras (extrayendo texto de rich content)

**Archivos**: `client/src/components/Sidebar/SidebarArea.tsx` o nuevo componente en `components/ui/`

**Esfuerzo**: ⏱ 1 día

---

### 1.7 Pantalla completa / canvas expandido

**Problema**: No hay modo de concentración. El sidebar y la cabecera siempre ocupan espacio.

**Qué hacer**:
1. Botón de pantalla completa (Fullscreen API: `document.documentElement.requestFullscreen()`)
2. O alternativamente: toggle que oculta sidebar + cabecera y maximiza el canvas

**Archivos**: `client/src/components/Canvas/CanvasArea.tsx`, `client/src/Workspace.tsx`

**Esfuerzo**: ⏱ 1 día

---

### 1.8 Zoom percentage indicator

**Problema**: No se ve el nivel de zoom actual. El usuario tiene que adivinar.

**Qué hacer**:
1. Leer `useReactFlow().getViewport().zoom`
2. Mostrar como badge `75%` / `100%` / `150%` en esquina del canvas
3. Actualizar en cada `onMoveEnd`

**Archivos**: `client/src/components/Canvas/CanvasArea.tsx`

**Esfuerzo**: ⏱ 30 min

---

### 1.9 Variantes de fondo del canvas

**Problema**: Solo dots. React Flow ofrece Lines y Cross.

**Qué hacer**:
1. Añadir botón cíclico (Dots → Lines → Cross)
2. Usar `BackgroundVariant` enum de `@xyflow/react`

**Archivos**: `client/src/components/Canvas/CanvasArea.tsx`

**Esfuerzo**: ⏱ 30 min

---

### 1.10 Atajo de teclado para nuevo capítulo

**Problema**: Hay atajo `N` para nuevo nodo pero no para nuevo capítulo.

**Qué hacer**:
1. Añadir `C` (o `Shift+N`) para crear capítulo
2. Misma lógica que botón "Add Chapter" en ChapterPanel

**Archivos**: `client/src/components/Canvas/CanvasArea.tsx`

**Esfuerzo**: ⏱ 15 min

---

## Fase 2 — Features Medios (Alto Valor)

Requieren más desarrollo pero aportan valor significativo al usuario.

### 2.1 UI de Beats (CRUD)

**Problema**: El modelo `IBeat` existe, los `chapter.beats[]` están en la BD, pero no hay UI para crearlos/editarlos/eliminarlos. Los beats aparecen listados en ChapterPanel pero son estáticos.

**Qué hacer**:
1. Añadir inline form en ChapterPanel para añadir beat: input de texto + botón "+"
2. Editar beat: click → inline input (como rename de character)
3. Eliminar beat: icono X con confirmación
4. Vincular nodos existentes al beat (dropdown multi-select de nodos del capítulo)

**Archivos**: `client/src/components/Sidebar/ChapterPanel.tsx`, `client/src/context/ProjectContext.tsx` (añadir `addBeat`, `updateBeat`, `removeBeat`)
**Dependencias**: Ninguna (modelo ya existe)

**Esfuerzo**: ⏱ 2-3 días

---

### 2.2 Gestión de tags globales

**Problema**: `User.authorLibrary.globalTags` almacena tags globales (id, label, color) pero no hay UI para gestionarlos. Tags como `gt_1` → "Giro" están hardcodeados.

**Qué hacer**:
1. Añadir sección "Manage Tags" en SidebarArea o modal dedicado
2. Crear/editar/eliminar tags con selector de color (reutilizar color picker de PlotNodeModal)
3. Endpoint API: `PUT /api/users/:authorId/library` (o añadir al user controller)
4. En PlotNodeModal, mostrar tags desde `globalTags` en vez de hardcoded

**Archivos**: Nuevo componente o modal + `server/src/controllers/userController.ts` (crear) + `server/src/routes/userRoutes.ts`
**Dependencias**: Requiere endpoint de usuario (User model ya existe)

**Esfuerzo**: ⏱ 2-3 días

---

### 2.3 Restaurar snapshots (endpoint + UI)

**Problema**: Los snapshots se crean y listan pero NO se pueden restaurar. Son archivos muertos.

**Qué hacer**:
1. Backend: `POST /api/snapshots/:snapshotId/restore` — reemplaza `projectData` del snapshot sobre el Project original
2. Frontend: Panel de snapshots (modal o slide-over) con lista + botón "Restaurar"
3. Confirmación: "¿Restaurar snapshot X? Se perderán los cambios no guardados."

**Archivos**: `server/src/controllers/snapshotController.ts`, `server/src/routes/snapshotRoutes.ts`, nuevo componente de UI
**Dependencias**: Snapshot model ya tiene `projectData`

**Esfuerzo**: ⏱ 2-3 días

---

### 2.4 Subir imagen de personaje

**Problema**: `ICharacter.image` existe en el schema (url, width, height) pero no hay UI para establecerlo. Solo muestra inicial.

**Qué hacer**:
1. Botón "Añadir imagen" en CharacterPanel (al lado del avatar)
2. Modal: input de URL + preview
3. Opcional: endpoint `POST /api/upload` para subir archivo (almacenar en /uploads o S3)
4. Mostrar imagen en avatar y en PlotCardNode (en chips de personaje)

**Archivos**: `client/src/components/Sidebar/CharacterPanel.tsx`, `PlotCardNode.tsx`
**Dependencias**: Opcionalmente requiere endpoint de upload

**Esfuerzo**: ⏱ 1-2 días

---

### 2.5 Vista de esquema / Outline

**Problema**: Solo hay vista de grafo. No hay forma de ver la estructura jerárquica del proyecto como texto.

**Qué hacer**:
1. Vista alternativa: tabla/tree donde cada capítulo es expandible y muestra sus nodos como filas
2. Mostrar: título del nodo, personajes asignados, preview del contenido (30 chars)
3. Toggle entre vista grafo / vista esquema

**Archivos**: Nuevo componente `OutlineView.tsx`, toggle en `Workspace.tsx`
**Dependencias**: Datos ya disponibles en context

**Esfuerzo**: ⏱ 3-4 días

---

## Fase 3 — Features Ambiciosos (Diferenciadores)

### 3.1 Sistema de autenticación (JWT)

**Qué incluye**:
- Backend: register/login/logout con JWT, middleware `authMiddleware`, scoping de proyectos por `authorId`
- Frontend: Login/Register pages, ProtectedRoute, token storage, auto-logout en 401
- Reemplazar `authorId: 'auth_9921'` hardcodeado por el usuario autenticado

**Archivos**: Muchos. Nuevos: `AuthContext.tsx`, `Login.tsx`, `Register.tsx`, `authRoutes.ts`, `authController.ts`, `authMiddleware.ts`
**Dependencias**: Feature crítico — desbloquea multi-usuario

**Esfuerzo**: ⏱ 1-2 semanas

---

### 3.2 Timeline / cronología

**Qué incluye**:
- Vista horizontal con capítulos como bloques en una línea de tiempo
- Arrastrar para reordenar (persiste al backend)
- Zoom in/out, coloreado por personaje POV
- Basado en SVG o Canvas, o librería tipo vis-timeline

**Archivos**: Nuevo componente `TimelineView.tsx`, nuevo endpoint de reorder
**Dependencias**: Fase 2.5 (Outline View) puede compartir lógica

**Esfuerzo**: ⏱ 2-4 semanas

---

### 3.3 Editor de manuscrito + compilación

**Qué incluye**:
- Editor rich-text a pantalla completa por capítulo
- Contador de palabras, temporizador de sesión
- "Compilar": unir todos los capítulos en un documento
- Exportar a PDF (puppeteer/playwright) o DOCX

**Archivos**: Nuevo componente `ManuscriptEditor.tsx`, ruta `/project/:projectId/manuscript`
**Dependencias**: TipTap ya existe (reutilizar configuración)

**Esfuerzo**: ⏱ 3-5 semanas

---

### 3.4 Grafo de relaciones de personajes

**Qué incluye**:
- Segundo canvas (o pestaña) con personajes como nodos
- Aristas con tipo: familia, romance, enemistad, aliado, mentor
- Ficha de personaje expandida: biography, apariencia, psicología, backstory
- Modelo separado `CharacterRelation` en backend

**Esfuerzo**: ⏱ 3-6 semanas

---

### 3.5 Exportación enriquecida

**Qué incluye**:
- PDF con tipografía profesional (vía Puppeteer)
- EPUB (reflowable ebooks)
- DOCX (Word)
- Fountain (formato de guion)
- HTML autocontenido
- Plantillas personalizables

**Esfuerzo**: ⏱ 2-4 semanas

---

### 3.6 AI Writing Assistant

**Qué incluye**:
- Sugerencias de trama basadas en nodos actuales
- Generación de nombres de personajes
- Detección de huecos argumentales
- Resumen de capítulos

**Esfuerzo**: ⏱ 3-6 semanas

---

## Resumen de priorización recomendada

```
Fase 1 (ahora)                    Fase 2 (próximo)              Fase 3 (futuro)
══════════════════════════════     ══════════════════════════    ══════════════════════════
1.1  Persistir tipo arista   →    2.1  UI de Beats         →    3.1  Autenticación
1.2  Botones Undo/Redo       →    2.2  Tags globales       →    3.2  Timeline
1.3  Duplicar nodo           →    2.3  Restaurar snapshots  →    3.3  Editor manuscrito
1.4  Colapsar sidebar        →    2.4  Imagen personaje     →    3.4  Grafo relaciones
1.5  Búsqueda en nodos       →    2.5  Vista Outline        →    3.5  Export enriquecido
1.6  Estadísticas            →                                  3.6  AI Assistant
1.7  Pantalla completa
1.8  Zoom indicator
1.9  Fondo canvas
1.10 Atajo nuevo capítulo
```

Cada fase tiene sentido por sí misma y entrega valor tangible antes de pasar a la siguiente.

---

## Convenciones para implementación

- **Branch naming**: `feat/{numero}-{nombre}` ej. `feat/1.1-persistir-tipo-arista`
- **Commit messages**: `feat: persistir tipo de arista (normal/causa/conflicto) en backend y frontend`
- **Pull Requests**: ~50-100 líneas por PR idealmente. Máximo 300.
- **Tests**: Añadir tests unitarios para lógica pura (sanitize, export, schemas Zod).
- **Documentación**: Actualizar `AGENTS.md` si se añaden nuevas rutas, contextos o dependencias.
