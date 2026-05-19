import { useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Upload, X, FileText, File, Image, Archive, Trash2, Download, AlertCircle, Check } from 'lucide-react'

export const FOLDERS = [
  { value: 'case_files', label: 'Case Files', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', desc: 'Main case documentation' },
  { value: 'trade_evidence', label: 'Trade Evidence', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', desc: 'Screenshots, MT5 exports, trade history' },
  { value: 'client_comms', label: 'Client Communications', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20', desc: 'Emails, chat logs, correspondence' },
  { value: 'compliance_reports', label: 'Compliance Reports', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', desc: 'Formal reports and regulatory docs' },
  { value: 'internal_memos', label: 'Internal Memos', color: 'text-brand-gold', bg: 'bg-brand-gold/10 border-brand-gold/20', desc: 'Internal notes and escalations' },
]

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ mime }) {
  if (!mime) return <File size={14} className="text-brand-muted" />
  if (mime.startsWith('image/')) return <Image size={14} className="text-blue-400" />
  if (mime.includes('pdf')) return <FileText size={14} className="text-red-400" />
  if (mime.includes('zip') || mime.includes('rar')) return <Archive size={14} className="text-yellow-400" />
  return <File size={14} className="text-brand-muted" />
}

// ── Confirm drop modal ────────────────────────────────────────────
function ConfirmDropModal({ file, onConfirm, onCancel }) {
  const [folder, setFolder] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [step, setStep] = useState(1) // 1=pick folder, 2=confirm

  function handleNext() {
    if (!folder) return
    setStep(2)
  }

  function handleConfirm() {
    onConfirm(folder)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md p-6 shadow-2xl">

        {step === 1 && (<>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Where does this file go?</h3>
              <p className="text-brand-muted text-xs mt-1 flex items-center gap-1.5">
                <File size={11} /> {file.name} · {formatBytes(file.size)}
              </p>
            </div>
            <button onClick={onCancel} className="text-brand-muted hover:text-white"><X size={18} /></button>
          </div>

          <div className="space-y-2 mb-5">
            {FOLDERS.map(f => (
              <button key={f.value} onClick={() => setFolder(f.value)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  folder === f.value ? `${f.bg} ${f.color}` : 'bg-brand-dark border-brand-border text-brand-muted hover:border-brand-gold/30 hover:text-white'
                }`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${folder === f.value ? 'bg-current' : 'bg-brand-border'}`} />
                <div>
                  <p className={`text-sm font-medium ${folder === f.value ? '' : 'text-white'}`}>{f.label}</p>
                  <p className="text-xs text-brand-muted mt-0.5">{f.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {!folder && (
            <div className="flex items-center gap-2 text-xs text-orange-400 mb-3">
              <AlertCircle size={12} /> You must select a folder — files cannot be saved without one
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">Cancel</button>
            <button onClick={handleNext} disabled={!folder}
              className="flex-1 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-40">
              Next →
            </button>
          </div>
        </>)}

        {step === 2 && (<>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-white font-semibold">Confirm Upload</h3>
            <button onClick={() => setStep(1)} className="text-brand-muted hover:text-white"><X size={18} /></button>
          </div>

          <div className="bg-brand-dark rounded-xl border border-brand-border p-4 space-y-3 mb-5">
            <div className="flex items-center gap-3">
              <FileIcon mime={file.type} />
              <div>
                <p className="text-white text-sm font-medium">{file.name}</p>
                <p className="text-brand-muted text-xs">{formatBytes(file.size)}</p>
              </div>
            </div>
            <div className="border-t border-brand-border pt-3">
              <p className="text-brand-muted text-xs mb-1">Saving to folder</p>
              {(() => {
                const f = FOLDERS.find(x => x.value === folder)
                return <div className={`flex items-center gap-2 text-sm font-medium ${f.color}`}>
                  <div className={`text-xs px-2 py-0.5 rounded-full border ${f.bg}`}>{f.label}</div>
                </div>
              })()}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-brand-border text-brand-muted hover:text-white rounded-lg py-2.5 text-sm transition-colors">← Back</button>
            <button onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-semibold rounded-lg py-2.5 text-sm transition-colors">
              <Check size={14} /> Confirm Upload
            </button>
          </div>
        </>)}
      </div>
    </div>
  )
}

// ── Main FileDrop component ───────────────────────────────────────
export default function FileDrop({ entityType, entityId, onUploadComplete }) {
  const { profile } = useAuth()
  const [dragging, setDragging] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  // Load existing attachments
  const loadAttachments = useCallback(async () => {
    if (!entityId) return
    const { data } = await supabase
      .from('file_attachments')
      .select('*, uploader:profiles!uploaded_by(full_name)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
    setAttachments(data || [])
    setLoadingFiles(false)
  }, [entityType, entityId])

  useState(() => { loadAttachments() }, [])

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setPendingFile(file)
  }

  function handleFileInput(e) {
    const file = e.target.files[0]
    if (file) setPendingFile(file)
  }

  async function handleConfirmUpload(folder) {
    if (!pendingFile) return
    setUploading(true)
    setError('')

    const ext = pendingFile.name.split('.').pop()
    const path = `${entityType}/${entityId}/${folder}/${Date.now()}_${pendingFile.name}`

    const { error: uploadError } = await supabase.storage
      .from('ops-files')
      .upload(path, pendingFile, { contentType: pendingFile.type })

    if (uploadError) {
      setError('Upload failed. Please try again.')
      setUploading(false)
      setPendingFile(null)
      return
    }

    await supabase.from('file_attachments').insert({
      entity_type: entityType,
      entity_id: entityId,
      folder,
      file_name: pendingFile.name,
      file_size: pendingFile.size,
      mime_type: pendingFile.type,
      storage_path: path,
      uploaded_by: profile.id,
    })

    setPendingFile(null)
    setUploading(false)
    loadAttachments()
    onUploadComplete?.()
  }

  async function handleDelete(attachment) {
    await supabase.storage.from('ops-files').remove([attachment.storage_path])
    await supabase.from('file_attachments').delete().eq('id', attachment.id)
    loadAttachments()
  }

  async function handleDownload(attachment) {
    const { data } = await supabase.storage
      .from('ops-files')
      .createSignedUrl(attachment.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const grouped = FOLDERS.reduce((acc, f) => {
    const files = attachments.filter(a => a.folder === f.value)
    if (files.length > 0) acc[f.value] = files
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging ? 'border-brand-gold bg-brand-gold/5 scale-[1.01]' : 'border-brand-border hover:border-brand-gold/40 hover:bg-white/5'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
        <Upload size={20} className={`mx-auto mb-2 ${dragging ? 'text-brand-gold' : 'text-brand-muted'}`} />
        <p className="text-white text-sm font-medium">{uploading ? 'Uploading...' : 'Drop file here or click to browse'}</p>
        <p className="text-brand-muted text-xs mt-1">You'll choose where it goes — no general uploads allowed</p>
      </div>

      {error && <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"><AlertCircle size={12} />{error}</div>}

      {/* Existing files grouped by folder */}
      {!loadingFiles && Object.keys(grouped).length > 0 && (
        <div className="space-y-3">
          {Object.entries(grouped).map(([folderKey, files]) => {
            const folderConfig = FOLDERS.find(f => f.value === folderKey)
            return (
              <div key={folderKey}>
                <p className={`text-xs font-semibold mb-1.5 ${folderConfig.color}`}>{folderConfig.label}</p>
                <div className="space-y-1">
                  {files.map(f => (
                    <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 bg-brand-dark rounded-lg border border-brand-border group">
                      <FileIcon mime={f.mime_type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{f.file_name}</p>
                        <p className="text-brand-muted text-xs">{formatBytes(f.file_size)} · {f.uploader?.full_name?.split(' ')[0]}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDownload(f)} className="p-1.5 text-brand-muted hover:text-brand-gold rounded transition-colors" title="Download">
                          <Download size={13} />
                        </button>
                        {(f.uploaded_by === profile?.id || profile?.role === 'admin') && (
                          <button onClick={() => handleDelete(f)} className="p-1.5 text-brand-muted hover:text-red-400 rounded transition-colors" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loadingFiles && attachments.length === 0 && (
        <p className="text-brand-muted text-xs text-center py-2">No files attached yet</p>
      )}

      {/* Confirm modal */}
      {pendingFile && !uploading && (
        <ConfirmDropModal
          file={pendingFile}
          onConfirm={handleConfirmUpload}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </div>
  )
}
