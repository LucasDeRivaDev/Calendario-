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
