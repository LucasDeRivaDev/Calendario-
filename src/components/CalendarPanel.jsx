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
