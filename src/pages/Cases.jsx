import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, X } from 'lucide-react'
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

export default function Cases() {
  const { profile } = useAuth()
  const [cases, setCases] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({
    case_ref: '', account_id: '', case_type: 'hedge_abuse',
    status: 'open', priority: 'medium', assigned_to: '', notes: ''
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [casesRes, profilesRes] = await Promise.all([
      supabase.from('cases').select(`*, assigned:profiles!assigned_to(full_name, avatar_color)`).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name, avatar_color').eq('is_active', true),
    ])
    setCases(casesRes.data || [])
    setProfiles(profilesRes.data || [])
    setLoading(false)
  }

  async function generateRef() {
    const date = format(new Date(), 'yyyyMMdd')
    const count = cases.length + 1
    return `CASE-${date}-${String(count).padStart(3, '0')}`
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
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-brand-border last:border-0 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-brand-gold text-sm font-medium">{c.case_ref}</td>
                <td className="px-4 py-3 text-white text-sm">{c.account_id || '—'}</td>
                <td className="px-4 py-3 text-brand-muted text-xs">{CASE_TYPE_LABELS[c.case_type]}</td>
                <td className="px-4 py-3">
                  {c.assigned ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-black" style={{ backgroundColor: c.assigned.avatar_color || '#C9A84C' }}>
                        {c.assigned.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-white text-xs">{c.assigned.full_name.split(' ')[0]}</span>
                    </div>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs capitalize font-medium ${c.priority === 'urgent' ? 'text-red-400' : c.priority === 'high' ? 'text-orange-400' : c.priority === 'medium' ? 'text-blue-400' : 'text-brand-muted'}`}>{c.priority}</span>
                </td>
                <td className="px-4 py-3">
                  <select value={c.status} onChange={e => updateStatus(c.id, e.target.value)} className="bg-brand-dark border border-brand-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-brand-gold">
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-brand-muted text-xs">{format(new Date(c.created_at), 'MMM d')}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-brand-muted text-sm py-12">No cases found</td></tr>
            )}
          </tbody>
        </table>
      </div>

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
