'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  ReactFlowProvider,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';


import { callFlowsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, Play, MessageSquare, Mic, HelpCircle, Phone, ArrowRightCircle } from 'lucide-react';

// --- CUSTOM NODES ---

const nodeStyle = "px-4 py-3 shadow-lg rounded-xl border-2 bg-white dark:bg-slate-900 min-w-[200px]";

const TriggerNode = ({ data }: NodeProps) => (
  <div className={`${nodeStyle} border-green-500 relative`}>
    <div className="flex items-center gap-2 mb-2 font-bold text-green-600">
      <Play className="w-4 h-4" /> Start Call
    </div>
    <div className="text-xs text-slate-500">{data.label || 'Entry Point'}</div>
    <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900" />
  </div>
);

const SpeakNode = ({ data, selected }: NodeProps) => (
  <div className={`${nodeStyle} ${selected ? 'border-purple-500' : 'border-purple-200'} transition-colors relative`}>
    <Handle type="target" position={Position.Top} className="w-4 h-4 border-2 border-white dark:border-slate-900" />
    <div className="flex items-center gap-2 mb-2 font-bold text-purple-600">
      <MessageSquare className="w-4 h-4" /> Speak
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 italic">"{data.text || '...'}"</div>
    <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-purple-500 border-2 border-white dark:border-slate-900" />
  </div>
);

const GatherNode = ({ data, selected }: NodeProps) => (
  <div className={`${nodeStyle} ${selected ? 'border-amber-500' : 'border-amber-200'} relative`}>
    <Handle type="target" position={Position.Top} className="w-4 h-4 border-2 border-white dark:border-slate-900" />
    <div className="flex items-center gap-2 mb-2 font-bold text-amber-600">
      <Mic className="w-4 h-4" /> Gather Input
    </div>
    <div className="text-xs font-semibold mb-1">Variable: {data.variable || '?'}</div>
    <div className="text-xs text-slate-500 line-clamp-2">Prompt: {data.prompt || '...'}</div>
    <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-amber-500 border-2 border-white dark:border-slate-900" />
  </div>
);

const ConditionNode = ({ data, selected }: NodeProps) => (
  <div className={`${nodeStyle} ${selected ? 'border-blue-500' : 'border-blue-200'} relative`}>
    <Handle type="target" position={Position.Top} className="w-4 h-4 border-2 border-white dark:border-slate-900" />
    <div className="flex items-center gap-2 mb-2 font-bold text-blue-600">
      <HelpCircle className="w-4 h-4" /> Condition
    </div>
    <div className="text-xs text-slate-600 text-center font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded mb-4">
      {data.variable || '?'} {data.operator || '=='} {data.value || '?'}
    </div>
    <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} className="w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900" />
    <div className="absolute -bottom-6 left-[30%] -translate-x-1/2 text-[10px] font-bold text-green-600">True</div>
    <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} className="w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900" />
    <div className="absolute -bottom-6 left-[70%] -translate-x-1/2 text-[10px] font-bold text-red-600">False</div>
  </div>
);

const TransferNode = ({ data, selected }: NodeProps) => (
  <div className={`${nodeStyle} ${selected ? 'border-pink-500' : 'border-pink-200'} relative`}>
    <Handle type="target" position={Position.Top} className="w-4 h-4 border-2 border-white dark:border-slate-900" />
    <div className="flex items-center gap-2 mb-2 font-bold text-pink-600">
      <Phone className="w-4 h-4" /> Transfer Call
    </div>
    <div className="text-xs text-slate-500">To: {data.transferTo || 'Agent'}</div>
  </div>
);

const EndNode = ({ data, selected }: NodeProps) => (
  <div className={`${nodeStyle} ${selected ? 'border-red-500' : 'border-red-200'} relative`}>
    <Handle type="target" position={Position.Top} className="w-4 h-4 border-2 border-white dark:border-slate-900" />
    <div className="flex items-center gap-2 mb-2 font-bold text-red-600">
      <ArrowRightCircle className="w-4 h-4" /> End Call
    </div>
  </div>
);

const nodeTypes = {
  trigger: TriggerNode,
  speak: SpeakNode,
  gather: GatherNode,
  condition: ConditionNode,
  transfer: TransferNode,
  end: EndNode,
};

let idCounter = 0;
const getId = () => `node_${Date.now()}_${idCounter++}`;

