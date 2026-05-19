import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Clock, CheckCircle2, AlertCircle, ChevronUp, ChevronDown,
  X, User, Calendar, Tag, FileText, Send, RefreshCw, Repeat, Zap
} from 'lucide-react'
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'

const PRIORITY_CONFIG = {
  urgent: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', dot: 'bg-red-400', label: 'Urgent', order: 0 },
  high:   { color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30', dot: 'bg-orange-400', label: 'High', order: 1 },
  medium: { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', dot: 'bg-blue-400', label: 'Medium', order: 2 },
  low:    { color: 'text-brand-muted', bg: 'bg-white/5 border-white/10', dot: 'bg-gray-500', label: 'Low', order: 3 },
}

const STATUS_CONFIG = {
  open:        { label: 'Open', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20' },
  in_progress: { label: 'Working On', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  review:      { label: 'Pending Review', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
  done:        { label: 'Completed', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  cancelled:   { label: 'Cancelled', color: 'text-brand-muted', bg: 'bg-white/5 border-white/10' },
}

const TYPE_CONFIG = {
  daily:   { label: 'Daily', icon: Repeat, color: 'text-cyan-400' },
  weekly:  { label: 'Weekly', icon: Repeat, color: 'text-indigo-400' },
  monthly: { label: 'Monthly', icon: Repeat, color: 'text-violet-400' },
  task:    { label: 'One-off', icon: Zap, color: 'text-brand-gold' },
  case:    { label: 'Case', icon: FileText, color: 'text-orange-400' },
}

function DueBadge({ date }) {
  if (!date) return null
  const d = new Date(date)
  const overdue = isPast(d) && !isToday(d)
  const today = isToday(d)
  const tomorrow = isTomorrow(d)
  return (
    <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
      overdue ? 'bg-red-400/20 text-red-400' :
      today   ? 'bg-orange-400/20 text-orange-400' :
      tomorrow? 'bg-yellow-400/20 text-yellow-400' :
                'bg-white/5 text-brand-muted'
    }`}>
      <Clock size={10} />
      {overdue ? `Overdue` : today ? 'Today' : tomorrow ? 'Tomorrow' : format(d, 'MMM d')}
    </span>
  )
}

function Avatar({ profile, size = 6 }) {
  if (!profile) return null
  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const sizeClass = size === 4 ? 'w-4 h-4 text-[8px]' : size === 5 ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-black flex-shrink-0`}
      style={{ backgroundColor: profile.avatar_color || '#C9A84C' }}
    >
      {initials}
    </div>
  )
}

function TaskModal({ task, profiles, currentProfile, onClose, onUpdate }) {
  const [status, setStatus] = useState(task.status)
  const [findings, setFindings] = useState(task.findings || '')
  const [source, setSource] = useState(task.source || '')
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
  const [saving, setSaving] = useState(false)

  const assignee = profiles.find(p => p.id === (assignedTo || task.assigned_to))
  const creator = profiles.find(p => p.id === task.created_by)
  const canSelfAssign = task.assigned_to !== currentProfile?.id

  async function handleSave() {
    setSaving(true)
    const updates = {
      status,
      findings: findings || null,
      source: source || null,
      assigned_to: assignedTo || task.assigned_to || null,
      updated_at: new Date().toISOString(),
    }
    if (status === 'done' && task.status !== 'done') {
      updates.completed_at = new Date().toISOString()
    }
    await supabase.from('tasks').update(updates).eq('id', task.id)
    setSaving(false)
    onUpdate()
    onClose()
  }

  async function handleSelfAssign() {
    setSaving(true)
    await supabase.from('tasks').update({
      assigned_to: currentProfile.id,
      status: 'in_progress',
      updated_at: new Date().toISOString()
    }).eq('id', task.id)
    setSaving(false)
    onUpdate()
    onClose()
  }

  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const TypeIcon = TYPE_CONFIG[task.type]?.icon || Zap

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-brand-border">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${pc.bg} ${pc.color} font-medium`}>{pc.label}</span>
              <span className={`flex items-center gap-1 text-xs ${TYPE_CONFIG[task.type]?.color || 'text-brand-muted'}`}>
                <TypeIcon size={11} />{TYPE_CONFIG[task.type]?.label || task.type}
              </span>
            </div>
            <h2 className="text-white font-semibold text-lg leading-tight">{task.title}</h2>
            {task.description && <p className="text-brand-muted text-sm mt-1.5">{task.description}</p>}
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-brand-dark rounded-lg p-3">
              <p className="text-xs text-brand-muted mb-1.5">Assigned To</p>
              {assignee ? (
                <div className="flex items-center gap-2"><Avatar profile={assignee} size={5} /><span className="text-white text-sm">{assignee.full_name}</span></div>
              ) : <span className="text-brand-muted text-sm">Unassigned</span>}
            </div>
            <div className="bg-brand-dark rounded-lg p-3">
              <p className="text-xs text-brand-muted mb-1.5">Created By</p>
              {creator ? (
                <div className="flex items-center gap-2"><Avatar profile={creator} size={5} /><span className="text-white text-sm">{creator.full_name}</span></div>
              ) : <span className="text-brand-muted text-sm">—</span>}
            </div>
            <div className="bg-brand-dark rounded-lg p-3">
              <p className="text-xs text-brand-muted mb-1.5">Assigned On</p>
              <span className="text-white text-sm">{format(new Date(task.created_at), 'MMM d, yyyy HH:mm')}</span>
            </div>
            <div className="bg-brand-dark rounded-lg p-3">
              <p className="text-xs text-brand-muted mb-1.5">Due Date</p>
              <span className="text-white text-sm">{task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}</span>
            </div>
            {task.completed_at && (
              <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-3 col-span-2">
                <p className="text-xs text-brand-muted mb-1">Completed</p>
                <span className="text-green-400 text-sm">{format(new Date(task.completed_at), 'MMM d, yyyy HH:mm')}</span>
              </div>
            )}
          </div>

          {/* Source */}
          <div>
            <label className="text-xs text-brand-muted mb-1.5 block">Source / Origin</label>
            <input
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="e.g. Client complaint, Compliance alert, Manager request..."
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold"
            />
          </div>

          {/* Reassign */}
          <div>
            <label className="text-xs text-brand-muted mb-1.5 block">Reassign To</label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold"
            >
              <option value="">Keep current assignee</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}{p.id === currentProfile?.id ? ' (me)' : ''}</option>
              ))}
            </select>
          </div>

          {/* Status buttons */}
          <div>
            <label className="text-xs text-brand-muted mb-1.5 block">Update Status</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'cancelled').map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setStatus(key)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                    status === key
                      ? `${cfg.bg} ${cfg.color}`
                      : 'bg-brand-dark border-brand-border text-brand-muted hover:text-white'
                  }`}
                >
                  {status === key && '✓ '}{cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Findings */}
          <div className={`rounded-xl p-4 border transition-all ${status === 'done' ? 'bg-green-400/5 border-green-400/20' : 'bg-brand-dark border-brand-border'}`}>
            <label className={`text-xs mb-2 block font-medium ${status === 'done' ? 'text-green-400' : 'text-brand-muted'}`}>
              {status === 'done' ? '✅ Findings / Results / Action Taken' : 'Notes / Findings'}
            </label>
            <textarea
              value={findings}
              onChange={e => setFindings(e.target.value)}
              rows={4}
              placeholder={status === 'done' ? 'Describe what was found, what action was taken...' : 'Add any notes...'}
              className={`w-full bg-brand-dark rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none resize-none border ${
                status === 'done' ? 'border-green-400/20 focus:border-green-400' : 'border-brand-border focus:border-brand-gold'
              }`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            {canSelfAssign && (
              <button
                onClick={handleSelfAssign}
                disabled={saving}
                className="flex items-center gap-2 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <User size={14} /> Self-Assign
              </button>
            )}
            <button onClick={onClose} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              <Send size={14} />{saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskRow({ task, profiles, index, onClick }) {
  const assignee = profiles.find(p => p.id === task.assigned_to)
  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const TypeIcon = TYPE_CONFIG[task.type]?.icon || Zap

  return (
    <div
      onClick={() => onClick(task)}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 cursor-pointer transition-colors border-b border-brand-border last:border-0 group"
    >
      <span className="text-brand-muted text-xs w-5 text-center font-mono flex-shrink-0">{index + 1}</span>
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pc.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate group-hover:text-brand-gold transition-colors">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`flex items-center gap-1 text-xs ${TYPE_CONFIG[task.type]?.color || 'text-brand-muted'}`}>
            <TypeIcon size={10} />{TYPE_CONFIG[task.type]?.label || task.type}
          </span>
          {task.source && <span className="text-brand-muted text-xs truncate">· {task.source}</span>}
        </div>
      </div>
      <DueBadge date={task.due_date} />
      <div className="flex items-center gap-1.5 flex-shrink-0 min-w-0">
        {assignee ? (
          <>
            <Avatar profile={assignee} size={6} />
            <span className="text-brand-muted text-xs hidden xl:block truncate">{assignee.full_name.split(' ')[0]}</span>
          </>
        ) : <span className="text-brand-muted text-xs">—</span>}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_CONFIG[task.status]?.bg} ${STATUS_CONFIG[task.status]?.color}`}>
        {STATUS_CONFIG[task.status]?.label}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [doneTasks, setDoneTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [viewMode, setViewMode] = useState('all')
  const [expandDone, setExpandDone] = useState(false)

  const fetchData = useCallback(async () => {
    const [activeRes, doneRes, profilesRes] = await Promise.all([
      supabase.from('tasks').select('*').not('status', 'in', '("done","cancelled")').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('status', 'done').order('completed_at', { ascending: false }).limit(20),
      supabase.from('profiles').select('*').eq('is_active', true),
    ])
    setTasks(activeRes.data || [])
    setDoneTasks(doneRes.data || [])
    setProfiles(profilesRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const sortTasks = (arr) => [...arr].sort((a, b) => {
    const pa = PRIORITY_CONFIG[a.priority]?.order ?? 99
    const pb = PRIORITY_CONFIG[b.priority]?.order ?? 99
    if (pa !== pb) return pa - pb
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  })

  const filteredTasks = sortTasks(tasks.filter(t => {
    if (viewMode === 'mine') return t.assigned_to === profile?.id
    if (viewMode === 'recurring') return ['daily', 'weekly', 'monthly'].includes(t.type)
    if (viewMode === 'oneoff') return t.type === 'task' || t.type === 'case'
    return true
  }))

  const urgentCount = tasks.filter(t => t.priority === 'urgent').length
  const overdueCount = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))).length
  const myCount = tasks.filter(t => t.assigned_to === profile?.id).length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'},{' '}
            <span className="text-brand-gold">{profile?.full_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-brand-muted text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {urgentCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-1.5">
              <AlertCircle size={13} className="text-red-400" />
              <span className="text-red-400 text-xs font-medium">{urgentCount} urgent</span>
            </div>
          )}
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-400/10 border border-orange-400/20 rounded-lg px-3 py-1.5">
              <Clock size={13} className="text-orange-400" />
              <span className="text-orange-400 text-xs font-medium">{overdueCount} overdue</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Tasks Flow Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-semibold text-sm">Active Tasks</h2>
            <span className="text-brand-muted text-xs bg-brand-dark px-2 py-0.5 rounded-full">{filteredTasks.length}</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'mine', label: `Mine (${myCount})` },
              { key: 'recurring', label: 'Recurring' },
              { key: 'oneoff', label: 'One-off' },
            ].map(f => (
              <button key={f.key} onClick={() => setViewMode(f.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === f.key ? 'bg-brand-gold text-black' : 'text-brand-muted hover:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2 bg-black/20 border-b border-brand-border">
          <span className="text-brand-muted text-xs w-5 text-center">#</span>
          <span className="w-2 flex-shrink-0" />
          <span className="flex-1 text-brand-muted text-xs">Task · Type · Source</span>
          <span className="text-brand-muted text-xs">Due</span>
          <span className="text-brand-muted text-xs">Assignee</span>
          <span className="text-brand-muted text-xs">Status</span>
        </div>

        {filteredTasks.length === 0
          ? <div className="text-center py-12 text-brand-muted text-sm">No active tasks</div>
          : filteredTasks.map((task, i) => (
              <TaskRow key={task.id} task={task} profiles={profiles} index={i} onClick={setSelectedTask} />
            ))
        }
      </div>

      {/* Recently Finished */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandDone(!expandDone)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 size={15} className="text-green-400" />
            <h2 className="text-white font-semibold text-sm">Recently Finished</h2>
            <span className="text-brand-muted text-xs bg-brand-dark px-2 py-0.5 rounded-full">{doneTasks.length}</span>
          </div>
          {expandDone ? <ChevronUp size={14} className="text-brand-muted" /> : <ChevronDown size={14} className="text-brand-muted" />}
        </button>

        {expandDone && (
          <div className="border-t border-brand-border">
            {doneTasks.length === 0
              ? <p className="text-center py-8 text-brand-muted text-sm">No completed tasks yet</p>
              : doneTasks.map(task => {
                  const assignee = profiles.find(p => p.id === task.assigned_to)
                  const TypeIcon = TYPE_CONFIG[task.type]?.icon || Zap
                  return (
                    <div key={task.id} onClick={() => setSelectedTask(task)}
                      className="flex items-start gap-4 px-4 py-3.5 hover:bg-white/5 cursor-pointer border-b border-brand-border last:border-0 transition-colors group"
                    >
                      <CheckCircle2 size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium group-hover:text-brand-gold transition-colors truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {task.completed_at && (
                            <span className="text-brand-muted text-xs">
                              {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
                            </span>
                          )}
                          {assignee && (
                            <span className="text-brand-muted text-xs flex items-center gap-1">
                              · <Avatar profile={assignee} size={4} /> {assignee.full_name.split(' ')[0]}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 text-xs ${TYPE_CONFIG[task.type]?.color || 'text-brand-muted'}`}>
                            · <TypeIcon size={10} /> {TYPE_CONFIG[task.type]?.label}
                          </span>
                        </div>
                        {task.findings && (
                          <div className="mt-2 bg-green-400/5 border border-green-400/15 rounded-lg px-3 py-2">
                            <p className="text-xs text-brand-muted mb-0.5">Findings / Action Taken</p>
                            <p className="text-green-300 text-xs leading-relaxed line-clamp-2">{task.findings}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
            }
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          profiles={profiles}
          currentProfile={profile}
          onClose={() => setSelectedTask(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  )
}
