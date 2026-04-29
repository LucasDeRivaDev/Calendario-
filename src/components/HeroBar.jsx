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
