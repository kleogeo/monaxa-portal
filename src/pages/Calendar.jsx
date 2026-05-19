import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start
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
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-brand-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-brand-muted text-xs font-medium text-center py-3">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {startPad.map((_, i) => <div key={`pad-${i}`} className="h-24 border-b border-r border-brand-border bg-black/20" />)}
          {days.map(day => {
            const dayTasks = getTasksForDay(day)
            const today = isToday(day)
            return (
              <div key={day.toISOString()} className="h-24 border-b border-r border-brand-border p-1.5 hover:bg-white/5 transition-colors">
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${today ? 'bg-brand-gold text-black' : 'text-brand-muted'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-1 text-[10px] truncate">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: task.assigned?.avatar_color || '#C9A84C' }} />
                      <span className="text-white truncate">{task.title}</span>
                    </div>
                  ))}
                  {dayTasks.length > 3 && <div className="text-brand-muted text-[10px]">+{dayTasks.length - 3} more</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
