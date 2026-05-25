import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, X, Repeat, Copy, Check, Trash2, Play, Pause } from 'lucide-react'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const RESPONSE_TEMPLATES = [
  {
    category: 'Copy Trading',
    title: 'Stop-Out Dispute Response',
    body: `Dear [Client Name],\n\nThank you for contacting us regarding your copy trading account.\n\nFollowing a thorough review of your account, we can confirm that the stop-out was triggered due to insufficient equity to maintain the required margin levels. At the time of the stop-out:\n\n- Balance: [BALANCE]\n- Equity: [EQUITY]\n- Used Margin: [USED MARGIN]\n- Free Margin: [FREE MARGIN]\n\nThis is a standard risk management process and is not a system error. We recommend enabling AutoScale to prevent similar situations in the future.\n\nShould you have any further questions, please do not hesitate to contact us.\n\nKind regards,\n[Your Name]\nMonaxa Client Support`
  },
  {
    category: 'Withdrawals',
    title: 'Withdrawal Processing Confirmation',
    body: `Dear [Client Name],\n\nWe confirm receipt of your withdrawal request for [AMOUNT] [CURRENCY].\n\nYour request is currently being processed and will be completed within [X] business days, subject to standard verification procedures.\n\nIf you have any questions regarding your withdrawal, please reference your transaction ID: [TX_ID].\n\nKind regards,\n[Your Name]\nMonaxa Operations`
  },
  {
    category: 'Hedge Abuse',
    title: 'Account Review Notice',
    body: `Dear [Client Name],\n\nFollowing a routine review of trading activity on your account(s), our Risk & Compliance team has identified trading patterns that require further clarification.\n\nWe kindly ask you to refrain from opening new positions until this review is completed. Our team will be in touch within [X] business days with our findings.\n\nThis review is a standard procedure and does not imply any wrongdoing.\n\nKind regards,\n[Your Name]\nMonaxa Risk & Compliance`
  },
  {
    category: 'KYC',
    title: 'KYC Document Request',
    body: `Dear [Client Name],\n\nTo comply with our regulatory obligations, we require the following documents to complete your KYC verification:\n\n1. Proof of Identity (Passport or National ID)\n2. Proof of Address (Utility bill or bank statement, dated within 3 months)\n3. [ADDITIONAL DOCUMENT IF REQUIRED]\n\nPlease upload these documents directly to your client portal or reply to this email with the attachments.\n\nUntil verification is complete, certain account functions may be restricted.\n\nKind regards,\n[Your Name]\nMonaxa Compliance`
  },
  {
    category: 'Bonus Abuse',
    title: 'Bonus Terms Breach Notice',
    body: `Dear [Client Name],\n\nFollowing a review of your account activity, our team has identified trading patterns inconsistent with our bonus terms and conditions.\n\nSpecifically, the trading activity suggests [PATTERN DESCRIPTION], which is in breach of Section [X] of our Bonus Policy.\n\nAs a result, the bonus amount of [AMOUNT] has been removed from your account. Your net balance remains [BALANCE].\n\nIf you believe this decision is incorrect, please contact us within 5 business days with supporting information.\n\nKind regards,\n[Your Name]\nMonaxa Risk & Compliance`
  },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        copied ? 'bg-green-400/10 border border-green-400/20 text-green-400' : 'bg-brand-dark border border-brand-border text-brand-muted hover:text-white'
      }`}>
      {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  )
}

export default function Templates() {
  const { profile } = useAuth()
  const [templates, setTemplates] = useState([])
  const [profiles, setProfiles] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('recurring') // recurring | responses
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', type: 'daily', priority: 'medium',
    assigned_to: '', estimated_hours: '', day_of_week: 1, day_of_month: 1
  })

  useEffect(() => {
    supabase.from('task_templates').select('*').order('created_at').then(({ data }) => setTemplates(data || []))
    supabase.from('profiles').select('id, full_name, avatar_color').eq('is_active', true).then(({ data }) => setProfiles(data || []))
  }, [])

  async function createTemplate(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('task_templates').insert({
      ...form,
      assigned_to: form.assigned_to || null,
      estimated_hours: form.estimated_hours || null,
      created_by: profile.id,
    })
    const { data } = await supabase.from('task_templates').select('*').order('created_at')
    setTemplates(data || [])
    setSaving(false)
    setShowModal(false)
    setForm({ title: '', description: '', type: 'daily', priority: 'medium', assigned_to: '', estimated_hours: '', day_of_week: 1, day_of_month: 1 })
  }

  async function toggleTemplate(id, current) {
    await supabase.from('task_templates').update({ is_active: !current }).eq('id', id)
    setTemplates(templates.map(t => t.id === id ? {...t, is_active: !current} : t))
  }

  async function deleteTemplate(id) {
    await supabase.from('task_templates').delete().eq('id', id)
    setTemplates(templates.filter(t => t.id !== id))
  }

  const TYPE_COLOR = { daily: 'text-cyan-400', weekly: 'text-indigo-400', monthly: 'text-violet-400' }
  const PRIORITY_COLOR = { low: 'text-brand-muted', medium: 'text-blue-400', high: 'text-orange-400', urgent: 'text-red-400' }
  const categories = [...new Set(RESPONSE_TEMPLATES.map(t => t.category))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Templates</h1>
        <p className="text-brand-muted text-sm mt-0.5">Recurring task schedules and response templates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-brand-surface border border-brand-border rounded-xl p-1 w-fit">
        {[{ key: 'recurring', label: 'Recurring Tasks' }, { key: 'responses', label: 'Response Templates' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-brand-gold text-black' : 'text-brand-muted hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RECURRING TASKS ── */}
      {tab === 'recurring' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Scheduled Task Templates</p>
              <p className="text-brand-muted text-xs mt-0.5">These auto-generate tasks on their set schedule. Active templates run daily at midnight.</p>
            </div>
            {profile?.role === 'admin' && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                <Plus size={15} /> New Template
              </button>
            )}
          </div>

          {templates.length === 0 ? (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-12 text-center">
              <Repeat size={24} className="text-brand-muted mx-auto mb-3" />
              <p className="text-brand-muted text-sm">No recurring templates yet</p>
              {profile?.role === 'admin' && <p className="text-brand-muted text-xs mt-1">Create one to start auto-generating tasks</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(t => {
                const assignee = profiles.find(p => p.id === t.assigned_to)
                return (
                  <div key={t.id} className={`bg-brand-surface border rounded-xl p-4 flex items-center gap-4 ${t.is_active ? 'border-brand-border' : 'border-brand-border opacity-50'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${TYPE_COLOR[t.type]}`}>{t.type}</span>
                        <span className={`text-xs ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                        {t.estimated_hours && <span className="text-brand-muted text-xs">~{t.estimated_hours}h</span>}
                      </div>
                      <p className="text-white text-sm font-medium">{t.title}</p>
                      {t.description && <p className="text-brand-muted text-xs mt-0.5 truncate">{t.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        {t.type === 'weekly' && <span className="text-brand-muted text-xs">Every {DAYS[t.day_of_week]}</span>}
                        {t.type === 'monthly' && <span className="text-brand-muted text-xs">Day {t.day_of_month} of month</span>}
                        {assignee && <span className="text-brand-muted text-xs">→ {assignee.full_name}</span>}
                        {t.last_generated_at && <span className="text-brand-muted text-xs">Last run: {new Date(t.last_generated_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    {profile?.role === 'admin' && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => toggleTemplate(t.id, t.is_active)}
                          className={`p-2 rounded-lg border transition-colors ${t.is_active ? 'text-green-400 border-green-400/20 bg-green-400/5 hover:bg-red-400/5 hover:text-red-400 hover:border-red-400/20' : 'text-brand-muted border-brand-border hover:text-green-400'}`}
                          title={t.is_active ? 'Pause' : 'Activate'}>
                          {t.is_active ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button onClick={() => deleteTemplate(t.id)}
                          className="p-2 rounded-lg border border-brand-border text-brand-muted hover:text-red-400 hover:border-red-400/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RESPONSE TEMPLATES ── */}
      {tab === 'responses' && (
        <div className="space-y-6">
          {categories.map(cat => (
            <div key={cat}>
              <p className="text-brand-gold text-xs font-semibold uppercase tracking-wider mb-3">{cat}</p>
              <div className="space-y-3">
                {RESPONSE_TEMPLATES.filter(t => t.category === cat).map((t, i) => (
                  <div key={i} className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
                      <p className="text-white text-sm font-medium">{t.title}</p>
                      <CopyButton text={t.body} />
                    </div>
                    <pre className="px-4 py-3 text-brand-muted text-xs leading-relaxed whitespace-pre-wrap font-sans">{t.body}</pre>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">New Recurring Template</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={createTemplate} className="space-y-4">
              <div>
                <label className="text-xs text-brand-muted mb-1.5 block">Task Title *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required
                  placeholder="e.g. End of day reconciliation"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="text-xs text-brand-muted mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-brand-muted mb-1.5 block">Schedule</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-brand-muted mb-1.5 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              {form.type === 'weekly' && (
                <div>
                  <label className="text-xs text-brand-muted mb-1.5 block">Day of Week</label>
                  <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: Number(e.target.value)})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              )}
              {form.type === 'monthly' && (
                <div>
                  <label className="text-xs text-brand-muted mb-1.5 block">Day of Month</label>
                  <input type="number" min="1" max="31" value={form.day_of_month} onChange={e => setForm({...form, day_of_month: Number(e.target.value)})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-brand-muted mb-1.5 block">Assign To</label>
                  <select value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})}
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold">
                    <option value="">Unassigned</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-brand-muted mb-1.5 block">Est. Hours</label>
                  <input type="number" min="0.5" step="0.5" value={form.estimated_hours} onChange={e => setForm({...form, estimated_hours: e.target.value})}
                    placeholder="e.g. 2"
                    className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
