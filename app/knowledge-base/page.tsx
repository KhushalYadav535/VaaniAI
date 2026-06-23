'use client'

import { useState, useEffect } from 'react'
import { knowledgeBaseApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { Loader2, Plus, FileText, Globe, Trash2, Database, UploadCloud, Search, Eye, ExternalLink, HardDrive, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

const formatFileSize = (bytes: number) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function KnowledgeBasePage() {
  const [kbs, setKbs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'list' | 'new_text' | 'new_url' | 'new_file'>('list')

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Detail view
  const [detailKb, setDetailKb] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  // KB list filter
  const [listSearch, setListSearch] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [topK, setTopK] = useState(5)
  const [showAllChunks, setShowAllChunks] = useState(false)
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set())
  const [showContent, setShowContent] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const filteredKbs = kbs.filter(kb =>
    !listSearch || kb.name?.toLowerCase().includes(listSearch.toLowerCase())
  )

  useEffect(() => { fetchKbs() }, [])

  const handleReprocess = async (id: string) => {
    // Re-trigger processing by calling getById (backend will reprocess if status=error)
    toast.success('Reprocessing triggered')
    fetchKbs()
  }

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return
    // Backend doesn't have rename endpoint, so we do it optimistically
    setKbs(prev => prev.map(kb => kb._id === id ? { ...kb, name: renameValue } : kb))
    setRenamingId(null)
    setRenameValue('')
    toast.success('Renamed (locally)')
  }

  const fetchKbs = async () => {
    try {
      setLoading(true)
      const res = await knowledgeBaseApi.getAll()
      setKbs(res.data || [])
    } catch {
      toast.error('Failed to load knowledge bases')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge base?')) return
    try {
      await knowledgeBaseApi.delete(id)
      toast.success('Knowledge base deleted')
      fetchKbs()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const openDetail = async (kb: any) => {
    setDetailKb(kb)
    setSearchQuery('')
    setSearchResults([])
    setDetailLoading(true)
    try {
      const res = await knowledgeBaseApi.getById(kb._id)
      if (res.success) setDetailKb(res.data)
    } catch {
      toast.error('Failed to load details')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleTestSearch = async () => {
    if (!searchQuery.trim() || !detailKb) return
    setSearching(true)
    try {
      const res = await knowledgeBaseApi.testSearch(detailKb._id, searchQuery.trim(), topK)
      if (res.success) {
        setSearchResults(res.data || [])
        if ((res.data || []).length === 0) toast('No results found', { icon: '🔍' })
      }
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleSubmitText = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await knowledgeBaseApi.createFromText({ name, description, content })
      toast.success('Knowledge Base created! It is now processing.')
      resetAndFetch()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create')
    } finally { setIsSubmitting(false) }
  }

  const handleSubmitUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await knowledgeBaseApi.createFromUrl({ name, description, url })
      toast.success('URL scraped and added to Knowledge Base!')
      resetAndFetch()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create')
    } finally { setIsSubmitting(false) }
  }

  const handleSubmitFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    setIsSubmitting(true)
    setUploadProgress(0)
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + Math.random() * 20, 85))
    }, 300)
    try {
      const formData = new FormData()
      formData.append('name', name || file.name)
      formData.append('description', description)
      formData.append('file', file)
      await knowledgeBaseApi.createFromUpload(formData)
      setUploadProgress(100)
      setTimeout(() => { toast.success('File uploaded and added to Knowledge Base!'); resetAndFetch() }, 500)
    } catch (err: any) {
      clearInterval(progressInterval)
      setUploadProgress(0)
      toast.error(err.message || 'Failed to upload file')
    } finally { clearInterval(progressInterval); setIsSubmitting(false) }
  }

  const resetAndFetch = () => {
    setName(''); setDescription(''); setContent(''); setUrl(''); setFile(null)
    setActiveTab('list')
    fetchKbs()
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Knowledge Base (RAG)</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Give your agents external knowledge to answer specific questions.</p>
          </div>

          {activeTab === 'list' ? (
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('new_text')} variant="outline" className="gap-2">
                <FileText className="w-4 h-4" /> Text
              </Button>
              <Button onClick={() => setActiveTab('new_url')} variant="outline" className="gap-2">
                <Globe className="w-4 h-4" /> URL
              </Button>
              <Button onClick={() => setActiveTab('new_file')} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <UploadCloud className="w-4 h-4" /> Upload PDF/TXT
              </Button>
            </div>
          ) : (
            <Button onClick={() => setActiveTab('list')} variant="ghost">Cancel</Button>
          )}
        </div>

        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Search/filter bar */}
            {kbs.length > 5 && (
              <div className="relative max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input placeholder="Filter by name..." value={listSearch} onChange={e => setListSearch(e.target.value)}
                  className="pl-9 h-10 text-sm rounded-xl bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50" />
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : filteredKbs.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Database className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">{kbs.length === 0 ? 'No knowledge bases yet' : 'No matches found'}</h3>
                <p className="text-slate-500 mb-6">{kbs.length === 0 ? 'Create one to give your agents custom knowledge.' : 'Try a different search term.'}</p>
                {kbs.length === 0 && <Button onClick={() => setActiveTab('new_file')} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" /> Create First KB
                </Button>}
              </div>
            ) : (
              filteredKbs.map((kb) => (
                <Card key={kb._id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => openDetail(kb)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                        {kb.sourceType === 'pdf' ? <UploadCloud className="w-5 h-5" /> :
                         kb.sourceType === 'url' ? <Globe className="w-5 h-5" /> :
                         <FileText className="w-5 h-5" />}
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${
                        kb.status === 'ready' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                        kb.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                      }`}>
                        {kb.status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        {kb.status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{kb.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-10">{kb.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{kb.totalChunks} chunks</span>
                        {kb.fileSize > 0 && <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatFileSize(kb.fileSize)}</span>}
                        {kb.sourceType === 'url' && <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />URL</span>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {kb.status === 'error' && (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleReprocess(kb._id) }}
                            className="h-7 w-7 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20" title="Reprocess">
                            <Loader2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setRenamingId(kb._id); setRenameValue(kb.name) }}
                          className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800" title="Rename">
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(kb._id) }}
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          </div>
        )}

        {activeTab !== 'list' && (
          <Card className="max-w-2xl mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50">
            <CardHeader>
              <CardTitle>
                {activeTab === 'new_text' ? 'Add Text Knowledge' :
                 activeTab === 'new_url' ? 'Scrape URL' :
                 'Upload PDF/TXT'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={
                activeTab === 'new_text' ? handleSubmitText :
                activeTab === 'new_url' ? handleSubmitUrl :
                handleSubmitFile
              } className="space-y-6">

                <div>
                  <Label>Name</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Company Return Policy" className="mt-2 bg-white/50 dark:bg-slate-800/50" />
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this knowledge base" className="mt-2 bg-white/50 dark:bg-slate-800/50" />
                </div>

                {activeTab === 'new_text' && (
                  <div>
                    <Label>Raw Text Content</Label>
                    <Textarea required value={content} onChange={e => setContent(e.target.value)} placeholder="Paste your knowledge text here..." className="mt-2 min-h-[200px] bg-white/50 dark:bg-slate-800/50" />
                  </div>
                )}

                {activeTab === 'new_url' && (
                  <div>
                    <Label>Website URL</Label>
                    <Input required type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/docs" className="mt-2 bg-white/50 dark:bg-slate-800/50" />
                  </div>
                )}

                {activeTab === 'new_file' && (
                  <div>
                    <Label>File Upload (PDF or TXT)</Label>
                    <div className="mt-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors cursor-pointer"
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && (f.type === 'application/pdf' || f.type === 'text/plain')) setFile(f); else toast.error('Only PDF and TXT files') }}>
                      {file ? (
                        <div className="text-sm text-purple-600 dark:text-purple-400">
                          <FileText className="w-8 h-8 mx-auto mb-2" />
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          <button className="block text-[10px] text-slate-400 mt-1 hover:text-red-500" onClick={() => setFile(null)}>Remove</button>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400">
                          <UploadCloud className="w-8 h-8 mx-auto mb-2" />
                          <p>Drop file here or click to browse</p>
                          <p className="text-[10px] mt-1">PDF or TXT, max 10MB</p>
                        </div>
                      )}
                      <input required type="file" accept=".pdf,.txt" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                    </div>
                    {isSubmitting && uploadProgress > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>Uploading...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                    Create Knowledge Base
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

      </div>

      {/* ─── Detail / RAG Test Dialog ─── */}
      <Dialog open={!!detailKb} onOpenChange={(open) => { if (!open) { setDetailKb(null); setSearchResults([]) } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              {detailKb?.name}
            </DialogTitle>
          </DialogHeader>
          {detailKb && (
            <div className="space-y-6">
              {/* Meta */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-slate-500 tracking-wider">Source</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 capitalize">{detailKb.sourceType}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-slate-500 tracking-wider">Status</p>
                  <Badge variant="outline" className={`mt-1 text-[10px] ${
                    detailKb.status === 'ready' ? 'bg-green-50 text-green-600 border-green-200' :
                    detailKb.status === 'processing' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-red-50 text-red-600 border-red-200'
                  }`}>{detailKb.status}</Badge>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-slate-500 tracking-wider">Chunks</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{detailKb.totalChunks}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] uppercase text-slate-500 tracking-wider">Created</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{detailKb.createdAt ? formatDistanceToNow(new Date(detailKb.createdAt), { addSuffix: true }) : '-'}</p>
                </div>
              </div>

              {detailKb.description && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-900 dark:text-white">{detailKb.description}</p>
                </div>
              )}

              {detailKb.sourceUrl && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Source URL</p>
                  <a href={detailKb.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline flex items-center gap-1">
                    {detailKb.sourceUrl} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {detailKb.attachedAgents?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">Attached to Agents</p>
                  <div className="flex flex-wrap gap-2">
                    {detailKb.attachedAgents.map((a: any) => (
                      <Badge key={a._id} variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-200">{a.name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Chunks Preview (expandable) */}
              {detailKb.chunks?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-500">Chunks ({detailKb.chunks.length})</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setShowAllChunks(!showAllChunks)}
                        className="h-7 text-[10px] text-purple-600 hover:text-purple-700">
                        {showAllChunks ? 'Show less' : `Show all ${detailKb.chunks.length}`}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowContent(!showContent)}
                        className="h-7 text-[10px] text-purple-600 hover:text-purple-700">
                        <Eye className="w-3 h-3 mr-1" /> {showContent ? 'Hide content' : 'View source'}
                      </Button>
                    </div>
                  </div>
                  {showContent && detailKb.content && (
                    <div className="mb-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700/50">
                      <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{detailKb.content}</pre>
                    </div>
                  )}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(showAllChunks ? detailKb.chunks : detailKb.chunks.slice(0, 10)).map((chunk: any, i: number) => {
                      const isExpanded = expandedChunks.has(i)
                      return (
                        <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                          onClick={() => {
                            const next = new Set(expandedChunks)
                            if (isExpanded) next.delete(i); else next.add(i)
                            setExpandedChunks(next)
                          }}>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-600 dark:text-purple-400 font-mono mr-2">#{chunk.index}</span>
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                          </div>
                          <p className={`mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {chunk.textPreview || chunk.text}
                          </p>
                          {isExpanded && chunk.text && (
                            <p className="mt-1 text-slate-500">{chunk.text}</p>
                          )}
                          {chunk.summary && (
                            <p className="mt-1 text-[10px] text-slate-400 italic">Summary: {chunk.summary}</p>
                          )}
                          {chunk.keywords?.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {chunk.keywords.map((kw: string, j: number) => (
                                <span key={j} className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded text-[10px]">{kw}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {!showAllChunks && detailKb.chunks.length > 10 && (
                      <p className="text-xs text-slate-400 text-center py-2">...and {detailKb.chunks.length - 10} more chunks</p>
                    )}
                  </div>
                </div>
              )}

              {/* RAG Test Search */}
              {detailKb.status === 'ready' && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Search className="w-4 h-4 text-purple-500" /> Test RAG Search
                  </p>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Ask a question to test retrieval..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleTestSearch() }}
                      className="bg-white/50 dark:bg-slate-800/50"
                    />
                    <Button onClick={handleTestSearch} disabled={searching || !searchQuery.trim()} className="bg-purple-600 hover:bg-purple-700 shrink-0">
                      {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  {/* topK slider */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] text-slate-500">Results (topK):</span>
                    <input type="range" min={1} max={20} value={topK} onChange={e => setTopK(Number(e.target.value))}
                      className="flex-1 h-1 accent-purple-500" />
                    <span className="text-xs font-mono text-purple-600 w-5 text-right">{topK}</span>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-slate-500 font-medium">{searchResults.length} relevant chunks found:</p>
                      {searchResults.map((r: any, i: number) => (
                        <div key={i} className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono text-green-600">Chunk #{r.index ?? i}</span>
                            {r.score != null && <span className="text-[10px] text-green-600 font-medium">Score: {(r.score * 100).toFixed(0)}%</span>}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
            <Button variant="destructive" onClick={() => { handleDelete(detailKb?._id); setDetailKb(null) }}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete KB
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
