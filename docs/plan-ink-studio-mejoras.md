# Plan de trabajo — Mejoras Ink Studio (funcionales + visuales)

> Estado: propuesto · Fecha: 2026-08-21 · Solo toca `client/` (server intacto)

Consolida las 9 mejoras funcionales y las 12 visuales propuestas para Ink Studio, reagrupadas en 4 fases por componente. Cada fase es independiente, verificable por separado y deja la app estable.

---

## Fase 1 — Feedback de estado · esfuerzo: M

*Archivos: `InkStudioView.tsx`, `CanvasArea.tsx`, `PlotCardNode.tsx`, i18n*

| # | Mejora | Detalle |
|---|--------|---------|
| 1.1 | Indicador de guardado | Chip "Guardando… / Guardado ✓" en el header del editor, mismo patrón que ManuscriptEditor |
| 1.2 | Dot pulsante en ▶ Probar | Indicador animado cuando hay ediciones sin compilar (dirty entre debounce y compile) |
| 1.3 | Sidebar semántico | Punto por tarjeta: verde=compila, rojo=con errores, hueco=vacío (mapa nodeId→estado derivado de la última compilación completa); contador de palabras a la derecha; tarjeta activa con barra lateral emerald |
| 1.4 | Badge de estado en tarjetas del canvas | El badge "Ink" pasa a rojo/ámbar si ese nodo tiene errores/warnings (estado compartido vía contexto o elevado a CanvasArea) |

## Fase 2 — Editor inteligente · esfuerzo: L

*Archivos: `inkCodeMirror.ts`, `lib/ink.ts`, `InkStudioView.tsx`, `tests/ink.test.ts`*

| # | Mejora | Detalle |
|---|--------|---------|
| 2.1 | Lint inline | `@codemirror/lint`: subrayado ondulado en la línea exacta + gutter marker; el panel inferior queda como resumen con botón "Ir a la tarjeta" |
| 2.2 | Autocompletado | Tras `-> ` sugerir los knots existentes en el proyecto; tras `VAR `/`LIST ` nombres ya declarados (`@codemirror/autocomplete`) |
| 2.3 | Sintaxis expresiva | Choices en verde brillante, diverts `->` en cian itálica, headers de knot con fondo sutil, tags en gris apagado |
| 2.4 | Resaltado del knot actual | Decoración de línea donde empieza el fragmento de la tarjeta seleccionada (modo historia, vía `fragmentForLine`) |
| 2.5 | Validación de diverts rotos | Nueva función pura `findBrokenDiverts(source)` en `lib/ink.ts`: `-> nombre` que no coincide con ningún knot definido → warning en diagnósticos |

**⚠ Dependencias nuevas — requieren aprobación explícita** (regla AGENTS.md):

```
cd client && pnpm add @codemirror/lint @codemirror/autocomplete
```

(pnpm estricto no permite importar dependencias transitivas; `basicSetup` no incluye lint.)

## Fase 3 — Reproductor editorial · esfuerzo: M-L

*Archivos: `InkStudioView.tsx`, i18n*

| # | Mejora | Detalle |
|---|--------|---------|
| 3.1 | Tipografía editorial | Texto narrado en serif (stack sistema Georgia/Charter, sin webfont); UI en sans |
| 3.2 | Opciones jugables | Botones altos con `[1]`…`[9]` visible, flecha `→` en hover, borde emerald animado |
| 3.3 | Historial legible | Choices ya elegidas tachadas/atenuadas con ✓ en la tomada; ornamento ⁂ entre escenas visitadas |
| 3.4 | Fade-in de texto nuevo | Animación ~180ms en párrafos añadidos tras elegir |
| 3.5 | Fondo de lectura | Panel del player en tono cálido (`stone-900`) distinguiéndolo del área de trabajo |
| 3.6 | Botón "Atrás" | Replay determinista: guardar índices elegidos, `ResetState()` + re-ejecutar secuencia menos el último paso |
| 3.7 | Atajos de teclado | `Ctrl+Enter`=Probar, `1-9`=elegir opción, `Esc`=volver al grafo (requiere prop `onClose` desde CanvasArea; verificar conflictos con atajos globales del workspace) |
| 3.8 | Inspector de variables | Panel plegable con `VAR`/contadores en vivo: nombres extraídos por regex del source, valores leídos de `story.variablesState` tras cada Continue/choose |

## Fase 4 — Chrome y estructura · esfuerzo: M

*Archivos: `InkStudioView.tsx`, `inkCodeMirror.ts`, `CanvasArea.tsx`, i18n*

| # | Mejora | Detalle |
|---|--------|---------|
| 4.1 | Header con identidad | Icono plumilla + título más presente; ▶ Probar pegado al toggle de modo; unificar acento teal(toolbar)→emerald |
| 4.2 | Diagnósticos pulidos | Iconos SVG en vez de ✕/⚠, filas con hover, panel colapsable recordando su estado |
| 4.3 | Empty states ilustrados | Plumilla grande + CTA "Crear primer script" cuando no hay scripts (en editor y player vacíos) |
| 4.4 | Detalles micro | Scrollbars finas personalizadas; transición fade al cambiar de tarjeta |
| 4.5 | Paneles redimensionables | Splitters custom (pointer events, sin deps) entre sidebar/editor/player; apilado responsive en pantallas pequeñas |
| 4.6 | Persistencia de contexto | `localStorage`: modo, tarjeta seleccionada, anchos de panel, estado colapsado de diagnósticos (`plotweaver.inkStudio.*`) |

---

## Orden de implementación

1 → 2 → 3 → 4. La Fase 2 es la de mayor valor funcional pero requiere aprobación de deps; las fases 1 y 3 pueden ejecutarse sin nada nuevo.

## Tests y verificación

- **Nuevos tests** en `client/tests/ink.test.ts`: `findBrokenDiverts` (diverts válidos, rotos, END/DONE excluidos, targets dinámicos `{...}` ignorados), extracción de knots/nombres de VAR.
- **Verificación por fase**: `cd client && pnpm typecheck && pnpm lint && pnpm test`.
- Server sin cambios: no requiere verificación adicional.

## Notas técnicas / riesgos

- **Replay "Atrás"**: inkjs no soporta rewind nativo; el replay es determinista porque la historia compilada no cambia entre pasos. Invalidar historial al recompilar.
- **Lint inline**: mapear línea de error global → posición en el doc del editor; en modo historia las líneas del editor coinciden con el source ensamblado solo si la tarjeta seleccionada es la única visible... decidir: lint sobre el doc actual (tarjeta) usando offsets del fragmento, o compilar siempre el source completo y trasladar líneas vía fragments.
- **Inspector de variables**: inkjs no expone enumeración pública limpia; extraer nombres con regex (`^VAR\s+(\w+)`) y leer valores indexando `variablesState`.
- **Esc global**: revisar `ShortcutsModal` / handlers existentes en Workspace para evitar duplicados.
- **i18n**: añadir claves nuevas bajo `inkStudio.*` en `es.json` y `en.json` (guardado, inspector, atrás, empty states…).

## Preguntas abiertas

1. ¿Se aprueban las deps `@codemirror/lint` + `@codemirror/autocomplete` (necesarias solo para Fase 2)?
2. Serif del player: stack de sistema (Georgia, recomendado, cero red) ¿o webfont Lora?
3. ¿Alcance completo (21 mejoras) o recortamos alguna fase/ítem?
4. Unificar acento visual a emerald (cambiar botón teal de la toolbar) ¿ok?
