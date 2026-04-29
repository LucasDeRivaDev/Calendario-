# Calendario Pro Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el calendario a nivel pro: dark mode cian, split en componentes, editar recordatorios, selector de color de perfil y vista semanal.

**Architecture:** Se extrae todo el estado a `useCalendar.js`, se divide `App.jsx` en 6 componentes enfocados, se reescribe el CSS completo en dark theme con acento `#06b6d4`. Las features nuevas (editar, color picker, vista semanal) se agregan dentro de los componentes correspondientes.

**Tech Stack:** React 18, Vite, Lucide React (ya instalado), date-holidays, localStorage, Web Notifications API, Web Audio API.

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Reescribir | `src/index.css` | Variables CSS dark theme + reset global |
| Crear | `src/hooks/useCalendar.js` | Todo el estado, lógica y funciones utilitarias |
| Crear | `src/components/HeroBar.jsx` | Barra superior con ícono, título y reloj en vivo |
| Crear | `src/components/AlarmToast.jsx` | Toast flotante de alarma activa |
| Crear | `src/components/ProfilePanel.jsx` | Panel izquierdo: perfiles + color picker + stats |
| Crear | `src/components/CalendarPanel.jsx` | Grilla mensual que se estira al alto del panel |
| Crear | `src/components/WeekView.jsx` | Vista semanal nueva |
| Crear | `src/components/DetailsPanel.jsx` | Panel derecho: formulario + lista con edición |
| Reescribir | `src/App.jsx` | Layout root: ensambla componentes + toggle vista |
| Reescribir | `src/App.css` | Todos los estilos dark theme |

---

## Task 1: Variables CSS y reset global (index.css)

**Files:**
- Rewrite: `src/index.css`

- [ ] **Reescribir `src/index.css` con el nuevo sistema de diseño dark**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap');

:root {
  --font-body: 'Inter', 'Segoe UI', sans-serif;
  --font-display: 'Space Grotesk', 'Segoe UI', sans-serif;

  /* Fondos */
  --bg-base: #060b18;
  --bg-surface: #0f172a;
  --bg-elevated: #1e293b;
  --bg-deep: #131f35;

  /* Bordes */
  --border: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.12);

  /* Texto */
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #334155;

  /* Acento principal: cian */
  --accent: #06b6d4;
  --accent-bright: #22d3ee;
  --accent-dim: rgba(6, 182, 212, 0.12);
  --accent-border: rgba(6, 182, 212, 0.25);
  --accent-glow: 0 4px 20px rgba(6, 182, 212, 0.28);

  /* Semánticos */
  --holiday: #fb923c;
  --holiday-dim: rgba(251, 146, 60, 0.13);
  --danger: #ef4444;
  --success: #10b981;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background-color: var(--bg-base);
  color: var(--text-primary);
  line-height: 1.5;
  font-size: 14px;
  min-width: 320px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button,
input,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  letter-spacing: 0;
}

#root {
  min-height: 100vh;
}
```

- [ ] **Verificar en el navegador** — corriendo `npm run dev` desde `C:/Proyectos con IA/calendario`, el fondo debe verse oscuro (`#060b18`) en vez del crema anterior.

- [ ] **Commit**

```bash
cd "C:/Proyectos con IA/calendario"
git add src/index.css
git commit -m "style: dark theme CSS variables and global reset"
```

---

## Task 2: Hook useCalendar (estado + lógica + utilidades)

**Files:**
- Create: `src/hooks/useCalendar.js`

- [ ] **Crear carpeta `src/hooks/` y el archivo `useCalendar.js`**

```js
// src/hooks/useCalendar.js
import { useEffect, useRef, useState } from 'react'
import Holidays from 'date-holidays'

const STORAGE_KEY = 'calendario-argentina-v1'

export const SWATCH_COLORS = [
  '#06b6d4', '#6366f1', '#8b5cf6', '#f59e0b',
  '#10b981', '#ef4444', '#ec4899', '#f97316',
]

const HOLIDAY_TYPES = {
  public: 'Feriado nacional',
  bank: 'Dia no laborable',
  observance: 'Conmemoración',
}

const hd = new Holidays('AR')

// ─── Utilidades puras ───────────────────────────────────────────────────────

export function formatDateKey(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateLabel(date) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getMonthMatrix(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const startDate = new Date(year, month, 1 - startOffset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    return d
  })
}

export function buildHolidayMap(year) {
  const map = {}
  for (const holiday of hd.getHolidays(year)) {
    const dateKey = holiday.date.slice(0, 10)
    if (!map[dateKey]) map[dateKey] = []
    map[dateKey].push({
      name: holiday.name,
      type: HOLIDAY_TYPES[holiday.type] || 'Fecha especial',
    })
  }
  return map
}

function playAlarm() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return
  const ctx = new AudioContextClass()
  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02 + i * 0.18)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18 + i * 0.18)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + i * 0.18)
    osc.stop(now + 0.22 + i * 0.18)
  })
}

function createProfile(name, color, idSuffix = Date.now()) {
  return {
    id: `profile-${idSuffix}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    color,
    reminders: [],
  }
}

