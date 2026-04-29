import { useEffect, useRef, useState } from 'react'
import Holidays from 'date-holidays'
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Trash2,
  UserRound,
  Volume2,
} from 'lucide-react'
import './App.css'

const STORAGE_KEY = 'calendario-argentina-v1'
const DEFAULT_PROFILE_COLORS = ['#0f766e', '#dc6b2f', '#2563eb', '#7c3aed', '#be123c']
const WEEK_DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const HOLIDAY_TYPES = {
  public: 'Feriado nacional',
  bank: 'Dia no laborable',
  observance: 'Conmemoracion',
}

const hd = new Holidays('AR')

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
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
  const today = new Date()
  const defaultProfile = createProfile('Personal', DEFAULT_PROFILE_COLORS[0], 'seed')

  const fallback = {
    profiles: [defaultProfile],
    activeProfileId: defaultProfile.id,
    alarmLog: {},
  }

  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    return fallback
  }

  try {
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed.profiles) || parsed.profiles.length === 0) {
      return fallback
    }

    const safeProfiles = parsed.profiles.map((profile, index) => ({
      id: profile.id || `profile-restored-${index}`,
      name: profile.name || `Perfil ${index + 1}`,
      color: profile.color || DEFAULT_PROFILE_COLORS[index % DEFAULT_PROFILE_COLORS.length],
      reminders: Array.isArray(profile.reminders) ? profile.reminders : [],
    }))

    return {
      profiles: safeProfiles,
      activeProfileId:
        safeProfiles.find((profile) => profile.id === parsed.activeProfileId)?.id || safeProfiles[0].id,
      alarmLog: parsed.alarmLog && typeof parsed.alarmLog === 'object' ? parsed.alarmLog : {},
      todayKey: formatDateKey(today),
    }
  } catch {
    return fallback
  }
}

function getMonthMatrix(viewDate) {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const startDate = new Date(year, month, 1 - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + index)
    return day
  })
}

function buildHolidayMap(year) {
  const map = {}
  for (const holiday of hd.getHolidays(year)) {
    const dateKey = holiday.date.slice(0, 10)
    if (!map[dateKey]) {
      map[dateKey] = []
    }
    map[dateKey].push({
      name: holiday.name,
      type: HOLIDAY_TYPES[holiday.type] || 'Fecha especial',
    })
  }
  return map
}

function playAlarm() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) {
    return
  }

  const context = new AudioContextClass()
  const now = context.currentTime
  const notes = [523.25, 659.25, 783.99]

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02 + index * 0.18)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18 + index * 0.18)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now + index * 0.18)
    oscillator.stop(now + 0.22 + index * 0.18)
  })
}

