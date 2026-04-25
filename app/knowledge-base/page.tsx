'use client'

import { useState, useEffect } from 'react'

import { knowledgeBaseApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { Loader2, Plus, FileText, Globe, Trash2, Database, UploadCloud } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

  useEffect(() => {
    fetchKbs()
  }, [])

  const fetchKbs = async () => {
    try {
      setLoading(true)
      const res = await knowledgeBaseApi.getAll()
      setKbs(res.data || [])
    } catch (err: any) {
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
    } catch (err: any) {
      toast.error('Failed to delete')
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
    } finally {
      setIsSubmitting(false)
    }
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
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', name || file.name)
      formData.append('description', description)
      formData.append('file', file)
      
      await knowledgeBaseApi.createFromUpload(formData)
      toast.success('File uploaded and added to Knowledge Base!')
      resetAndFetch()
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload file')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetAndFetch = () => {
    setName('')
    setDescription('')
    setContent('')
    setUrl('')
    setFile(null)
    setActiveTab('list')
    fetchKbs()
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Knowledge Base (RAG)</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Give your agents external knowledge to answer specific questions.
            </p>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : kbs.length === 0 ? (
              <div className="col-span-full py-20 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Database className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No knowledge bases yet</h3>
                <p className="text-slate-500 mb-6">Create one to give your agents custom knowledge.</p>
                <Button onClick={() => setActiveTab('new_file')} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" /> Create First KB
                </Button>
              </div>
            ) : (
              kbs.map((kb) => (
                <Card key={kb._id} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                        {kb.sourceType === 'pdf' ? <UploadCloud className="w-5 h-5" /> : 
                         kb.sourceType === 'url' ? <Globe className="w-5 h-5" /> : 
                         <FileText className="w-5 h-5" />}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        kb.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        kb.status === 'processing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {kb.status}
                      </span>
                    </div>
                    <CardTitle className="mt-4">{kb.name}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-10">{kb.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-sm text-slate-500">
                        {kb.totalChunks} chunks
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(kb._id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
                    <Input required type="file" accept=".pdf,.txt" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-2 bg-white/50 dark:bg-slate-800/50" />
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
    </div>
  )
}
