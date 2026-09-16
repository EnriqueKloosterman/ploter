# Plan de trabajo — Sistema de diseño UI (consistencia visual)

> Estado: ✅ completado · Fecha: 2026-08-22 · Solo toca `client/` (server intacto)

Consolida las mejoras de diseño detectadas en la auditoría visual de toda la app (Dashboard, Auth, Canvas, Sidebar, modales, Ink Studio) en 4 fases por capas. Diagnóstico base: la app tiene buena intención (tema oscuro glassmorphism, hover states cuidados) pero **no hay sistema**: 4 acentos de color conviviendo, 3 sistemas de iconos, modales hermanos con ADN divergente, tipografía sin escala y animaciones CSS que no existen.

## Progreso

- ✅ **Fase 1 completa** (2026-08-22): tokens `@theme` (`accent`, `accent-strong`, `accent-deep`, `surface`, `surface-raised`), keyframes `fade-zoom-in`/`slide-in-right`, `.label` utility, focus-visible global, Inter Variable cargada, hardcodes eliminados, acento primario unificado (blue/emerald CTA → accent).
- ✅ **Fase 2 completa** (2026-08-22): `ui/Modal.tsx` base (Esc + click-fuera + animaciones) con los 10 modales migrados; iconografía unificada en lucide-react (toolbar CanvasArea, SidebarArea, ChapterPanel, CharacterPanel, OutlineView, TimelineView, LanguageSelector, ErrorBoundary); adiós caracteres-icono ('x', '+/-' , '>' rotado, 'O', '?', "ESC") y emojis de export.
- ✅ **Fase 3 completa** (2026-08-22): `ui/Spinner.tsx` (Dashboard, ProjectContext, ProtectedRoute, CharacterPanel; SidebarArea conserva LoaderCircle contextual que hereda el color del botón); `ui/EmptyState.tsx` aplicado en CharacterPanel, ChapterPanel, StoryFlow, Ink Studio, ManuscriptEditor, CharacterGraph (i18n nueva clave `outline.empty`), TimelineView; tipografía: cero `text-[7px]-[9px]` (todo ≥10px) y headings de panel con `.label`.
- ✅ **Fase 4 completa** (2026-08-22): aria-labels en toda la toolbar y botones solo-icono; divs clicables → `<button>` accesible (card Dashboard con `aria-expanded`, headers de paneles, avatar de personaje, beats, botón añadir dentro del header como span role=button); click targets ≥28px (swatches ya w-7, delete-beat p-1, add-panel w-7 h-7); radios normalizados a lg/xl/full (adiós rounded-2xl) y bordes de contenedores unificados a `border-white/10`; toolbar de vistas sobria: botones neutros + barra inferior cromática solo en la vista activa (sky/emerald/purple/amber/indigo/teal/rose/violet).

**Plan completo** — las 4 fases están implementadas y verificadas.

Nota verificación: `pnpm typecheck`, `pnpm build` y `pnpm test` (62/62) pasan; `pnpm lint` falla por deuda preexistente NO introducida por el plan (PlotCardNode `any`, AuthContext/UserContext fast-refresh + setState-in-effect, ProjectStats memo deps, orden de `escapeHtml` en PrintableCardsModal). Pendiente decidir si se limpia dentro de este plan.

---

## Fase 1 — Cimientos: color y CSS sano · esfuerzo: M

*Archivos: `index.css`, `Login.tsx`, `Dashboard.tsx`, `SidebarArea.tsx`, `ChapterPanel.tsx`, `CharacterPanel.tsx`, `EdgeModal.tsx`, `PlotNodeModal.tsx`, `InputModal.tsx`, `PlotCardNode.tsx`*

| # | Mejora | Detalle |
|---|--------|---------|
| 1.1 | Tokens semánticos | `@theme` en `index.css`: `--color-accent` (emerald), `--color-surface`, `--color-surface-raised`, `--color-border-hair`. Regla documentada: emerald=acción primaria/focus, red=solo peligro, amber=warning, sky=info/links |
| 1.2 | Unificar acento primario | Botones guardar blue→accent (`PlotNodeModal.tsx:375`, `InputModal.tsx:65`); focus rings todos a accent (blue ×18, purple ×3); glows de sombra coherentes con el contexto |
| 1.3 | Matar hardcodes | `#0f172a` → token surface (`Login.tsx:30`, `Dashboard.tsx:93,101`), `#1e293b` → surface-raised (`SidebarArea.tsx:37`) |
| 1.4 | Clases fantasma | `bg-slate-750/850` no existen → `slate-800/900` reales (`ChapterPanel.tsx:108,128,155,213`, `CharacterPanel.tsx:89,109,130`, `EdgeModal.tsx:67`) |
| 1.5 | Animaciones reales | Keyframes propias en `index.css`: `fade-zoom-in` (modales/tarjetas), `slide-in-right` (toasts). Aplicar donde ya se intentó con `animate-in*` roto (`PlotNodeModal.tsx:73`, `PlotCardNode.tsx:170,191`, `ToastContext.tsx:39`). Duración estándar: 200ms ease-out |
| 1.6 | Contraste mínimo | Metadatos ilegibles subidos un escalón: `text-slate-600→slate-400` sobre slate-800 (`ExportModal.tsx:118`), fechas Dashboard `slate-500→slate-400` |

## Fase 2 — Modal base + iconografía · esfuerzo: L

*Archivos: nuevos `ui/Modal.tsx`, `ui/icons.tsx`; migración: `ConfirmModal.tsx`, `InputModal.tsx`, `ExportModal.tsx`, `PlotNodeModal.tsx`, `EdgeModal.tsx`, `TagsModal.tsx`, `SnapshotsModal.tsx`, `ShortcutsModal.tsx`, `PrintableCardsModal.tsx`, `RelationEditModal.tsx`*