function App() {
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
  const [form, setForm] = useState({
    title: '',
    time: '09:00',
    location: '',
    notes: '',
  })
  const seenAlarmRef = useRef('')

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) || profiles[0]
  const monthDays = getMonthMatrix(viewDate)
  const currentMonth = viewDate.getMonth()
  const holidayMap = buildHolidayMap(viewDate.getFullYear())
  const remindersByDay = activeProfile.reminders.reduce((acc, reminder) => {
    if (!acc[reminder.dateKey]) {
      acc[reminder.dateKey] = []
    }
    acc[reminder.dateKey].push(reminder)
    return acc
  }, {})
  const selectedReminders = [...(remindersByDay[selectedDateKey] || [])].sort((a, b) =>
    a.time.localeCompare(b.time),
  )
  const selectedDate = new Date(`${selectedDateKey}T00:00:00`)
  const selectedHolidays = holidayMap[selectedDateKey] || []
  const todayKey = formatDateKey(now)
  const pendingToday = profiles.flatMap((profile) =>
    profile.reminders
      .filter((reminder) => reminder.dateKey === todayKey)
      .map((reminder) => ({ ...reminder, profileName: profile.name, profileColor: profile.color })),
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profiles,
        activeProfileId,
        alarmLog,
      }),
    )
  }, [profiles, activeProfileId, alarmLog])

  useEffect(() => {
    const nowDate = new Date()
    const nowKey = formatDateKey(nowDate)
    const currentTime = `${`${nowDate.getHours()}`.padStart(2, '0')}:${`${nowDate.getMinutes()}`.padStart(
      2,
      '0',
    )}`

    const dueReminder = profiles
      .flatMap((profile) =>
        profile.reminders.map((reminder) => ({
          ...reminder,
          profileName: profile.name,
          profileColor: profile.color,
        })),
      )
      .sort((a, b) => `${a.dateKey}${a.time}`.localeCompare(`${b.dateKey}${b.time}`))
      .find((reminder) => {
        const uniqueKey = `${reminder.id}-${nowKey}`
        return reminder.dateKey === nowKey && reminder.time <= currentTime && !alarmLog[uniqueKey]
      })

    if (!dueReminder) {
      seenAlarmRef.current = ''
      return
    }

    const alarmKey = `${dueReminder.id}-${nowKey}`
    if (seenAlarmRef.current === alarmKey) {
      return
    }

    seenAlarmRef.current = alarmKey
    setAlarmLog((current) => ({ ...current, [alarmKey]: nowDate.toISOString() }))
    setAlarmEvent(dueReminder)
    playAlarm()

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`Recordatorio: ${dueReminder.title}`, {
        body: `${dueReminder.profileName} · ${dueReminder.time}`,
      })
    }
  }, [now, profiles, alarmLog])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function addProfile(event) {
    event.preventDefault()
    const trimmedName = newProfileName.trim()
    if (!trimmedName) {
      return
    }

    const color = DEFAULT_PROFILE_COLORS[profiles.length % DEFAULT_PROFILE_COLORS.length]
    const profile = createProfile(trimmedName, color)
    setProfiles((current) => [...current, profile])
    setActiveProfileId(profile.id)
    setNewProfileName('')
    setShowProfileForm(false)
  }

  function addReminder(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      return
    }

    const reminder = createReminder(selectedDateKey, form)
    setProfiles((current) =>
      current.map((profile) =>
        profile.id === activeProfile.id
          ? { ...profile, reminders: [...profile.reminders, reminder] }
          : profile,
      ),
    )
    setForm({
      title: '',
      time: '09:00',
      location: '',
      notes: '',
    })
  }

  function removeReminder(reminderId) {
    setProfiles((current) =>
      current.map((profile) =>
        profile.id === activeProfile.id
          ? {
              ...profile,
              reminders: profile.reminders.filter((reminder) => reminder.id !== reminderId),
            }
          : profile,
      ),
    )
  }

  function requestNotifications() {
    if (typeof Notification === 'undefined') {
      return
    }

    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission)
    })
  }

  const monthHolidayCount = monthDays.reduce((count, day) => {
    if (day.getMonth() !== currentMonth) {
      return count
    }
    return count + (holidayMap[formatDateKey(day)]?.length || 0)
  }, 0)

  return (
    <main className="app-shell">
      <section className="hero-bar">
        <div>
          <p className="eyebrow">Agenda argentina multi perfil</p>
          <h1>Calendario vivo con recordatorios, feriados y alarmas</h1>
        </div>
        <div className="clock-card">
          <span className="clock-label">Ahora</span>
          <strong>{now.toLocaleTimeString('es-AR')}</strong>
          <span>{formatDateLabel(now)}</span>
        </div>
      </section>

      <section className="workspace">
        <aside className="panel profiles-panel">
          <div className="panel-header">
            <div>
              <p className="section-kicker">Perfiles</p>
              <h2>Espacios independientes</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Agregar perfil"
              onClick={() => setShowProfileForm((current) => !current)}
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="profiles-list">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={`profile-card ${profile.id === activeProfile.id ? 'active' : ''}`}
                onClick={() => setActiveProfileId(profile.id)}
                style={{ '--profile-accent': profile.color }}
              >
                <span className="profile-dot" />
                <span className="profile-copy">
                  <strong>{profile.name}</strong>
                  <small>{profile.reminders.length} recordatorios</small>
                </span>
                <UserRound size={16} />
              </button>
            ))}
          </div>

          {showProfileForm && (
            <form className="profile-form" onSubmit={addProfile}>
              <label>
                Nombre del perfil
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(event) => setNewProfileName(event.target.value)}
                  placeholder="Trabajo, Familia, Estudio..."
                />
              </label>
              <button type="submit" className="primary-button">
                Crear perfil
              </button>
            </form>
          )}

          <div className="info-stack">
            <div className="mini-stat">
              <Clock3 size={16} />
              <div>
                <span>Hoy</span>
                <strong>{pendingToday.length} eventos activos</strong>
              </div>
            </div>
            <div className="mini-stat">
              <CalendarDays size={16} />
              <div>
                <span>Mes visible</span>
                <strong>{monthHolidayCount} fechas especiales</strong>
              </div>
            </div>
          </div>

          <div className="notification-box">
            <div className="notification-copy">
              <Bell size={16} />
              <div>
                <strong>Alertas del navegador</strong>
                <span>
                  {notificationPermission === 'granted'
                    ? 'Activadas'
                    : notificationPermission === 'denied'
                      ? 'Bloqueadas'
                      : notificationPermission === 'unsupported'
                        ? 'No disponibles'
                        : 'Pendientes'}
                </span>
              </div>
            </div>
            {notificationPermission === 'default' && (
              <button type="button" className="secondary-button" onClick={requestNotifications}>
                Activar
              </button>
            )}
          </div>
        </aside>

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
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="today-button"
                onClick={() => {
                  const current = new Date()
                  setViewDate(new Date(current.getFullYear(), current.getMonth(), 1))
                  setSelectedDateKey(formatDateKey(current))
                }}
              >
                Hoy
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Mes siguiente"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="calendar-scroller">
            <div className="calendar-frame">
              <div className="week-grid week-head">
                {WEEK_DAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="calendar-grid">
                {monthDays.map((day) => {
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
                      className={`day-card ${isCurrentMonth ? '' : 'muted'} ${isToday ? 'today' : ''} ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedDateKey(dateKey)}
                    >
                      <span className="day-number">{day.getDate()}</span>
                      {holidays.length > 0 && (
                        <span className="holiday-pill">{holidays[0].name}</span>
                      )}
                      <div className="day-reminders">
                        {reminders.slice(0, 2).map((reminder) => (
                          <span key={reminder.id} className="reminder-chip">
                            {reminder.time} · {reminder.title}
                          </span>
                        ))}
                        {reminders.length > 2 && <span className="more-chip">+{reminders.length - 2} mas</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="panel details-panel">
          <div className="panel-header">
            <div>
              <p className="section-kicker">Dia seleccionado</p>
              <h2>{formatDateLabel(selectedDate)}</h2>
            </div>
          </div>

          <div className="selected-profile-banner" style={{ '--profile-accent': activeProfile.color }}>
            <span className="profile-dot" />
            <strong>{activeProfile.name}</strong>
            <small>Todo lo que agregues queda guardado solo en este perfil.</small>
          </div>

          {selectedHolidays.length > 0 && (
            <div className="holiday-box">
              {selectedHolidays.map((holiday) => (
                <div key={`${selectedDateKey}-${holiday.name}`} className="holiday-row">
                  <CalendarDays size={16} />
                  <div>
                    <strong>{holiday.name}</strong>
                    <span>{holiday.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form className="reminder-form" onSubmit={addReminder}>
            <label>
              Titulo
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder="Ej. Reunion con cliente"
              />
            </label>

            <div className="form-row">
              <label>
                Hora
                <input
                  type="time"
                  value={form.time}
                  onChange={(event) => updateForm('time', event.target.value)}
                />
              </label>
              <label>
                Lugar
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => updateForm('location', event.target.value)}
                  placeholder="Opcional"
                />
              </label>
            </div>

            <label>
              Notas
              <textarea
                rows="4"
                value={form.notes}
                onChange={(event) => updateForm('notes', event.target.value)}
                placeholder="Detalles, ideas, links, lista de cosas..."
              />
            </label>

            <button type="submit" className="primary-button">
              Guardar recordatorio
            </button>
          </form>

          <div className="agenda-list">
            {selectedReminders.length === 0 ? (
              <div className="empty-state">
                <Volume2 size={18} />
                <p>No hay recordatorios para este dia en este perfil.</p>
              </div>
            ) : (
              selectedReminders.map((reminder) => (
                <article key={reminder.id} className="agenda-item">
                  <div className="agenda-top">
                    <div>
                      <strong>{reminder.title}</strong>
                      <span>{reminder.time}</span>
                    </div>
                    <button
                      type="button"
                      className="ghost-button"
                      aria-label={`Borrar ${reminder.title}`}
                      onClick={() => removeReminder(reminder.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {reminder.location && (
                    <p className="agenda-meta">
                      <MapPin size={14} />
                      {reminder.location}
                    </p>
                  )}
                  {reminder.notes && <p className="agenda-notes">{reminder.notes}</p>}
                </article>
              ))
            )}
          </div>
        </aside>
      </section>

      {alarmEvent && (
        <div className="alarm-toast" role="alert">
          <div>
            <p className="section-kicker">Recordatorio en curso</p>
            <strong>{alarmEvent.title}</strong>
            <span>
              {alarmEvent.profileName} · {alarmEvent.time}
            </span>
          </div>
          <button type="button" className="primary-button" onClick={() => setAlarmEvent(null)}>
            Cerrar
          </button>
        </div>
      )}
    </main>
  )
}

export default App
