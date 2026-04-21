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

export default function CallFlowPage() {
  const [nodes, setNodes] = useState<FlowNode[]>([
    {
      id: '1',
      type: 'trigger',
      title: 'Incoming Call',
      description: 'Customer calls support line',
      config: { phoneNumber: '+18005550123' },
      position: { x: 100, y: 100 },
      connections: ['2']
    },
    {
      id: '2',
      type: 'action',
      title: 'Welcome Message',
      description: 'Play greeting and menu options',
      config: { message: 'Thank you for calling. Press 1 for sales, 2 for support.' },
      position: { x: 300, y: 100 },
      connections: ['3', '4']
    }
  ])
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [selectedNodeType, setSelectedNodeType] = useState<string>('')

  const addNode = (type: string) => {
    const newNode: FlowNode = {
      id: String(nodes.length + 1),
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Call Flow Builder</h1>
          <p className="text-slate-400 mt-2">Design custom call flows for your voice agents.</p>
        </div>

        <div className="flex items-center gap-4">
          <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Node
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-slate-50">Choose Node Type</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Select the type of node to add to your flow
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3">
                {nodeTypes.map((nodeType) => (
                  <div
                    key={nodeType.type}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedNodeType === nodeType.type
                        ? 'border-purple-600 bg-purple-600/10'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                    onClick={() => {
                      setSelectedNodeType(nodeType.type)
                      addNode(nodeType.type)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <nodeType.icon className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-slate-50">{nodeType.title}</p>
                        <p className="text-sm text-slate-400">{nodeType.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="border-slate-700 text-slate-300">
            <Copy className="w-4 h-4 mr-2" />
            Duplicate Flow
          </Button>

          <Button variant="outline" className="border-slate-700 text-slate-300">
            Save Flow
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="space-y-6">
        <TabsList className="bg-slate-900 border-slate-800">
          <TabsTrigger value="builder" className="data-[state=active]:bg-slate-800">Flow Builder</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-slate-800">Templates</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-slate-800">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Flow Canvas */}
            <div className="lg:col-span-3">
              <Card className="bg-slate-900 border-slate-800 h-[600px]">
                <CardHeader>
                  <CardTitle className="text-slate-50">Flow Canvas</CardTitle>
                  <CardDescription className="text-slate-400">
                    Drag and drop nodes to build your call flow
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative h-[500px] bg-slate-800 rounded-lg overflow-hidden">
                  {/* Grid Background */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="h-full w-full" style={{
                      backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>

                  {/* Nodes */}
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      className={`absolute p-4 rounded-lg border-2 cursor-move transition-all ${getNodeColor(node.type)}`}
                      style={{
                        left: `${node.position.x}px`,
                        top: `${node.position.y}px`,
                        minWidth: '200px'
                      }}
                      onClick={() => setSelectedNode(node)}
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
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-slate-50">Node Configuration</CardTitle>
                  <CardDescription className="text-slate-400">
                    {selectedNode ? 'Configure selected node' : 'Select a node to configure'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedNode ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-200">Node Title</Label>
                        <Input
                          value={selectedNode.title}
                          onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })}
                          className="mt-2 bg-slate-800 border-slate-700 text-slate-50"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-slate-200">Description</Label>
                        <Textarea
                          value={selectedNode.description}
                          onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
                          className="mt-2 bg-slate-800 border-slate-700 text-slate-50"
                          rows={3}
                        />
                      </div>

                      {selectedNode.type === 'action' && (
                        <div>
                          <Label className="text-slate-200">Message</Label>
                          <Textarea
                            placeholder="Enter the message to play..."
                            className="mt-2 bg-slate-800 border-slate-700 text-slate-50"
                            rows={4}
                          />
                        </div>
                      )}

                      {selectedNode.type === 'condition' && (
                        <div>
                          <Label className="text-slate-200">Condition</Label>
                          <Select>
                            <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800">
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
                          <Label className="text-slate-200">Delay Duration</Label>
                          <Input
                            type="number"
                            placeholder="Seconds"
                            className="mt-2 bg-slate-800 border-slate-700 text-slate-50"
                          />
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-700">
                        <h4 className="font-medium text-slate-50 mb-2">Connections</h4>
                        {selectedNode.connections.length > 0 ? (
                          <div className="space-y-2">
                            {selectedNode.connections.map((connId) => (
                              <div key={connId} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                                <span className="text-sm text-slate-300">Connected to Node {connId}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">No connections</p>
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
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Flow Templates</CardTitle>
              <CardDescription className="text-slate-400">
                Start with pre-built call flow templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-slate-50">{template.name}</h3>
                        <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                      </div>
                      <Badge variant={
                        template.complexity === 'Low' ? 'default' :
                        template.complexity === 'Medium' ? 'secondary' : 'destructive'
                      }>
                        {template.complexity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{template.nodes} nodes</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                          Preview
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
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
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Flow Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Global settings for this call flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-200">Flow Name</Label>
                <Input
                  placeholder="Customer Support Flow"
                  className="mt-2 bg-slate-800 border-slate-700 text-slate-50"
                />
              </div>
              
              <div>
                <Label className="text-slate-200">Description</Label>
                <Textarea
                  placeholder="Describe what this flow does..."
                  className="mt-2 bg-slate-800 border-slate-700 text-slate-50"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-200">Assigned Agent</Label>
                  <Select>
                    <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="1">Customer Support Bot</SelectItem>
                      <SelectItem value="2">Sales Assistant</SelectItem>
                      <SelectItem value="3">Technical Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-200">Priority</Label>
                  <Select>
                    <SelectTrigger className="mt-2 bg-slate-800 border-slate-700 text-slate-50">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-slate-200">Tags</Label>
                <Input
                  placeholder="support, customer-service, priority"
                  className="mt-2 bg-slate-800 border-slate-700 text-slate-50"
                />
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h4 className="font-medium text-slate-50 mb-3">Advanced Options</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Enable call recording</span>
                    <input type="checkbox" className="rounded border-slate-600" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Allow call transfer</span>
                    <input type="checkbox" className="rounded border-slate-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Enable analytics</span>
                    <input type="checkbox" className="rounded border-slate-600" defaultChecked />
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