function createReminder(dateKey, form) {
  return {
    id: `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dateKey,
    title: form.title.trim(),
    time: form.time || '09:00',
    notes: form.notes.trim(),
    location: form.location.trim(),
    createdAt: new Date().toISOString(),
  }
}

function getInitialState() {
  const defaultProfile = createProfile('Personal', SWATCH_COLORS[0], 'seed')
  const fallback = { profiles: [defaultProfile], activeProfileId: defaultProfile.id, alarmLog: {} }
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return fallback
  try {
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed.profiles) || parsed.profiles.length === 0) return fallback
    const safeProfiles = parsed.profiles.map((p, i) => ({
      id: p.id || `profile-restored-${i}`,
      name: p.name || `Perfil ${i + 1}`,
      color: p.color || SWATCH_COLORS[i % SWATCH_COLORS.length],
      reminders: Array.isArray(p.reminders) ? p.reminders : [],
    }))
    return {
      profiles: safeProfiles,
      activeProfileId: safeProfiles.find(p => p.id === parsed.activeProfileId)?.id || safeProfiles[0].id,
      alarmLog: parsed.alarmLog && typeof parsed.alarmLog === 'object' ? parsed.alarmLog : {},
    }
  } catch {
    return fallback
  }
}

const EMPTY_FORM = { title: '', time: '09:00', location: '', notes: '' }

// ─── Hook principal ──────────────────────────────────────────────────────────

export function useCalendar() {
  const [initialState] = useState(() => getInitialState())
  const [profiles, setProfiles] = useState(initialState.profiles)
  const [activeProfileId, setActiveProfileId] = useState(initialState.activeProfileId)
  const [alarmLog, setAlarmLog] = useState(initialState.alarmLog)
  const [now, setNow] = useState(new Date())
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDateKey, setSelectedDateKey] = useState(formatDateKey(new Date()))
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )
  const [alarmEvent, setAlarmEvent] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingReminderId, setEditingReminderId] = useState(null)
  const seenAlarmRef = useRef('')

  // Computed
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0]
  const monthDays = getMonthMatrix(viewDate)
  const currentMonth = viewDate.getMonth()
  const holidayMap = buildHolidayMap(viewDate.getFullYear())
  const remindersByDay = activeProfile.reminders.reduce((acc, r) => {
    if (!acc[r.dateKey]) acc[r.dateKey] = []
    acc[r.dateKey].push(r)
    return acc
  }, {})
  const selectedReminders = [...(remindersByDay[selectedDateKey] || [])].sort((a, b) =>
    a.time.localeCompare(b.time),
  )
  const selectedDate = new Date(`${selectedDateKey}T00:00:00`)
  const selectedHolidays = holidayMap[selectedDateKey] || []
  const todayKey = formatDateKey(now)
  const pendingToday = profiles.flatMap(p =>
    p.reminders
      .filter(r => r.dateKey === todayKey)
      .map(r => ({ ...r, profileName: p.name, profileColor: p.color })),
  )
  const monthHolidayCount = monthDays.reduce((count, day) => {
    if (day.getMonth() !== currentMonth) return count
    return count + (holidayMap[formatDateKey(day)]?.length || 0)
  }, 0)

  // Effects
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles, activeProfileId, alarmLog }))
  }, [profiles, activeProfileId, alarmLog])

  useEffect(() => {
    const nowDate = new Date()
    const nowKey = formatDateKey(nowDate)
    const currentTime = `${`${nowDate.getHours()}`.padStart(2, '0')}:${`${nowDate.getMinutes()}`.padStart(2, '0')}`
    const dueReminder = profiles
      .flatMap(p =>
        p.reminders.map(r => ({ ...r, profileName: p.name, profileColor: p.color })),
      )
      .sort((a, b) => `${a.dateKey}${a.time}`.localeCompare(`${b.dateKey}${b.time}`))
      .find(r => {
        const uniqueKey = `${r.id}-${nowKey}`
        return r.dateKey === nowKey && r.time <= currentTime && !alarmLog[uniqueKey]
      })

    if (!dueReminder) { seenAlarmRef.current = ''; return }
    const alarmKey = `${dueReminder.id}-${nowKey}`
    if (seenAlarmRef.current === alarmKey) return
    seenAlarmRef.current = alarmKey
    setAlarmLog(cur => ({ ...cur, [alarmKey]: nowDate.toISOString() }))
    setAlarmEvent(dueReminder)
    playAlarm()
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`Recordatorio: ${dueReminder.title}`, {
        body: `${dueReminder.profileName} · ${dueReminder.time}`,
      })
    }
  }, [now, profiles, alarmLog])

  // Actions
  function updateForm(field, value) {
    setForm(cur => ({ ...cur, [field]: value }))
  }

  function addProfile(event) {
    event.preventDefault()
    const name = newProfileName.trim()
    if (!name) return
    const color = SWATCH_COLORS[profiles.length % SWATCH_COLORS.length]
    const profile = createProfile(name, color)
    setProfiles(cur => [...cur, profile])
    setActiveProfileId(profile.id)
    setNewProfileName('')
    setShowProfileForm(false)
  }

  function updateProfileColor(color) {
    setProfiles(cur =>
      cur.map(p => (p.id === activeProfileId ? { ...p, color } : p)),
    )
  }

  function addReminder(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    const reminder = createReminder(selectedDateKey, form)
    setProfiles(cur =>
      cur.map(p =>
        p.id === activeProfile.id
          ? { ...p, reminders: [...p.reminders, reminder] }
          : p,
      ),
    )
    setForm(EMPTY_FORM)
  }

  function startEditReminder(reminder) {
    setEditingReminderId(reminder.id)
    setForm({
      title: reminder.title,
      time: reminder.time,
      location: reminder.location || '',
      notes: reminder.notes || '',
    })
  }

  function cancelEditReminder() {
    setEditingReminderId(null)
    setForm(EMPTY_FORM)
  }

  function updateReminder(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    setProfiles(cur =>
      cur.map(p =>
        p.id === activeProfile.id
          ? {
              ...p,
              reminders: p.reminders.map(r =>
                r.id === editingReminderId
                  ? { ...r, title: form.title.trim(), time: form.time, location: form.location.trim(), notes: form.notes.trim() }
                  : r,
              ),
            }
          : p,
      ),
    )
    setEditingReminderId(null)
    setForm(EMPTY_FORM)
  }

  function removeReminder(reminderId) {
    if (editingReminderId === reminderId) cancelEditReminder()
    setProfiles(cur =>
      cur.map(p =>
        p.id === activeProfile.id
          ? { ...p, reminders: p.reminders.filter(r => r.id !== reminderId) }
          : p,
      ),
    )
  }

  function requestNotifications() {
    if (typeof Notification === 'undefined') return
    Notification.requestPermission().then(p => setNotificationPermission(p))
  }

  return {
    // state
    profiles, activeProfile, activeProfileId,
    alarmLog, now, viewDate, selectedDateKey,
    form, editingReminderId,
    notificationPermission,
    alarmEvent, setAlarmEvent,
    showProfileForm, setShowProfileForm,
    newProfileName, setNewProfileName,
    // computed
    monthDays, currentMonth, holidayMap,
    remindersByDay, selectedReminders,
    selectedDate, selectedHolidays,
    todayKey, pendingToday, monthHolidayCount,
    // actions
    setActiveProfileId,
    setViewDate, setSelectedDateKey,
    addProfile, updateProfileColor,
    addReminder, updateReminder,
    startEditReminder, cancelEditReminder,
    updateForm,
    requestNotifications,
  }
}
```

- [ ] **Verificar que el hook no rompe nada** — agregar temporalmente al final de `App.jsx` existente:
  ```js
  import { useCalendar } from './hooks/useCalendar'
  ```
  y ejecutar `npm run dev`. No debe haber errores en consola.

- [ ] **Commit**

```bash
git add src/hooks/useCalendar.js
git commit -m "feat: extract all state and logic to useCalendar hook"
```

---

## Task 3: HeroBar component

**Files:**
- Create: `src/components/HeroBar.jsx`

- [ ] **Crear `src/components/HeroBar.jsx`**

```jsx
// src/components/HeroBar.jsx
import { CalendarDays } from 'lucide-react'
import { formatDateLabel } from '../hooks/useCalendar'

export function HeroBar({ now }) {
  return (
    <section className="hero-bar">
      <div className="hero-left">
        <div className="hero-icon">
          <CalendarDays size={20} />
        </div>
        <div>
          <h1 className="hero-title">Calendario AR</h1>
          <p className="hero-sub">Agenda · Feriados · Alarmas</p>
        </div>
      </div>
      <div className="clock-block">
        <div className="clock-time">{now.toLocaleTimeString('es-AR')}</div>
        <div className="clock-date">{formatDateLabel(now)}</div>
      </div>
    </section>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/HeroBar.jsx
git commit -m "feat: add HeroBar component"
```

---

## Task 4: AlarmToast component

**Files:**
- Create: `src/components/AlarmToast.jsx`

- [ ] **Crear `src/components/AlarmToast.jsx`**

```jsx
// src/components/AlarmToast.jsx
import { Bell } from 'lucide-react'

export function AlarmToast({ alarmEvent, onClose }) {
  if (!alarmEvent) return null

  return (
    <div className="alarm-toast" role="alert">
      <div className="alarm-icon-wrap">
        <Bell size={18} />
      </div>
      <div className="alarm-body">
        <p className="alarm-label">Recordatorio activo</p>
        <strong className="alarm-title">{alarmEvent.title}</strong>
        <span className="alarm-sub">{alarmEvent.profileName} · {alarmEvent.time}</span>
      </div>
      <button type="button" className="alarm-close" onClick={onClose}>
        Cerrar
      </button>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/AlarmToast.jsx
git commit -m "feat: add AlarmToast component"
```

---

## Task 5: ProfilePanel (con color picker)

**Files:**
- Create: `src/components/ProfilePanel.jsx`

- [ ] **Crear `src/components/ProfilePanel.jsx`**

```jsx
// src/components/ProfilePanel.jsx
import { Bell, CalendarDays, Check, Clock3, Plus, UserRound } from 'lucide-react'
import { SWATCH_COLORS } from '../hooks/useCalendar'

export function ProfilePanel({
  profiles,
  activeProfile,
  notificationPermission,
  pendingToday,
  monthHolidayCount,
  showProfileForm,
  newProfileName,
  onSetActiveProfile,
  onToggleProfileForm,
  onNewProfileNameChange,
  onAddProfile,
  onUpdateProfileColor,
  onRequestNotifications,
}) {
  return (
    <aside className="panel profiles-panel">
      <div className="panel-header">
        <div>
          <p className="section-kicker">Perfiles</p>
          <h2>Mis espacios</h2>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="Agregar perfil"
          onClick={onToggleProfileForm}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="profiles-list">
        {profiles.map(profile => (
          <button
            key={profile.id}
            type="button"
            className={`profile-card ${profile.id === activeProfile.id ? 'active' : ''}`}
            onClick={() => onSetActiveProfile(profile.id)}
            style={{ '--profile-accent': profile.color }}
          >
            <span className="profile-dot" />
            <span className="profile-copy">
              <strong>{profile.name}</strong>
              <small>{profile.reminders.length} recordatorios</small>
            </span>
            <UserRound size={14} />
          </button>
        ))}
      </div>

      {showProfileForm && (
        <form className="profile-form" onSubmit={onAddProfile}>
          <label>
            Nombre del perfil
            <input
              type="text"
              value={newProfileName}
              onChange={e => onNewProfileNameChange(e.target.value)}
              placeholder="Trabajo, Familia, Estudio..."
              autoFocus
            />
          </label>
          <button type="submit" className="primary-button">Crear perfil</button>
        </form>
      )}

      <div className="color-picker-section">
        <p className="section-kicker">Color del perfil activo</p>
        <div className="color-swatches">
          {SWATCH_COLORS.map(color => (
            <button
              key={color}
              type="button"
              className={`swatch ${activeProfile.color === color ? 'selected' : ''}`}
              style={{ background: color }}
              aria-label={`Color ${color}`}
              onClick={() => onUpdateProfileColor(color)}
            />
          ))}
        </div>
      </div>

      <div className="info-stack">
        <div className="mini-stat">
          <Clock3 size={15} />
          <div>
            <span>Hoy</span>
            <strong>{pendingToday.length} eventos activos</strong>
          </div>
        </div>
        <div className="mini-stat">
          <CalendarDays size={15} />
          <div>
            <span>Mes visible</span>
            <strong>{monthHolidayCount} fechas especiales</strong>
          </div>
        </div>
      </div>

      <div className="notification-box">
        <div className="notification-copy">
          <Bell size={15} />
          <div>
            <strong>Alertas del navegador</strong>
            <span>
              {notificationPermission === 'granted' && 'Activadas'}
              {notificationPermission === 'denied' && 'Bloqueadas'}
              {notificationPermission === 'unsupported' && 'No disponibles'}
              {notificationPermission === 'default' && 'Pendientes'}
            </span>
          </div>
        </div>
        {notificationPermission === 'granted' && <Check size={14} className="notif-check" />}
        {notificationPermission === 'default' && (
          <button type="button" className="secondary-button" onClick={onRequestNotifications}>
            Activar
          </button>
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/ProfilePanel.jsx
git commit -m "feat: add ProfilePanel with color picker"
```

---

## Task 6: CalendarPanel (grilla full-height)

**Files:**
- Create: `src/components/CalendarPanel.jsx`

- [ ] **Crear `src/components/CalendarPanel.jsx`**

```jsx
// src/components/CalendarPanel.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDateKey, formatMonthLabel } from '../hooks/useCalendar'

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function CalendarPanel({
  viewDate,
  monthDays,
  currentMonth,
  holidayMap,
  remindersByDay,
  selectedDateKey,
  todayKey,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onGoToday,
}) {
  return (
    <section className="panel calendar-panel">
      <div className="panel-header month-header">
        <div>
          <p className="section-kicker">Vista mensual</p>
          <h2>{formatMonthLabel(viewDate)}</h2>
        </div>
        <div className="month-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Mes anterior"
            onClick={onPrevMonth}
          >
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="today-button" onClick={onGoToday}>
            Hoy
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Mes siguiente"
            onClick={onNextMonth}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="week-grid week-head">
        {WEEK_DAYS.map(d => <span key={d}>{d}</span>)}
      </div>

      <div className="calendar-grid">
        {monthDays.map(day => {
          const dateKey = formatDateKey(day)
          const reminders = remindersByDay[dateKey] || []
          const holidays = holidayMap[dateKey] || []
          const isCurrentMonth = day.getMonth() === currentMonth
          const isToday = dateKey === todayKey
          const isSelected = dateKey === selectedDateKey

          return (
            <button
              key={dateKey}
              type="button"
              className={[
                'day-card',
                isCurrentMonth ? '' : 'muted',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
              ].join(' ')}
              onClick={() => onSelectDate(dateKey)}
            >
              <span className="day-number">{day.getDate()}</span>
              {holidays.length > 0 && (
                <span className="holiday-pill">{holidays[0].name}</span>
              )}
              <div className="day-reminders">
                {reminders.slice(0, 2).map(r => (
                  <span key={r.id} className="reminder-chip">
                    {r.time} · {r.title}
                  </span>
                ))}
                {reminders.length > 2 && (
                  <span className="more-chip">+{reminders.length - 2} más</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/CalendarPanel.jsx
git commit -m "feat: add CalendarPanel with full-height grid"
```

---

## Task 7: WeekView (vista semanal nueva)

**Files:**
- Create: `src/components/WeekView.jsx`

- [ ] **Crear `src/components/WeekView.jsx`**

```jsx
// src/components/WeekView.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDateKey } from '../hooks/useCalendar'

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function getWeekDays(selectedDateKey) {
  const date = new Date(`${selectedDateKey}T00:00:00`)
  const dayOfWeek = (date.getDay() + 6) % 7 // Lunes = 0
  const monday = new Date(date)
  monday.setDate(date.getDate() - dayOfWeek)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getWeekLabel(weekDays) {
  const first = weekDays[0]
  const last = weekDays[6]
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} de ${last.toLocaleString('es-AR', { month: 'long', year: 'numeric' })}`
  }
  return `${first.toLocaleString('es-AR', { day: 'numeric', month: 'short' })} – ${last.toLocaleString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export function WeekView({
  selectedDateKey,
  remindersByDay,
  holidayMap,
  todayKey,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onGoToday,
}) {
  const weekDays = getWeekDays(selectedDateKey)

  return (
    <section className="panel week-panel">
      <div className="panel-header month-header">
        <div>
          <p className="section-kicker">Vista semanal</p>
          <h2>{getWeekLabel(weekDays)}</h2>
        </div>
        <div className="month-actions">
          <button type="button" className="icon-button" aria-label="Semana anterior" onClick={onPrevWeek}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="today-button" onClick={onGoToday}>
            Hoy
          </button>
          <button type="button" className="icon-button" aria-label="Semana siguiente" onClick={onNextWeek}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="week-columns">
        {weekDays.map((day, i) => {
          const dateKey = formatDateKey(day)
          const reminders = remindersByDay[dateKey] || []
          const holidays = holidayMap[dateKey] || []
          const isToday = dateKey === todayKey
          const isSelected = dateKey === selectedDateKey

          return (
            <div
              key={dateKey}
              className={[
                'week-col',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
              ].join(' ')}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(dateKey)}
              onKeyDown={e => e.key === 'Enter' && onSelectDate(dateKey)}
            >
              <div className="week-col-head">
                <span className="week-col-name">{DAY_NAMES[i]}</span>
                <span className="week-col-num">{day.getDate()}</span>
              </div>
              {holidays.length > 0 && (
                <span className="holiday-pill">{holidays[0].name}</span>
              )}
              <div className="week-events">
                {reminders.map(r => (
                  <div key={r.id} className="week-event">
                    <span className="week-event-time">{r.time}</span>
                    <span className="week-event-title">{r.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/WeekView.jsx
git commit -m "feat: add WeekView component"
```

---

## Task 8: DetailsPanel (con edición de recordatorios)

**Files:**
- Create: `src/components/DetailsPanel.jsx`

- [ ] **Crear `src/components/DetailsPanel.jsx`**

```jsx
// src/components/DetailsPanel.jsx
import { CalendarDays, MapPin, Pencil, Save, Trash2, Volume2, X } from 'lucide-react'
import { formatDateLabel } from '../hooks/useCalendar'

export function DetailsPanel({
  selectedDate,
  activeProfile,
  selectedReminders,
  selectedHolidays,
  form,
  editingReminderId,
  onUpdateForm,
  onAddReminder,
  onUpdateReminder,
  onStartEdit,
  onCancelEdit,
  onRemoveReminder,
}) {
  const isEditing = editingReminderId !== null

  return (
    <aside className="panel details-panel">
      <div className="panel-header">
        <div>
          <p className="section-kicker">Día seleccionado</p>
          <h2>{formatDateLabel(selectedDate)}</h2>
        </div>
      </div>

      <div className="selected-profile-banner" style={{ '--profile-accent': activeProfile.color }}>
        <span className="profile-dot" />
        <div>
          <strong>{activeProfile.name}</strong>
          <small>Todo lo que agregués queda guardado solo en este perfil.</small>
        </div>
      </div>

      {selectedHolidays.length > 0 && (
        <div className="holiday-box">
          {selectedHolidays.map(h => (
            <div key={h.name} className="holiday-row">
              <CalendarDays size={15} />
              <div>
                <strong>{h.name}</strong>
                <span>{h.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="editing-banner">
          <Pencil size={12} />
          <span>
            Editando: <strong>{form.title || '…'}</strong>
          </span>
          <button
            type="button"
            className="cancel-edit-btn"
            aria-label="Cancelar edición"
            onClick={onCancelEdit}
          >
            <X size={12} />
          </button>
        </div>
      )}

      <form className="reminder-form" onSubmit={isEditing ? onUpdateReminder : onAddReminder}>
        <label>
          Título
          <input
            type="text"
            value={form.title}
            onChange={e => onUpdateForm('title', e.target.value)}
            placeholder="Ej. Reunión con cliente"
          />
        </label>
        <div className="form-row">
          <label>
            Hora
            <input
              type="time"
              value={form.time}
              onChange={e => onUpdateForm('time', e.target.value)}
            />
          </label>
          <label>
            Lugar
            <input
              type="text"
              value={form.location}
              onChange={e => onUpdateForm('location', e.target.value)}
              placeholder="Opcional"
            />
          </label>
        </div>
        <label>
          Notas
          <textarea
            rows="3"
            value={form.notes}
            onChange={e => onUpdateForm('notes', e.target.value)}
            placeholder="Detalles, ideas, links..."
          />
        </label>
        <button type="submit" className="primary-button">
          <Save size={14} />
          {isEditing ? 'Guardar cambios' : 'Guardar recordatorio'}
        </button>
      </form>

      <div className="agenda-list">
        {selectedReminders.length === 0 ? (
          <div className="empty-state">
            <Volume2 size={17} />
            <p>No hay recordatorios para este día en este perfil.</p>
          </div>
        ) : (
          selectedReminders.map(reminder => (
            <article
              key={reminder.id}
              className={`agenda-item ${editingReminderId === reminder.id ? 'editing' : ''}`}
            >
              <div className="agenda-top">
                <div>
                  <strong>{reminder.title}</strong>
                  <span>{reminder.time}</span>
                </div>
                <div className="agenda-actions">
                  <button
                    type="button"
                    className="icon-button edit-btn"
                    aria-label={`Editar ${reminder.title}`}
                    onClick={() => onStartEdit(reminder)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-button delete-btn"
                    aria-label={`Borrar ${reminder.title}`}
                    onClick={() => onRemoveReminder(reminder.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {reminder.location && (
                <p className="agenda-meta">
                  <MapPin size={12} />
                  {reminder.location}
                </p>
              )}
              {reminder.notes && <p className="agenda-notes">{reminder.notes}</p>}
            </article>
          ))
        )}
      </div>
    </aside>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/DetailsPanel.jsx
git commit -m "feat: add DetailsPanel with edit mode"
```

---

## Task 9: App.jsx — ensamblaje final

**Files:**
- Rewrite: `src/App.jsx`

- [ ] **Reescribir `src/App.jsx` completo**

```jsx
// src/App.jsx
import { useState } from 'react'
import { CalendarDays, LayoutGrid } from 'lucide-react'
import { useCalendar, formatDateKey } from './hooks/useCalendar'
import { HeroBar } from './components/HeroBar'
import { ProfilePanel } from './components/ProfilePanel'
import { CalendarPanel } from './components/CalendarPanel'
import { WeekView } from './components/WeekView'
import { DetailsPanel } from './components/DetailsPanel'
import { AlarmToast } from './components/AlarmToast'
import './App.css'

function App() {
  const [viewMode, setViewMode] = useState('month') // 'month' | 'week'
  const cal = useCalendar()

  function handlePrevMonth() {
    cal.setViewDate(new Date(cal.viewDate.getFullYear(), cal.viewDate.getMonth() - 1, 1))
  }

  function handleNextMonth() {
    cal.setViewDate(new Date(cal.viewDate.getFullYear(), cal.viewDate.getMonth() + 1, 1))
  }

  function handleGoToday() {
    const t = new Date()
    cal.setViewDate(new Date(t.getFullYear(), t.getMonth(), 1))
    cal.setSelectedDateKey(formatDateKey(t))
  }

  function handlePrevWeek() {
    const d = new Date(`${cal.selectedDateKey}T00:00:00`)
    d.setDate(d.getDate() - 7)
    cal.setSelectedDateKey(formatDateKey(d))
    cal.setViewDate(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  function handleNextWeek() {
    const d = new Date(`${cal.selectedDateKey}T00:00:00`)
    d.setDate(d.getDate() + 7)
    cal.setSelectedDateKey(formatDateKey(d))
    cal.setViewDate(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  return (
    <main className="app-shell">
      <HeroBar now={cal.now} />

      <div className="view-toggle">
        <button
          type="button"
          className={`toggle-btn ${viewMode === 'month' ? 'active' : ''}`}
          onClick={() => setViewMode('month')}
        >
          <CalendarDays size={13} />
          Mensual
        </button>
        <button
          type="button"
          className={`toggle-btn ${viewMode === 'week' ? 'active' : ''}`}
          onClick={() => setViewMode('week')}
        >
          <LayoutGrid size={13} />
          Semanal
        </button>
      </div>

      <section className="workspace">
        <ProfilePanel
          profiles={cal.profiles}
          activeProfile={cal.activeProfile}
          notificationPermission={cal.notificationPermission}
          pendingToday={cal.pendingToday}
          monthHolidayCount={cal.monthHolidayCount}
          showProfileForm={cal.showProfileForm}
          newProfileName={cal.newProfileName}
          onSetActiveProfile={cal.setActiveProfileId}
          onToggleProfileForm={() => cal.setShowProfileForm(v => !v)}
          onNewProfileNameChange={cal.setNewProfileName}
          onAddProfile={cal.addProfile}
          onUpdateProfileColor={cal.updateProfileColor}
          onRequestNotifications={cal.requestNotifications}
        />

        {viewMode === 'month' ? (
          <CalendarPanel
            viewDate={cal.viewDate}
            monthDays={cal.monthDays}
            currentMonth={cal.currentMonth}
            holidayMap={cal.holidayMap}
            remindersByDay={cal.remindersByDay}
            selectedDateKey={cal.selectedDateKey}
            todayKey={cal.todayKey}
            onSelectDate={cal.setSelectedDateKey}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onGoToday={handleGoToday}
          />
        ) : (
          <WeekView
            selectedDateKey={cal.selectedDateKey}
            remindersByDay={cal.remindersByDay}
            holidayMap={cal.holidayMap}
            todayKey={cal.todayKey}
            onSelectDate={cal.setSelectedDateKey}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onGoToday={handleGoToday}
          />
        )}

        <DetailsPanel
          selectedDate={cal.selectedDate}
          activeProfile={cal.activeProfile}
          selectedReminders={cal.selectedReminders}
          selectedHolidays={cal.selectedHolidays}
          form={cal.form}
          editingReminderId={cal.editingReminderId}
          onUpdateForm={cal.updateForm}
          onAddReminder={cal.addReminder}
          onUpdateReminder={cal.updateReminder}
          onStartEdit={cal.startEditReminder}
          onCancelEdit={cal.cancelEditReminder}
          onRemoveReminder={cal.removeReminder}
        />
      </section>

      <AlarmToast alarmEvent={cal.alarmEvent} onClose={() => cal.setAlarmEvent(null)} />
    </main>
  )
}

export default App
```

- [ ] **Verificar en el navegador** — `npm run dev` debe mostrar la app sin errores. Va a verse sin estilos nuevos todavía, pero sin pantalla roja de error.

- [ ] **Commit**

```bash
git add src/App.jsx
git commit -m "refactor: rewrite App.jsx using split components"
```

---

## Task 10: App.css — dark theme completo

**Files:**
- Rewrite: `src/App.css`

- [ ] **Reescribir `src/App.css` completo**

```css
/* ─── Layout shell ─────────────────────────────────────────────────── */
.app-shell {
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ─── Hero bar ─────────────────────────────────────────────────────── */
.hero-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(6, 182, 212, 0.02));
  border: 1px solid rgba(6, 182, 212, 0.15);
  border-radius: 18px;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex: none;
}

.hero-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  margin: 0;
}

.hero-sub {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin: 2px 0 0;
}

.clock-block {
  text-align: right;
}

.clock-time {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3vw, 2rem);
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.clock-date {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 3px;
}

/* ─── View toggle ──────────────────────────────────────────────────── */
.view-toggle {
  display: flex;
  gap: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 4px;
  width: fit-content;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  transition: color 150ms ease, background 150ms ease;
}

.toggle-btn.active {
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--accent-border);
}

/* ─── Workspace ────────────────────────────────────────────────────── */
.workspace {
  display: grid;
  grid-template-columns: 268px minmax(0, 1fr) 320px;
  gap: 14px;
  align-items: stretch;
  flex: 1;
}

/* ─── Panel base ───────────────────────────────────────────────────── */
.panel {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 18px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.panel h2 {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 4px 0 0;
}

.section-kicker {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0;
}

/* ─── Botones ──────────────────────────────────────────────────────── */
.icon-button {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  transition: color 150ms ease, border-color 150ms ease;
  flex: none;
}

.icon-button:hover {
  color: var(--text-primary);
  border-color: var(--border-hover);
}

.today-button,
.secondary-button {
  padding: 7px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  transition: color 150ms ease, border-color 150ms ease;
}

.today-button:hover,
.secondary-button:hover {
  color: var(--accent);
  border-color: var(--accent-border);
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 11px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  background: var(--accent);
  color: var(--bg-base);
  box-shadow: var(--accent-glow);
  transition: opacity 150ms ease, box-shadow 150ms ease;
}

.primary-button:hover {
  opacity: 0.9;
}

/* ─── Profiles panel ───────────────────────────────────────────────── */
.profiles-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.profiles-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 12px;
  border-radius: 13px;
  background: var(--bg-elevated);
  color: inherit;
  border: 1px solid var(--border);
  transition: border-color 160ms ease, background 160ms ease;
}

.profile-card:hover {
  border-color: var(--border-hover);
}

.profile-card.active {
  background: rgba(6, 182, 212, 0.07);
  border-color: var(--accent-border);
}

.profile-dot {
  display: block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--profile-accent, var(--accent));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--profile-accent, var(--accent)) 18%, transparent);
  flex: none;
}

.profile-copy {
  display: grid;
  gap: 2px;
  text-align: left;
  flex: 1;
}

.profile-copy strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.profile-copy small {
  font-size: 10px;
  color: var(--text-muted);
}

/* ─── Profile form ─────────────────────────────────────────────────── */
.profile-form {
  display: grid;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

/* ─── Inputs ───────────────────────────────────────────────────────── */
label {
  display: grid;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

input,
textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 11px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  padding: 10px 13px;
  font: inherit;
  font-size: 13px;
  font-weight: 400;
  color: var(--text-primary);
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

input:focus,
textarea:focus {
  border-color: var(--accent-border);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
}

textarea {
  resize: vertical;
  min-height: 80px;
}

/* ─── Color picker ─────────────────────────────────────────────────── */
.color-picker-section {
  display: grid;
  gap: 8px;
}

.color-swatches {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  padding: 10px;
  background: var(--bg-elevated);
  border-radius: 12px;
  border: 1px dashed var(--accent-border);
}

.swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex: none;
  transition: transform 150ms ease;
}

.swatch:hover {
  transform: scale(1.2);
}

.swatch.selected {
  outline: 2px solid var(--text-primary);
  outline-offset: 2px;
}

/* ─── Stats ────────────────────────────────────────────────────────── */
.info-stack {
  display: grid;
  gap: 8px;
}

.mini-stat {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--border);
  color: var(--accent);
}

.mini-stat > div {
  display: grid;
  gap: 2px;
}

.mini-stat span {
  font-size: 10px;
  color: var(--text-muted);
}

.mini-stat strong {
  font-size: 12px;
  color: var(--text-primary);
}

/* ─── Notification box ─────────────────────────────────────────────── */
.notification-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.notification-copy {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--accent);
}

.notification-copy > div {
  display: grid;
  gap: 2px;
}

.notification-copy strong {
  font-size: 12px;
  color: var(--text-primary);
}

.notification-copy span {
  font-size: 10px;
  color: var(--text-muted);
}

.notif-check {
  color: var(--success);
  flex: none;
}

/* ─── Calendar panel ───────────────────────────────────────────────── */
.calendar-panel {
  display: flex;
  flex-direction: column;
}

.month-header {
  align-items: center;
}

.month-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.week-head {
  margin-bottom: 8px;
  flex: none;
}

.week-head span {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 4px 0;
}

/* Grilla: ocupa todo el alto restante del panel */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: repeat(6, 1fr);
  gap: 6px;
  flex: 1;
}

.day-card {
  border-radius: 13px;
  padding: 9px 8px;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  color: inherit;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition: border-color 150ms ease, background 150ms ease;
}

.day-card:hover {
  background: var(--bg-elevated);
  border-color: var(--border-hover);
}

.day-card.muted {
  opacity: 0.22;
}

.day-card.today {
  border-color: rgba(6, 182, 212, 0.45);
  background: rgba(6, 182, 212, 0.04);
}

.day-card.selected {
  border-color: var(--accent);
  background: rgba(6, 182, 212, 0.1);
}

.day-number {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  line-height: 1;
}

.day-card.today .day-number {
  color: var(--accent);
}

.day-card.selected .day-number {
  color: var(--accent-bright);
}

.holiday-pill,
.reminder-chip,
.more-chip {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border-radius: 5px;
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.holiday-pill {
  background: var(--holiday-dim);
  color: var(--holiday);
}

.day-reminders {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reminder-chip {
  background: rgba(6, 182, 212, 0.13);
  color: var(--accent-bright);
}

.more-chip {
  background: rgba(99, 102, 241, 0.12);
  color: #818cf8;
  width: fit-content;
}

/* ─── Week view ────────────────────────────────────────────────────── */
.week-panel {
  display: flex;
  flex-direction: column;
}

.week-columns {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  flex: 1;
}

.week-col {
  border-radius: 13px;
  padding: 10px 8px;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;
}

.week-col:hover {
  background: var(--bg-elevated);
  border-color: var(--border-hover);
}

.week-col.today {
  border-color: rgba(6, 182, 212, 0.45);
  background: rgba(6, 182, 212, 0.04);
}

.week-col.selected {
  border-color: var(--accent);
  background: rgba(6, 182, 212, 0.1);
}

.week-col-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.week-col-name {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.week-col-num {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  color: var(--text-muted);
  line-height: 1;
}

.week-col.today .week-col-num { color: var(--accent); }
.week-col.selected .week-col-num { color: var(--accent-bright); }

.week-events {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.week-event {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 7px;
  background: rgba(6, 182, 212, 0.12);
  border-left: 2px solid var(--accent);
  border-radius: 5px;
}

.week-event-time {
  font-size: 9px;
  font-weight: 700;
  color: var(--accent);
}

.week-event-title {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Details panel ────────────────────────────────────────────────── */
.details-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.selected-profile-banner {
  --profile-accent: var(--accent);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 13px;
  background: rgba(6, 182, 212, 0.06);
  border: 1px solid rgba(6, 182, 212, 0.15);
  border-radius: 13px;
}

.selected-profile-banner .profile-dot {
  margin-top: 3px;
}

.selected-profile-banner strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-bright);
  display: block;
}

.selected-profile-banner small {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
  display: block;
}

.holiday-box {
  display: grid;
  gap: 8px;
}

.holiday-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 13px;
  background: rgba(251, 146, 60, 0.07);
  border: 1px solid rgba(251, 146, 60, 0.18);
  border-radius: 13px;
  color: var(--holiday);
}

.holiday-row > div {
  display: grid;
  gap: 2px;
}

.holiday-row strong {
  font-size: 12px;
  color: var(--holiday);
}

.holiday-row span {
  font-size: 10px;
  color: var(--text-muted);
}

/* ─── Editing banner ───────────────────────────────────────────────── */
.editing-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  border-radius: 11px;
  font-size: 12px;
  color: var(--accent);
}

.editing-banner span {
  flex: 1;
}

.editing-banner strong {
  color: var(--accent-bright);
}

.cancel-edit-btn {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  flex: none;
  transition: background 150ms ease;
}

.cancel-edit-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* ─── Reminder form ────────────────────────────────────────────────── */
.reminder-form {
  display: grid;
  gap: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr);
  gap: 10px;
}

/* ─── Agenda list ──────────────────────────────────────────────────── */
.agenda-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.agenda-item {
  display: grid;
  gap: 8px;
  padding: 12px 13px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 14px;
  transition: border-color 150ms ease;
}

.agenda-item.editing {
  border-color: var(--accent-border);
  background: rgba(6, 182, 212, 0.05);
}

.agenda-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.agenda-top > div {
  display: grid;
  gap: 3px;
}

.agenda-top strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.agenda-top span {
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
}

.agenda-actions {
  display: flex;
  gap: 5px;
  flex: none;
}

.edit-btn {
  color: var(--accent);
  border-color: var(--accent-border) !important;
}

.delete-btn {
  color: var(--text-muted);
}

.delete-btn:hover {
  color: var(--danger) !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
}

.agenda-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
}

.agenda-notes {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 100px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  background: var(--bg-elevated);
  border-radius: 14px;
  border: 1px dashed var(--border);
  padding: 20px;
}

/* ─── Alarm toast ──────────────────────────────────────────────────── */
.alarm-toast {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-surface);
  border: 1px solid rgba(6, 182, 212, 0.35);
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 28px rgba(6, 182, 212, 0.12);
  max-width: min(380px, calc(100vw - 32px));
}

.alarm-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  flex: none;
}

.alarm-body {
  flex: 1;
  display: grid;
  gap: 2px;
}

.alarm-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--accent);
}

.alarm-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.alarm-sub {
  font-size: 11px;
  color: var(--text-muted);
}

.alarm-close {
  padding: 7px 14px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  background: var(--accent-dim);
  color: var(--accent);
  border: 1px solid var(--accent-border);
  flex: none;
  transition: opacity 150ms ease;
}

.alarm-close:hover {
  opacity: 0.8;
}

/* ─── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 1200px) {
  .workspace {
    grid-template-columns: 240px minmax(0, 1fr);
  }
  .details-panel {
    grid-column: 1 / -1;
  }
}

@media (max-width: 860px) {
  .app-shell {
    padding: 12px;
  }
  .workspace {
    grid-template-columns: 1fr;
  }
  .details-panel {
    grid-column: auto;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .calendar-grid,
  .week-grid {
    gap: 5px;
  }
}

@media (max-width: 640px) {
  .alarm-toast {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
  .hero-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .clock-block {
    text-align: left;
  }
}
```

- [ ] **Verificar visualmente en el navegador** (`npm run dev`):
  - Fondo dark en toda la app
  - Reloj en cian
  - Toggle Mensual/Semanal funciona
  - Grilla del calendario se estira hasta el borde inferior del panel
  - Color picker aparece en el panel de perfiles
  - El lápiz en cada recordatorio abre el modo edición
  - La vista semanal muestra 7 columnas

- [ ] **Commit final**

```bash
git add src/App.css
git commit -m "style: complete dark theme redesign with cyan accent"
```
