# Vocred Frontend Analysis

## What This Project Is

Vocred is a Next.js frontend for a voice-AI platform. The app is built around a few core user journeys:

- Authenticate and enter the platform
- Create and manage AI agents
- Test agents in live voice or text mode
- Review calls, chats, analytics, and usage
- Configure telephony, LLM, TTS, webhooks, CRM, knowledge base, and campaign features
- Expose a public embeddable web widget
- Provide a super-admin console for platform-wide management

The frontend is not a mock-only UI. Most pages are wired to API calls and expect a backend at `NEXT_PUBLIC_API_URL` or the local fallback `http://localhost:5000/api`.

## High-Level Architecture

- Framework: Next.js App Router
- UI: React 19, Tailwind CSS 4, shadcn/ui, Radix UI
- Motion and charts: Framer Motion, Recharts, XyFlow
- Forms and validation: react-hook-form, zod
- Notifications: react-hot-toast, Sonner-related UI pieces
- Auth/session: localStorage plus backend validation
- Realtime voice: WebSocket sessions and browser audio APIs

The app is wrapped in `ThemeProvider` and `AuthProvider`, then rendered through `AppShell`.

## Root Flow

The root layout is in [`app/layout.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/layout.tsx). It:

- Loads the global CSS
- Mounts the theme provider
- Mounts the auth provider
- Mounts the app shell
- Adds the toast container and Vercel analytics

The main route tree is:

- `/` landing page
- `/auth/login`
- `/auth/register`
- authenticated product routes under `/dashboard`, `/agents`, `/numbers`, and the rest

The auth experience is mostly client-side. The frontend stores `token` and `user` in localStorage, then uses those values to decide routing.

## Route Map

| Route | Purpose | Main data source / behavior |
| --- | --- | --- |
| `/` | Premium landing page | Static marketing page with animated hero, pricing, testimonials, CTA |
| `/auth/login` | Sign-in page | Calls `authApi.login`, stores token/user in localStorage |
| `/auth/register` | Sign-up page | Calls `authApi.register`, stores token/user in localStorage |
| `/dashboard` | Product overview | Pulls stats, recent calls, and quick actions |
| `/agents` | Agent management | Fetches agents, filters, sorts, deletes, navigates to create/edit |
| `/agents/new` | Create agent | Uses `AgentForm`, optional template prefill |
| `/agents/[id]/edit` | Edit agent | Loads agent by id, reuses `AgentForm` |
| `/agent-templates` | Template gallery | One-click deploy or prefilled agent creation |
| `/numbers` | Phone number management | Fetches numbers, buy modal, assign/unassign agent |
| `/logs` | Call history | Filtered call table with detail drawer and recordings |
| `/chats` | Chat-style conversation history | Reuses call logs but filters WhatsApp/text interactions |
| `/analytics` | KPI and charts | Aggregated metrics, time series, pie charts, top agents |
| `/usage` | Usage limits and consumption | Calls, LLM requests, STT minutes, TTS chars |
| `/settings` | API key and integration config | LLM, STT, TTS, telephony, webhook tests |
| `/voice-settings` | Voice preview and outbound calling | Preview TTS voices, start Twilio outbound calls |
| `/test-agent` | Live voice agent test harness | WebSocket voice session, mic capture, transcript, sentiment |
| `/test-webrtc` | WebRTC test page | Signaling over WebSocket, peer connection, audio stats |
| `/playground` | Prompt playground | Text-only LLM test and A/B prompt comparison |
| `/call-flows` | Flow list | Fetch, create, delete flows |
| `/call-flows/[id]` | Advanced visual flow editor | XyFlow drag/drop editor with node properties |
| `/call-flow` | Simpler flow builder | Separate template-based node builder, not the same as `/call-flows/[id]` |
| `/knowledge-base` | RAG knowledge base manager | Text, URL, and file ingestion plus test search |
| `/campaigns` | Outbound campaign manager | Create/start/pause/delete campaigns from phone lists |
| `/crm` | Leads and support tickets | CRUD for leads and tickets, CSV export |
| `/webhooks` | Webhook manager and docs | Create/edit/test webhooks, see delivery logs |
| `/web-widget` | Widget builder and preview | Generates embed snippet and live iframe preview |
| `/widget` | Public embeddable voice widget | Connects to backend widget session and WebSocket voice stream |
| `/active-calls` | Active call monitoring | Polls active calls every 5 seconds |
| `/super-admin` | Platform-wide admin console | Users, plans, calls, and global KPIs |

## Authentication Flow

Auth lives in [`components/providers/auth-provider.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/components/providers/auth-provider.tsx).

