// src/components/DayListView.jsx
import { useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, CalendarClock, Tag } from 'lucide-react'
import { formatDateKey, formatMonthLabel } from '../hooks/useCalendar'

const DAY_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function DayListView({
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
  const todayRef = useRef(null)

  // Scroll al día de hoy (o al seleccionado) al montar o cambiar de mes
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [viewDate])

  const daysInMonth = monthDays.filter(d => d.getMonth() === currentMonth)

  return (
    <section className="panel day-list-panel">
      {/* Header */}
      <div className="panel-header month-header">
        <div>
          <p className="section-kicker">Vista diaria</p>
          <h2>{formatMonthLabel(viewDate)}</h2>
        </div>
        <div className="month-actions">
          <button type="button" className="icon-button" aria-label="Mes anterior" onClick={onPrevMonth}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" className="today-button" onClick={onGoToday}>
            Hoy
          </button>
          <button type="button" className="icon-button" aria-label="Mes siguiente" onClick={onNextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Lista de días */}
      <div className="day-list-scroll">
        {daysInMonth.map(day => {
          const dateKey = formatDateKey(day)
          const reminders = remindersByDay[dateKey] || []
          const holidays = holidayMap[dateKey] || []
          const isToday = dateKey === todayKey
          const isSelected = dateKey === selectedDateKey
          const dayIndex = day.getDay() // 0=Dom
          const isWeekend = dayIndex === 0 || dayIndex === 6

          return (
            <button
              key={dateKey}
              type="button"
              ref={isToday ? todayRef : null}
              className={[
                'day-list-row',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                isWeekend ? 'weekend' : '',
              ].join(' ')}
              onClick={() => onSelectDate(dateKey)}
            >
              {/* Columna izquierda: número y nombre del día */}
              <div className="day-list-date">
                <span className="day-list-num">{day.getDate()}</span>
                <span className="day-list-name">{DAY_SHORT[dayIndex]}</span>
              </div>

              {/* Separador vertical */}
              <div className="day-list-divider" />

              {/* Contenido: feriados + recordatorios */}
              <div className="day-list-content">
                {holidays.length === 0 && reminders.length === 0 && (
                  <span className="day-list-empty">Sin eventos</span>
                )}
                {holidays.map((h, i) => (
                  <div key={i} className="day-list-holiday">
                    <Tag size={10} />
                    {h.name}
                  </div>
                ))}
                {reminders.map(r => (
                  <div key={r.id} className="day-list-event">
                    <CalendarClock size={10} />
                    <span className="day-list-event-time">{r.time}</span>
                    <span className="day-list-event-title">{r.title}</span>
                    {r.notes && <span className="day-list-event-notes">— {r.notes}</span>}
                  </div>
                ))}
              </div>

              {/* Badge con cantidad total */}
              {(reminders.length + holidays.length) > 0 && (
                <span className="day-list-badge">
                  {reminders.length + holidays.length}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
