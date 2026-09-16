# Ink Studio — Guía de uso

Ink Studio integra en PlotWeaver un editor de narrativa ramificada basado en [Ink](https://www.inklestudios.com/ink/), el lenguaje que Inkle usa en juegos como *80 Days* o *Heaven's Vault*. Cada tarjeta del canvas puede contener su propio script, puedes probar la historia directamente en la app y exportarla como un HTML jugable autocontenido.

---

## 1. Cómo abrir Ink Studio

Hay tres accesos:

| Acceso | Dónde | Qué hace |
|--------|-------|----------|
| Botón de toolbar (icono de diálogo, teal) | Toolbar flotante del canvas, junto a las demás vistas | Abre el studio con la primera tarjeta seleccionada |
| Botón **Ink** | Footer del modal de edición de tarjeta | Abre el studio con esa tarjeta ya seleccionada |
| Badge **Ink** (teal) | Esquina superior derecha de las tarjetas | Indica que esa tarjeta tiene script |

El studio es una vista alterna más: al abrirlo se cierra cualquier otra vista (Outline, Timeline, Manuscrito, etc.) y el botón pasa a decir "Volver al grafo".

---

## 2. La interfaz

```
┌──────────────────────────────────────────────────────────────┐
│ Ink Studio │ 3/12 con script        [Historia completa|Solo esta tarjeta] │
├──────────────┬───────────────────────────┬───────────────────┤
│ NODOS        │ EDITOR (.ink)             │ REPRODUCTOR       │
│ ▸ Capítulo 1 │ (CodeMirror con           │ Texto de la       │
│   • Tarjeta  │  resaltado de sintaxis)   │ historia (serif)  │
│   • Tarjeta  │                           │ ⁂ separador       │
│ ▸ Sin capítulo│                          │ ✓ elecciones hechas│
│              │                           │ ← Atrás ↺ { }     │
│              │                           ├───────────────────┤
│ [+ Plantilla]│                           │ OPCIONES [1] [2]  │
└──────────────┴───────────────────────────┴───────────────────┘
```

- **Sidebar izquierdo**: todas las tarjetas agrupadas por capítulo (mismo orden que el manuscrito). El punto verde indica tarjetas con script. Clic para seleccionar.
- **Editor central**: CodeMirror 6 con resaltado para knots, choices, diverts, variables y comentarios.
- **Reproductor derecho**: muestra la historia compilada con estética editorial (texto serif, separador ⁂ tras cada elección). Pulsando **▶ Probar** recompila y empieza desde cero; las opciones numeradas se pulsan directamente o con las **teclas 1-9**. **↺ Reiniciar** vuelve al inicio sin recompilar; **← Atrás** deshace la última elección replayeando la ruta elegida; **{ }** muestra un panel con el valor actual de cada variable declarada (`VAR`). Los párrafos nuevos aparecen con un fundido suave.
- **Diagnósticos**: debajo del reproductor. Si hay errores, cada uno muestra un botón **Ir a la tarjeta** que selecciona el nodo responsable de ese error.

### Atajos de teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl/⌘ + Enter` | Recompilar y jugar (equivale a ▶ Probar) |
| `Esc` | Cerrar el Ink Studio |
| `1` … `9` | Elegir la opción correspondiente (fuera del editor) |

### Modos de prueba

| Modo | Qué compila |
|------|-------------|
| **Historia completa** | Todos los scripts del proyecto concatenados (ver §4) |
| **Solo esta tarjeta** | Únicamente el script de la tarjeta seleccionada |

### Guardado

No hay botón guardar: al dejar de escribir 900 ms, el script se guarda en el proyecto (con undo/redo y autosave global de 5 s, igual que el manuscrito). Tras cada guardado se recompila automáticamente. Si cierras el studio o cambias de tarjeta, los cambios pendientes se guardan igualmente.

---

## 3. El lenguaje Ink en 5 minutos

Un script Ink es texto normal con instrucciones intercaladas:

```ink
// Esto es un comentario
Te acercas a la puerta antigua.

* [Abrir la puerta]
  La bisagra cruje. -> explorar_salon
* [Marcharte]
  Quizá sea mejor así. -> END
```

### Elementos esenciales

| Sintaxis | Significado |
|----------|-------------|
| `== nombre_knot ==` | Define una sección reutilizable (knot). El cierre `==` final es opcional |
| `-> nombre_knot` | Divert: salta a otra sección |
| `-> END` | Termina la historia. `-> DONE` termina sin fin explícito |
| `* [Texto]` | Opción de elección. Con `[ ]` el texto NO se repite después; sin corchetes sí |
| `+ [Texto]` | Elección "sticky": reaparece tras ser elegida |
| `VAR oro = 10` | Variable. `CONST`, `LIST` también disponibles |
| `{oro > 5: Tienes monedas}` | Texto condicional |
| `~ oro = oro - 2` | Operación (lógica sin mostrar texto) |
| `{tiene_llave}La puerta cede\{/else}Cerrada{/}` | Condicional por bloques |
| `Texto # tag` | Tag (metadatos, invisible al lector) |
| `Palabra<>siguiente` | Glue: une líneas sin salto |
| `// comentario` | Comentario de línea |

### Ejemplo con variables

```ink
VAR confianza = 0

== encuentro ==
—¿Vienes en paz? —pregunta la guardiana.

* [Mentir] ~ confianza = confianza - 1
  Ella entrecierra los ojos.
* [Decir la verdad] ~ confianza = confianza + 1
  Asiente lentamente.

+ [Continuar]
  {confianza > 0: —Sígueme —dice.{ else: —Vete de aquí.}
  -> END
```

Referencia completa: https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md

---

## 4. Cómo PlotWeaver ensambla tu historia

En modo **Historia completa**, los scripts de todas las tarjetas con contenido se concatenan en este orden:

1. Tarjetas asignadas a capítulos, siguiendo el orden de capítulos del proyecto.
2. Después, las tarjetas sin capítulo.

Cada tarjeta aporta su texto tal cual (sin envoltorio automático), separado por una línea en blanco. Por eso la convención recomendada es **un knot por tarjeta**: así los diverts entre tarjetas funcionan igual en modo completo que jugando la tarjeta suelta.

**Convención sugerida** (el botón *Insertar plantilla* genera esto):

```ink
== k_nombre_de_la_tarjeta ==
Descripción de la escena.

* [Opción A]
  -> k_otra_tarjeta
* [Opción B]
  -> END
```

Los nombres de knot deben ser únicos en todo el proyecto: si dos tarjetas se llaman igual, verás el error de knot duplicado y el diagnóstico te llevará a ambas.

> Consejo: no necesitas escribir el divert inicial. Al pulsar ▶ Probar en modo completo, si el primer fragmento no arranca con un knot, Ink empieza por el principio del texto.

---

## 5. Exportar HTML jugable

1. Abre el modal de exportación (toolbar del canvas).
2. Elige la tarjeta **🎮 HTML Jugable**.
3. Se descarga `Titulo_historia_interactiva.html`.

El archivo es **totalmente autocontenido**: incluye el motor inkjs, tu historia compilada y un reproductor minimalista. No necesita servidor ni conexión — funciona con doble clic, ideal para compartir la historia o subirla a una web estática.

Si algún script tiene errores de compilación, la exportación se rechaza con código 422 y el detalle de los errores; corrígelos en Ink Studio (los diagnósticos te llevan a cada tarjeta) e inténtalo de nuevo.

---

## 6. Preguntas frecuentes

**¿Puedo usar INCLUDE?**
No tiene efecto entre tarjetas: cada tarjeta es un fragmento independiente y solo se concatenan contenidos. Declara variables en la primera tarjeta del orden.

**Una opción no aparece en el reproductor.**
Comprueba que la historia llega hasta ella: tras un divert, el flujo no vuelve atrás salvo que uses choices sticky (`+`) o diverts explícitos.

**"Knot duplicado".**
Dos tarjetas generan el mismo nombre de knot. Renombra uno de los `== ... ==`.

**¿Se versiona lo que escribo aquí?**
Sí: el script vive dentro del proyecto (`data.inkContent` de cada nodo), así que entra en el autosave, undo/redo y Snapshots como el resto del contenido.

**¿Dónde se guarda el script?**
Dentro de la propia tarjeta del canvas. Si borras la tarjeta, se borra su script.
