import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CheckSquare, FolderOpen } from 'lucide-react'

const STATUS_COLORS = {
  open: 'bg-blue-400',
  in_progress: 'bg-yellow-400',
  review: 'bg-purple-400',
  done: 'bg-green-400',
  cancelled: 'bg-gray-600',
}

export default function TeamView() {
  const [profiles, setProfiles] = useState([])
  const [tasks, setTasks] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('team-rt-' + Math.random())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchData() {
    const [profilesRes, tasksRes, casesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_active', true),
      supabase.from('tasks').select('*').not('status', 'in', '("done","cancelled")'),
      supabase.from('cases').select('*').neq('status', 'closed'),
    ])
    setProfiles(profilesRes.data || [])
    setTasks(tasksRes.data || [])
    setCases(casesRes.data || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Team View</h1>
        <p className="text-brand-muted text-sm mt-1">Live workload across the dealing desk</p>
      </div>

      {/* Team grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {profiles.map(member => {
          const memberTasks = tasks.filter(t =>
            t.assigned_to === member.id ||
            (Array.isArray(t.assigned_to_users) && t.assigned_to_users.includes(member.id))
          )
          const memberCases = cases.filter(c => c.assigned_to === member.id)
          const initials = member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

          return (
            <div key={member.id} className="bg-brand-surface border border-brand-border rounded-xl p-5">
              {/* Member header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black flex-shrink-0"
                  style={{ backgroundColor: member.avatar_color || '#C9A84C' }}
                >
                  {initials}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{member.full_name}</p>
                  <p className="text-brand-muted text-xs capitalize">{member.role}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="flex items-center gap-1 text-brand-muted text-xs">
                    <CheckSquare size={12} />
                    {memberTasks.length}
                  </span>
                  <span className="flex items-center gap-1 text-brand-muted text-xs">
                    <FolderOpen size={12} />
                    {memberCases.length}
                  </span>
                </div>
              </div>

              {/* Task list */}
              <div className="space-y-2">
                {memberTasks.length === 0 && memberCases.length === 0 && (
                  <p className="text-brand-muted text-xs text-center py-3">No active items</p>
                )}
                {memberTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center gap-2 py-1">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[task.status]}`} />
                    <p className="text-white text-xs truncate flex-1">{task.title}</p>
                    <span className="text-brand-muted text-xs capitalize">{task.priority}</span>
                  </div>
                ))}
                {memberTasks.length > 3 && (
                  <p className="text-brand-muted text-xs pl-3">+{memberTasks.length - 3} more tasks</p>
                )}
                {memberCases.slice(0, 2).map(c => (
                  <div key={c.id} className="flex items-center gap-2 py-1">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-brand-gold" />
                    <p className="text-brand-muted text-xs truncate flex-1">{c.case_ref}</p>
                    <span className="text-brand-muted text-xs">{c.case_type.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
