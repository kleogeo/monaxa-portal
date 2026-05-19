import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { UserPlus, X } from 'lucide-react'

const AVATAR_COLORS = ['#C9A84C', '#4C9AC9', '#C94C4C', '#4CC94C', '#9A4CC9', '#C9894C', '#4CC9C9']

export default function Admin() {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', role: 'member', avatar_color: '#C9A84C' })
  const [message, setMessage] = useState('')

  useEffect(() => { fetchMembers() }, [])

  async function fetchMembers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setMembers(data || [])
    setLoading(false)
  }

  async function inviteMember(e) {
    e.preventDefault()
    setInviteLoading(true)
    setMessage('')

    // Use Supabase Admin to invite user
    const { error } = await supabase.auth.admin?.inviteUserByEmail
      ? await supabase.auth.admin.inviteUserByEmail(form.email, { data: { full_name: form.full_name } })
      : { error: null }

    // Insert profile directly (user will set password on first login via email link)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: crypto.randomUUID(),
      email: form.email,
      full_name: form.full_name,
      role: form.role,
      avatar_color: form.avatar_color,
    })

    if (profileError) {
      setMessage('Error adding member. They may already exist.')
    } else {
      setMessage(`✓ ${form.full_name} added. Share the portal URL and have them sign up with ${form.email}.`)
      setForm({ email: '', full_name: '', role: 'member', avatar_color: '#C9A84C' })
      fetchMembers()
    }
    setInviteLoading(false)
  }

  async function toggleActive(id, current) {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', id)
    fetchMembers()
  }

  if (profile?.role !== 'admin') return (
    <div className="flex items-center justify-center h-64">
      <p className="text-brand-muted">Admin access only.</p>
    </div>
  )

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Admin</h1>
          <p className="text-brand-muted text-sm mt-1">Manage team members</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors">
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      {/* Members list */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-border">
              <th className="text-left text-brand-muted text-xs font-medium px-5 py-3">Member</th>
              <th className="text-left text-brand-muted text-xs font-medium px-5 py-3">Email</th>
              <th className="text-left text-brand-muted text-xs font-medium px-5 py-3">Role</th>
              <th className="text-left text-brand-muted text-xs font-medium px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => {
              const initials = m.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              return (
                <tr key={m.id} className="border-b border-brand-border last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ backgroundColor: m.avatar_color || '#C9A84C' }}>
                        {initials}
                      </div>
                      <span className="text-white text-sm">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-brand-muted text-sm">{m.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${m.role === 'admin' ? 'text-brand-gold border-brand-gold/30 bg-brand-gold/10' : 'text-brand-muted border-brand-border bg-white/5'}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleActive(m.id, m.is_active)} className={`text-xs px-2 py-1 rounded-full border transition-colors ${m.is_active ? 'text-green-400 border-green-400/30 bg-green-400/10 hover:bg-red-400/10 hover:text-red-400 hover:border-red-400/30' : 'text-brand-muted border-brand-border hover:text-green-400'}`}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Add Team Member</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={inviteMember} className="space-y-4">
              <div>
                <label className="text-brand-muted text-xs mb-1 block">Full Name *</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="First Last" />
              </div>
              <div>
                <label className="text-brand-muted text-xs mb-1 block">Work Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" placeholder="name@monaxa.com" />
              </div>
              <div>
                <label className="text-brand-muted text-xs mb-1 block">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-brand-muted text-xs mb-1 block">Avatar Colour</label>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({...form, avatar_color: c})} className={`w-7 h-7 rounded-full transition-all ${form.avatar_color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-dark scale-110' : ''}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              {message && <p className={`text-xs ${message.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={inviteLoading} className="flex-1 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
                  {inviteLoading ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
