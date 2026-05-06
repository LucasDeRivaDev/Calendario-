// src/hooks/useCalendar.js
import { useEffect, useMemo, useRef, useState } from 'react'
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
  const holidayMap = useMemo(
    () => buildHolidayMap(viewDate.getFullYear()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewDate.getFullYear()],
  )
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
        p.id === activeProfileId
          ? { ...p, reminders: [...p.reminders, reminder] }
          : p,
      ),
    )
    setForm({ ...EMPTY_FORM })
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
    setForm({ ...EMPTY_FORM })
  }

  function updateReminder(event) {
    event.preventDefault()
    if (!form.title.trim()) return
    setProfiles(cur =>
      cur.map(p =>
        p.id === activeProfileId
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
    setForm({ ...EMPTY_FORM })
  }

  function removeReminder(reminderId) {
    if (editingReminderId === reminderId) cancelEditReminder()
    setProfiles(cur =>
      cur.map(p =>
        p.id === activeProfileId
          ? { ...p, reminders: p.reminders.filter(r => r.id !== reminderId) }
          : p,
      ),
    )
  }

  function removeProfile(profileId) {
    if (profiles.length <= 1) return
    const remaining = profiles.filter(p => p.id !== profileId)
    setProfiles(remaining)
    if (activeProfileId === profileId) {
      setActiveProfileId(remaining[0].id)
    }
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
    removeReminder,
    removeProfile,
    requestNotifications,
  }
}
