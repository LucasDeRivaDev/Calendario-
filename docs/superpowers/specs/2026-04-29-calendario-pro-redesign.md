# Rediseño Pro del Calendario AR

**Fecha:** 2026-04-29  
**Estado:** Aprobado por el usuario  

---

## Resumen

Rediseño completo del calendario argentino multi-perfil. El objetivo es llevarlo a un nivel profesional tanto en estética como en funcionalidad, apto para portfolio freelance.

---

## Decisiones de diseño

| Decisión | Elección |
|---|---|
| Tema | Dark Mode profesional |
| Color de acento | Cian — `#06b6d4` |
| Iconos | SVG de Lucide React (ya instalado) — sin emojis |
| Grilla del calendario | Se estira verticalmente hasta el borde inferior del panel (mismo nivel que el panel de detalles) |
| Arquitectura de código | Opción B: dividir en componentes + reescribir CSS |

---

## Paleta de colores

```
--bg-base:        #060b18   (fondo global)
--bg-surface:     #0f172a   (paneles)
--bg-elevated:    #1e293b   (cards, inputs, items)
--bg-deep:        #131f35   (celdas del calendario)
--border:         rgba(255,255,255,0.06)
--text-primary:   #f1f5f9
--text-secondary: #94a3b8
--text-muted:     #334155
--accent:         #06b6d4   (cian)
--accent-bright:  #22d3ee
--accent-dim:     rgba(6,182,212,0.12)
--accent-border:  rgba(6,182,212,0.25)
--accent-glow:    rgba(6,182,212,0.28)
--holiday:        #fb923c   (naranja para feriados)
--danger:         #ef4444   (rojo para eliminar)
--success:        #10b981   (verde para notificaciones OK)
```

---

## Arquitectura de componentes

### Estructura de carpetas

```
src/
├── components/
│   ├── HeroBar.jsx        — reloj en vivo + título
│   ├── ProfilePanel.jsx   — perfiles + selector de color + stats + notificaciones
│   ├── CalendarPanel.jsx  — grilla mensual con navegación
│   ├── WeekView.jsx       — vista semanal (nueva)
│   ├── DetailsPanel.jsx   — formulario + lista de recordatorios del día
│   └── AlarmToast.jsx     — notificación flotante de alarma
├── hooks/
│   └── useCalendar.js     — todo el estado y lógica (extraído de App.jsx)
├── App.jsx                — layout root: HeroBar + toggle + workspace
├── App.css                — estilos del layout y componentes
└── index.css              — variables CSS globales + reset
```

### Responsabilidades de cada componente

**`HeroBar`** — recibe `now` como prop, muestra el título de la app y el reloj en tiempo real con el acento cian.

**`ProfilePanel`** — recibe `profiles`, `activeProfileId`, callbacks de cambio. Muestra la lista de perfiles, el selector de color (8 swatches), las estadísticas del día y el estado de notificaciones del navegador.

**`CalendarPanel`** — recibe `viewDate`, `monthDays`, `holidayMap`, `remindersByDay`, `selectedDateKey`, callbacks de navegación y selección. Renderiza la grilla con `grid-template-rows: repeat(6, 1fr)` y `flex: 1` para que se estire al alto total del panel.

**`WeekView`** — recibe la semana actual y los recordatorios de esos 7 días. Muestra los días en columnas con los eventos como bloques de tiempo. Se activa con el toggle Mensual/Semanal.

**`DetailsPanel`** — recibe `selectedDateKey`, `selectedReminders`, `selectedHolidays`, `activeProfile`, callbacks de agregar/editar/borrar. Maneja el estado local del formulario y el modo edición.

**`AlarmToast`** — recibe `alarmEvent` y `onClose`. Se muestra fijo en la esquina inferior derecha cuando hay una alarma activa.

**`useCalendar`** — contiene todo el estado: `profiles`, `activeProfileId`, `alarmLog`, `now`, `viewDate`, `selectedDateKey`, `form`, `editingReminderId`. Expone funciones: `addProfile`, `updateProfileColor`, `addReminder`, `updateReminder`, `removeReminder`, `requestNotifications`.

---

## Features nuevas

### 1. Editar recordatorios

- Cada recordatorio en la lista tiene dos botones: lápiz (editar) y tacho (borrar)
- Al hacer clic en el lápiz: el formulario del panel derecho se pre-llena con los datos del recordatorio y aparece un banner cian "Editando: [título]"
- El botón del formulario cambia de "Guardar recordatorio" a "Guardar cambios"
- Al guardar: se actualiza el recordatorio en el perfil activo y el formulario vuelve al modo creación
- Estado: `editingReminderId` en `useCalendar`. Si es `null`, el formulario está en modo creación.

### 2. Selector de color para perfiles

- En el `ProfilePanel` hay una fila de 8 swatches de color debajo de la lista de perfiles
- Los colores disponibles: `#06b6d4`, `#6366f1`, `#8b5cf6`, `#f59e0b`, `#10b981`, `#ef4444`, `#ec4899`, `#f97316`
- Al hacer clic en un swatch: actualiza el color del perfil activo en el estado global y en `localStorage`
- El swatch seleccionado tiene un `outline: 2px solid white`

### 3. Vista semanal

- Toggle Mensual/Semanal arriba del workspace (debajo del hero)
- En modo semanal: `CalendarPanel` se reemplaza por `WeekView`
- `WeekView` muestra 7 columnas (Lun–Dom) con los recordatorios del perfil activo como bloques con hora y título
- Los feriados se muestran con un chip naranja en el día correspondiente
- La semana visible es la que contiene el `selectedDateKey`

---

## CSS — principios del nuevo diseño

- Variables CSS definidas en `index.css`
- Paneles con `backdrop-filter` eliminado — reemplazado por capas sólidas oscuras
- `align-items: stretch` en el grid del workspace para que los tres paneles tengan el mismo alto
- Calendario: `display: flex; flex-direction: column` en el panel, `flex: 1` en `.cal-grid`
- Inputs y botones con `border-radius` más pequeño (10–12px) para look más moderno
- Transiciones suaves `180ms ease` en hover de días y botones
- `box-shadow` con glow cian en el botón primario

---

## Lo que NO cambia

- Lógica de feriados (`date-holidays` con `'AR'`)
- Sistema de perfiles y `localStorage`
- Sistema de alarmas y notificaciones del navegador
- Todas las funciones utilitarias (`formatDateKey`, `formatDateLabel`, `getMonthMatrix`, `buildHolidayMap`, `playAlarm`)

---

## Criterio de éxito

- La app se ve en dark mode con acento cian en todos los estados
- El calendario se estira hasta el borde inferior del panel, al mismo nivel que el panel de detalles
- Los iconos son todos de Lucide React (sin emojis en la UI)
- Se puede editar un recordatorio existente sin perder el resto
- Se puede cambiar el color de un perfil y se persiste en localStorage
- La vista semanal muestra los 7 días de la semana activa con sus recordatorios
- No hay regresiones en las features existentes
