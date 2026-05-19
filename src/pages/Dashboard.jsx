import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Clock, CheckCircle2, AlertCircle, ChevronUp, ChevronDown,
  X, User, FileText, Send, Repeat, Zap, Search, Pin,
  HelpCircle, UserPlus, ArrowRightLeft, StickyNote, Timer,
  Activity, RefreshCw, Calendar, Tag
} from 'lucide-react'
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInHours } from 'date-fns'

// ─── Config ───────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────
function DueBadge({ date }) {
  if (!date) return null
  const d = new Date(date)
  const overdue = isPast(d) && !isToday(d)
  return (
    <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
      overdue ? 'bg-red-400/20 text-red-400' :
      isToday(d) ? 'bg-orange-400/20 text-orange-400' :
      isTomorrow(d) ? 'bg-yellow-400/20 text-yellow-400' :
      'bg-white/5 text-brand-muted'
    }`}>
      <Clock size={10} />
      {overdue ? 'Overdue' : isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : format(d, 'MMM d')}
    </span>
  )
}

function Avatar({ profile, size = 6 }) {
  if (!profile) return null
  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const cls = size === 4 ? 'w-4 h-4 text-[8px]' : size === 5 ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'
  return (
    <div className={`${cls} rounded-full flex items-center justify-center font-bold text-black flex-shrink-0`}
      style={{ backgroundColor: profile.avatar_color || '#C9A84C' }}>
      {initials}
    </div>
  )
}

function StatusTimestamp({ status, changedAt, startedAt }) {
  if (!changedAt && !startedAt) return null
  const ts = status === 'in_progress' && startedAt ? startedAt : changedAt
  if (!ts) return null
  return (
    <span className="text-brand-muted text-xs flex items-center gap-1">
      <Clock size={9} />
      {STATUS_CONFIG[status]?.label} since {format(new Date(ts), 'HH:mm')}
    </span>
  )
}

function TimeProgress({ estimatedHours, startedAt }) {
  if (!estimatedHours || !startedAt) return null
  const elapsed = differenceInHours(new Date(), new Date(startedAt))
  const pct = Math.min((elapsed / estimatedHours) * 100, 100)
  const over = elapsed > estimatedHours
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 bg-brand-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : pct > 75 ? 'bg-orange-400' : 'bg-brand-gold'}`}
          style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs flex-shrink-0 ${over ? 'text-red-400' : 'text-brand-muted'}`}>
        {elapsed}h / {estimatedHours}h
      </span>
    </div>
  )
}

// ─── Task Modal ───────────────────────────────────────────────────
function TaskModal({ task, profiles, currentProfile, onClose, onUpdate }) {
  const [status, setStatus] = useState(task.status)
  const [findings, setFindings] = useState(task.findings || '')
  const [source, setSource] = useState(task.source || '')
  const [assignedTo, setAssignedTo] = useState(task.assigned_to || '')
  const [scratchNote, setScratchNote] = useState('')
  const [handoffNote, setHandoffNote] = useState(task.handoff_note || '')
  const [helpMsg, setHelpMsg] = useState(task.help_message || '')
  const [collaborators, setCollaborators] = useState([])
  const [newCollab, setNewCollab] = useState('')
  const [tab, setTab] = useState('details') // details | help | handoff | notes
  const [saving, setSaving] = useState(false)
  const [loadingNote, setLoadingNote] = useState(true)

  const assignee = profiles.find(p => p.id === (assignedTo || task.assigned_to))
  const creator = profiles.find(p => p.id === task.created_by)
  const canSelfAssign = task.assigned_to !== currentProfile?.id
  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const TypeIcon = TYPE_CONFIG[task.type]?.icon || Zap

  useEffect(() => {
    // Load scratch note
    supabase.from('task_notes')
      .select('note')
      .eq('task_id', task.id)
      .eq('user_id', currentProfile.id)
      .single()
      .then(({ data }) => { if (data) setScratchNote(data.note || ''); setLoadingNote(false) })

    // Load collaborators
    supabase.from('task_collaborators')
      .select('user_id')
      .eq('task_id', task.id)
      .then(({ data }) => setCollaborators(data?.map(d => d.user_id) || []))
  }, [task.id, currentProfile.id])

  async function handleSave() {
    setSaving(true)
    const now = new Date().toISOString()
    const updates = {
      status,
      findings: findings || null,
      source: source || null,
      assigned_to: assignedTo || task.assigned_to || null,
      updated_at: now,
      status_changed_at: status !== task.status ? now : task.status_changed_at,
    }
    if (status === 'done' && task.status !== 'done') updates.completed_at = now
    if (status === 'in_progress' && task.status !== 'in_progress') updates.started_at = now

    await supabase.from('tasks').update(updates).eq('id', task.id)

    // Save scratch note
    await supabase.from('task_notes').upsert({
      task_id: task.id, user_id: currentProfile.id, note: scratchNote, updated_at: now
    }, { onConflict: 'task_id,user_id' })

    // Log activity
    if (status !== task.status) {
      await supabase.from('activity_log').insert({
        user_id: currentProfile.id, action_type: `status_${status}`,
        entity_type: 'task', entity_id: task.id, entity_title: task.title
      })
    }
    setSaving(false)
    onUpdate()
    onClose()
  }

  async function handleSelfAssign() {
    setSaving(true)
    const now = new Date().toISOString()
    await supabase.from('tasks').update({
      assigned_to: currentProfile.id, status: 'in_progress',
      started_at: now, status_changed_at: now, updated_at: now
    }).eq('id', task.id)
    await supabase.from('activity_log').insert({
      user_id: currentProfile.id, action_type: 'self_assigned',
      entity_type: 'task', entity_id: task.id, entity_title: task.title
    })
    setSaving(false); onUpdate(); onClose()
  }

  async function handlePin() {
    await supabase.from('tasks').update({ is_pinned: !task.is_pinned }).eq('id', task.id)
    onUpdate(); onClose()
  }

  async function handleHelp() {
    setSaving(true)
    await supabase.from('tasks').update({ help_requested: true, help_message: helpMsg }).eq('id', task.id)
    await supabase.from('activity_log').insert({
      user_id: currentProfile.id, action_type: 'help_requested',
      entity_type: 'task', entity_id: task.id, entity_title: task.title,
      meta: { message: helpMsg }
    })
    setSaving(false); onUpdate(); onClose()
  }

  async function handleHandoff() {
    setSaving(true)
    const now = new Date().toISOString()
    await supabase.from('tasks').update({
      handoff_note: handoffNote, handed_off_at: now,
      handed_off_by: currentProfile.id, status: 'review', status_changed_at: now
    }).eq('id', task.id)
    await supabase.from('activity_log').insert({
      user_id: currentProfile.id, action_type: 'handed_off',
      entity_type: 'task', entity_id: task.id, entity_title: task.title
    })
    setSaving(false); onUpdate(); onClose()
  }

  async function addCollaborator() {
    if (!newCollab || collaborators.includes(newCollab)) return
    await supabase.from('task_collaborators').insert({ task_id: task.id, user_id: newCollab })
    setCollaborators([...collaborators, newCollab])
    setNewCollab('')
  }

  const tabs = [
    { key: 'details', label: 'Details', icon: FileText },
    { key: 'help', label: task.help_requested ? '🆘 Help' : 'Help', icon: HelpCircle },
    { key: 'handoff', label: 'Handoff', icon: ArrowRightLeft },
    { key: 'notes', label: 'My Notes', icon: StickyNote },
  ]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-brand-border">
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${pc.bg} ${pc.color} font-medium`}>{pc.label}</span>
              <span className={`flex items-center gap-1 text-xs ${TYPE_CONFIG[task.type]?.color}`}>
                <TypeIcon size={11} />{TYPE_CONFIG[task.type]?.label}
              </span>
              {task.help_requested && <span className="text-xs bg-red-400/10 border border-red-400/20 text-red-400 px-2 py-0.5 rounded-full">🆘 Help needed</span>}
              {task.handoff_note && <span className="text-xs bg-purple-400/10 border border-purple-400/20 text-purple-400 px-2 py-0.5 rounded-full">↗ Handed off</span>}
            </div>
            <h2 className="text-white font-semibold text-base leading-tight">{task.title}</h2>
            {task.description && <p className="text-brand-muted text-xs mt-1">{task.description}</p>}
            <StatusTimestamp status={task.status} changedAt={task.status_changed_at} startedAt={task.started_at} />
            {task.estimated_hours && task.started_at && (
              <TimeProgress estimatedHours={task.estimated_hours} startedAt={task.started_at} />
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handlePin} title={task.is_pinned ? 'Unpin' : 'Pin to top'}
              className={`p-1.5 rounded-lg transition-colors ${task.is_pinned ? 'text-brand-gold bg-brand-gold/10' : 'text-brand-muted hover:text-brand-gold'}`}>
              <Pin size={15} />
            </button>
            <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors p-1.5">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-brand-border">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                tab === t.key ? 'text-brand-gold border-b-2 border-brand-gold' : 'text-brand-muted hover:text-white'
              }`}>
              <t.icon size={12} />{t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">

          {/* ── DETAILS TAB ── */}
          {tab === 'details' && (<>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-brand-dark rounded-lg p-3">
                <p className="text-xs text-brand-muted mb-1">Assigned To</p>
                {assignee ? <div className="flex items-center gap-2"><Avatar profile={assignee} size={5} /><span className="text-white text-sm">{assignee.full_name}</span></div>
                  : <span className="text-brand-muted text-sm">Unassigned</span>}
              </div>
              <div className="bg-brand-dark rounded-lg p-3">
                <p className="text-xs text-brand-muted mb-1">Created By</p>
                {creator ? <div className="flex items-center gap-2"><Avatar profile={creator} size={5} /><span className="text-white text-sm">{creator.full_name}</span></div>
                  : <span className="text-brand-muted text-sm">—</span>}
              </div>
              <div className="bg-brand-dark rounded-lg p-3">
                <p className="text-xs text-brand-muted mb-1">Assigned On</p>
                <span className="text-white text-sm">{format(new Date(task.created_at), 'MMM d, HH:mm')}</span>
              </div>
              <div className="bg-brand-dark rounded-lg p-3">
                <p className="text-xs text-brand-muted mb-1">Due Date</p>
                <span className="text-white text-sm">{task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}</span>
              </div>
              {task.estimated_hours && (
                <div className="bg-brand-dark rounded-lg p-3 col-span-2">
                  <p className="text-xs text-brand-muted mb-1 flex items-center gap-1"><Timer size={11} /> Estimate</p>
                  <span className="text-white text-sm">{task.estimated_hours} hours</span>
                </div>
              )}
            </div>

            {/* Collaborators */}
            {collaborators.length > 0 && (
              <div>
                <p className="text-xs text-brand-muted mb-2">Collaborators</p>
                <div className="flex gap-2 flex-wrap">
                  {collaborators.map(uid => {
                    const p = profiles.find(x => x.id === uid)
                    return p ? <div key={uid} className="flex items-center gap-1.5 bg-brand-dark rounded-lg px-2 py-1.5 border border-brand-border">
                      <Avatar profile={p} size={5} /><span className="text-white text-xs">{p.full_name.split(' ')[0]}</span>
                    </div> : null
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-brand-muted mb-1.5 block">Add Collaborator</label>
              <div className="flex gap-2">
                <select value={newCollab} onChange={e => setNewCollab(e.target.value)}
                  className="flex-1 bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold">
                  <option value="">Select team member...</option>
                  {profiles.filter(p => p.id !== task.assigned_to && !collaborators.includes(p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
                <button onClick={addCollaborator} disabled={!newCollab}
                  className="px-3 py-2 bg-brand-gold/10 border border-brand-gold/30 text-brand-gold rounded-lg text-sm hover:bg-brand-gold/20 transition-colors disabled:opacity-40">
                  <UserPlus size={15} />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-brand-muted mb-1.5 block">Source / Origin</label>
              <input value={source} onChange={e => setSource(e.target.value)}
                placeholder="e.g. Client complaint, Compliance alert..."
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
            </div>

            <div>
              <label className="text-xs text-brand-muted mb-1.5 block">Reassign To</label>
              <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                <option value="">Keep current</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}{p.id === currentProfile?.id ? ' (me)' : ''}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-brand-muted mb-1.5 block">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_CONFIG).filter(([k]) => k !== 'cancelled').map(([key, cfg]) => (
                  <button key={key} onClick={() => setStatus(key)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                      status === key ? `${cfg.bg} ${cfg.color}` : 'bg-brand-dark border-brand-border text-brand-muted hover:text-white'
                    }`}>
                    {status === key && '✓ '}{cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-xl p-4 border ${status === 'done' ? 'bg-green-400/5 border-green-400/20' : 'bg-brand-dark border-brand-border'}`}>
              <label className={`text-xs mb-2 block font-medium ${status === 'done' ? 'text-green-400' : 'text-brand-muted'}`}>
                {status === 'done' ? '✅ Findings / Results / Action Taken' : 'Notes / Findings'}
              </label>
              <textarea value={findings} onChange={e => setFindings(e.target.value)} rows={3}
                placeholder={status === 'done' ? 'What was found, what action was taken...' : 'Add notes...'}
                className={`w-full bg-brand-dark rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none resize-none border ${
                  status === 'done' ? 'border-green-400/20 focus:border-green-400' : 'border-brand-border focus:border-brand-gold'
                }`} />
            </div>

            <div className="flex gap-2">
              {canSelfAssign && (
                <button onClick={handleSelfAssign} disabled={saving}
                  className="flex items-center gap-2 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors">
                  <User size={13} /> Self-Assign
                </button>
              )}
              <button onClick={onClose} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
                <Send size={13} />{saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>)}

          {/* ── HELP TAB ── */}
          {tab === 'help' && (<>
            <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium mb-1 flex items-center gap-2"><HelpCircle size={14} /> Request Help</p>
              <p className="text-brand-muted text-xs mb-3">This flags the task as needing assistance and notifies the admin. The dashboard will show a help badge on this task.</p>
              <textarea value={helpMsg} onChange={e => setHelpMsg(e.target.value)} rows={3}
                placeholder="Describe what you need help with..."
                className="w-full bg-brand-dark border border-red-400/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-400 resize-none mb-3" />
              {task.help_requested && <p className="text-red-400 text-xs mb-3">⚠️ Help already flagged on this task.</p>}
              <button onClick={handleHelp} disabled={saving || !helpMsg}
                className="w-full bg-red-400/10 border border-red-400/30 text-red-400 hover:bg-red-400/20 rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? 'Sending...' : '🆘 Flag for Help'}
              </button>
            </div>
            {task.help_message && (
              <div className="bg-brand-dark rounded-lg border border-brand-border p-3">
                <p className="text-xs text-brand-muted mb-1">Current help message</p>
                <p className="text-white text-sm">{task.help_message}</p>
              </div>
            )}
          </>)}

          {/* ── HANDOFF TAB ── */}
          {tab === 'handoff' && (<>
            <div className="bg-purple-400/5 border border-purple-400/20 rounded-xl p-4">
              <p className="text-purple-400 text-sm font-medium mb-1 flex items-center gap-2"><ArrowRightLeft size={14} /> End of Shift Handoff</p>
              <p className="text-brand-muted text-xs mb-3">Leave a summary of where you are on this task so the next person can pick it up instantly. Status will move to Pending Review.</p>
              <textarea value={handoffNote} onChange={e => setHandoffNote(e.target.value)} rows={4}
                placeholder="Where I left off, what still needs doing, any important context..."
                className="w-full bg-brand-dark border border-purple-400/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-400 resize-none mb-3" />
              <button onClick={handleHandoff} disabled={saving || !handoffNote}
                className="w-full bg-purple-400/10 border border-purple-400/30 text-purple-400 hover:bg-purple-400/20 rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : '↗ Submit Handoff'}
              </button>
            </div>
            {task.handoff_note && (
              <div className="bg-brand-dark rounded-lg border border-brand-border p-3">
                <p className="text-xs text-brand-muted mb-1">Previous handoff note</p>
                <p className="text-white text-sm">{task.handoff_note}</p>
                {task.handed_off_at && <p className="text-brand-muted text-xs mt-1">{format(new Date(task.handed_off_at), 'MMM d, HH:mm')}</p>}
              </div>
            )}
          </>)}

          {/* ── NOTES TAB ── */}
          {tab === 'notes' && (<>
            <div className="bg-brand-gold/5 border border-brand-gold/20 rounded-xl p-4">
              <p className="text-brand-gold text-sm font-medium mb-1 flex items-center gap-2"><StickyNote size={14} /> Private Scratch Pad</p>
              <p className="text-brand-muted text-xs mb-3">Only you can see this. Use it for mid-investigation thoughts, working notes, anything you don't want to lose.</p>
              {loadingNote ? <p className="text-brand-muted text-xs">Loading...</p> : (
                <textarea value={scratchNote} onChange={e => setScratchNote(e.target.value)} rows={6}
                  placeholder="Your private notes for this task..."
                  className="w-full bg-brand-dark border border-brand-gold/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold resize-none" />
              )}
            </div>
            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
              <Send size={13} />{saving ? 'Saving...' : 'Save Notes'}
            </button>
          </>)}

        </div>
      </div>
    </div>
  )
}

// ─── Task Row ─────────────────────────────────────────────────────
function TaskRow({ task, profiles, index, onClick, isPinned }) {
  const assignee = profiles.find(p => p.id === task.assigned_to)
  const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const TypeIcon = TYPE_CONFIG[task.type]?.icon || Zap

  return (
    <div onClick={() => onClick(task)}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-brand-border last:border-0 group ${
        isPinned ? 'bg-brand-gold/5' : ''
      }`}>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPinned ? <Pin size={11} className="text-brand-gold" /> : <span className="text-brand-muted text-xs w-4 text-center font-mono">{index + 1}</span>}
        <div className={`w-2 h-2 rounded-full ${pc.dot}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-medium truncate group-hover:text-brand-gold transition-colors">{task.title}</p>
          {task.help_requested && <span className="text-xs text-red-400 flex-shrink-0">🆘</span>}
          {task.handoff_note && <span className="text-xs text-purple-400 flex-shrink-0">↗</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`flex items-center gap-1 text-xs ${TYPE_CONFIG[task.type]?.color}`}>
            <TypeIcon size={10} />{TYPE_CONFIG[task.type]?.label}
          </span>
          <StatusTimestamp status={task.status} changedAt={task.status_changed_at} startedAt={task.started_at} />
        </div>
        {task.estimated_hours && task.started_at && (
          <TimeProgress estimatedHours={task.estimated_hours} startedAt={task.started_at} />
        )}
      </div>
      <DueBadge date={task.due_date} />
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {assignee ? <><Avatar profile={assignee} size={6} /><span className="text-brand-muted text-xs hidden xl:block">{assignee.full_name.split(' ')[0]}</span></> : <span className="text-brand-muted text-xs">—</span>}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_CONFIG[task.status]?.bg} ${STATUS_CONFIG[task.status]?.color}`}>
        {STATUS_CONFIG[task.status]?.label}
      </span>
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────
function ActivityFeed({ profiles }) {
  const [events, setEvents] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setEvents(data || []))
  }, [open])

  const ACTION_LABELS = {
    status_done: '✅ completed',
    status_in_progress: '🔄 started working on',
    status_review: '👀 sent for review',
    status_open: '🔁 reopened',
    self_assigned: '👋 self-assigned',
    help_requested: '🆘 requested help on',
    handed_off: '↗ handed off',
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <Activity size={15} className="text-cyan-400" />
          <h2 className="text-white font-semibold text-sm">Activity Feed</h2>
        </div>
        {open ? <ChevronUp size={14} className="text-brand-muted" /> : <ChevronDown size={14} className="text-brand-muted" />}
      </button>
      {open && (
        <div className="border-t border-brand-border">
          {events.length === 0 ? <p className="text-center py-6 text-brand-muted text-sm">No activity yet</p> : (
            events.map(e => {
              const actor = profiles.find(p => p.id === e.user_id)
              return (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3 border-b border-brand-border last:border-0">
                  {actor ? <Avatar profile={actor} size={6} /> : <div className="w-6 h-6 rounded-full bg-brand-border flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="text-white font-medium">{actor?.full_name?.split(' ')[0] || 'Someone'}</span>
                      <span className="text-brand-muted"> {ACTION_LABELS[e.action_type] || e.action_type} </span>
                      <span className="text-white">{e.entity_title}</span>
                    </p>
                    <p className="text-brand-muted text-xs mt-0.5">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────
export default function Dashboard() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [doneTasks, setDoneTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [viewMode, setViewMode] = useState('all')
  const [expandDone, setExpandDone] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef(null)

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

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'Escape') setSearch('')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const sortTasks = (arr) => [...arr].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    const pa = PRIORITY_CONFIG[a.priority]?.order ?? 99
    const pb = PRIORITY_CONFIG[b.priority]?.order ?? 99
    if (pa !== pb) return pa - pb
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  })

  const filteredTasks = sortTasks(tasks.filter(t => {
    const matchesView = viewMode === 'all' ? true :
      viewMode === 'mine' ? t.assigned_to === profile?.id :
      viewMode === 'recurring' ? ['daily','weekly','monthly'].includes(t.type) :
      viewMode === 'oneoff' ? (t.type === 'task' || t.type === 'case') :
      viewMode === 'help' ? t.help_requested : true

    const matchesSearch = !search || [t.title, t.description, t.source, t.findings]
      .filter(Boolean).some(f => f.toLowerCase().includes(search.toLowerCase()))

    return matchesView && matchesSearch
  }))

  const urgentCount = tasks.filter(t => t.priority === 'urgent').length
  const overdueCount = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))).length
  const helpCount = tasks.filter(t => t.help_requested).length
  const myCount = tasks.filter(t => t.assigned_to === profile?.id).length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'},{' '}
            <span className="text-brand-gold">{profile?.full_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-brand-muted text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {urgentCount > 0 && <div className="flex items-center gap-1.5 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-1.5"><AlertCircle size={13} className="text-red-400" /><span className="text-red-400 text-xs font-medium">{urgentCount} urgent</span></div>}
          {overdueCount > 0 && <div className="flex items-center gap-1.5 bg-orange-400/10 border border-orange-400/20 rounded-lg px-3 py-1.5"><Clock size={13} className="text-orange-400" /><span className="text-orange-400 text-xs font-medium">{overdueCount} overdue</span></div>}
          {helpCount > 0 && <div className="flex items-center gap-1.5 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-1.5"><HelpCircle size={13} className="text-red-400" /><span className="text-red-400 text-xs font-medium">{helpCount} need help</span></div>}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder='Search tasks, cases, sources... (press / to focus)'
          className="w-full bg-brand-surface border border-brand-border rounded-xl pl-10 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold transition-colors"
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-white"><X size={14} /></button>}
      </div>

      {/* Active Tasks */}
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
              { key: 'help', label: helpCount > 0 ? `🆘 Help (${helpCount})` : 'Help' },
            ].map(f => (
              <button key={f.key} onClick={() => setViewMode(f.key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === f.key ? 'bg-brand-gold text-black' : 'text-brand-muted hover:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-black/20 border-b border-brand-border">
          <span className="text-brand-muted text-xs w-6">#</span>
          <span className="flex-1 text-brand-muted text-xs">Task · Type · Status since</span>
          <span className="text-brand-muted text-xs">Due</span>
          <span className="text-brand-muted text-xs">Assignee</span>
          <span className="text-brand-muted text-xs">Status</span>
        </div>

        {filteredTasks.length === 0
          ? <div className="text-center py-10 text-brand-muted text-sm">{search ? `No results for "${search}"` : 'No active tasks'}</div>
          : filteredTasks.map((task, i) => (
              <TaskRow key={task.id} task={task} profiles={profiles} index={i} onClick={setSelectedTask} isPinned={task.is_pinned} />
            ))
        }
      </div>

      {/* Recently Finished */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        <button onClick={() => setExpandDone(!expandDone)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={15} className="text-green-400" />
            <h2 className="text-white font-semibold text-sm">Recently Finished</h2>
            <span className="text-brand-muted text-xs bg-brand-dark px-2 py-0.5 rounded-full">{doneTasks.length}</span>
          </div>
          {expandDone ? <ChevronUp size={14} className="text-brand-muted" /> : <ChevronDown size={14} className="text-brand-muted" />}
        </button>
        {expandDone && (
          <div className="border-t border-brand-border">
            {doneTasks.length === 0 ? <p className="text-center py-8 text-brand-muted text-sm">No completed tasks yet</p>
              : doneTasks.map(task => {
                  const assignee = profiles.find(p => p.id === task.assigned_to)
                  const TypeIcon = TYPE_CONFIG[task.type]?.icon || Zap
                  return (
                    <div key={task.id} onClick={() => setSelectedTask(task)}
                      className="flex items-start gap-4 px-4 py-3.5 hover:bg-white/5 cursor-pointer border-b border-brand-border last:border-0 transition-colors group">
                      <CheckCircle2 size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium group-hover:text-brand-gold transition-colors truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {task.completed_at && <span className="text-brand-muted text-xs">{formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}</span>}
                          {assignee && <span className="text-brand-muted text-xs flex items-center gap-1">· <Avatar profile={assignee} size={4} /> {assignee.full_name.split(' ')[0]}</span>}
                        </div>
                        {task.findings && (
                          <div className="mt-2 bg-green-400/5 border border-green-400/15 rounded-lg px-3 py-2">
                            <p className="text-xs text-brand-muted mb-0.5">Findings</p>
                            <p className="text-green-300 text-xs leading-relaxed line-clamp-2">{task.findings}</p>
                          </div>
                        )}
                        {task.handoff_note && (
                          <div className="mt-1 bg-purple-400/5 border border-purple-400/15 rounded-lg px-3 py-2">
                            <p className="text-xs text-brand-muted mb-0.5">Handoff note</p>
                            <p className="text-purple-300 text-xs line-clamp-1">{task.handoff_note}</p>
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

      {/* Activity Feed */}
      <ActivityFeed profiles={profiles} />

      {/* Modal */}
      {selectedTask && (
        <TaskModal task={selectedTask} profiles={profiles} currentProfile={profile}
          onClose={() => setSelectedTask(null)} onUpdate={fetchData} />
      )}
    </div>
  )
}
