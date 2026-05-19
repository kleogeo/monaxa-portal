import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { X, Edit3, Check, Shield, Users, Building2, ExternalLink } from 'lucide-react'

const AVATAR_COLORS = ['#C9A84C', '#4C9AC9', '#C94C4C', '#4CC94C', '#9A4CC9', '#C9894C', '#4CC9C9', '#C94CA8']

function Avatar({ profile, size = 8 }) {
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const cls = size === 8 ? 'w-8 h-8 text-xs' : 'w-6 h-6 text-[10px]'
  return (
    <div className={`${cls} rounded-full flex items-center justify-center font-bold text-black flex-shrink-0`}
      style={{ backgroundColor: profile?.avatar_color || '#C9A84C' }}>
      {initials}
    </div>
  )
}

export default function Admin() {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [departments, setDepartments] = useState([])
  const [userDepts, setUserDepts] = useState({}) // userId -> [deptId]
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('team') // team | departments

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [membersRes, deptsRes, userDeptsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('departments').select('*').order('name'),
      supabase.from('user_departments').select('*'),
    ])
    setMembers(membersRes.data || [])
    setDepartments(deptsRes.data || [])

    // Build userId -> deptIds map
    const map = {}
    for (const ud of userDeptsRes.data || []) {
      if (!map[ud.user_id]) map[ud.user_id] = []
      map[ud.user_id].push(ud.department_id)
    }
    setUserDepts(map)
    setLoading(false)
  }

  function startEdit(member) {
    setEditingId(member.id)
    setEditForm({
      full_name: member.full_name,
      role: member.role,
      avatar_color: member.avatar_color,
      is_active: member.is_active,
    })
  }

  async function saveEdit(id) {
    setSaving(true)
    await supabase.from('profiles').update(editForm).eq('id', id)
    setSaving(false)
    setEditingId(null)
    fetchAll()
  }

  async function toggleDept(userId, deptId) {
    const current = userDepts[userId] || []
    if (current.includes(deptId)) {
      await supabase.from('user_departments').delete().eq('user_id', userId).eq('department_id', deptId)
    } else {
      await supabase.from('user_departments').insert({ user_id: userId, department_id: deptId })
    }
    fetchAll()
  }

  async function saveDept(dept) {
    setSaving(true)
    await supabase.from('departments').update({ name: dept.name, color: dept.color, description: dept.description }).eq('id', dept.id)
    setSaving(false)
    fetchAll()
  }

  if (profile?.role !== 'admin') return (
    <div className="flex items-center justify-center h-64">
      <p className="text-brand-muted">Admin access only.</p>
    </div>
  )

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Admin</h1>
        <p className="text-brand-muted text-sm mt-0.5">Manage team members, roles, and departments</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-xl p-1 w-fit">
        {[{ key: 'team', label: 'Team Members', icon: Users }, { key: 'departments', label: 'Departments', icon: Building2 }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-brand-gold text-black' : 'text-brand-muted hover:text-white'}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* ── TEAM TAB ── */}
      {tab === 'team' && (
        <div className="space-y-4">
          {/* Add member notice */}
          <div className="bg-brand-dark border border-brand-border rounded-xl p-4 flex items-start gap-3">
            <Shield size={16} className="text-brand-gold mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Adding new team members</p>
              <p className="text-brand-muted text-xs mt-1">Create accounts directly in the Supabase dashboard, then their profile will appear here automatically for you to set their role and department.</p>
              <a href="https://supabase.com/dashboard/project/jcmjvzcdpplmrkekslpl/auth/users" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-brand-gold text-xs mt-2 hover:text-brand-gold/80 transition-colors">
                <ExternalLink size={12} /> Open Supabase Auth Dashboard
              </a>
            </div>
          </div>

          {/* Members list */}
          <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 border-b border-brand-border">
              <div className="text-brand-muted text-xs font-medium px-5 py-3">Member</div>
              <div />
              <div className="text-brand-muted text-xs font-medium px-4 py-3">Role</div>
              <div className="text-brand-muted text-xs font-medium px-4 py-3">Status</div>
              <div className="text-brand-muted text-xs font-medium px-4 py-3">Actions</div>
            </div>

            {members.map(m => (
              <div key={m.id} className="border-b border-brand-border last:border-0">
                {editingId === m.id ? (
                  /* Edit row */
                  <div className="p-4 space-y-3 bg-brand-dark">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-brand-muted mb-1 block">Full Name</label>
                        <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                          className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold" />
                      </div>
                      <div>
                        <label className="text-xs text-brand-muted mb-1 block">Role</label>
                        <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}
                          className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold">
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-brand-muted mb-1.5 block">Avatar Colour</label>
                      <div className="flex gap-2">
                        {AVATAR_COLORS.map(c => (
                          <button key={c} type="button" onClick={() => setEditForm({...editForm, avatar_color: c})}
                            className={`w-7 h-7 rounded-full transition-all ${editForm.avatar_color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-dark scale-110' : ''}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                        <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({...editForm, is_active: e.target.checked})}
                          className="w-4 h-4 rounded accent-brand-gold" />
                        Active account
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2 text-sm transition-colors">Cancel</button>
                      <button onClick={() => saveEdit(m.id)} disabled={saving}
                        className="flex-1 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2 text-sm transition-colors disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View row */
                  <div className="flex items-center gap-4 px-5 py-3">
                    <Avatar profile={m} size={8} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{m.full_name}</p>
                      <p className="text-brand-muted text-xs">{m.email}</p>
                      {/* Department badges */}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {(userDepts[m.id] || []).map(dId => {
                          const d = departments.find(x => x.id === dId)
                          return d ? <span key={dId} className="text-xs px-1.5 py-0.5 rounded-full border"
                            style={{ color: d.color, borderColor: d.color + '40', backgroundColor: d.color + '15' }}>{d.name}</span> : null
                        })}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${m.role === 'admin' ? 'text-brand-gold border-brand-gold/30 bg-brand-gold/10' : 'text-brand-muted border-brand-border bg-white/5'}`}>
                      {m.role}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${m.is_active ? 'text-green-400 border-green-400/20 bg-green-400/10' : 'text-red-400 border-red-400/20 bg-red-400/10'}`}>
                      {m.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => startEdit(m)} className="p-2 text-brand-muted hover:text-brand-gold rounded-lg border border-brand-border hover:border-brand-gold/30 transition-colors flex-shrink-0">
                      <Edit3 size={13} />
                    </button>
                  </div>
                )}

                {/* Department assignment (below each member, collapsible) */}
                {editingId !== m.id && (
                  <div className="px-5 pb-3">
                    <p className="text-brand-muted text-xs mb-2">Departments:</p>
                    <div className="flex gap-2 flex-wrap">
                      {departments.map(d => {
                        const assigned = (userDepts[m.id] || []).includes(d.id)
                        return (
                          <button key={d.id} onClick={() => toggleDept(m.id, d.id)}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${assigned ? 'text-black font-medium' : 'text-brand-muted hover:text-white border-brand-border'}`}
                            style={assigned ? { backgroundColor: d.color, borderColor: d.color } : {}}>
                            {d.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DEPARTMENTS TAB ── */}
      {tab === 'departments' && (
        <div className="space-y-3">
          <p className="text-brand-muted text-sm">Manage departments and their colours. Click a department to edit it.</p>
          {departments.map(dept => (
            <DeptEditor key={dept.id} dept={dept} onSave={saveDept} />
          ))}
        </div>
      )}
    </div>
  )
}

function DeptEditor({ dept, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: dept.name, color: dept.color, description: dept.description || '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave({ ...dept, ...form })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color }} />
        <div className="flex-1">
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold" />
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Description..."
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="text-xs text-brand-muted mb-1.5 block">Colour</label>
                <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                  className="w-10 h-8 rounded cursor-pointer bg-transparent border-0" />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-white text-sm font-medium">{dept.name}</p>
              {dept.description && <p className="text-brand-muted text-xs mt-0.5">{dept.description}</p>}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 border border-brand-border text-brand-muted hover:text-white rounded-lg text-xs transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-3 py-1.5 bg-brand-gold text-black font-semibold rounded-lg text-xs transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="p-2 text-brand-muted hover:text-brand-gold rounded-lg border border-brand-border hover:border-brand-gold/30 transition-colors">
              <Edit3 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
