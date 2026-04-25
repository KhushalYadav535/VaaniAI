'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, MessageSquare, Clock, Calendar, Mail, User, Settings, Plus, Trash2, Edit2, Copy } from 'lucide-react'

interface FlowNode {
  id: string
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'end'
  title: string
  description: string
  config: any
  position: { x: number; y: number }
  connections: string[]
}

const nodeTypes = [
  { type: 'trigger', icon: Phone, title: 'Call Trigger', description: 'Start flow when call comes in' },
  { type: 'action', icon: MessageSquare, title: 'Send Message', description: 'Play voice message or text' },
  { type: 'condition', icon: Settings, title: 'Condition', description: 'Check if condition is met' },
  { type: 'delay', icon: Clock, title: 'Delay', description: 'Wait for specified time' },
  { type: 'end', icon: Phone, title: 'End Call', description: 'Terminate the call' },
]

const templates = [
  {
    id: '1',
    name: 'Customer Support Flow',
    description: 'Standard customer service with menu options',
    nodes: 8,
    complexity: 'Medium'
  },
  {
    id: '2',
    name: 'Sales Qualification',
    description: 'Lead qualification and routing',
    nodes: 12,
    complexity: 'High'
  },
  {
    id: '3',
    name: 'Appointment Booking',
    description: 'Schedule appointments with calendar integration',
    nodes: 6,
    complexity: 'Low'
  },
  {
    id: '4',
    name: 'Emergency Response',
    description: 'Urgent call handling with escalation',
    nodes: 10,
    complexity: 'High'
  }
]

import { callFlowsApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'

export default function CallFlowPage() {
  const [activeTab, setActiveTab] = useState('builder')
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [selectedNodeType, setSelectedNodeType] = useState<string>('')
  
  // flow settings
  const [flowId, setFlowId] = useState<string | null>(null)
  const [flowName, setFlowName] = useState('My Call Flow')
  const [flowDescription, setFlowDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  React.useEffect(() => {
    // Load existing flow if needed
    fetchFlows()
  }, [])

  const fetchFlows = async () => {
    try {
      const data: any = await callFlowsApi.getAll()
      if (data?.flows?.length > 0) {
        const flow = data.flows[0]
        setFlowId(flow._id)
        setFlowName(flow.name || 'My Call Flow')
        setFlowDescription(flow.description || '')
        setPriority(flow.priority || 'medium')
        setNodes(flow.nodes || [])
      } else {
        // Init default empty state or use template
        setNodes([
          {
            id: '1',
            type: 'trigger',
            title: 'Incoming Call',
            description: 'Customer calls support line',
            config: { phoneNumber: '+18005550123' },
            position: { x: 100, y: 100 },
            connections: []
          }
        ])
      }
    } catch (e) {
      console.error('Failed to load flows', e)
    }
  }

  const handleSaveFlow = async () => {
    setIsSaving(true)
    try {
      const payload = {
        name: flowName,
        description: flowDescription,
        priority,
        nodes
      }
      
      if (flowId) {
        await callFlowsApi.update(flowId, payload)
        toast({ title: 'Success', description: 'Call flow updated successfully' })
      } else {
        const res: any = await callFlowsApi.create(payload)
        if (res.success) {
          setFlowId(res.flow._id)
          toast({ title: 'Success', description: 'Call flow created successfully' })
        }
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save call flow', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const addNode = (type: string) => {
    const newNode: FlowNode = {
      id: String(Date.now()),
      type: type as FlowNode['type'],
      title: `New ${type}`,
      description: 'Configure this node',
      config: {},
      position: { x: 200, y: 200 },
      connections: []
    }
    setNodes([...nodes, newNode])
    setIsAddingNode(false)
    setSelectedNodeType('')
  }

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(node => node.id !== id))
    setSelectedNode(null)
  }

  const updateNode = (id: string, updates: Partial<FlowNode>) => {
    setNodes(nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ))
  }

  const handleDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    setDraggingNodeId(nodeId)
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setSelectedNode(node)
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return
    const container = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - container.left - dragOffset.x
    const y = e.clientY - container.top - dragOffset.y
    updateNode(draggingNodeId, { position: { x, y } })
  }

  const handleDragEnd = () => {
    setDraggingNodeId(null)
  }

  const getNodeIcon = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.type === type)
    return nodeType?.icon || Settings
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'bg-green-600/20 border-green-600'
      case 'action': return 'bg-blue-600/20 border-blue-600'
      case 'condition': return 'bg-yellow-600/20 border-yellow-600'
      case 'delay': return 'bg-purple-600/20 border-purple-600'
      case 'end': return 'bg-red-600/20 border-red-600'
      default: return 'bg-slate-600/20 border-slate-600'
    }
  }

  const handleUseTemplate = (templateId: string) => {
    let newNodes: FlowNode[] = []
    if (templateId === '1') {
      newNodes = [
        { id: '1', type: 'trigger', title: 'Incoming Call', description: 'Customer calls support', config: {}, position: { x: 200, y: 50 }, connections: ['2'] },
        { id: '2', type: 'action', title: 'Play Menu', description: 'Press 1 for Sales, 2 for Support', config: {}, position: { x: 200, y: 200 }, connections: ['3', '4'] },
        { id: '3', type: 'condition', title: 'If Press 1', description: 'Route to Sales', config: {}, position: { x: 50, y: 350 }, connections: ['5'] },
        { id: '4', type: 'condition', title: 'If Press 2', description: 'Route to Support', config: {}, position: { x: 350, y: 350 }, connections: ['6'] },
        { id: '5', type: 'action', title: 'Transfer to Sales', description: 'Call transfer', config: {}, position: { x: 50, y: 500 }, connections: [] },
        { id: '6', type: 'action', title: 'Transfer to Support', description: 'Call transfer', config: {}, position: { x: 350, y: 500 }, connections: [] },
      ]
    } else {
      newNodes = [
        { id: '1', type: 'trigger', title: 'Web Trigger', description: 'From Website', config: {}, position: { x: 200, y: 100 }, connections: ['2'] },
        { id: '2', type: 'action', title: 'Send Greeting', description: 'Hello, how can I help?', config: {}, position: { x: 200, y: 250 }, connections: ['3'] },
        { id: '3', type: 'end', title: 'End Conversation', description: '', config: {}, position: { x: 200, y: 400 }, connections: [] },
      ]
    }
    setNodes(newNodes)
    setActiveTab('builder')
    toast({ title: 'Template applied', description: 'You can now save or customize this flow.' })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Call Flow Builder</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-light">Design custom call flows for your voice agents.</p>
        </div>

        <div className="flex items-center gap-4">
          <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Node
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-slate-50">Choose Node Type</DialogTitle>
                <DialogDescription className="text-slate-500 dark:text-slate-400 font-light">
                  Select the type of node to add to your flow
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3">
                {nodeTypes.map((nodeType) => (
                  <div
                    key={nodeType.type}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedNodeType === nodeType.type
                        ? 'border-purple-500 dark:border-purple-600 bg-purple-500/10 dark:bg-purple-600/10'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      setSelectedNodeType(nodeType.type)
                      addNode(nodeType.type)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <nodeType.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-50">{nodeType.title}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-light">{nodeType.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-light">
            <Copy className="w-4 h-4 mr-2" />
            Duplicate Flow
          </Button>

          <Button onClick={handleSaveFlow} disabled={isSaving} variant="outline" className="border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-light">
            {isSaving ? 'Saving...' : 'Save Flow'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl p-1 rounded-2xl h-auto">
          <TabsTrigger value="builder" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-400 rounded-xl py-2 px-6 font-light transition-all">Flow Builder</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-400 rounded-xl py-2 px-6 font-light transition-all">Templates</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-50 text-slate-600 dark:text-slate-400 rounded-xl py-2 px-6 font-light transition-all">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Flow Canvas */}
            <div className="lg:col-span-3">
              <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300 h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-50">Flow Canvas</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
                    Drag and drop nodes to build your call flow
                  </CardDescription>
                </CardHeader>
                <CardContent 
                  className="relative flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl m-6 mt-0 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-inner"
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                >
                  {/* Grid Background */}
                  <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
                    <div className="h-full w-full" style={{
                      backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                      color: 'var(--grid-color)',
                    }}></div>
                  </div>

                  {/* Nodes */}
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      className={`absolute p-4 rounded-lg border-2 cursor-move transition-shadow ${getNodeColor(node.type)} ${
                        draggingNodeId === node.id ? 'z-50 shadow-xl opacity-90' : 'z-10'
                      } ${selectedNode?.id === node.id ? 'ring-2 ring-purple-500' : ''}`}
                      style={{
                        left: `${node.position.x}px`,
                        top: `${node.position.y}px`,
                        minWidth: '200px'
                      }}
                      onMouseDown={(e) => handleDragStart(e, node.id)}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedNode(node)
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {React.createElement(getNodeIcon(node.type), {
                            className: 'w-4 h-4 text-purple-400'
                          })}
                          <span className="font-medium text-slate-50 text-sm">{node.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-slate-400 hover:text-slate-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Edit node
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNode(node.id)
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400">{node.description}</p>
                      
                      {/* Connection Points */}
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-600 rounded-full border-2 border-slate-800"></div>
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-600 rounded-full border-2 border-slate-800"></div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {nodes.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Phone className="w-12 h-12 text-slate-600 mb-4" />
                      <p className="text-slate-400">No nodes added yet</p>
                      <p className="text-sm text-slate-500">Click "Add Node" to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Node Configuration */}
            <div className="lg:col-span-1">
              <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-50">Node Configuration</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
                    {selectedNode ? 'Configure selected node' : 'Select a node to configure'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedNode ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-700 dark:text-slate-200 font-light">Node Title</Label>
                        <Input
                          value={selectedNode.title}
                          onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })}
                          className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 focus:border-purple-500 dark:focus:border-purple-600 rounded-xl font-light"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-slate-700 dark:text-slate-200 font-light">Description</Label>
                        <Textarea
                          value={selectedNode.description}
                          onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                          className="mt-2 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 focus:border-purple-500 dark:focus:border-purple-600 rounded-xl font-light resize-none"
                          rows={3}
                        />
                      </div>

                      {selectedNode.type === 'action' && (
                        <div>
                          <Label className="text-slate-700 dark:text-slate-200 font-light">Message</Label>
                          <Textarea
                            placeholder="Enter the message to play..."
                            className="mt-2 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 focus:border-purple-500 dark:focus:border-purple-600 rounded-xl font-light resize-none"
                            rows={4}
                          />
                        </div>
                      )}

                      {selectedNode.type === 'condition' && (
                        <div>
                          <Label className="text-slate-700 dark:text-slate-200 font-light">Condition</Label>
                          <Select>
                            <SelectTrigger className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 rounded-xl font-light">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                              <SelectItem value="pressed-1">User pressed 1</SelectItem>
                              <SelectItem value="pressed-2">User pressed 2</SelectItem>
                              <SelectItem value="time-business">Business hours</SelectItem>
                              <SelectItem value="emergency">Emergency detected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedNode.type === 'delay' && (
                        <div>
                          <Label className="text-slate-700 dark:text-slate-200 font-light">Delay Duration</Label>
                          <Input
                            type="number"
                            placeholder="Seconds"
                            className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 focus:border-purple-500 dark:focus:border-purple-600 rounded-xl font-light"
                          />
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                        <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Connections</h4>
                        {selectedNode.connections.length > 0 ? (
                          <div className="space-y-2">
                            {selectedNode.connections.map((connId) => (
                              <div key={connId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                                <span className="text-sm text-slate-600 dark:text-slate-300 font-light">Connected to Node {connId}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">No connections</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Settings className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Select a node to configure</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-50">Flow Templates</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
                Start with pre-built call flow templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="p-5 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md dark:hover:border-slate-600 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-50">{template.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-light">{template.description}</p>
                      </div>
                      <Badge variant={
                        template.complexity === 'Low' ? 'default' :
                        template.complexity === 'Medium' ? 'secondary' : 'destructive'
                      } className="font-normal">
                        {template.complexity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-light">{template.nodes} nodes</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl font-light">
                          Preview
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md rounded-xl font-light"
                          onClick={() => handleUseTemplate(template.id)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-50">Flow Settings</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 font-light">
                Global settings for this call flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-slate-700 dark:text-slate-200 font-light">Flow Name</Label>
                <Input
                  placeholder="Customer Support Flow"
                  className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 focus:border-purple-500 dark:focus:border-purple-600 rounded-xl font-light"
                />
              </div>
              
              <div>
                <Label className="text-slate-700 dark:text-slate-200 font-light">Description</Label>
                <Textarea
                  placeholder="Describe what this flow does..."
                  className="mt-2 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 focus:border-purple-500 dark:focus:border-purple-600 rounded-xl font-light resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-slate-700 dark:text-slate-200 font-light">Assigned Agent</Label>
                  <Select>
                    <SelectTrigger className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 rounded-xl font-light">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                      <SelectItem value="1">Customer Support Bot</SelectItem>
                      <SelectItem value="2">Sales Assistant</SelectItem>
                      <SelectItem value="3">Technical Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-700 dark:text-slate-200 font-light">Priority</Label>
                  <Select>
                    <SelectTrigger className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 rounded-xl font-light">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-xl">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-200 font-light">Tags</Label>
                <Input
                  placeholder="support, customer-service, priority"
                  className="mt-2 h-11 bg-white/50 dark:bg-slate-800/50 border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-slate-50 focus:border-purple-500 dark:focus:border-purple-600 rounded-xl font-light"
                />
              </div>

              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3">Advanced Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-light">Enable call recording</span>
                    <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 w-4 h-4 text-purple-600 focus:ring-purple-500" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-light">Allow call transfer</span>
                    <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 w-4 h-4 text-purple-600 focus:ring-purple-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-light">Enable analytics</span>
                    <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 w-4 h-4 text-purple-600 focus:ring-purple-500" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