What it does:

- Restores `token` and `user` from localStorage on mount
- Calls `authApi.getMe()` to validate the session
- Exposes `login`, `register`, `logout`, and `refreshUser`
- Redirects on logout to `/auth/login`

Important detail:

- This is not server-side protected auth.
- Route decisions are made in the client shell and in page components using localStorage and `useAuth()`.

Login and registration pages both call the backend directly and then store the returned session in localStorage.

## Route Shell And Protection

[`components/layout/app-shell.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/components/layout/app-shell.tsx) decides whether to show the public pages or the authenticated app chrome.

Behavior:

- Auth pages and widget routes render without sidebar/navbar
- Other routes render inside the sidebar + navbar shell
- Super-admin users are pushed to `/super-admin` and blocked from most customer routes

This is a client-side gate. It improves UX, but the backend still needs to enforce real access control.

## Theme System

Theme handling is in [`components/providers/theme-provider.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/components/providers/theme-provider.tsx).

Flow:

- Reads `theme` from localStorage
- Falls back to system preference
- Toggles the `dark` class on `<html>`
- Persists user choice

The app uses a polished purple/cyan visual language in most screens, while `app/globals.css` defines the design tokens used by Tailwind.

## Backend Integration Pattern

The central API client is [`lib/api.ts`](/R:/Projects/datatrack projects/vocred frontend/Vocred/lib/api.ts).

Key behavior:

- Uses `NEXT_PUBLIC_API_URL` or `http://localhost:5000/api`
- Automatically attaches the bearer token from localStorage
- Normalizes JSON requests and throws on non-OK responses
- Exposes grouped API modules for auth, agents, numbers, calls, analytics, knowledge base, settings, campaigns, webhooks, Twilio, usage, CRM, super-admin, and storage
- Opens voice WebSocket sessions with `createVoiceSession()`

The frontend assumes the backend provides:

- `/auth/*`
- `/agents/*`
- `/numbers/*`
- `/calls/*`
- `/analytics/*`
- `/knowledge-base/*`
- `/settings/*`
- `/campaigns/*`
- `/webhooks/*`
- `/crm/*`
- `/usage/*`
- `/super-admin/*`
- `/widget/*`
- `/voice-preview`
- `/twilio/*`

## Main User Journey

1. User lands on `/`.
2. User signs up or logs in.
3. Session is saved in localStorage.
4. Authenticated pages render through the app shell.
5. User creates an agent, connects a knowledge base or call flow, and configures voice/LLM settings.
6. User tests the agent in `/test-agent` or `/playground`.
7. User buys numbers, launches campaigns, monitors logs, and reviews analytics.
8. User can embed the widget externally or manage platform settings and webhooks.

## Core Feature Areas

### Dashboard

[`app/dashboard/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/dashboard/page.tsx) combines:

- Greeting hero
- Stats cards
- Quick actions
- Recent calls table
- Onboarding/help panel

It is the main “home” screen after login.

### Agents

The agent system is centered around:

- [`app/agents/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/agents/page.tsx)
- [`app/agents/new/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/agents/new/page.tsx)
- [`app/agents/[id]/edit/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/agents/[id]/edit/page.tsx)
- [`components/agents/agent-form.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/components/agents/agent-form.tsx)
- [`lib/agentTemplates.ts`](/R:/Projects/datatrack projects/vocred frontend/Vocred/lib/agentTemplates.ts)

What an agent contains:

- Identity and prompt
- Voice provider and voice ID
- LLM provider and model
- Temperature and max duration
- Knowledge base attachment
- Workflow attachment
- Tool/function definitions
- Transfer/handoff settings
- Voicemail behavior
- Post-call SMS and WhatsApp actions

The form is organized into tabs:

- Identity
- Intelligence
- Voice & Audio
- Call Routing
- Tools
- Post-Call

The templates page can:

- Prefill a new agent form
- Create an agent immediately from a template

### Call Flows

There are two flow builders:

- `/call-flows/[id]` is the advanced XyFlow editor
- `/call-flow` is a simpler card-based builder with templates

The advanced editor supports:

- Drag/drop nodes
- Node properties panel
- Multiple node types
- Save/update to backend

Node types in the advanced editor include:

- Trigger
- Speak
- Gather input
- Condition
- Set variable
- Wait
- Transfer
- Webhook
- End

### Voice Testing

[`app/test-agent/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/test-agent/page.tsx) is the most important realtime flow in the app.