function FlowEditor() {
  const router = useRouter();
  const params = useParams();
  const flowId = params.id as string;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowData, setFlowData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Selected node for the properties panel
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    fetchFlow();
  }, [flowId]);

  const fetchFlow = async () => {
    try {
      const res = await callFlowsApi.getById(flowId);
      if (res.flow) {
        setFlowData(res.flow);
        setNodes(res.flow.nodes || []);
        setEdges(res.flow.edges || []);
      }
    } catch (err) {
      toast.error('Failed to load flow');
      router.push('/call-flows');
    }
  };

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onSave = async () => {
    setIsSaving(true);
    try {
      await callFlowsApi.update(flowId, {
        name: flowData.name,
        description: flowData.description,
        nodes: nodes,
        edges: edges,
      });
      toast.success('Workflow saved!');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const addNode = (type: string) => {
    const newNode = {
      id: getId(),
      type,
      position: { x: 250, y: nodes.length * 100 + 100 },
      data: getDefaultDataForType(type),
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const getDefaultDataForType = (type: string) => {
    switch (type) {
      case 'speak': return { text: 'Hello, how can I help?' };
      case 'gather': return { prompt: 'Please say your account number.', variable: 'account_number', expectedType: 'text' };
      case 'condition': return { variable: 'account_number', operator: 'exists', value: '' };
      case 'transfer': return { transferTo: '+1234567890', reason: 'User requested human' };
      case 'end': return { message: 'Goodbye!' };
      default: return {};
    }
  };

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const newData = { ...node.data, [key]: value };
          setSelectedNode({ ...node, data: newData });
          return { ...node, data: newData };
        }
        return node;
      })
    );
  };

  return (
    <div className="p-6">
      <div className="h-[calc(100vh-6rem)] flex flex-col bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header bar */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/call-flows')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <Input 
                value={flowData?.name || ''} 
                onChange={e => setFlowData({...flowData, name: e.target.value})}
                className="h-8 font-bold text-lg bg-transparent border-transparent hover:border-slate-200 focus:border-purple-500 px-2"
              />
            </div>
          </div>
          <Button onClick={onSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Flow'}
          </Button>
        </div>

        <div className="flex-1 flex flex-row overflow-hidden relative">
          
          {/* Left Sidebar - Nodes Palette */}
          <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-3 overflow-y-auto z-10 shadow-lg">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500 mb-2">Drag or Click to Add</h3>
            <Button variant="outline" className="justify-start gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700" onClick={() => addNode('speak')}>
              <MessageSquare className="w-4 h-4" /> AI Speak
            </Button>
            <Button variant="outline" className="justify-start gap-2 border-amber-200 hover:bg-amber-50 hover:text-amber-700" onClick={() => addNode('gather')}>
              <Mic className="w-4 h-4" /> Gather Input
            </Button>
            <Button variant="outline" className="justify-start gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-700" onClick={() => addNode('condition')}>
              <HelpCircle className="w-4 h-4" /> Condition
            </Button>
            <Button variant="outline" className="justify-start gap-2 border-pink-200 hover:bg-pink-50 hover:text-pink-700" onClick={() => addNode('transfer')}>
              <Phone className="w-4 h-4" /> Transfer Call
            </Button>
            <Button variant="outline" className="justify-start gap-2 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => addNode('end')}>
              <ArrowRightCircle className="w-4 h-4" /> End Call
            </Button>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 h-full relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={(e, node) => setSelectedNode(node)}
              onPaneClick={() => setSelectedNode(null)}
              fitView
              className="bg-slate-50/50 dark:bg-slate-950/50"
            >
              <Background color="#ccc" gap={16} />
              <Controls className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg shadow-xl" />
              <MiniMap className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden" zoomable pannable />
            </ReactFlow>
          </div>

          {/* Right Sidebar - Properties Panel */}
          {selectedNode && (
            <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col overflow-y-auto z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] absolute right-0 h-full animate-in slide-in-from-right-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 capitalize flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  {selectedNode.type} Node
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)} className="h-6 w-6">
                  <ArrowRightCircle className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-5">
                {selectedNode.type === 'speak' && (
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Text to Speak</Label>
                    <Textarea 
                      value={selectedNode.data.text} 
                      onChange={(e) => updateNodeData('text', e.target.value)} 
                      className="mt-2 min-h-32"
                      placeholder="Hi, what can I do for you?"
                    />
                    <p className="text-[10px] text-slate-400 mt-2">Use {{variable}} to inject dynamic data.</p>
                  </div>
                )}

                {selectedNode.type === 'gather' && (
                  <>
                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Prompt (AI asks)</Label>
                      <Textarea 
                        value={selectedNode.data.prompt} 
                        onChange={(e) => updateNodeData('prompt', e.target.value)} 
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Save answer as Variable</Label>
                      <Input 
                        value={selectedNode.data.variable} 
                        onChange={(e) => updateNodeData('variable', e.target.value)} 
                        className="mt-2 font-mono text-sm"
                        placeholder="e.g. user_intent"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Expected Type</Label>
                      <Select value={selectedNode.data.expectedType || 'text'} onValueChange={(v) => updateNodeData('expectedType', v)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Free Text</SelectItem>
                          <SelectItem value="boolean">Yes/No (Boolean)</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {selectedNode.type === 'condition' && (
                  <>
                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Variable to Test</Label>
                      <Input 
                        value={selectedNode.data.variable} 
                        onChange={(e) => updateNodeData('variable', e.target.value)} 
                        className="mt-2 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Operator</Label>
                      <Select value={selectedNode.data.operator || 'equals'} onValueChange={(v) => updateNodeData('operator', v)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals (==)</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="exists">Exists (not null)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedNode.data.operator !== 'exists' && (
                      <div>
                        <Label className="text-xs text-slate-500 uppercase tracking-wider">Value</Label>
                        <Input 
                          value={selectedNode.data.value} 
                          onChange={(e) => updateNodeData('value', e.target.value)} 
                          className="mt-2"
                        />
                      </div>
                    )}
                  </>
                )}

                {selectedNode.type === 'transfer' && (
                  <>
                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Transfer To (Phone Number)</Label>
                      <Input 
                        value={selectedNode.data.transferTo} 
                        onChange={(e) => updateNodeData('transferTo', e.target.value)} 
                        className="mt-2"
                        placeholder="+1234567890"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 uppercase tracking-wider">Internal Reason</Label>
                      <Input 
                        value={selectedNode.data.reason} 
                        onChange={(e) => updateNodeData('reason', e.target.value)} 
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
                
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <Button variant="destructive" className="w-full" onClick={() => {
                    setNodes(nodes.filter(n => n.id !== selectedNode.id));
                    setSelectedNode(null);
                  }}>
                    Delete Node
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CallFlowEditorWrapper() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}
