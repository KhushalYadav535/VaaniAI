'use client'

import React, { useState, useCallback, useEffect, useRef, DragEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Handle,
  Position,
  NodeProps,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { callFlowsApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import {
  Save, ArrowLeft, Play, MessageSquare, Mic, HelpCircle, Phone, ArrowRightCircle,
  Webhook, Clock, Variable, Trash2, X, ChevronRight, Zap, Network,
  Search, GripVertical, Copy, Keyboard,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   NODE CONFIG — defines all available node types with their metadata
   ═══════════════════════════════════════════════════════════════════ */

const NODE_CATALOG = {
  conversation: [
    { type: 'speak',    label: 'AI Speak',       icon: MessageSquare, color: '#8b5cf6', desc: 'Agent says something' },
    { type: 'gather',   label: 'Gather Input',   icon: Mic,           color: '#f59e0b', desc: 'Listen & capture user input' },
  ],
  logic: [
    { type: 'condition', label: 'Condition',      icon: HelpCircle,    color: '#3b82f6', desc: 'Branch on a variable' },
    { type: 'setvar',    label: 'Set Variable',   icon: Variable,      color: '#06b6d4', desc: 'Set or update a variable' },
    { type: 'wait',      label: 'Wait / Delay',   icon: Clock,         color: '#6366f1', desc: 'Pause before next step' },
  ],
  actions: [
    { type: 'transfer',  label: 'Transfer Call',  icon: Phone,         color: '#ec4899', desc: 'Transfer to human agent' },
    { type: 'webhook',   label: 'Webhook / API',  icon: Webhook,       color: '#10b981', desc: 'Call external API' },
    { type: 'end',       label: 'End Call',        icon: ArrowRightCircle, color: '#ef4444', desc: 'Hang up the call' },
  ],
};

const ALL_NODES = [...NODE_CATALOG.conversation, ...NODE_CATALOG.logic, ...NODE_CATALOG.actions];
const nodeColorMap: Record<string, string> = {};
ALL_NODES.forEach(n => { nodeColorMap[n.type] = n.color; });
nodeColorMap['trigger'] = '#22c55e';

/* ═══════════════════════════════════════════════════════════════════
   PREMIUM CUSTOM NODE COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

const handleBase = '!w-3.5 !h-3.5 !border-2 !border-[#1a1a2e] transition-all duration-200';

function NodeShell({ children, selected, color, type, label, icon: Icon }: {
  children?: React.ReactNode; selected?: boolean; color: string; type: string; label: string; icon: React.ElementType;
}) {
  return (
    <div className={`group relative min-w-[220px] max-w-[280px] rounded-2xl transition-all duration-300 ${selected ? 'scale-[1.02]' : ''}`}
      style={{
        background: '#12121e',
        border: `1.5px solid ${selected ? color : 'rgba(255,255,255,0.06)'}`,
        boxShadow: selected ? `0 0 30px ${color}25, 0 8px 32px rgba(0,0,0,0.4)` : '0 4px 20px rgba(0,0,0,0.3)',
      }}>
      {/* Top accent bar */}
      <div className="h-[3px] rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${color}, ${color}60)` }} />
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.04]">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20`, boxShadow: `0 0 12px ${color}15` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-white/80 tracking-wide uppercase">{label}</div>
          <div className="text-[9px] text-white/25 font-medium">{type}</div>
        </div>
        <div className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
      {/* Body */}
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

const TriggerNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#22c55e" type="trigger" label="Start Call" icon={Play}>
      <div className="text-[11px] text-emerald-400/70 font-medium flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" /></span>
        {d.label || 'Entry Point'}
      </div>
      <Handle type="source" position={Position.Bottom} className={`${handleBase} !bg-emerald-500`} />
    </NodeShell>
  );
};

const SpeakNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#8b5cf6" type="speak" label="AI Speak" icon={MessageSquare}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-violet-500`} />
      <div className="text-[11px] text-white/50 line-clamp-3 leading-relaxed italic">&ldquo;{d.text || '...'}&rdquo;</div>
      <Handle type="source" position={Position.Bottom} className={`${handleBase} !bg-violet-500`} />
    </NodeShell>
  );
};

const GatherNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#f59e0b" type="gather" label="Gather Input" icon={Mic}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-amber-500`} />
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-amber-500/60 uppercase tracking-wider">var</span>
          <code className="text-[11px] text-amber-400/90 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">{d.variable || '?'}</code>
        </div>
        <div className="text-[10px] text-white/40 line-clamp-2">{d.prompt || '...'}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className={`${handleBase} !bg-amber-500`} />
    </NodeShell>
  );
};

const ConditionNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#3b82f6" type="condition" label="Condition" icon={HelpCircle}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-blue-500`} />
      <div className="text-[11px] text-center font-mono text-blue-400/80 bg-blue-500/10 border border-blue-500/15 p-2 rounded-lg mb-2">
        {d.variable || '?'} <span className="text-blue-300/50">{d.operator || '=='}</span> {d.value || '?'}
      </div>
      <div className="flex justify-between px-2 mt-3">
        <div className="flex flex-col items-center gap-1">
          <Handle type="source" position={Position.Bottom} id="true" style={{ position: 'relative', left: 0, transform: 'none' }} className={`${handleBase} !bg-emerald-500 !relative`} />
          <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">True</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Handle type="source" position={Position.Bottom} id="false" style={{ position: 'relative', left: 0, transform: 'none' }} className={`${handleBase} !bg-red-500 !relative`} />
          <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">False</span>
        </div>
      </div>
    </NodeShell>
  );
};

const SetVarNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#06b6d4" type="setvar" label="Set Variable" icon={Variable}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-cyan-500`} />
      <div className="flex items-center gap-2">
        <code className="text-[11px] text-cyan-400/90 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded">{d.variable || 'var'}</code>
        <span className="text-white/30 text-[10px]">=</span>
        <code className="text-[11px] text-white/50 font-mono truncate">{d.value || '""'}</code>
      </div>
      <Handle type="source" position={Position.Bottom} className={`${handleBase} !bg-cyan-500`} />
    </NodeShell>
  );
};

const WaitNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#6366f1" type="wait" label="Wait / Delay" icon={Clock}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-indigo-500`} />
      <div className="text-[11px] text-indigo-400/80 font-mono flex items-center gap-1.5">
        <Clock className="w-3 h-3" /> {d.seconds || 3}s delay
      </div>
      <Handle type="source" position={Position.Bottom} className={`${handleBase} !bg-indigo-500`} />
    </NodeShell>
  );
};

const TransferNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#ec4899" type="transfer" label="Transfer Call" icon={Phone}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-pink-500`} />
      <div className="space-y-1">
        <div className="text-[11px] text-pink-400/80 font-mono">{d.transferTo || '+1...'}</div>
        {d.reason && <div className="text-[10px] text-white/30">{d.reason}</div>}
      </div>
    </NodeShell>
  );
};

const WebhookNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#10b981" type="webhook" label="Webhook / API" icon={Webhook}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-emerald-500`} />
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/15 px-1.5 py-0.5 rounded uppercase">{d.method || 'POST'}</span>
          <span className="text-[10px] text-white/40 font-mono truncate">{d.url || 'https://...'}</span>
        </div>
        {d.saveAs && <div className="text-[9px] text-white/25">Save response &rarr; <code className="text-emerald-400/60">{d.saveAs}</code></div>}
      </div>
      <Handle type="source" position={Position.Bottom} className={`${handleBase} !bg-emerald-500`} />
    </NodeShell>
  );
};

const EndNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#ef4444" type="end" label="End Call" icon={ArrowRightCircle}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-red-500`} />
      <div className="text-[11px] text-red-400/60">{d.message || 'Call ends here'}</div>
    </NodeShell>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  speak: SpeakNode,
  gather: GatherNode,
  condition: ConditionNode,
  setvar: SetVarNode,
  wait: WaitNode,
  transfer: TransferNode,
  webhook: WebhookNode,
  end: EndNode,
};

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR DRAG ITEM
   ═══════════════════════════════════════════════════════════════════ */

