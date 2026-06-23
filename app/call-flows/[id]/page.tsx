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
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
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
  Search, GripVertical, Copy, Keyboard, Hash, GitBranch, Brain, FileSearch, UserPlus, Plus,
  Undo2, Redo2, LayoutGrid, CheckCircle2, AlignStartVertical, AlignEndVertical, StickyNote,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   NODE CONFIG — defines all available node types with their metadata
   ═══════════════════════════════════════════════════════════════════ */

const NODE_CATALOG = {
  conversation: [
    { type: 'speak',    label: 'AI Speak',       icon: MessageSquare, color: '#8b5cf6', desc: 'Agent says something' },
    { type: 'gather',   label: 'Gather Input',   icon: Mic,           color: '#f59e0b', desc: 'Listen & capture user input' },
    { type: 'dtmf',     label: 'DTMF Keypad',    icon: Hash,          color: '#fb923c', desc: 'Capture phone keypad digits' },
    { type: 'llm',      label: 'LLM Turn',       icon: Brain,         color: '#a855f7', desc: 'One open-ended LLM response' },
  ],
  logic: [
    { type: 'condition',    label: 'Condition',     icon: HelpCircle,    color: '#3b82f6', desc: 'Branch on a variable' },
    { type: 'switch',       label: 'Switch / Multi-case', icon: GitBranch, color: '#0ea5e9', desc: 'Multi-way routing on a variable' },
    { type: 'set_variable', label: 'Set Variable',  icon: Variable,      color: '#06b6d4', desc: 'Set or update a variable' },
    { type: 'extract',      label: 'Extract Data',  icon: FileSearch,    color: '#0d9488', desc: 'LLM-powered structured extraction' },
    { type: 'wait',         label: 'Wait / Delay',  icon: Clock,         color: '#6366f1', desc: 'Pause before next step' },
  ],
  actions: [
    { type: 'transfer',       label: 'Transfer Call',   icon: Phone,    color: '#ec4899', desc: 'Transfer to human agent' },
    { type: 'transfer_agent', label: 'Squad Handoff',   icon: UserPlus, color: '#d946ef', desc: 'Transfer to another AI agent' },
    { type: 'webhook',        label: 'Webhook / API',   icon: Webhook,  color: '#10b981', desc: 'Call external API' },
    { type: 'end',            label: 'End Call',        icon: ArrowRightCircle, color: '#ef4444', desc: 'Hang up the call' },
    { type: 'comment',        label: 'Note / Comment',  icon: StickyNote, color: '#facc15', desc: 'Add inline documentation' },
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
    <NodeShell selected={selected} color="#06b6d4" type="set_variable" label="Set Variable" icon={Variable}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-cyan-500`} />
      <div className="flex items-center gap-2">
        <code className="text-[11px] text-cyan-400/90 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded">{d.name || d.variable || 'var'}</code>
        <span className="text-white/30 text-[10px]">=</span>
        <code className="text-[11px] text-white/50 font-mono truncate">{d.value || '""'}</code>
      </div>
      <Handle type="source" position={Position.Bottom} className={`${handleBase} !bg-cyan-500`} />
    </NodeShell>
  );
};

const DtmfNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  const routes = d.routes && typeof d.routes === 'object' ? Object.keys(d.routes) : [];
  return (
    <NodeShell selected={selected} color="#fb923c" type="dtmf" label="DTMF Keypad" icon={Hash}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-orange-400`} />
      <div className="space-y-1.5">
        <div className="text-[10px] text-white/40 line-clamp-2">{d.prompt || 'Press a key...'}</div>
        <code className="text-[11px] text-orange-400/90 font-mono bg-orange-500/10 px-1.5 py-0.5 rounded inline-block">
          → {d.variable || 'dtmf_digits'}
        </code>
      </div>
      {routes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-white/[0.05]">
          {routes.map((k) => (
            <div key={k} className="flex flex-col items-center gap-1">
              <Handle type="source" position={Position.Bottom} id={k} style={{ position: 'relative', left: 0, transform: 'none' }} className={`${handleBase} !bg-orange-400 !relative`} />
              <span className="text-[8px] font-bold text-orange-400 uppercase tracking-wider">{k}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1">
            <Handle type="source" position={Position.Bottom} id="default" style={{ position: 'relative', left: 0, transform: 'none' }} className={`${handleBase} !bg-white/30 !relative`} />
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider">def</span>
          </div>
        </div>
      ) : (
        <Handle type="source" position={Position.Bottom} className={`${handleBase} !bg-orange-400`} />
      )}
    </NodeShell>
  );
};

const SwitchNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  const cases = Array.isArray(d.cases) ? d.cases : [];
  return (
    <NodeShell selected={selected} color="#0ea5e9" type="switch" label="Switch" icon={GitBranch}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-sky-500`} />
      <div className="text-[11px] text-center font-mono text-sky-400/80 bg-sky-500/10 border border-sky-500/15 p-2 rounded-lg mb-2">
        switch ({d.variable || '?'})
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {cases.map((c: any) => (
          <div key={c.value} className="flex flex-col items-center gap-1">
            <Handle type="source" position={Position.Bottom} id={`case_${c.value}`} style={{ position: 'relative', left: 0, transform: 'none' }} className={`${handleBase} !bg-sky-500 !relative`} />
            <span className="text-[8px] font-bold text-sky-400 uppercase tracking-wider">{String(c.value).slice(0, 8)}</span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-1">
          <Handle type="source" position={Position.Bottom} id="default" style={{ position: 'relative', left: 0, transform: 'none' }} className={`${handleBase} !bg-white/30 !relative`} />
          <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider">def</span>
        </div>
      </div>
    </NodeShell>
  );
};

const LlmNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#a855f7" type="llm" label="LLM Turn" icon={Brain}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-purple-500`} />
      <div className="space-y-1.5">
        <div className="text-[10px] text-purple-300/60 line-clamp-2 italic">{d.prompt || d.system || 'Open-ended LLM response...'}</div>
        {d.resultVariable && (
          <code className="text-[10px] text-purple-400/70 font-mono">→ {d.resultVariable}</code>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className={`${handleBase} !bg-purple-500`} />
      <Handle type="source" position={Position.Right} id="error" className={`${handleBase} !bg-red-500`} />
    </NodeShell>
  );
};

const ExtractNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  const fields = Array.isArray(d.schema) ? d.schema : [];
  return (
    <NodeShell selected={selected} color="#0d9488" type="extract" label="Extract Data" icon={FileSearch}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-teal-500`} />
      <div className="space-y-1.5">
        <div className="text-[10px] text-teal-400/60">{fields.length} field{fields.length !== 1 ? 's' : ''} configured</div>
        {fields.slice(0, 3).map((f: any) => (
          <code key={f.name} className="text-[10px] text-teal-400/80 font-mono bg-teal-500/10 px-1.5 py-0.5 rounded inline-block mr-1">
            {f.name}:{f.type || 'string'}
          </code>
        ))}
      </div>
      <Handle type="source" position={Position.Bottom} className={`${handleBase} !bg-teal-500`} />
      <Handle type="source" position={Position.Right} id="error" className={`${handleBase} !bg-red-500`} />
    </NodeShell>
  );
};

const TransferAgentNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <NodeShell selected={selected} color="#d946ef" type="transfer_agent" label="Squad Handoff" icon={UserPlus}>
      <Handle type="target" position={Position.Top} className={`${handleBase} !bg-fuchsia-500`} />
      <div className="space-y-1">
        <code className="text-[10px] text-fuchsia-400/80 font-mono bg-fuchsia-500/10 px-1.5 py-0.5 rounded inline-block">
          → {d.agentName || (d.agentId ? d.agentId.slice(0, 8) + '...' : 'select agent')}
        </code>
        {d.reason && <div className="text-[10px] text-white/30">{d.reason}</div>}
      </div>
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

const CommentNode = ({ data, selected }: NodeProps) => {
  const d = data as any;
  return (
    <div className={`group relative min-w-[200px] max-w-[300px] rounded-2xl transition-all duration-300 ${selected ? 'scale-[1.02]' : ''}`}
      style={{
        background: '#1a1a2e80',
        border: `1.5px solid ${selected ? '#facc15' : 'rgba(250,204,21,0.2)'}`,
        boxShadow: selected ? '0 0 30px rgba(250,204,21,0.15), 0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.3)',
      }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-yellow-500/10">
        <StickyNote className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-[11px] font-bold text-yellow-400/80 uppercase tracking-wide">Note</span>
      </div>
      <div className="px-4 py-3">
        <div className="text-[11px] text-yellow-300/60 italic leading-relaxed whitespace-pre-wrap">{d.text || 'Add a note...'}</div>
      </div>
    </div>
  );
};

const nodeTypes = {
  trigger: TriggerNode,
  speak: SpeakNode,
  gather: GatherNode,
  dtmf: DtmfNode,
  llm: LlmNode,
  condition: ConditionNode,
  switch: SwitchNode,
  set_variable: SetVarNode,
  setvar: SetVarNode, // legacy alias for old saved flows
  extract: ExtractNode,
  wait: WaitNode,
  transfer: TransferNode,
  transfer_agent: TransferAgentNode,
  webhook: WebhookNode,
  end: EndNode,
  comment: CommentNode,
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
    case 'speak':          return { text: 'Hello, how can I help you today?' };
    case 'gather':         return { prompt: 'Please say your account number.', variable: 'account_number', expectedType: 'text' };
    case 'dtmf':           return { prompt: 'Press 1 for sales, 2 for support.', variable: 'menu_choice', routes: { '1': 'sales', '2': 'support' } };
    case 'llm':            return { prompt: '', system: 'You are a helpful voice agent.', model: 'llama-3.1-8b-instant', temperature: 0.4, resultVariable: '' };
    case 'condition':      return { variable: 'account_number', operator: 'exists', value: '' };
    case 'switch':         return { variable: 'menu_choice', cases: [{ value: 'sales' }, { value: 'support' }] };
    case 'set_variable':   return { name: 'status', value: 'active' };
    case 'setvar':         return { name: 'status', value: 'active' }; // legacy
    case 'extract':        return { schema: [{ name: 'name', type: 'string' }, { name: 'email', type: 'string' }], resultVariable: 'extracted' };
    case 'wait':           return { seconds: 3 };
    case 'transfer':       return { transferTo: '+1234567890', reason: 'User requested human agent' };
    case 'transfer_agent': return { agentId: '', agentName: '', reason: 'Squad routing' };
    case 'webhook':        return { method: 'POST', url: 'https://api.example.com/webhook', body: '{}', resultVariable: 'api_result', timeoutMs: 8000, maxRetries: 0 };
    case 'end':            return { message: 'Goodbye!' };
    case 'comment':        return { text: 'TODO: document why this path exists' };
    default:               return {};
  }
};

let idCounter = 0;
const getId = () => `node_${Date.now()}_${idCounter++}`;

/* ═══════════════════════════════════════════════════════════════════
   UNDO / REDO HISTORY
   ═══════════════════════════════════════════════════════════════════ */

type HistoryEntry = { nodes: Node[]; edges: Edge[] };
const MAX_HISTORY = 50;

function useUndoRedo(
  nodes: Node[], setNodes: any,
  edges: Edge[], setEdges: any
) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushHistory = useCallback((n: Node[], e: Edge[]) => {
    if (skipRef.current) { skipRef.current = false; return; }
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const next = [...trimmed, { nodes: JSON.parse(JSON.stringify(n)), edges: JSON.parse(JSON.stringify(e)) }];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    const entry = history[newIdx];
    if (entry) {
      skipRef.current = true;
      setNodes(JSON.parse(JSON.stringify(entry.nodes)));
      setEdges(JSON.parse(JSON.stringify(entry.edges)));
      setHistoryIndex(newIdx);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    const entry = history[newIdx];
    if (entry) {
      skipRef.current = true;
      setNodes(JSON.parse(JSON.stringify(entry.nodes)));
      setEdges(JSON.parse(JSON.stringify(entry.edges)));
      setHistoryIndex(newIdx);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  // Debounced auto-push on any state change (positions, data, etc.)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (nodes.length > 0 || edges.length > 0) {
        const entry = history[historyIndex];
        const nodesSame = entry && JSON.stringify(entry.nodes) === JSON.stringify(nodes);
        const edgesSame = entry && JSON.stringify(entry.edges) === JSON.stringify(edges);
        if (!nodesSame || !edgesSame) pushHistory(nodes, edges);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  return { undo, redo, canUndo: historyIndex > 0, canRedo: historyIndex < history.length - 1 };
}

/* ═══════════════════════════════════════════════════════════════════
   FLOW EDITOR — Main Component
   ═══════════════════════════════════════════════════════════════════ */

function FlowEditor() {
  const router = useRouter();
  const params = useParams();
  const flowId = params.id as string;
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNodes, getEdges, setNodes: rfSetNodes, setEdges: rfSetEdges } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [flowData, setFlowData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  const { undo, redo, canUndo, canRedo } = useUndoRedo(nodes, setNodes, edges, setEdges);

  // Flow templates
  const flowTemplates = [
    { name: 'IVR Menu', desc: 'DTMF-based menu with routing', build: () => ({
      nodes: [
        { id: 'trigger', type: 'trigger', position: { x: 250, y: 0 }, data: {} },
        { id: 'speak', type: 'speak', position: { x: 250, y: 120 }, data: { text: 'Press 1 for sales, 2 for support.' } },
        { id: 'dtmf', type: 'dtmf', position: { x: 250, y: 240 }, data: { prompt: 'Press 1 for sales, 2 for support.', variable: 'menu_choice', routes: { '1': 'sales', '2': 'support' } } },
        { id: 'end', type: 'end', position: { x: 250, y: 380 }, data: { message: 'Goodbye!' } },
      ],
      edges: [
        { id: 'e1', source: 'trigger', target: 'speak', animated: true },
        { id: 'e2', source: 'speak', target: 'dtmf', animated: true },
        { id: 'e3', source: 'dtmf', target: 'end', animated: true },
      ],
    })},
    { name: 'Survey Call', desc: 'Ask questions and capture responses', build: () => ({
      nodes: [
        { id: 'trigger', type: 'trigger', position: { x: 250, y: 0 }, data: {} },
        { id: 'speak', type: 'speak', position: { x: 250, y: 120 }, data: { text: 'Hello! We value your feedback.' } },
        { id: 'gather', type: 'gather', position: { x: 250, y: 240 }, data: { prompt: 'On a scale of 1-10, how satisfied are you?', variable: 'satisfaction', expectedType: 'text' } },
        { id: 'gather2', type: 'gather', position: { x: 250, y: 360 }, data: { prompt: 'Any suggestions for improvement?', variable: 'feedback', expectedType: 'text' } },
        { id: 'end', type: 'end', position: { x: 250, y: 480 }, data: { message: 'Thank you for your time!' } },
      ],
      edges: [
        { id: 'e1', source: 'trigger', target: 'speak', animated: true },
        { id: 'e2', source: 'speak', target: 'gather', animated: true },
        { id: 'e3', source: 'gather', target: 'gather2', animated: true },
        { id: 'e4', source: 'gather2', target: 'end', animated: true },
      ],
    })},
  ];

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.includes('Mac');
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedNode) {
        setNodes((nds) => nds.filter(n => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
      }
    }
    if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    if (mod && e.key === 'c' && selectedNode) {
      e.preventDefault();
      navigator.clipboard.writeText(JSON.stringify(selectedNode));
    }
    if (mod && e.key === 'v') {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        try {
          const data = JSON.parse(text);
          if (data.type && data.data) {
            setNodes((nds) => nds.concat({
              id: getId(), type: data.type,
              position: { x: data.position.x + 50, y: data.position.y + 50 },
              data: JSON.parse(JSON.stringify(data.data)),
            }));
          }
        } catch { /* ignore non-node clipboard content */ }
      });
    }
    if (mod && e.key === 'd' && selectedNode) {
      e.preventDefault();
      setNodes((nds) => nds.concat({
        id: getId(), type: selectedNode.type,
        position: { x: selectedNode.position.x + 40, y: selectedNode.position.y + 60 },
        data: JSON.parse(JSON.stringify(selectedNode.data)),
      }));
    }
    if (e.key === 'Escape') setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges, undo, redo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Valid connections
  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = getNodes().find(n => n.id === connection.source);
    const targetNode = getNodes().find(n => n.id === connection.target);
    if (!sourceNode || !targetNode) return false;
    if (targetNode.type === 'trigger') return false;
    if (sourceNode.id === targetNode.id) return false;
    return true;
  }, [getNodes]);

  // Validate flow
  const validateFlow = useCallback(() => {
    const issues: string[] = [];
    const currentNodes = getNodes();
    const currentEdges = getEdges();

    if (currentNodes.length === 0) {
      issues.push('Flow is empty — add at least one node.');
    } else {
      const hasTrigger = currentNodes.some(n => n.type === 'trigger');
      if (!hasTrigger) issues.push('No Start (Trigger) node found. Add one to define entry point.');
    }

    // Check for disconnected nodes (except trigger)
    const connectedNodeIds = new Set<string>();
    currentEdges.forEach(e => { connectedNodeIds.add(e.source); connectedNodeIds.add(e.target); });
    const disconnected = currentNodes.filter(n => !connectedNodeIds.has(n.id) && n.type !== 'trigger');
    if (disconnected.length > 0) {
      issues.push(`${disconnected.length} node(s) are disconnected (no incoming/outgoing connections).`);
    }

    // Check for nodes with missing required fields
    currentNodes.forEach(n => {
      if (n.type === 'webhook' && !(n.data as any)?.url) {
        issues.push(`Webhook node "${n.id?.slice(0, 12)}" has no URL configured.`);
      }
      if (n.type === 'transfer' && !(n.data as any)?.transferTo) {
        issues.push(`Transfer node "${n.id?.slice(0, 12)}" has no destination number.`);
      }
    });

    if (issues.length === 0) {
      setValidationMsg('Flow looks good! ✓');
      toast.success('Flow validation passed!');
    } else {
      setValidationMsg(issues.join('\n'));
      toast.error(`${issues.length} issue(s) found`);
    }
    setTimeout(() => setValidationMsg(null), 5000);
  }, [getNodes, getEdges]);

  // Auto-layout using dagre-like simple grid
  const autoLayout = useCallback(() => {
    const currentNodes = getNodes();
    if (currentNodes.length === 0) return;
    const sorted = [...currentNodes];
    // Simple layered layout: position by index
    sorted.forEach((n, i) => {
      n.position = { x: 50 + (i % 4) * 250, y: 50 + Math.floor(i / 4) * 180 };
    });
    rfSetNodes([...sorted]);
    setNodes([...sorted]);
  }, [getNodes, rfSetNodes, setNodes]);

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
        <div className="flex items-center gap-1.5">
          {/* Undo/Redo */}
          <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)"
            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white/70 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)"
            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white/70 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-white/[0.06] mx-1" />

          {/* Snap-to-grid toggle */}
          <button onClick={() => setSnapToGrid(s => !s)} title="Toggle snap to grid"
            className={`p-2 rounded-lg transition-all ${snapToGrid ? 'text-violet-400 bg-violet-500/10' : 'text-white/30 hover:text-white/70 hover:bg-white/[0.05]'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Align / Auto-layout */}
          <button onClick={autoLayout} title="Auto-layout nodes"
            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white/70 transition-all">
            <AlignStartVertical className="w-4 h-4" />
          </button>

          {/* Templates */}
          <div className="relative group/template">
            <button title="Load template"
              className="p-2 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white/70 transition-all">
              <Copy className="w-4 h-4" />
            </button>
            <div className="absolute top-full right-0 mt-1 w-48 opacity-0 invisible group-hover/template:opacity-100 group-hover/template:visible transition-all duration-200 z-50">
              <div className="bg-[#1a1a2e] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
                <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-wider border-b border-white/[0.04]">Templates</div>
                {flowTemplates.map(t => (
                  <button key={t.name} onClick={() => {
                    const { nodes: tn, edges: te } = t.build();
                    setNodes(tn as any); setEdges(te as any);
                  }}
                    className="w-full text-left px-3 py-2.5 text-[12px] text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-colors">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-[10px] text-white/30">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Export */}
          <button onClick={() => {
            const data = JSON.stringify({ nodes: getNodes(), edges: getEdges() }, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${flowData?.name || 'flow'}.json`; a.click();
            URL.revokeObjectURL(url);
            toast.success('Flow exported!');
          }} title="Export flow as JSON"
            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white/70 transition-all">
            <Save className="w-4 h-4" />
          </button>

          {/* Import */}
          <button onClick={() => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.onchange = (e: any) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const data = JSON.parse(ev.target?.result as string);
                  if (data.nodes) setNodes(data.nodes);
                  if (data.edges) setEdges(data.edges || []);
                  toast.success('Flow imported!');
                } catch { toast.error('Invalid flow file'); }
              };
              reader.readAsText(file);
            };
            input.click();
          }} title="Import flow from JSON"
            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-white/70 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Validate */}
          <button onClick={validateFlow} title="Validate flow"
            className="p-2 rounded-lg hover:bg-white/[0.05] text-white/30 hover:text-emerald-400 transition-all">
            <CheckCircle2 className="w-4 h-4" />
          </button>

          {/* Simulation toggle */}
          <button onClick={() => setSimulating(s => !s)} title="Simulation mode"
            className={`p-2 rounded-lg transition-all ${simulating ? 'text-amber-400 bg-amber-500/10' : 'text-white/30 hover:text-white/70 hover:bg-white/[0.05]'}`}>
            <Play className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-white/[0.06] mx-1" />

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-[11px] text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {nodes.length} nodes · {edges.length} edges
          </div>
          <div className="h-5 w-px bg-white/[0.06] mx-1" />
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
          <div className="p-3 border-t border-white/[0.04] space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-white/15">
              <Keyboard className="w-3 h-3" /> <span>Drag nodes onto canvas</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/15">
              <span className="px-1 py-0.5 bg-white/[0.04] rounded text-[8px] font-mono">Del</span>
              <span>Delete selected</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/15">
              <span className="px-1 py-0.5 bg-white/[0.04] rounded text-[8px] font-mono">Ctrl+Z/Y</span>
              <span>Undo/Redo</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/15">
              <span className="px-1 py-0.5 bg-white/[0.04] rounded text-[8px] font-mono">Ctrl+D</span>
              <span>Duplicate node</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/15">
              <span className="px-1 py-0.5 bg-white/[0.04] rounded text-[8px] font-mono">Ctrl+C/V</span>
              <span>Copy/Paste node</span>
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
            onNodeClick={(_, node) => { setSelectedNode(node); setSelectedEdge(null); }}
            onEdgeClick={(_, edge) => { setSelectedEdge(edge); setSelectedNode(null); }}
            onPaneClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
            onDrop={onDrop} onDragOver={onDragOver}
            isValidConnection={isValidConnection}
            fitView
            snapToGrid={snapToGrid}
            snapGrid={[20, 20]}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#7c3aed50', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#7c3aed60', width: 12, height: 12 },
            }}
            proOptions={{ hideAttribution: true }}
            className="!bg-[#0a0a14]"
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Shift"
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

          {/* Validation message toast */}
          {validationMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[12px] font-medium shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />{validationMsg}
            </div>
          )}

          {/* Simulation overlay */}
          {simulating && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#1a1a2e] border border-amber-500/20 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-amber-400/80 text-[12px] font-medium">
                <Play className="w-3.5 h-3.5" /> Simulation
              </div>
              <div className="h-4 w-px bg-white/[0.08]" />
              <div className="flex items-center gap-1.5">
                <button onClick={() => setSimStep(s => Math.max(0, s - 1))} disabled={simStep === 0}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-white/40 hover:text-white/70 text-[11px] disabled:opacity-20 transition-all">
                  Prev
                </button>
                <span className="text-[12px] text-white/40 font-mono min-w-[60px] text-center">{simStep + 1} / {nodes.length}</span>
                <button onClick={() => setSimStep(s => Math.min(nodes.length - 1, s + 1))} disabled={simStep >= nodes.length - 1}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-white/40 hover:text-white/70 text-[11px] disabled:opacity-20 transition-all">
                  Next
                </button>
              </div>
              <div className="h-4 w-px bg-white/[0.08]" />
              <button onClick={() => setSimulating(false)}
                className="text-[11px] text-red-400/60 hover:text-red-400 transition-all px-2 py-1">
                Exit
              </button>
            </div>
          )}

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

        {/* ── Edge Properties Panel ── */}
        {selectedEdge && !selectedNode && (
          <div className="w-[320px] border-l border-white/[0.05] bg-[#0c0c18]/95 backdrop-blur-xl flex flex-col z-20 flex-shrink-0 animate-in slide-in-from-right-5 duration-200">
            <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.05]">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white/80">Edge</div>
                  <div className="text-[10px] text-white/25 font-mono">{selectedEdge.source} → {selectedEdge.target}</div>
                </div>
              </div>
              <button onClick={() => setSelectedEdge(null)} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/25 hover:text-white/60 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <PropSection label="Edge Label">
                <Input value={selectedEdge.label || ''} onChange={(e) => {
                  const label = e.target.value;
                  setEdges((eds) => eds.map(ed => ed.id === selectedEdge.id ? { ...ed, label, style: { ...ed.style }, animated: ed.animated } : ed));
                  setSelectedEdge({ ...selectedEdge, label });
                }}
                  className="bg-white/[0.03] border-white/[0.06] text-white/80 text-[12px] rounded-xl h-10 focus:border-cyan-500/30"
                  placeholder="e.g. Success path" />
              </PropSection>
              <PropSection label="Edge Style">
                <select value={(selectedEdge.style as any)?.stroke || '#7c3aed'}
                  onChange={(e) => {
                    const color = e.target.value;
                    setEdges((eds) => eds.map(ed => ed.id === selectedEdge.id ? { ...ed, style: { ...ed.style as any, stroke: color } } : ed));
                    setSelectedEdge({ ...selectedEdge, style: { ...selectedEdge.style as any, stroke: color } });
                  }}
                  className="w-full h-10 px-3 bg-white/[0.03] border border-white/[0.06] text-white/70 text-[12px] rounded-xl">
                  <option value="#7c3aed">Violet</option>
                  <option value="#22c55e">Green</option>
                  <option value="#ef4444">Red</option>
                  <option value="#f59e0b">Amber</option>
                  <option value="#06b6d4">Cyan</option>
                  <option value="#ec4899">Pink</option>
                  <option value="#ffffff">White</option>
                </select>
              </PropSection>
              <PropSection label="Animated">
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => {
                    const anim = !selectedEdge.animated;
                    setEdges((eds) => eds.map(ed => ed.id === selectedEdge.id ? { ...ed, animated: anim } : ed));
                    setSelectedEdge({ ...selectedEdge, animated: anim });
                  }}
                    className={`px-4 py-2 rounded-xl text-[12px] font-medium transition-all ${selectedEdge.animated ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/[0.03] text-white/40 border border-white/[0.06]'}`}>
                    {selectedEdge.animated ? 'On' : 'Off'}
                  </button>
                  <button onClick={() => {
                    // Delete edge
                    setEdges((eds) => eds.filter(ed => ed.id !== selectedEdge.id));
                    setSelectedEdge(null);
                  }}
                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-[12px] font-medium border border-red-500/20 hover:bg-red-500/20 transition-all">
                    Delete Edge
                  </button>
                </div>
              </PropSection>
            </div>
          </div>
        )}

        {/* ── Right Panel — Node Properties ── */}
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
              {(selectedNode.type === 'set_variable' || selectedNode.type === 'setvar') && (<>
                <PropSection label="Variable Name">
                  <Input value={selectedNode.data.name || selectedNode.data.variable || ''}
                    onChange={(e) => { updateNodeData('name', e.target.value); updateNodeData('variable', e.target.value); }}
                    className="bg-white/[0.03] border-white/[0.06] text-cyan-400/90 text-[12px] font-mono rounded-xl h-10 focus:border-cyan-500/30" placeholder="e.g. status" />
                </PropSection>
                <PropSection label="Value" hint="Use {{variable}} for substitution">
                  <Input value={selectedNode.data.value} onChange={(e) => updateNodeData('value', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] rounded-xl h-10 focus:border-cyan-500/30" placeholder="e.g. active or {{user.name}}" />
                </PropSection>
              </>)}

              {/* -- DTMF -- */}
              {selectedNode.type === 'dtmf' && (<>
                <PropSection label="Prompt">
                  <Textarea value={selectedNode.data.prompt} onChange={(e) => updateNodeData('prompt', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/80 text-[12px] rounded-xl min-h-[80px] focus:border-orange-500/30"
                    placeholder="Press 1 for sales, 2 for support" />
                </PropSection>
                <PropSection label="Save digits as">
                  <Input value={selectedNode.data.variable} onChange={(e) => updateNodeData('variable', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-orange-400/90 text-[12px] font-mono rounded-xl h-10 focus:border-orange-500/30"
                    placeholder="e.g. menu_choice" />
                </PropSection>
                <PropSection label="Routes (digit → handle)" hint="Each entry creates a routing handle on the node">
                  <div className="space-y-2">
                    {Object.entries(selectedNode.data.routes || {}).map(([digit, handle]) => (
                      <div key={digit} className="flex gap-2 items-center">
                        <Input value={digit} disabled className="bg-white/[0.02] border-white/[0.04] text-orange-400 text-[11px] font-mono rounded-lg h-9 w-16" />
                        <Input value={String(handle)}
                          onChange={(e) => {
                            const routes = { ...(selectedNode.data.routes || {}), [digit]: e.target.value };
                            updateNodeData('routes', routes);
                          }}
                          className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[11px] rounded-lg h-9 flex-1" />
                        <button type="button" title="Remove digit route" onClick={() => {
                          const r = { ...(selectedNode.data.routes || {}) }; delete r[digit];
                          updateNodeData('routes', r);
                        }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => {
                      const existing = Object.keys(selectedNode.data.routes || {});
                      const next = ['1','2','3','4','5','6','7','8','9','0','*','#'].find(d => !existing.includes(d)) || 'x';
                      updateNodeData('routes', { ...(selectedNode.data.routes || {}), [next]: `route_${next}` });
                    }} className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1.5">
                      <Plus className="w-3 h-3" /> Add digit route
                    </button>
                  </div>
                </PropSection>
              </>)}

              {/* -- LLM -- */}
              {selectedNode.type === 'llm' && (<>
                <PropSection label="System Prompt">
                  <Textarea value={selectedNode.data.system} onChange={(e) => updateNodeData('system', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/80 text-[12px] rounded-xl min-h-[80px] focus:border-purple-500/30"
                    placeholder="You are a helpful voice agent." />
                </PropSection>
                <PropSection label="User Prompt (uses transcript if empty)">
                  <Textarea value={selectedNode.data.prompt} onChange={(e) => updateNodeData('prompt', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/80 text-[12px] rounded-xl min-h-[60px] focus:border-purple-500/30" />
                </PropSection>
                <PropSection label="Model">
                  <Select value={selectedNode.data.model || 'llama-3.1-8b-instant'} onValueChange={(v) => updateNodeData('model', v)}>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] rounded-xl h-10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/[0.08] text-white/80 rounded-xl">
                      <SelectItem value="llama-3.1-8b-instant">Llama 3.1 8B (fast)</SelectItem>
                      <SelectItem value="llama-3.3-70b-versatile">Llama 3.3 70B (smart)</SelectItem>
                      <SelectItem value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B</SelectItem>
                      <SelectItem value="openai/gpt-oss-20b">GPT-OSS 20B</SelectItem>
                    </SelectContent>
                  </Select>
                </PropSection>
                <PropSection label="Save response as variable">
                  <Input value={selectedNode.data.resultVariable} onChange={(e) => updateNodeData('resultVariable', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-purple-400/80 text-[12px] font-mono rounded-xl h-10 focus:border-purple-500/30"
                    placeholder="e.g. agent_reply" />
                </PropSection>
              </>)}

              {/* -- Switch (multi-case) -- */}
              {selectedNode.type === 'switch' && (<>
                <PropSection label="Variable to test">
                  <Input value={selectedNode.data.variable} onChange={(e) => updateNodeData('variable', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-sky-400/90 text-[12px] font-mono rounded-xl h-10 focus:border-sky-500/30" />
                </PropSection>
                <PropSection label="Cases" hint="Each case becomes a routing handle. Unmatched values fall through to 'default'.">
                  <div className="space-y-2">
                    {(Array.isArray(selectedNode.data.cases) ? selectedNode.data.cases : []).map((c: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input value={c.value}
                          onChange={(e) => {
                            const cases = [...selectedNode.data.cases];
                            cases[idx] = { ...cases[idx], value: e.target.value };
                            updateNodeData('cases', cases);
                          }}
                          className="bg-white/[0.03] border-white/[0.06] text-sky-400/90 text-[11px] font-mono rounded-lg h-9 flex-1" />
                        <button type="button" title="Remove case" onClick={() => {
                          const cases = selectedNode.data.cases.filter((_: any, i: number) => i !== idx);
                          updateNodeData('cases', cases);
                        }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => {
                      const cases = Array.isArray(selectedNode.data.cases) ? selectedNode.data.cases : [];
                      updateNodeData('cases', [...cases, { value: `case_${cases.length + 1}` }]);
                    }} className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1.5">
                      <Plus className="w-3 h-3" /> Add case
                    </button>
                  </div>
                </PropSection>
              </>)}

              {/* -- Extract -- */}
              {selectedNode.type === 'extract' && (<>
                <PropSection label="Schema fields">
                  <div className="space-y-2">
                    {(Array.isArray(selectedNode.data.schema) ? selectedNode.data.schema : []).map((f: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input value={f.name}
                          onChange={(e) => {
                            const schema = [...selectedNode.data.schema];
                            schema[idx] = { ...schema[idx], name: e.target.value };
                            updateNodeData('schema', schema);
                          }}
                          className="bg-white/[0.03] border-white/[0.06] text-teal-400/90 text-[11px] font-mono rounded-lg h-9 flex-1" placeholder="field name" />
                        <Select value={f.type || 'string'}
                          onValueChange={(v) => {
                            const schema = [...selectedNode.data.schema];
                            schema[idx] = { ...schema[idx], type: v };
                            updateNodeData('schema', schema);
                          }}>
                          <SelectTrigger className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[11px] rounded-lg h-9 w-24"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1a1a2e] border-white/[0.08] text-white/80 rounded-xl">
                            <SelectItem value="string">string</SelectItem>
                            <SelectItem value="number">number</SelectItem>
                            <SelectItem value="boolean">boolean</SelectItem>
                            <SelectItem value="array">array</SelectItem>
                            <SelectItem value="enum">enum</SelectItem>
                          </SelectContent>
                        </Select>
                        <button type="button" title="Remove field" onClick={() => {
                          const schema = selectedNode.data.schema.filter((_: any, i: number) => i !== idx);
                          updateNodeData('schema', schema);
                        }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => {
                      const schema = Array.isArray(selectedNode.data.schema) ? selectedNode.data.schema : [];
                      updateNodeData('schema', [...schema, { name: `field_${schema.length + 1}`, type: 'string' }]);
                    }} className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1.5">
                      <Plus className="w-3 h-3" /> Add field
                    </button>
                  </div>
                </PropSection>
                <PropSection label="Save to variable">
                  <Input value={selectedNode.data.resultVariable} onChange={(e) => updateNodeData('resultVariable', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-teal-400/80 text-[12px] font-mono rounded-xl h-10 focus:border-teal-500/30"
                    placeholder="e.g. extracted" />
                </PropSection>
              </>)}

              {/* -- Transfer Agent (Squad) -- */}
              {selectedNode.type === 'transfer_agent' && (<>
                <PropSection label="Destination Agent ID" hint="The MongoDB _id of the agent to hand off to">
                  <Input value={selectedNode.data.agentId} onChange={(e) => updateNodeData('agentId', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-fuchsia-400/90 text-[12px] font-mono rounded-xl h-10 focus:border-fuchsia-500/30"
                    placeholder="65a..." />
                </PropSection>
                <PropSection label="Display Name (optional)">
                  <Input value={selectedNode.data.agentName} onChange={(e) => updateNodeData('agentName', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] rounded-xl h-10 focus:border-fuchsia-500/30"
                    placeholder="e.g. Billing Specialist" />
                </PropSection>
                <PropSection label="Reason">
                  <Input value={selectedNode.data.reason} onChange={(e) => updateNodeData('reason', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-white/70 text-[12px] rounded-xl h-10 focus:border-fuchsia-500/30" />
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

              {/* -- Comment / Note -- */}
              {selectedNode.type === 'comment' && (
                <PropSection label="Note Text">
                  <Textarea value={selectedNode.data.text} onChange={(e) => updateNodeData('text', e.target.value)}
                    className="bg-white/[0.03] border-white/[0.06] text-yellow-400/80 text-[12px] rounded-xl min-h-[120px] placeholder:text-white/20 focus:border-yellow-500/30 font-mono italic"
                    placeholder="Add documentation notes here..." />
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