| # | Mejora | Detalle |
|---|--------|---------|
| 2.1 | Componente `<Modal>` | Overlay común (`bg-black/60 backdrop-blur-sm`), z-index única (50; toasts 100), fondo surface, radio xl, tamaños sm/md/lg, animación entrada+salida real (estado `closing` + timeout), cierre Esc + click-fuera configurable, header con título y botón ✕ SVG |
| 2.2 | Migración de modales | Los ~9 modales existentes pasan al componente base uno por uno (app estable entre cada migración); i18n para textos hardcodeados ("Cancelar", "Sí, eliminar") |
| 2.3 | `icons.tsx` centralizado | Sin deps nuevas: recopilar los SVG inline duplicados (toolbar, sidebar, panels) en un solo módulo exportado; añadir los que faltan (X, chevron, plus, minus, play, question) |
| 2.4 | Adiós caracteres-icono | `'x'`, `'+'/'-'`, `'▶'/'◀'`, `'>'` rotado, `'O'` foco, `'?'` atajos, `"ESC"` como botón → iconos del set; emojis de ExportModal (🌐📕🎮…) → iconos |

## Fase 3 — Tipografía y componentes compartidos · esfuerzo: M

*Archivos: `index.html`, `index.css`, nuevos `ui/EmptyState.tsx`, `ui/Spinner.tsx`; toca casi todas las vistas*

| # | Mejora | Detalle |
|---|--------|---------|
| 3.1 | Inter real | ✅ Hecho en Fase 1: `@fontsource-variable/inter` cargada en `main.tsx` |
| 3.2 | Escala tipográfica | Clase utilitaria `.label` para el patrón repetido `text-xs uppercase tracking-wider text-slate-400 font-semibold`; eliminar px arbitrarios `[7px]–[9px]` (mínimo legible 10px); headings de panel con un solo estilo |
| 3.3 | `<EmptyState>` | Icono + texto + CTA integrado; aplicar en ChapterPanel (:145,:298), CharacterPanel (:126), vistas vacías de Ink/Timeline/StoryFlow; Dashboard conserva su variante con link |
| 3.4 | `<Spinner>` único | Hoy hay 3 estilos (border-emerald, border-purple, SVG ad-hoc): Dashboard :94, ProjectContext :409, SidebarArea :98 → uno solo con token de color |

## Fase 4 — Accesibilidad y pulido final · esfuerzo: S-M

*Archivos: transversal*

| # | Mejora | Detalle |
|---|--------|---------|
| 4.1 | Focus visible | Regla global `focus-visible:ring-accent` en botones/enlaces; hoy 0 usos de focus-visible en todo src |
| 4.2 | aria-labels | En todo botón que es solo icono (cerrar, colapsar, swatches, undo/redo…); divs clicables → `<button>` (card proyecto Dashboard :138, headers ChapterPanel) |
| 4.3 | Click targets ≥28px | Swatches `w-6 h-6` → `w-7 h-7`, delete-beat `p-0.5` → padding mínimo, botón 'O' foco |
| 4.4 | Radios/bordes con regla | lg=input/botón, xl=tarjeta/modal/panel, full=pill — nada más; un solo sistema de borde (`border-white/10` gana: es el del canvas/modales) |
| 4.5 | Toolbar de vistas sobria | El color por vista se mantiene como identidad PERO solo en un punto/borde inferior del icono activo; botones neutros (no 7 fondos de color simultáneos) |

---

## Orden de implementación

1 → 2 → 3 → 4. La Fase 1 desbloquea tokens que las demás consumen; la 2 es la de mayor retorno visual (los modales son la superficie más vista); 3 y 4 son transversales y pueden fraccionarse.

Cada fase termina con la app estable y verificable por separado.

## Tests y verificación

- Por fase: `cd client && pnpm typecheck && pnpm lint && pnpm test`.
- Revisión visual manual checklist por vista: Login/Register → Dashboard → Workspace (canvas, sidebar, modal nodo, edge modal, export) → Ink Studio.
- Server sin cambios: sin verificación adicional.

## Notas técnicas / riesgos

- **Tailwind 4**: los tokens van en `@theme { ... }` dentro de `index.css` (no hay tailwind.config.js). Las utilidades se generan automáticamente (`bg-accent`, `text-accent`, `ring-accent`).
- **Animación de salida en Modal**: React desmonta al instante; hace falta estado interno `closing` + `setTimeout(≈200ms)` antes de llamar a `onClose` real. Alternativa simple: solo entrada animada (aceptable).
- **Migración de modales incremental**: mantener los props públicos de cada modal intactos para no romper llamadas existentes; el refactor es interno.
- **`animate-in*` actual**: las clases ya escritas son inertes (plugin no instalado); al definir keyframes propias conviene usar nombres nuevos (`anim-fade-zoom`) para evitar colisión semántica.
- **stone en el player Ink**: decisión deliberada de zona de lectura — NO se unifica a slate.
- **Sin dependencias nuevas salvo decisión 3.1** (ver preguntas): iconografía resuelta con `icons.tsx` propio; si se prefiere `lucide-react` requiere aprobación explícita (regla AGENTS.md).

## Preguntas abiertas

> **RESUELTAS (2026-08-22, aprobación de Enrique):**
> 1. Inter: ✅ `@fontsource-variable/inter` (dep npm, self-hosted)
> 2. Iconografía: ✅ `lucide-react` (dep aprobada; sustituye a la opción `icons.tsx` propio)
> 3. Toolbar: ✅ identidad cromática atenuada por vista
> 4. Alcance: ✅ completo (Fases 1-4)