function DragItem({ type, label, icon: Icon, color, desc }: { type: string; label: string; icon: React.ElementType; color: string; desc: string }) {
  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div draggable onDragStart={onDragStart}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-white/[0.04] border border-transparent hover:border-white/[0.06]"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
        style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold text-white/70 group-hover:text-white/90 transition-colors">{label}</div>
        <div className="text-[10px] text-white/25 leading-tight">{desc}</div>
      </div>
      <GripVertical className="w-3.5 h-3.5 text-white/10 group-hover:text-white/25 transition-colors flex-shrink-0" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DEFAULT DATA FACTORY
   ═══════════════════════════════════════════════════════════════════ */

const getDefaultDataForType = (type: string) => {
  switch (type) {
    case 'speak':     return { text: 'Hello, how can I help you today?' };
    case 'gather':    return { prompt: 'Please say your account number.', variable: 'account_number', expectedType: 'text' };
    case 'condition': return { variable: 'account_number', operator: 'exists', value: '' };
    case 'setvar':    return { variable: 'status', value: 'active' };
    case 'wait':      return { seconds: 3 };
    case 'transfer':  return { transferTo: '+1234567890', reason: 'User requested human agent' };
    case 'webhook':   return { method: 'POST', url: 'https://api.example.com/webhook', body: '{}', saveAs: 'api_result' };
    case 'end':       return { message: 'Goodbye!' };
    default:          return {};
  }
};

let idCounter = 0;
const getId = () => `node_${Date.now()}_${idCounter++}`;

/* ═══════════════════════════════════════════════════════════════════
   FLOW EDITOR — Main Component
   ═══════════════════════════════════════════════════════════════════ */

function FlowEditor() {
  const router = useRouter();
  const params = useParams();
  const flowId = params.id as string;
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [flowData, setFlowData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchFlow(); }, [flowId]);

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

  const onConnect = useCallback((connection: Connection) =>
    setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } } as any, eds)),
  [setEdges]);

  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes((nds) => nds.concat({ id: getId(), type, position, data: getDefaultDataForType(type) }));
  }, [screenToFlowPosition, setNodes]);

  const addNode = (type: string) => {
    setNodes((nds) => nds.concat({
      id: getId(), type,
      position: { x: 300 + Math.random() * 100, y: nodes.length * 120 + 120 },
      data: getDefaultDataForType(type),
    }));
  };

  const onSave = async () => {
    setIsSaving(true);
    try {
      await callFlowsApi.update(flowId, { name: flowData.name, description: flowData.description, nodes, edges });
      toast.success('Workflow saved!');
    } catch (err) { toast.error('Failed to save'); }
    finally { setIsSaving(false); }
  };

  const duplicateNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.concat({
      id: getId(), type: selectedNode.type,
      position: { x: selectedNode.position.x + 40, y: selectedNode.position.y + 60 },
      data: { ...selectedNode.data },
    }));
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter(n => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((nds) => nds.map((node) => {
      if (node.id === selectedNode.id) {
        const newData = { ...node.data, [key]: value };
        setSelectedNode({ ...node, data: newData });
        return { ...node, data: newData };
      }
      return node;
    }));
  };

  const filteredCatalog = (items: typeof ALL_NODES) =>
    items.filter(n => !searchQuery || n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.desc.toLowerCase().includes(searchQuery.toLowerCase()));

  const nodeColor = selectedNode ? (nodeColorMap[selectedNode.type] || '#8b5cf6') : '#8b5cf6';

  return (
    <div className="h-screen flex flex-col bg-[#0a0a14] text-white overflow-hidden">

      {/* ── Premium Header ── */}
      <div className="h-14 border-b border-white/[0.06] bg-[#0e0e1a]/90 backdrop-blur-xl px-4 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/call-flows')}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white/80 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-white/[0.08]" />
          <div className="flex items-center gap-2 text-[12px] text-white/30">
            <Network className="w-3.5 h-3.5" />
            <span>Call Flows</span>
            <ChevronRight className="w-3 h-3" />
          </div>
          <input
            value={flowData?.name || ''}
            onChange={e => setFlowData({ ...flowData, name: e.target.value })}
            className="bg-transparent border-none outline-none text-[15px] font-semibold text-white/90 placeholder:text-white/25 w-[200px] focus:bg-white/[0.03] rounded-lg px-2 py-1 -ml-1 transition-colors"
            placeholder="Untitled Flow"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[11px] text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {nodes.length} nodes · {edges.length} edges
          </div>
          <div className="h-5 w-px bg-white/[0.06]" />
          <button onClick={onSave} disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-[13px] font-semibold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-row overflow-hidden relative">

        {/* ── Left Sidebar — Node Palette ── */}
        <div className="w-[260px] border-r border-white/[0.05] bg-[#0c0c18]/90 backdrop-blur-xl flex flex-col z-20 flex-shrink-0">
          {/* Search */}
          <div className="p-3 border-b border-white/[0.04]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <input
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-[12px] text-white/70 placeholder:text-white/20 outline-none focus:border-violet-500/30 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 scrollbar-thin">
            {/* Conversation */}
            {filteredCatalog(NODE_CATALOG.conversation).length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-3 mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">Conversation</span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
                {filteredCatalog(NODE_CATALOG.conversation).map(n => <DragItem key={n.type} {...n} />)}
              </div>
            )}
            {/* Logic */}
            {filteredCatalog(NODE_CATALOG.logic).length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-3 mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">Logic</span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
                {filteredCatalog(NODE_CATALOG.logic).map(n => <DragItem key={n.type} {...n} />)}
              </div>
            )}
            {/* Actions */}
            {filteredCatalog(NODE_CATALOG.actions).length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-3 mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">Actions</span>
                  <div className="flex-1 h-px bg-white/[0.04]" />
                </div>
                {filteredCatalog(NODE_CATALOG.actions).map(n => <DragItem key={n.type} {...n} />)}
              </div>
            )}
          </div>

          {/* Keyboard hints */}
          <div className="p-3 border-t border-white/[0.04] space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] text-white/15">
              <Keyboard className="w-3 h-3" /> <span>Drag nodes onto canvas</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/15">
              <span className="px-1 py-0.5 bg-white/[0.04] rounded text-[8px] font-mono">Del</span>
              <span>Delete selected node</span>
            </div>
          </div>
        </div>

        {/* ── Canvas ── */}
        <div ref={reactFlowWrapper} className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            onDrop={onDrop} onDragOver={onDragOver}
            fitView
            defaultEdgeOptions={{ animated: true, style: { stroke: '#7c3aed50', strokeWidth: 2 } }}
            proOptions={{ hideAttribution: true }}
            className="!bg-[#0a0a14]"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ffffff08" />
            <Controls
              showInteractive={false}
              className="!bg-[#12121e] !border-white/[0.06] !rounded-xl !shadow-2xl [&>button]:!bg-transparent [&>button]:!border-white/[0.04] [&>button]:!text-white/40 [&>button:hover]:!bg-white/[0.05] [&>button:hover]:!text-white/70"
            />
            <MiniMap
              nodeColor={(n) => nodeColorMap[n.type || 'speak'] || '#8b5cf6'}
              maskColor="rgba(10,10,20,0.85)"
              className="!bg-[#12121e] !border-white/[0.06] !rounded-xl !shadow-2xl !overflow-hidden"
              zoomable pannable
            />
          </ReactFlow>

          {/* Empty state overlay */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center pointer-events-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/15 flex items-center justify-center mx-auto mb-5">
                  <Network className="w-8 h-8 text-violet-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-white/40 mb-2">Start building your flow</h3>
                <p className="text-[13px] text-white/20 mb-6 max-w-[300px]">Drag nodes from the left panel or click below to add your first node.</p>
                <button onClick={() => addNode('speak')}
                  className="px-5 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/25 text-violet-400 text-[13px] font-medium hover:bg-violet-600/30 transition-colors">
                  <MessageSquare className="w-4 h-4 inline mr-2" /> Add first node
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel — Properties ── */}
        {selectedNode && (
          <div className="w-[320px] border-l border-white/[0.05] bg-[#0c0c18]/95 backdrop-blur-xl flex flex-col z-20 flex-shrink-0 animate-in slide-in-from-right-5 duration-200">
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${nodeColor}20` }}>
                  {(() => { const cfg = ALL_NODES.find(n => n.type === selectedNode.type); return cfg ? <cfg.icon className="w-3.5 h-3.5" style={{ color: nodeColor }} /> : <Zap className="w-3.5 h-3.5" style={{ color: nodeColor }} /> })()}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white/80 capitalize">{selectedNode.type} Node</div>
                  <div className="text-[10px] text-white/25 font-mono">{selectedNode.id.slice(0, 16)}...</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={duplicateNode} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/25 hover:text-white/60 transition-all" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                <button onClick={deleteNode} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/25 hover:text-red-400 transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => setSelectedNode(null)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/25 hover:text-white/60 transition-all"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
              {/* -- Speak -- */}
              {selectedNode.type === 'speak' && (
                <PropSection label="Text to Speak" hint="Use {{variable}} for dynamic data">
                  <Textarea value={selectedNode.data.text} onChange={(e) => updateNodeData('text', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/80 text-[12px] rounded-xl min-h-[120px] placeholder:text-white/20 focus:border-violet-500/30"
                    placeholder="What should the AI say?" />
                </PropSection>
              )}

              {/* -- Gather -- */}
              {selectedNode.type === 'gather' && (<>
                <PropSection label="Prompt (AI asks)">
                  <Textarea value={selectedNode.data.prompt} onChange={(e) => updateNodeData('prompt', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/80 text-[12px] rounded-xl min-h-[80px] placeholder:text-white/20 focus:border-amber-500/30" />
                </PropSection>
                <PropSection label="Save as Variable">
                  <Input value={selectedNode.data.variable} onChange={(e) => updateNodeData('variable', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-amber-400/90 text-[12px] font-mono rounded-xl placeholder:text-white/20 focus:border-amber-500/30 h-10"
                    placeholder="e.g. user_intent" />
                </PropSection>
                <PropSection label="Expected Type">
                  <Select value={selectedNode.data.expectedType || 'text'} onValueChange={(v) => updateNodeData('expectedType', v)}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/[0.08] text-white/80 rounded-xl">
                      <SelectItem value="text">Free Text</SelectItem>
                      <SelectItem value="boolean">Yes / No</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </PropSection>
              </>)}

              {/* -- Condition -- */}
              {selectedNode.type === 'condition' && (<>
                <PropSection label="Variable to Test">
                  <Input value={selectedNode.data.variable} onChange={(e) => updateNodeData('variable', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-blue-400/90 text-[12px] font-mono rounded-xl h-10 focus:border-blue-500/30" />
                </PropSection>
                <PropSection label="Operator">
                  <Select value={selectedNode.data.operator || 'equals'} onValueChange={(v) => updateNodeData('operator', v)}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/[0.08] text-white/80 rounded-xl">
                      <SelectItem value="equals">Equals (==)</SelectItem>
                      <SelectItem value="not_equals">Not Equals (!=)</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than (&gt;)</SelectItem>
                      <SelectItem value="less_than">Less Than (&lt;)</SelectItem>
                      <SelectItem value="exists">Exists (not null)</SelectItem>
                    </SelectContent>
                  </Select>
                </PropSection>
                {selectedNode.data.operator !== 'exists' && (
                  <PropSection label="Value">
                    <Input value={selectedNode.data.value} onChange={(e) => updateNodeData('value', e.target.value)}
                      className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] rounded-xl h-10 focus:border-blue-500/30" />
                  </PropSection>
                )}
              </>)}

              {/* -- Set Variable -- */}
              {selectedNode.type === 'setvar' && (<>
                <PropSection label="Variable Name">
                  <Input value={selectedNode.data.variable} onChange={(e) => updateNodeData('variable', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-cyan-400/90 text-[12px] font-mono rounded-xl h-10 focus:border-cyan-500/30" placeholder="e.g. status" />
                </PropSection>
                <PropSection label="Value">
                  <Input value={selectedNode.data.value} onChange={(e) => updateNodeData('value', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] rounded-xl h-10 focus:border-cyan-500/30" placeholder="e.g. active" />
                </PropSection>
              </>)}

              {/* -- Wait -- */}
              {selectedNode.type === 'wait' && (
                <PropSection label="Delay (seconds)">
                  <Input type="number" value={selectedNode.data.seconds} onChange={(e) => updateNodeData('seconds', Number(e.target.value))}
                    className="bg-white/[0.03] border-white/[0.06] text-indigo-400/90 text-[12px] font-mono rounded-xl h-10 focus:border-indigo-500/30" />
                </PropSection>
              )}

              {/* -- Transfer -- */}
              {selectedNode.type === 'transfer' && (<>
                <PropSection label="Transfer To">
                  <Input value={selectedNode.data.transferTo} onChange={(e) => updateNodeData('transferTo', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-pink-400/90 text-[12px] font-mono rounded-xl h-10 focus:border-pink-500/30" placeholder="+1234567890" />
                </PropSection>
                <PropSection label="Reason">
                  <Input value={selectedNode.data.reason} onChange={(e) => updateNodeData('reason', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] rounded-xl h-10 focus:border-pink-500/30" />
                </PropSection>
              </>)}

              {/* -- Webhook -- */}
              {selectedNode.type === 'webhook' && (<>
                <PropSection label="HTTP Method">
                  <Select value={selectedNode.data.method || 'POST'} onValueChange={(v) => updateNodeData('method', v)}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-emerald-400/90 text-[12px] font-mono rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/[0.08] text-white/80 rounded-xl">
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </PropSection>
                <PropSection label="URL">
                  <Input value={selectedNode.data.url} onChange={(e) => updateNodeData('url', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] font-mono rounded-xl h-10 focus:border-emerald-500/30" placeholder="https://api.example.com" />
                </PropSection>
                <PropSection label="Request Body (JSON)">
                  <Textarea value={selectedNode.data.body} onChange={(e) => updateNodeData('body', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/60 text-[11px] font-mono rounded-xl min-h-[80px] placeholder:text-white/20 focus:border-emerald-500/30" />
                </PropSection>
                <PropSection label="Save Response As">
                  <Input value={selectedNode.data.saveAs} onChange={(e) => updateNodeData('saveAs', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-emerald-400/80 text-[12px] font-mono rounded-xl h-10 focus:border-emerald-500/30" placeholder="e.g. api_result" />
                </PropSection>
              </>)}

              {/* -- End -- */}
              {selectedNode.type === 'end' && (
                <PropSection label="End Message">
                  <Input value={selectedNode.data.message} onChange={(e) => updateNodeData('message', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] rounded-xl h-10 focus:border-red-500/30" placeholder="Goodbye!" />
                </PropSection>
              )}
            </div>

            {/* Panel footer — danger zone */}
            <div className="p-3 border-t border-white/[0.04]">
              <button onClick={deleteNode}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/15 bg-red-500/5 text-red-400 text-[12px] font-semibold hover:bg-red-500/10 hover:border-red-500/25 transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Delete Node
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PROPERTY SECTION HELPER
   ═══════════════════════════════════════════════════════════════════ */

function PropSection({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30 mb-1.5 block">{label}</Label>
      {children}
      {hint && <p className="text-[9px] text-white/15 mt-1.5">{hint}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   WRAPPER
   ═══════════════════════════════════════════════════════════════════ */

export default function CallFlowEditorWrapper() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}
