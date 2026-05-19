import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, X, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_COLORS = {
  open: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  in_progress: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  review: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  done: 'text-green-400 bg-green-400/10 border-green-400/20',
  cancelled: 'text-brand-muted bg-white/5 border-white/10',
}

const PRIORITY_DOT = {
  low: 'bg-gray-500',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-400',
}

export default function Tasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({
    title: '', description: '', type: 'task',
    status: 'open', priority: 'medium',
    assigned_to: '', due_date: '', estimated_hours: '', department_id: ''
  })

  useEffect(() => { fetchData() }, [])

  // Keyboard shortcuts: N=new task, Escape=close, S=save
  const formRef = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement.tagName
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (e.key === 'n' && !inInput) { e.preventDefault(); setShowModal(true) }
      if (e.key === 'Escape') setShowModal(false)
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); formRef.current?.requestSubmit() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function fetchData() {
    const [tasksRes, profilesRes, deptsRes] = await Promise.all([
      supabase.from('tasks').select(`*, assigned:profiles!assigned_to(full_name, avatar_color), creator:profiles!created_by(full_name)`).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, avatar_color').eq('is_active', true),
      supabase.from('departments').select('id, name, color').eq('is_active', true).order('name'),
    ])
    setTasks(tasksRes.data || [])
    setProfiles(profilesRes.data || [])
    setDepartments(deptsRes.data || [])
    setLoading(false)
  }

  async function createTask(e) {
    e.preventDefault()
    const payload = {
      ...form,
      created_by: profile.id,
      assigned_to: form.assigned_to || profile.id,
      due_date: form.due_date || null,
      estimated_hours: form.estimated_hours || null,
      department_id: form.department_id || null,
    }
    await supabase.from('tasks').insert(payload)
    setShowModal(false)
    setForm({ title: '', description: '', type: 'task', status: 'open', priority: 'medium', assigned_to: '', due_date: '', estimated_hours: '', department_id: '' })
    fetchData()
  }

  async function updateStatus(id, status) {
    await supabase.from('tasks').update({ status, completed_at: status === 'done' ? new Date().toISOString() : null }).eq('id', id)
    fetchData()
  }

  const filtered = filter === 'all' ? tasks : filter === 'mine' ? tasks.filter(t => t.assigned_to === profile?.id) : tasks.filter(t => t.status === filter)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Tasks</h1>
          <p className="text-brand-muted text-sm mt-1">{tasks.length} total tasks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'mine', label: 'Mine' },
          { key: 'open', label: 'Open' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'review', label: 'Review' },
          { key: 'done', label: 'Done' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === key ? 'bg-brand-gold text-black' : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.map(task => (
          <div key={task.id} className="bg-brand-surface border border-brand-border rounded-xl p-4 flex items-start gap-4 hover:border-brand-gold/30 transition-colors">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{task.title}</p>
                  {task.description && <p className="text-brand-muted text-xs mt-0.5 line-clamp-1">{task.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.assigned && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-black" style={{ backgroundColor: task.assigned.avatar_color || '#C9A84C' }}>
                        {task.assigned.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-brand-muted text-xs hidden sm:block">{task.assigned.full_name.split(' ')[0]}</span>
                    </div>
                  )}
                  <select
                    value={task.status}
                    onChange={e => updateStatus(task.id, e.target.value)}
                    className="bg-brand-dark border border-brand-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[task.status]}`}>{task.status.replace('_', ' ')}</span>
                <span className="text-brand-muted text-xs capitalize">{task.type}</span>
                {task.due_date && <span className="text-brand-muted text-xs">{format(new Date(task.due_date), 'MMM d')}</span>}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-brand-muted text-sm text-center py-12">No tasks found</p>}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">New Task</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white"><X size={18} /></button>
            </div>
            <form ref={formRef} onSubmit={createTask} className="space-y-4">
              <div>
                <label className="text-brand-muted text-xs mb-1 block">Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="Task title" />
              </div>
              <div>
                <label className="text-brand-muted text-xs mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold resize-none" placeholder="Details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    <option value="task">Task</option>
                    <option value="case">Case</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-brand-muted text-xs mb-1 block">Assign To</label>
                <select value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                  <option value="">Assign to myself</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                </div>
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Est. Hours</label>
                  <input type="number" min="0.5" step="0.5" value={form.estimated_hours} onChange={e => setForm({...form, estimated_hours: e.target.value})} placeholder="e.g. 2" className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                </div>
              </div>
              {departments.length > 1 && (
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Department</label>
                  <select value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
