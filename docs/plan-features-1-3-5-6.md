# Plan de Implementación — Features 1, 3, 5 y 6

## 1. 📖 Story Bible — Nueva vista

**Archivo nuevo:** `client/src/components/Canvas/StoryBibleView.tsx`
**Modificar:** `CanvasArea.tsx` + i18n

Vista similar a OutlineView que compila:

- Metadatos del proyecto (título, fecha de creación/modificación)
- **Todos los personajes** con todos sus campos:
  - Nombre, imagen, biografía, apariencia, psicología, trasfondo, stats
- **Capítulos** con sus escenas:
  - Título (HTML renderizado), contenido (HTML renderizado), acción de escena, stats, chips de personajes y tags
- Diseño limpio de lectura, scroll, fondo oscuro, ancho centrado ~700px

**Botón en toolbar:** Icono 📖, toggle como las demás vistas.

---

## 3. 👁️ Story Flow — Nueva vista

**Archivo nuevo:** `client/src/components/Canvas/StoryFlowView.tsx`
**Modificar:** `CanvasArea.tsx` + i18n

Modo lectura lineal que recorre todas las tarjetas ordenadas por capítulo:

- Cada tarjeta se renderiza COMPLETA:
  - Título (HTML), contenido (HTML renderizado), acción de escena, stats, chips de personajes y tags
- Navegación por scroll
- Cada capítulo es una sección con separador y encabezado
- Ancho centrado ~700px, fondo más limpio, tipografía más grande para el contenido

**Botón en toolbar:** Icono 👁️, toggle como las demás vistas.

---

## 5. 🗂️ Asignación Masiva de Capítulos

**Modificar:** `client/src/components/Canvas/OutlineView.tsx`

En la vista de esquema:

- Cada fila de nodo obtiene un **checkbox** pequeño a la izquierda
- Cuando hay ≥1 nodo seleccionado, aparece una **barra flotante** inferior con:
  - Contador: "3 escenas seleccionadas"
  - Dropdown: "Mover al capítulo →" con la lista de capítulos + "Sin capítulo"
  - Botón "Deseleccionar todo"
- Al seleccionar un capítulo, se actualiza `chapterId` en todos los nodos seleccionados vía `updateNodes()`

Sin archivos nuevos — solo modificar OutlineView.

---

## 6. 🖨️ Tarjetas Imprimibles — Nuevo modal

**Archivo nuevo:** `client/src/components/Canvas/PrintableCardsModal.tsx`
**Modificar:** `ExportModal.tsx` (agregar como 6to formato) + i18n

Modal con todas las tarjetas en grid responsivo:

- 3 columnas en pantalla, **3×3 por página al imprimir**
- Cada tarjeta muestra: barra de color, título (texto plano), preview de contenido (2 líneas), chips de personajes y tags
- Botón "🖨️ Imprimir":
  - Crea iframe oculto con el contenido aislado
  - Dispara `iframe.contentWindow.print()`
  - Limpia el iframe después
- CSS `@media print`:
  - `@page { size: A4; margin: 1cm; }`
  - Saltos de página cada 9 tarjetas
  - Sin backgrounds oscuros (ahorro de tinta), colores suaves

---

## Archivos a Modificar / Crear

| Archivo | Acción |
|---|---|
| `client/src/components/Canvas/StoryBibleView.tsx` | **Nuevo** |
| `client/src/components/Canvas/StoryFlowView.tsx` | **Nuevo** |
| `client/src/components/Canvas/PrintableCardsModal.tsx` | **Nuevo** |
| `client/src/components/Canvas/CanvasArea.tsx` | +2 estados, +2 botones, +render condicional |
| `client/src/components/Canvas/OutlineView.tsx` | +checkboxes, +barra asignación masiva |
| `client/src/components/Canvas/ExportModal.tsx` | +formato "Tarjetas" |
| `client/src/i18n/en.json` | +6-8 keys |
| `client/src/i18n/es.json` | +6-8 keys |

Nada del lado servidor — todo frontend con datos ya disponibles en el contexto del proyecto.
