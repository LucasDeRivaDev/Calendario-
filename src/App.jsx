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
          onRemoveProfile={cal.removeProfile}
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
