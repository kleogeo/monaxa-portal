import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, X, ExternalLink, Table2, Trash2, Edit3, Check } from 'lucide-react'

function convertToEmbed(url) {
  // Convert Google Sheets share URL to embed URL
  if (!url) return null
  let embedUrl = url
  // Handle /edit, /view etc
  embedUrl = embedUrl.replace(/\/(edit|view|pub).*$/, '')
  // Add embed params
  if (!embedUrl.includes('/pub')) {
    embedUrl = embedUrl.replace('/spreadsheets/d/', '/spreadsheets/d/')
    embedUrl += '/pub?output=html&widget=true&headers=false'
  }
  return embedUrl
}

function isValidSheetsUrl(url) {
  return url && (url.includes('docs.google.com/spreadsheets') || url.includes('sheets.google.com'))
}

export default function Sheets() {
  const { profile } = useAuth()
  const [sheets, setSheets] = useState([])
  const [activeSheet, setActiveSheet] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', url: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSheets()
  }, [])

  async function loadSheets() {
    const { data } = await supabase
      .from('shared_sheets')
      .select('*')
      .order('created_at', { ascending: false })
    setSheets(data || [])
    if (data?.length > 0 && !activeSheet) setActiveSheet(data[0])
  }

  async function saveSheet(e) {
    e.preventDefault()
    setError('')
    if (!isValidSheetsUrl(form.url)) {
      setError('Please enter a valid Google Sheets URL')
      return
    }
    setSaving(true)
    if (editingId) {
      await supabase.from('shared_sheets').update({ name: form.name, url: form.url, description: form.description }).eq('id', editingId)
    } else {
      await supabase.from('shared_sheets').insert({ ...form, created_by: profile.id })
    }
    setSaving(false)
    setShowModal(false)
    setEditingId(null)
    setForm({ name: '', url: '', description: '' })
    loadSheets()
  }

  async function deleteSheet(id) {
    await supabase.from('shared_sheets').delete().eq('id', id)
    if (activeSheet?.id === id) setActiveSheet(null)
    loadSheets()
  }

  function startEdit(sheet) {
    setForm({ name: sheet.name, url: sheet.url, description: sheet.description || '' })
    setEditingId(sheet.id)
    setShowModal(true)
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Google Sheets</h1>
          <p className="text-brand-muted text-sm mt-0.5">Shared team spreadsheets — embedded live</p>
        </div>
        {profile?.role === 'admin' && (
          <button onClick={() => { setForm({ name: '', url: '', description: '' }); setEditingId(null); setShowModal(true) }}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            <Plus size={15} /> Add Sheet
          </button>
        )}
      </div>

      {sheets.length === 0 ? (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-16 text-center">
          <Table2 size={32} className="text-brand-muted mx-auto mb-4" />
          <p className="text-white font-medium">No sheets added yet</p>
          <p className="text-brand-muted text-sm mt-1">
            {profile?.role === 'admin'
              ? 'Click "Add Sheet" to embed a Google Sheet — paste the share URL and it appears here live.'
              : 'Ask your admin to add shared sheets here.'}
          </p>
          {profile?.role === 'admin' && (
            <div className="mt-4 text-xs text-brand-muted bg-brand-dark rounded-lg px-4 py-3 inline-block text-left">
              <p className="font-medium text-white mb-1">How to get a Google Sheets URL:</p>
              <p>1. Open the sheet in Google Sheets</p>
              <p>2. File → Share → Publish to web</p>
              <p>3. Copy the link and paste it here</p>
              <p className="mt-1 text-brand-gold">Or just paste the regular share URL — we'll handle the conversion</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-5">
          {/* Sheet selector sidebar */}
          <div className="w-56 flex-shrink-0 space-y-1">
            {sheets.map(s => (
              <div key={s.id}
                className={`group flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  activeSheet?.id === s.id ? 'bg-brand-gold/10 border-brand-gold/30' : 'bg-brand-surface border-brand-border hover:border-brand-gold/20'
                }`}
                onClick={() => setActiveSheet(s)}>
                <Table2 size={14} className={`flex-shrink-0 mt-0.5 ${activeSheet?.id === s.id ? 'text-brand-gold' : 'text-brand-muted'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${activeSheet?.id === s.id ? 'text-brand-gold' : 'text-white'}`}>{s.name}</p>
                  {s.description && <p className="text-brand-muted text-xs mt-0.5 truncate">{s.description}</p>}
                </div>
                {profile?.role === 'admin' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); startEdit(s) }} className="p-1 text-brand-muted hover:text-brand-gold rounded transition-colors"><Edit3 size={11} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteSheet(s.id) }} className="p-1 text-brand-muted hover:text-red-400 rounded transition-colors"><Trash2 size={11} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sheet embed */}
          <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl overflow-hidden">
            {activeSheet ? (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
                  <div>
                    <p className="text-white font-medium text-sm">{activeSheet.name}</p>
                    {activeSheet.description && <p className="text-brand-muted text-xs">{activeSheet.description}</p>}
                  </div>
                  <a href={activeSheet.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-brand-muted hover:text-brand-gold text-xs transition-colors">
                    <ExternalLink size={13} /> Open in Google Sheets
                  </a>
                </div>
                <iframe
                  src={convertToEmbed(activeSheet.url)}
                  className="w-full"
                  style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}
                  frameBorder="0"
                  title={activeSheet.name}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-brand-muted text-sm">Select a sheet to view</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">{editingId ? 'Edit Sheet' : 'Add Google Sheet'}</h3>
              <button onClick={() => setShowModal(false)} className="text-brand-muted hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={saveSheet} className="space-y-4">
              <div>
                <label className="text-xs text-brand-muted mb-1.5 block">Sheet Name *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                  placeholder="e.g. Daily P&L Tracker"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
              </div>
              <div>
                <label className="text-xs text-brand-muted mb-1.5 block">Google Sheets URL *</label>
                <input value={form.url} onChange={e => setForm({...form, url: e.target.value})} required
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
                <p className="text-brand-muted text-xs mt-1">Paste the share or publish URL from Google Sheets</p>
              </div>
              <div>
                <label className="text-xs text-brand-muted mb-1.5 block">Description (optional)</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Brief description of what's in this sheet"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-gold" />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
                  <Check size={14} />{saving ? 'Saving...' : editingId ? 'Update' : 'Add Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
