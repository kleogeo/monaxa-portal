import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, X, CheckCircle2, Clock, Circle } from 'lucide-react'

const STATUS_CONFIG = {
  open:        { label: 'Open',        color: 'text-slate-400' },
  in_progress: { label: 'In Progress', color: 'text-yellow-400' },
  review:      { label: 'Review',      color: 'text-purple-400' },
  done:        { label: 'Completed',   color: 'text-green-400' },
  cancelled:   { label: 'Cancelled',   color: 'text-brand-muted' },
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedDayTasks, setSelectedDayTasks] = useState([])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = Array(monthStart.getDay()).fill(null)

  useEffect(() => { fetchData() }, [currentDate])

  async function fetchData() {
    const start = format(monthStart, 'yyyy-MM-dd')
    const end = format(monthEnd, 'yyyy-MM-dd')
    const [tasksRes, profilesRes] = await Promise.all([
      supabase.from('tasks').select(`*, assigned:profiles!assigned_to(full_name, avatar_color)`).not('due_date', 'is', null).gte('due_date', start).lte('due_date', end),
      supabase.from('profiles').select('id, full_name, avatar_color').eq('is_active', true),
    ])
    setTasks(tasksRes.data || [])
    setProfiles(profilesRes.data || [])
    setLoading(false)
  }

  function getTasksForDay(day) {
    return tasks.filter(t => isSameDay(new Date(t.due_date), day))
  }

  function openDay(day) {
    const dayTasks = getTasksForDay(day)
    if (dayTasks.length === 0) return
    setSelectedDay(day)
    setSelectedDayTasks(dayTasks)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Calendar</h1>
          <p className="text-brand-muted text-sm mt-1">Team schedule overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-border text-brand-muted hover:text-white hover:border-brand-gold transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-white font-semibold min-w-32 text-center">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-border text-brand-muted hover:text-white hover:border-brand-gold transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Team legend */}
      <div className="flex flex-wrap gap-3">
        {profiles.map(p => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.avatar_color || '#C9A84C' }} />
            <span className="text-brand-muted text-xs">{p.full_name.split(' ')[0]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-brand-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-brand-muted text-xs font-medium text-center py-3">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {startPad.map((_, i) => <div key={`pad-${i}`} className="h-24 border-b border-r border-brand-border bg-black/20" />)}
          {days.map(day => {
            const dayTasks = getTasksForDay(day)
            const today = isToday(day)
            const hasTasks = dayTasks.length > 0
            return (
              <div key={day.toISOString()}
                onClick={() => openDay(day)}
                className={`h-24 border-b border-r border-brand-border p-1.5 transition-colors ${hasTasks ? 'cursor-pointer hover:bg-white/5' : ''}`}>
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${today ? 'bg-brand-gold text-black' : 'text-brand-muted'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-1 text-[10px] truncate">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.assigned?.avatar_color || '#C9A84C' }} />
                      <span className={`truncate ${task.status === 'done' ? 'text-brand-muted line-through' : 'text-white'}`}>{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && <div className="text-brand-gold text-[10px]">+{dayTasks.length - 3} more</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Day detail modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setSelectedDay(null)}>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-white">{format(selectedDay, 'EEEE, MMMM d')}</h3>
                <p className="text-brand-muted text-xs mt-0.5">{selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? 's' : ''} due</p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="text-brand-muted hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {selectedDayTasks.map(task => {
                const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.open
                return (
                  <div key={task.id} className="bg-brand-dark border border-brand-border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.status === 'done' ? 'text-brand-muted line-through' : 'text-white'}`}>{task.title}</p>
                        {task.description && <p className="text-brand-muted text-xs mt-0.5 line-clamp-2">{task.description}</p>}
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {task.assigned && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-black"
                            style={{ backgroundColor: task.assigned.avatar_color || '#C9A84C' }}>
                            {task.assigned.full_name.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <span className="text-brand-muted text-xs">{task.assigned.full_name.split(' ')[0]}</span>
                        </div>
                      )}
                      <span className="text-brand-muted text-xs capitalize">{task.type}</span>
                      <span className="text-brand-muted text-xs capitalize">{task.priority}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
