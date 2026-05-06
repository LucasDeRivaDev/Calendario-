// src/components/DayListView.jsx
import { ChevronLeft, ChevronRight, CalendarClock, Tag, Sun } from 'lucide-react'
import { formatDateKey } from '../hooks/useCalendar'

const DAY_FULL  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTH_GEN = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre'
]

export function DayView({
  selectedDateKey,
  holidayMap,
  remindersByDay,
  todayKey,
  onSelectDate,
  onGoToday,
}) {
  const day     = new Date(`${selectedDateKey}T00:00:00`)
  const reminders = remindersByDay[selectedDateKey] || []
  const holidays  = holidayMap[selectedDateKey]    || []
  const isToday   = selectedDateKey === todayKey
  const dayIndex  = day.getDay()

  function handlePrevDay() {
    const d = new Date(day)
    d.setDate(d.getDate() - 1)
    onSelectDate(formatDateKey(d))
  }

  function handleNextDay() {
    const d = new Date(day)
    d.setDate(d.getDate() + 1)
    onSelectDate(formatDateKey(d))
  }

  return (
    <section className="panel day-view-panel">
      {/* Header con navegación */}
      <div className="panel-header month-header">
        <div>
          <p className="section-kicker">Vista del día</p>
          <h2>
            {DAY_FULL[dayIndex]}, {day.getDate()} de {MONTH_GEN[day.getMonth()]} {day.getFullYear()}
          </h2>
        </div>
        <div className="month-actions">
          <button type="button" className="icon-button" aria-label="Día anterior" onClick={handlePrevDay}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="today-button" onClick={onGoToday}>
            Hoy
          </button>
          <button type="button" className="icon-button" aria-label="Día siguiente" onClick={handleNextDay}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Número del día grande */}
      <div className={`day-view-hero ${isToday ? 'today' : ''}`}>
        <span className="day-view-big-num">{day.getDate()}</span>
        <div className="day-view-hero-info">
          <span className="day-view-weekday">{DAY_FULL[dayIndex]}</span>
          <span className="day-view-month">{MONTH_GEN[day.getMonth()]} {day.getFullYear()}</span>
          {isToday && <span className="day-view-today-badge">Hoy</span>}
        </div>
      </div>

      {/* Separador */}
      <div className="day-view-separator" />

      {/* Contenido: feriados + eventos */}
      <div className="day-view-body">
        {holidays.length === 0 && reminders.length === 0 && (
          <div className="day-view-empty">
            <Sun size={32} strokeWidth={1.2} />
            <p>No hay eventos para este día</p>
            <span>Usá el panel de detalles para agregar un recordatorio</span>
          </div>
        )}

        {holidays.map((h, i) => (
          <div key={i} className="day-view-holiday">
            <div className="day-view-event-icon holiday-icon">
              <Tag size={14} />
            </div>
            <div className="day-view-event-copy">
              <strong>{h.name}</strong>
              <span>Feriado nacional</span>
            </div>
          </div>
        ))}

        {reminders.map(r => (
          <div key={r.id} className="day-view-event">
            <div className="day-view-event-icon reminder-icon">
              <CalendarClock size={14} />
            </div>
            <div className="day-view-event-copy">
              <strong>{r.title}</strong>
              <span className="day-view-event-time">{r.time}</span>
              {r.notes && <p className="day-view-event-notes">{r.notes}</p>}
              {r.label && <span className="day-view-event-label">{r.label}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
