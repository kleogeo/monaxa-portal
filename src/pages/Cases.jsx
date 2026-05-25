import { useEffect, useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, X, GripVertical } from 'lucide-react'
import { format } from 'date-fns'
import FileDrop from '../components/FileDrop'

const STATUS_COLORS = {
  open: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  in_progress: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  escalated: 'text-red-400 bg-red-400/10 border-red-400/20',
  closed: 'text-green-400 bg-green-400/10 border-green-400/20',
}

const CASE_TYPE_LABELS = {
  hedge_abuse: 'Hedge Abuse',
  bonus_abuse: 'Bonus Abuse',
  copy_trading: 'Copy Trading',
  withdrawal: 'Withdrawal',
  kyc: 'KYC',
  latency_arb: 'Latency Arb',
  ea_detection: 'EA Detection',
  other: 'Other',
}


function CaseDetailModal({ c, profiles, onClose, onUpdate }) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [form, setForm] = useState({ ...c })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    if (isAdmin) {
      await supabase.from('cases').update({
        case_ref: form.case_ref,
        account_id: form.account_id,
        case_type: form.case_type,
        priority: form.priority,
        status: form.status,
        assigned_to: form.assigned_to,
        notes: form.notes,
      }).eq('id', c.id)
    } else {
      await supabase.from('cases').update({ status: form.status }).eq('id', c.id)
    }
    setSaving(false)
    onUpdate()
    onClose()
  }

  async function deleteCase() {
    if (!confirm('Delete this case?')) return
    await supabase.from('cases').delete().eq('id', c.id)
    onUpdate()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-white">{c.case_ref}</h3>
            <p className="text-brand-muted text-xs mt-0.5">{format(new Date(c.created_at), 'MMM d, yyyy')}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <button onClick={deleteCase} className="text-brand-muted hover:text-red-400 text-xs transition-colors">Delete</button>}
            <button onClick={onClose} className="text-brand-muted hover:text-white"><X size={18} /></button>
          </div>
        </div>
        <div className="space-y-4">
          {isAdmin ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Case Ref</label>
                  <input value={form.case_ref} onChange={e => setForm({...form, case_ref: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                </div>
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Account ID</label>
                  <input value={form.account_id || ''} onChange={e => setForm({...form, account_id: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Type</label>
                  <select value={form.case_type} onChange={e => setForm({...form, case_type: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    {Object.entries(CASE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Assigned To</label>
                  <select value={form.assigned_to || ''} onChange={e => setForm({...form, assigned_to: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-brand-muted text-xs mb-1 block">Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} rows={4}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold resize-none" />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-brand-dark border border-brand-border rounded-lg p-3">
                  <p className="text-brand-muted text-xs mb-1">Case Ref</p>
                  <p className="text-white text-sm">{form.case_ref}</p>
                </div>
                <div className="bg-brand-dark border border-brand-border rounded-lg p-3">
                  <p className="text-brand-muted text-xs mb-1">Account ID</p>
                  <p className="text-white text-sm">{form.account_id || '—'}</p>
                </div>
                <div className="bg-brand-dark border border-brand-border rounded-lg p-3">
                  <p className="text-brand-muted text-xs mb-1">Type</p>
                  <p className="text-white text-sm">{CASE_TYPE_LABELS[form.case_type]}</p>
                </div>
                <div className="bg-brand-dark border border-brand-border rounded-lg p-3">
                  <p className="text-brand-muted text-xs mb-1">Priority</p>
                  <p className="text-white text-sm capitalize">{form.priority}</p>
                </div>
                <div className="bg-brand-dark border border-brand-border rounded-lg p-3 col-span-2">
                  <p className="text-brand-muted text-xs mb-1">Assigned To</p>
                  <p className="text-white text-sm">{profiles.find(p => p.id === form.assigned_to)?.full_name || '—'}</p>
                </div>
              </div>
              <div>
                <label className="text-brand-muted text-xs mb-1 block">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="escalated">Escalated</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {form.notes && (
                <div className="bg-brand-dark border border-brand-border rounded-lg p-3">
                  <p className="text-brand-muted text-xs mb-1">Notes</p>
                  <p className="text-white text-sm">{form.notes}</p>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SortableCaseRow({ c, updateStatus, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  return (
    <tr ref={setNodeRef} style={style} className="border-b border-brand-border last:border-0 hover:bg-white/5 transition-colors cursor-pointer">
      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
        <span {...attributes} {...listeners}
          className="text-brand-border hover:text-brand-muted cursor-grab active:cursor-grabbing touch-none flex justify-center">
          <GripVertical size={14} />
        </span>
      </td>
      <td className="px-4 py-3 text-brand-gold text-sm font-medium" onClick={onClick}>{c.case_ref}</td>
      <td className="px-4 py-3 text-white text-sm" onClick={onClick}>{c.account_id || '—'}</td>
      <td className="px-4 py-3 text-brand-muted text-xs" onClick={onClick}>{CASE_TYPE_LABELS[c.case_type]}</td>
      <td className="px-4 py-3" onClick={onClick}>
        {c.assigned ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-black" style={{ backgroundColor: c.assigned.avatar_color || '#C9A84C' }}>
              {c.assigned.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <span className="text-white text-xs">{c.assigned.full_name.split(' ')[0]}</span>
          </div>
        ) : '—'}
      </td>
      <td className="px-4 py-3" onClick={onClick}>
        <span className={`text-xs capitalize font-medium ${c.priority === 'urgent' ? 'text-red-400' : c.priority === 'high' ? 'text-orange-400' : c.priority === 'medium' ? 'text-blue-400' : 'text-brand-muted'}`}>{c.priority}</span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)}
          className="bg-brand-dark border border-brand-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-gold">
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="closed">Closed</option>
        </select>
      </td>
      <td className="px-4 py-3 text-brand-muted text-xs" onClick={onClick}>{format(new Date(c.created_at), 'MMM d')}</td>
    </tr>
  )
}

export default function Cases() {
  const { profile } = useAuth()
  const [cases, setCases] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [selectedCase, setSelectedCase] = useState(null)
  const [form, setForm] = useState({
    case_ref: '', account_id: '', case_type: 'hedge_abuse',
    status: 'open', priority: 'medium', assigned_to: '', notes: ''
  })

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('cases-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, fetchData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchData() {
    const [casesRes, profilesRes] = await Promise.all([
      supabase.from('cases').select(`*, assigned:profiles!assigned_to(full_name, avatar_color)`).order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, avatar_color').eq('is_active', true),
    ])
    setCases(casesRes.data || [])
    setProfiles(profilesRes.data || [])
    setLoading(false)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = filtered.findIndex(c => c.id === active.id)
    const newIndex = filtered.findIndex(c => c.id === over.id)
    const reordered = arrayMove(filtered, oldIndex, newIndex)
    setCases(prev => {
      const ids = new Set(reordered.map(c => c.id))
      const others = prev.filter(c => !ids.has(c.id))
      return [...reordered, ...others]
    })
    await Promise.all(
      reordered.map((c, i) =>
        supabase.from('cases').update({ sort_order: i }).eq('id', c.id)
      )
    )
  }

  async function generateRef() {
    const date = format(new Date(), 'yyyyMMdd')
    const { count } = await supabase.from('cases').select('*', { count: 'exact', head: true })
    return `CASE-${date}-${String((count || 0) + 1).padStart(3, '0')}`
  }

  async function createCase(e) {
    e.preventDefault()
    const ref = form.case_ref || await generateRef()
    await supabase.from('cases').insert({
      ...form,
      case_ref: ref,
      created_by: profile.id,
      assigned_to: form.assigned_to || profile.id,
    })
    setShowModal(false)
    setForm({ case_ref: '', account_id: '', case_type: 'hedge_abuse', status: 'open', priority: 'medium', assigned_to: '', notes: '' })
    fetchData()
  }

  async function updateStatus(id, status) {
    await supabase.from('cases').update({ status }).eq('id', id)
    fetchData()
  }

  const filtered = filter === 'all' ? cases : filter === 'mine' ? cases.filter(c => c.assigned_to === profile?.id) : cases.filter(c => c.status === filter)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Cases</h1>
          <p className="text-brand-muted text-sm mt-1">{cases.length} total cases</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors">
          <Plus size={16} /> New Case
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All' },
          { key: 'mine', label: 'Mine' },
          { key: 'open', label: 'Open' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'escalated', label: 'Escalated' },
          { key: 'closed', label: 'Closed' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === key ? 'bg-brand-gold text-black' : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Cases table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="text-left text-brand-muted text-xs font-medium px-4 py-3 w-8"></th>
              <th className="text-left text-brand-muted text-xs font-medium px-4 py-3">Case Ref</th>
              <th className="text-left text-brand-muted text-xs font-medium px-4 py-3">Account</th>
              <th className="text-left text-brand-muted text-xs font-medium px-4 py-3">Type</th>
              <th className="text-left text-brand-muted text-xs font-medium px-4 py-3">Assigned</th>
              <th className="text-left text-brand-muted text-xs font-medium px-4 py-3">Priority</th>
              <th className="text-left text-brand-muted text-xs font-medium px-4 py-3">Status</th>
              <th className="text-left text-brand-muted text-xs font-medium px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filtered.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {filtered.map(c => <SortableCaseRow key={c.id} c={c} updateStatus={updateStatus} onClick={() => setSelectedCase(c)} />)}
              </SortableContext>
            </DndContext>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-brand-muted text-sm py-12">No cases found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedCase && <CaseDetailModal c={selectedCase} profiles={profiles} onClose={() => setSelectedCase(null)} onUpdate={fetchData} />}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">New Case</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={createCase} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Case Ref (auto if blank)</label>
                  <input value={form.case_ref} onChange={e => setForm({...form, case_ref: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="CASE-..." />
                </div>
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Account ID</label>
                  <input value={form.account_id} onChange={e => setForm({...form, account_id: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="MT5 account #" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-brand-muted text-xs mb-1 block">Case Type *</label>
                  <select value={form.case_type} onChange={e => setForm({...form, case_type: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    {Object.entries(CASE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
              <div>
                <label className="text-brand-muted text-xs mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={3} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold resize-none" placeholder="Initial notes..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors">Create Case</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
