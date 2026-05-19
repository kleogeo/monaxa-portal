import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X, Check, Clock, Sun, Umbrella, Stethoscope, Baby, MoreHorizontal } from 'lucide-react'

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave', icon: Umbrella, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
  { value: 'sick', label: 'Sick Leave', icon: Stethoscope, color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
  { value: 'public', label: 'Public Holiday', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-brand-muted', bg: 'bg-white/5 border-white/10' },
]

const SHIFT_COLORS = ['#C9A84C', '#4C9AC9', '#C94C4C', '#4CC94C', '#9A4CC9', '#C9894C']

function Avatar({ profile, size = 6 }) {
  if (!profile) return null
  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const cls = size === 5 ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]'
  return (
    <div className={`${cls} rounded-full flex items-center justify-center font-bold text-black flex-shrink-0`}
      style={{ backgroundColor: profile.avatar_color || '#C9A84C' }}>
      {initials}
    </div>
  )
}

export default function RotaCalendar() {
  const { profile } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [profiles, setProfiles] = useState([])
  const [leaves, setLeaves] = useState([])
  const [view, setView] = useState('month') // month | team
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ start_date: '', end_date: '', type: 'annual', note: '' })
  const [saving, setSaving] = useState(false)
  const [pendingLeaves, setPendingLeaves] = useState([])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = Array(monthStart.getDay()).fill(null)

  const fetchData = useCallback(async () => {
    const [profilesRes, leavesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_active', true),
      supabase.from('leave_requests').select('*').gte('start_date', format(monthStart, 'yyyy-MM-dd')).lte('end_date', format(monthEnd, 'yyyy-MM-dd')),
    ])
    setProfiles(profilesRes.data || [])
    setLeaves(leavesRes.data || [])
    if (profile?.role === 'admin') {
      const { data } = await supabase.from('leave_requests').select('*').eq('status', 'pending')
      setPendingLeaves(data || [])
    }
  }, [currentDate, profile?.role])

  useEffect(() => { fetchData() }, [fetchData])

  function getLeavesForDay(day) {
    return leaves.filter(l => {
      const start = new Date(l.start_date)
      const end = new Date(l.end_date)
      const d = new Date(day)
      return d >= start && d <= end
    })
  }

  async function submitLeave(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('leave_requests').insert({
      ...form,
      user_id: profile.id,
      status: 'pending',
    })
    setSaving(false)
    setShowModal(false)
    setForm({ start_date: '', end_date: '', type: 'annual', note: '' })
    fetchData()
  }

  async function approveLeave(id, approved) {
    await supabase.from('leave_requests').update({ status: approved ? 'approved' : 'rejected' }).eq('id', id)
    fetchData()
  }

  const getLeaveType = (type) => LEAVE_TYPES.find(t => t.value === type) || LEAVE_TYPES[3]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Rota & Leave</h1>
          <p className="text-brand-muted text-sm mt-0.5">Team schedule and holiday management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-lg p-1">
            {['month', 'team'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${view === v ? 'bg-brand-gold text-black' : 'text-brand-muted hover:text-white'}`}>
                {v === 'month' ? 'Month View' : 'Team View'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            <Plus size={15} /> Request Leave
          </button>
        </div>
      </div>

      {/* Admin pending approvals */}
      {profile?.role === 'admin' && pendingLeaves.length > 0 && (
        <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4">
          <p className="text-yellow-400 text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock size={14} /> {pendingLeaves.length} pending approval{pendingLeaves.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {pendingLeaves.map(l => {
              const member = profiles.find(p => p.id === l.user_id)
              const lt = getLeaveType(l.type)
              return (
                <div key={l.id} className="flex items-center gap-3 bg-brand-dark rounded-lg p-3 border border-brand-border">
                  {member && <Avatar profile={member} size={6} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{member?.full_name}</p>
                    <p className="text-brand-muted text-xs">{lt.label} · {format(new Date(l.start_date), 'MMM d')} – {format(new Date(l.end_date), 'MMM d')}</p>
                    {l.note && <p className="text-brand-muted text-xs italic">"{l.note}"</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveLeave(l.id, true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-400/10 border border-green-400/20 text-green-400 rounded-lg text-xs hover:bg-green-400/20 transition-colors">
                      <Check size={12} /> Approve
                    </button>
                    <button onClick={() => approveLeave(l.id, false)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-400/10 border border-red-400/20 text-red-400 rounded-lg text-xs hover:bg-red-400/20 transition-colors">
                      <X size={12} /> Reject
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-border text-brand-muted hover:text-white hover:border-brand-gold transition-colors">
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-white font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-brand-border text-brand-muted hover:text-white hover:border-brand-gold transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Leave type legend */}
      <div className="flex gap-3 flex-wrap">
        {LEAVE_TYPES.map(lt => (
          <div key={lt.value} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${lt.bg} ${lt.color}`}>
            <lt.icon size={11} /> {lt.label}
          </div>
        ))}
      </div>

      {view === 'month' && (
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-brand-border">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-brand-muted text-xs font-medium text-center py-3">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {startPad.map((_, i) => <div key={`pad-${i}`} className="min-h-20 border-b border-r border-brand-border bg-black/20" />)}
            {days.map(day => {
              const dayLeaves = getLeavesForDay(day)
              const approved = dayLeaves.filter(l => l.status === 'approved')
              const today = isToday(day)
              return (
                <div key={day.toISOString()} className="min-h-20 border-b border-r border-brand-border p-1.5 hover:bg-white/5 transition-colors">
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${today ? 'bg-brand-gold text-black' : 'text-brand-muted'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {approved.slice(0, 3).map(l => {
                      const member = profiles.find(p => p.id === l.user_id)
                      const lt = getLeaveType(l.type)
                      return (
                        <div key={l.id} className={`flex items-center gap-1 text-[10px] rounded px-1 py-0.5 ${lt.bg}`}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: member?.avatar_color || '#C9A84C' }} />
                          <span className={`truncate ${lt.color}`}>{member?.full_name?.split(' ')[0]}</span>
                        </div>
                      )
                    })}
                    {approved.length > 3 && <p className="text-brand-muted text-[10px]">+{approved.length - 3}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'team' && (
        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-brand-border">
                  <th className="text-left text-brand-muted text-xs font-medium px-4 py-3 w-36">Member</th>
                  {days.map(d => (
                    <th key={d.toISOString()} className={`text-center text-xs font-medium px-1 py-3 w-8 ${isToday(d) ? 'text-brand-gold' : 'text-brand-muted'}`}>
                      <div>{format(d, 'EEE')[0]}</div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mx-auto mt-0.5 ${isToday(d) ? 'bg-brand-gold text-black font-bold' : ''}`}>
                        {format(d, 'd')}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map(member => (
                  <tr key={member.id} className="border-b border-brand-border last:border-0 hover:bg-white/5">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar profile={member} size={6} />
                        <span className="text-white text-xs font-medium">{member.full_name.split(' ')[0]}</span>
                      </div>
                    </td>
                    {days.map(day => {
                      const dayLeave = leaves.find(l => {
                        if (l.user_id !== member.id || l.status !== 'approved') return false
                        const start = new Date(l.start_date)
                        const end = new Date(l.end_date)
                        const d = new Date(day)
                        return d >= start && d <= end
                      })
                      const lt = dayLeave ? getLeaveType(dayLeave.type) : null
                      const isWeekend = [0, 6].includes(day.getDay())
                      return (
                        <td key={day.toISOString()} className={`text-center px-0.5 py-2 ${isWeekend ? 'bg-white/5' : ''}`}>
                          {lt ? (
                            <div className={`w-5 h-5 rounded flex items-center justify-center mx-auto ${lt.bg}`}>
                              <lt.icon size={10} className={lt.color} />
                            </div>
                          ) : (
                            <div className={`w-5 h-5 rounded mx-auto ${isToday(day) ? 'bg-brand-gold/20' : ''}`} />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Request Leave</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={submitLeave} className="space-y-4">
              <div>
                <label className="text-xs text-brand-muted mb-1.5 block">Leave Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEAVE_TYPES.map(lt => (
                    <button key={lt.value} type="button" onClick={() => setForm({...form, type: lt.value})}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                        form.type === lt.value ? `${lt.bg} ${lt.color}` : 'bg-brand-dark border-brand-border text-brand-muted hover:text-white'
                      }`}>
                      <lt.icon size={14} /> {lt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-brand-muted mb-1.5 block">From</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                </div>
                <div>
                  <label className="text-xs text-brand-muted mb-1.5 block">To</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                </div>
              </div>
              <div>
                <label className="text-xs text-brand-muted mb-1.5 block">Note (optional)</label>
                <input value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                  placeholder="Any additional context..."
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
                  {saving ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