Flow:

- User selects an active agent
- App opens a WebSocket voice session
- Browser microphone is captured and streamed
- Backend sends transcript, response text, audio, sentiment, latency, and transfer events
- UI renders transcript, call status, timers, and sentiment history
- User can also type messages or run a scripted simulation

[`app/widget/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/widget/page.tsx) and [`app/web-widget/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/web-widget/page.tsx) expose the same experience in embeddable form.

### Analytics, Logs, and Usage

These three screens show different slices of the same call activity:

- `/logs` shows detailed call history with filtering and call detail drawer
- `/chats` filters the same call data down to WhatsApp/text style conversations
- `/analytics` renders aggregate charts and KPIs
- `/usage` shows quota-style consumption across LLM, calls, STT, and TTS

The log detail panel is especially rich:

- Summary
- Sentiment
- Urgency
- Transfer information
- Topics and decisions
- Action items
- Sentiment timeline
- Notifications sent
- Transcript
- Recording playback
- Extracted data

### Numbers And Telephony

[`app/numbers/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/numbers/page.tsx) plus the buy modal and table manage phone numbers.

The flow is:

- Fetch numbers from backend
- Normalize backend `_id` into frontend `id`
- Buy a number from a mocked country/type picker
- Create the number in backend
- Optionally assign it to an agent
- Delete or reassign later

[`app/voice-settings/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/voice-settings/page.tsx) lets users:

- Preview TTS voices
- Change speed
- Trigger outbound Twilio calls

### Knowledge Base And CRM

The knowledge base manager supports:

- Text ingestion
- URL ingestion
- PDF/TXT upload
- RAG search testing

The CRM page supports:

- Leads CRUD
- Support tickets CRUD
- Status editing
- Resolution handling
- CSV export

These are both fed by AI interaction and back-office workflows.

### Webhooks, Campaigns, And Widget

Webhook management includes:

- CRUD for webhook endpoints
- Toggle active/inactive
- Secret display and regeneration
- Test delivery
- Event selection
- Delivery logs
- Documentation tab with payload examples

Campaigns allow:

- Create a campaign from an agent and a number list
- Start, pause, or delete it
- Observe progress and status

The web widget flow is:

- Select an agent
- Generate an embed snippet
- Preview the widget in an iframe
- Switch color, button label, and position

### Super Admin

[`app/super-admin/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/super-admin/page.tsx) is a separate console for platform operators.

It provides:

- Platform KPIs
- User search
- User detail inspection
- Plan changes
- User deletion
- Global calls view

Access is limited to users with `role === 'super_admin'`.

## Important Implementation Notes

- The docs in the repo are partially outdated. For example, the current landing page is `/`, not `/auth/landing`.
- A lot of UI is production-style, but many features still depend on backend endpoints being present and returning the expected shapes.
- There are some duplicate or overlapping surfaces:
  - `app/call-flow/page.tsx` and `app/call-flows/[id]/page.tsx` both deal with flows, but they are not the same editor.
  - The analytics, logs, and chats screens reuse the same call record model differently.
- The design language is intentionally different between pages:
  - Marketing/landing is highly cinematic
  - Dashboard and product pages are cleaner SaaS style
  - Super-admin is dark and console-like

## What To Know First If You Are New To The Codebase

If you want to understand the app fastest, read these files in this order:

1. [`app/layout.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/layout.tsx)
2. [`components/providers/auth-provider.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/components/providers/auth-provider.tsx)
3. [`components/layout/app-shell.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/components/layout/app-shell.tsx)
4. [`lib/api.ts`](/R:/Projects/datatrack projects/vocred frontend/Vocred/lib/api.ts)
5. [`app/dashboard/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/dashboard/page.tsx)
6. [`components/agents/agent-form.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/components/agents/agent-form.tsx)
7. [`app/test-agent/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/test-agent/page.tsx)
8. [`app/call-flows/[id]/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/call-flows/[id]/page.tsx)
9. [`app/settings/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/settings/page.tsx)
10. [`app/webhooks/page.tsx`](/R:/Projects/datatrack projects/vocred frontend/Vocred/app/webhooks/page.tsx)

## Summary

The frontend is a full SaaS control plane for a voice AI platform. It combines marketing, auth, agent creation, realtime testing, telephony, analytics, CRM, knowledge base, webhooks, campaigns, widget embedding, and super-admin tooling into one app shell. The most important mental model is that the frontend is mostly a client-side orchestrator over a backend API and WebSocket voice service.

