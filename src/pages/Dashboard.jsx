import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { CheckSquare, FolderOpen, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS = {
  open: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  in_progress: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  review: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  done: 'text-green-400 bg-green-400/10 border-green-400/20',
  cancelled: 'text-brand-muted bg-white/5 border-white/10',
}

const PRIORITY_COLORS = {
  low: 'text-brand-muted',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
}

function StatCard({ icon: Icon, label, value, color = 'text-brand-gold' }) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-brand-muted text-sm">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <p className="text-3xl font-display font-bold text-white">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchData()
  }, [profile])

  async function fetchData() {
    const [tasksRes, casesRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('assigned_to', profile.id).neq('status', 'done').order('due_date', { ascending: true }),
      supabase.from('cases').select('*').eq('assigned_to', profile.id).neq('status', 'closed').order('created_at', { ascending: false }),
    ])
    setTasks(tasksRes.data || [])
    setCases(casesRes.data || [])
    setLoading(false)
  }

  const openTasks = tasks.filter(t => t.status === 'open').length
  const inProgress = tasks.filter(t => t.status === 'in_progress').length
  const urgentItems = [...tasks, ...cases].filter(i => i.priority === 'urgent').length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-brand-gold">{profile?.full_name?.split(' ')[0]}</span>
        </h1>
        <p className="text-brand-muted text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="Open Tasks" value={openTasks} />
        <StatCard icon={TrendingUp} label="In Progress" value={inProgress} color="text-yellow-400" />
        <StatCard icon={FolderOpen} label="Active Cases" value={cases.length} color="text-blue-400" />
        <StatCard icon={AlertCircle} label="Urgent" value={urgentItems} color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">My Tasks</h2>
            <span className="text-brand-muted text-xs">{tasks.length} active</span>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 && (
              <p className="text-brand-muted text-sm text-center py-6">No active tasks</p>
            )}
            {tasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-brand-dark hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[task.status]}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="text-brand-muted text-xs flex items-center gap-1">
                        <Clock size={10} />
                        {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Cases */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">My Cases</h2>
            <span className="text-brand-muted text-xs">{cases.length} active</span>
          </div>
          <div className="space-y-3">
            {cases.length === 0 && (
              <p className="text-brand-muted text-sm text-center py-6">No active cases</p>
            )}
            {cases.map(c => (
              <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-brand-dark hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium">{c.case_ref}</p>
                    {c.account_id && <span className="text-brand-muted text-xs">#{c.account_id}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status]}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                    <span className="text-brand-muted text-xs">{c.case_type.replace('_', ' ')}</span>
                    <span className={`text-xs font-medium ${PRIORITY_COLORS[c.priority]}`}>
                      {c.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
