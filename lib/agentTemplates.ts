// Agent Templates Configuration
export interface AgentTemplate {
  id: string
  name: string
  category: string
  description: string
  icon: string
  color: string
  badge?: string
  features: string[]
  config: {
    name: string
    systemPrompt: string
    firstMessage: string
    voiceProvider: string
    voiceId: string
    language: string
    llmProvider: string
    llmModel: string
    temperature: number
    maxDuration: number
    toolsJson?: string
    knowledgeBaseId?: string
    workflowId?: string
    customLlmUrl?: string
    transferToAgentId?: string
    voiceSpeed?: number
    interruptionSensitivity?: number
    backgroundDenoising?: string
    fillerWords?: boolean
    ambientNoise?: string
    transferNumber?: string
    voicemailMessage?: string
    sendSMS?: boolean
    sendWhatsApp?: boolean
    smsTemplate?: string
    whatsappTemplate?: string
  }
}

export const agentTemplates: AgentTemplate[] = [
  {
    id: 'sales-lead',
    name: 'Sales Lead Generation',
    category: 'Sales',
    description: 'Outbound agent that qualifies leads, collects budgets, and books sales calls.',
    icon: 'Users',
    color: 'from-blue-500 to-cyan-500',
    badge: 'Most Popular',
    features: ['Budget Collection', 'Calendar Booking', 'CRM Sync'],
    config: {
      name: 'Sales Lead Generator',
      systemPrompt: `You are a professional sales development representative. Your goal is to qualify leads and book appointments.

Key responsibilities:
- Qualify leads by understanding their needs, budget, and timeline
- Collect contact information and decision-maker details
- Book appointments with the sales team
- Maintain a professional and friendly tone
- Handle objections gracefully
- Follow a structured qualification process

Qualification questions to ask:
1. What challenges are you currently facing?
2. What's your budget range for this solution?
3. What's your timeline for implementation?
4. Who are the key decision-makers?
5. What solutions have you tried before?

Always end by scheduling a follow-up call if they're qualified.`,
      firstMessage: 'Hi, this is {{agentName}} from {{company}}. I\'m reaching out because we\'ve helped companies like yours improve their sales process. Do you have a quick 2 minutes to see if we can help you too?',
      voiceProvider: 'edge-tts',
      voiceId: 'en-US-JennyNeural',
      language: 'en',
      llmProvider: 'groq',
      llmModel: 'llama-3.1-8b-instant',
      temperature: 0.7,
      maxDuration: 600,
      voiceSpeed: 1.1,
      interruptionSensitivity: 0.6,
      backgroundDenoising: 'default',
      fillerWords: true,
      ambientNoise: 'office',
      sendSMS: true,
      smsTemplate: 'Thanks for speaking with {{agentName}}! We\'ve scheduled a follow-up call. Summary: {{summary}}',
      whatsappTemplate: '*Sales Lead Qualified*\n\nAgent: {{agentName}}\nLead: {{name}}\nBudget: {{budget}}\nTimeline: {{timeline}}\n\n{{summary}}',
      toolsJson: JSON.stringify([
        {
          type: "function",
          function: {
            name: "book_appointment",
            description: "Book a sales appointment",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                datetime: { type: "string" },
                budget: { type: "string" },
                company: { type: "string" }
              },
              required: ["name", "phone", "datetime"]
            }
          }
        }
      ])
    }
  },
  {
    id: 'service-request',
    name: 'Customer Service Request',
    category: 'Support',
    description: 'Handles incoming complaints, generates ticket IDs, and escalates to human agents.',
    icon: 'Ticket',
    color: 'from-indigo-500 to-purple-500',
    badge: 'Essential',
    features: ['Ticket Creation', 'Human Escalation', 'Sentiment Analysis'],
    config: {
      name: 'Customer Service Agent',
      systemPrompt: `You are a professional customer service representative. Your goal is to resolve customer issues efficiently and escalate when necessary.

Key responsibilities:
- Listen carefully to customer issues
- Generate unique ticket IDs for tracking
- Attempt to resolve common issues first
- Escalate complex issues to human agents
- Maintain empathy and professionalism
- Document all interactions

Process:
1. Greet the customer warmly
2. Listen to their issue completely
3. Generate a ticket ID
4. Attempt resolution based on knowledge base
5. If unresolved, escalate to human agent
6. Confirm resolution or next steps

Always maintain a calm, empathetic tone even with upset customers.`,
      firstMessage: 'Thank you for calling {{company}} customer service. My name is {{agentName}}. How can I help you today?',
      voiceProvider: 'edge-tts',
      voiceId: 'en-US-JennyNeural',
      language: 'en',
      llmProvider: 'groq',
      llmModel: 'llama-3.1-8b-instant',
      temperature: 0.5,
      maxDuration: 900,
      voiceSpeed: 1.0,
      interruptionSensitivity: 0.4,
      backgroundDenoising: 'default',
      fillerWords: false,
      ambientNoise: 'none',
      sendSMS: true,
      smsTemplate: 'Your ticket {{ticketId}} has been created. We\'ll contact you soon. Summary: {{summary}}',
      whatsappTemplate: '*Support Ticket Created*\n\nTicket ID: {{ticketId}}\nAgent: {{agentName}}\nIssue: {{issue}}\nStatus: {{status}}\n\n{{summary}}',
      toolsJson: JSON.stringify([
        {
          type: "function",
          function: {
            name: "create_ticket",
            description: "Create a support ticket",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                issue: { type: "string" },
                priority: { type: "string", enum: ["Low", "Medium", "High"] }
              },
              required: ["name", "phone", "issue"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "escalate_to_human",
            description: "Escalate to human agent",
            parameters: {
              type: "object",
              properties: {
                ticketId: { type: "string" },
                reason: { type: "string" },
                urgency: { type: "string" }
              },
              required: ["ticketId", "reason"]
            }
          }
        }
      ])
    }
  },
  {
    id: 'appointment-setter',
    name: 'Clinic Appointment Setter',
    category: 'Healthcare',
    description: 'Empathetic agent to book, reschedule, or cancel doctor appointments.',
    icon: 'HeartPulse',
    color: 'from-rose-500 to-pink-500',
    features: ['Empathetic Voice', 'Slot Checking', 'Reminders'],
    config: {
      name: 'Medical Appointment Coordinator',
      systemPrompt: `You are a compassionate medical appointment coordinator. Your goal is to help patients schedule, reschedule, or cancel appointments with care and empathy.

Key responsibilities:
- Help patients book appointments with appropriate doctors
- Check available time slots
- Handle rescheduling requests gracefully
- Collect necessary patient information
- Send appointment confirmations
- Maintain HIPAA compliance and confidentiality

Important guidelines:
- Always speak with empathy and care
- Never give medical advice
- Confirm all appointment details
- Collect insurance information if needed
- Remind patients to bring ID and insurance cards
- Follow up with appointment reminders

Process:
1. Greet patient warmly
2. Understand their medical needs
3. Check doctor availability
4. Offer suitable time slots
5. Collect patient information
6. Confirm appointment details
7. Set up reminders`,
      firstMessage: 'Hello, this is {{agentName}} from {{clinic}}. How can I help you schedule your appointment today?',
      voiceProvider: 'edge-tts',
      voiceId: 'en-US-JennyNeural',
      language: 'en',
      llmProvider: 'groq',
      llmModel: 'llama-3.1-8b-instant',
      temperature: 0.6,
      maxDuration: 480,
      voiceSpeed: 0.9,
      interruptionSensitivity: 0.5,
      backgroundDenoising: 'default',
      fillerWords: true,
      ambientNoise: 'none',
      sendSMS: true,
      smsTemplate: 'Your appointment with {{doctor}} is confirmed for {{date}} at {{time}}. Please arrive 15 mins early.',
      whatsappTemplate: '*Appointment Confirmed*\n\nPatient: {{name}}\nDoctor: {{doctor}}\nDate: {{date}}\nTime: {{time}}\nClinic: {{clinic}}\n\nPlease bring ID and insurance card.',
      toolsJson: JSON.stringify([
        {
          type: "function",
          function: {
            name: "check_availability",
            description: "Check doctor availability",
            parameters: {
              type: "object",
              properties: {
                doctor: { type: "string" },
                date: { type: "string" },
                appointmentType: { type: "string" }
              },
              required: ["doctor", "date"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "book_appointment",
            description: "Book medical appointment",
            parameters: {
              type: "object",
              properties: {
                patientName: { type: "string" },
                phone: { type: "string" },
                doctor: { type: "string" },
                datetime: { type: "string" },
                appointmentType: { type: "string" },
                insurance: { type: "string" }
              },
              required: ["patientName", "phone", "doctor", "datetime"]
            }
          }
        }
      ])
    }
  },
  {
    id: 'real-estate',
    name: 'Real Estate Assistant',
    category: 'Real Estate',
    description: 'Answers property queries, schedules site visits, and captures buyer requirements.',
    icon: 'Building2',
    color: 'from-emerald-500 to-teal-500',
    features: ['Property FAQs', 'Site Visit Booking', 'Lead Capture'],
    config: {
      name: 'Real Estate Assistant',
      systemPrompt: `You are a knowledgeable real estate assistant. Your goal is to help potential buyers find their dream property and schedule site visits.

Key responsibilities:
- Answer property-related questions
- Collect buyer requirements and preferences
- Schedule property site visits
- Provide basic property information
- Capture lead details for follow-up
- Coordinate with real estate agents

Information to collect:
- Budget range
- Preferred location/area
- Property type (house, apartment, commercial)
- Number of bedrooms/bathrooms
- Move-in timeline
- Special requirements

Process:
1. Greet potential buyer
2. Understand their requirements
3. Suggest suitable properties
4. Provide property details
5. Schedule site visits
6. Capture contact information
7. Follow up with property details`,
      firstMessage: 'Hi, this is {{agentName}} from {{agency}}. I\'m here to help you find your perfect property. What type of property are you looking for?',
      voiceProvider: 'edge-tts',
      voiceId: 'en-US-JennyNeural',
      language: 'en',
      llmProvider: 'groq',
      llmModel: 'llama-3.1-8b-instant',
      temperature: 0.7,
      maxDuration: 600,
      voiceSpeed: 1.0,
      interruptionSensitivity: 0.5,
      backgroundDenoising: 'default',
      fillerWords: true,
      ambientNoise: 'office',
      sendSMS: true,
      smsTemplate: 'Property viewing scheduled! {{property}} on {{date}} at {{time}}. Address: {{address}}',
      whatsappTemplate: '*Property Viewing Scheduled*\n\nProperty: {{property}}\nDate: {{date}}\nTime: {{time}}\nAddress: {{address}}\nAgent: {{agentName}}\n\n{{propertyDetails}}',
      toolsJson: JSON.stringify([
        {
          type: "function",
          function: {
            name: "search_properties",
            description: "Search for properties",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" },
                budget: { type: "string" },
                propertyType: { type: "string" },
                bedrooms: { type: "number" },
                bathrooms: { type: "number" }
              },
              required: ["location", "budget"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "schedule_visit",
            description: "Schedule property visit",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string" },
                phone: { type: "string" },
                propertyId: { type: "string" },
                datetime: { type: "string" },
                email: { type: "string" }
              },
              required: ["name", "phone", "propertyId", "datetime"]
            }
          }
        }
      ])
    }
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Order Tracker',
    category: 'Sales',
    description: 'Provides live updates on order status and handles return requests.',
    icon: 'ShoppingCart',
    color: 'from-orange-500 to-amber-500',
    features: ['API Webhooks', 'Return Processing', 'Order Tracking'],
    config: {
      name: 'E-commerce Support Agent',
      systemPrompt: `You are an e-commerce customer support agent specializing in order tracking and returns. Your goal is to provide excellent service for online shoppers.

Key responsibilities:
- Track order status and provide updates
- Handle return and exchange requests
- Answer product questions
- Process refund requests
- Coordinate with warehouse/shipping
- Handle delivery issues

Process:
1. Verify customer identity
2. Check order status
3. Provide accurate updates
4. Handle return requests if needed
5. Process refunds/exchanges
6. Follow up on resolutions

Always be helpful and patient with customers. Provide clear timelines and next steps.`,
      firstMessage: 'Thank you for calling {{company}} support. I\'m {{agentName}} and I can help you track your order or process returns. How can I assist you?',
      voiceProvider: 'edge-tts',
      voiceId: 'en-US-JennyNeural',
      language: 'en',
      llmProvider: 'groq',
      llmModel: 'llama-3.1-8b-instant',
      temperature: 0.5,
      maxDuration: 480,
      voiceSpeed: 1.0,
      interruptionSensitivity: 0.4,
      backgroundDenoising: 'default',
      fillerWords: false,
      ambientNoise: 'none',
      sendSMS: true,
      smsTemplate: 'Order {{orderId}} update: {{status}}. Expected delivery: {{deliveryDate}}',
      whatsappTemplate: '*Order Update*\n\nOrder ID: {{orderId}}\nStatus: {{status}}\nTracking: {{trackingNumber}}\nExpected Delivery: {{deliveryDate}}\n\n{{summary}}',
      toolsJson: JSON.stringify([
        {
          type: "function",
          function: {
            name: "track_order",
            description: "Track order status",
            parameters: {
              type: "object",
              properties: {
                orderId: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" }
              },
              required: ["orderId", "phone"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "process_return",
            description: "Process return request",
            parameters: {
              type: "object",
              properties: {
                orderId: { type: "string" },
                reason: { type: "string" },
                refundMethod: { type: "string" }
              },
              required: ["orderId", "reason"]
            }
          }
        }
      ])
    }
  },
  {
    id: 'logistics',
    name: 'Logistics Dispatcher',
    category: 'Logistics',
    description: 'Coordinates with drivers, updates delivery times, and handles delays.',
    icon: 'Car',
    color: 'from-slate-600 to-slate-800',
    features: ['Driver Coordination', 'Delay Alerts', 'Status Updates'],
    config: {
      name: 'Logistics Coordinator',
      systemPrompt: `You are a logistics coordinator managing delivery operations. Your goal is to ensure smooth delivery operations and handle any issues that arise.

Key responsibilities:
- Coordinate with delivery drivers
- Provide real-time delivery updates
- Handle delivery delays and issues
- Optimize delivery routes
- Communicate with customers about delays
- Manage driver schedules

Process:
1. Check delivery status
2. Coordinate with drivers if needed
3. Update customers on delays
4. Reschedule if necessary
5. Document all issues
6. Follow up on resolutions

Maintain clear communication with both drivers and customers. Be proactive about potential delays.`,
      firstMessage: 'This is {{agentName}} from {{company}} logistics. I\'m calling about your delivery scheduled for today.',
      voiceProvider: 'edge-tts',
      voiceId: 'en-US-GuyNeural',
      language: 'en',
      llmProvider: 'groq',
      llmModel: 'llama-3.1-8b-instant',
      temperature: 0.4,
      maxDuration: 300,
      voiceSpeed: 1.1,
      interruptionSensitivity: 0.6,
      backgroundDenoising: 'default',
      fillerWords: false,
      ambientNoise: 'office',
      sendSMS: true,
      smsTemplate: 'Delivery update: Your package is {{status}}. New ETA: {{eta}}',
      whatsappTemplate: '*Delivery Update*\n\nOrder: {{orderId}}\nStatus: {{status}}\nDriver: {{driverName}}\nETA: {{eta}}\n\n{{notes}}',
      toolsJson: JSON.stringify([
        {
          type: "function",
          function: {
            name: "update_delivery_status",
            description: "Update delivery status",
            parameters: {
              type: "object",
              properties: {
                orderId: { type: "string" },
                status: { type: "string" },
                eta: { type: "string" },
                driverId: { type: "string" }
              },
              required: ["orderId", "status"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "contact_driver",
            description: "Contact delivery driver",
            parameters: {
              type: "object",
              properties: {
                driverId: { type: "string" },
                message: { type: "string" },
                orderId: { type: "string" }
              },
              required: ["driverId", "message"]
            }
          }
        }
      ])
    }
  }
]

export function getTemplateById(id: string): AgentTemplate | undefined {
  return agentTemplates.find(template => template.id === id)
}

export function getTemplatesByCategory(category: string): AgentTemplate[] {
  return agentTemplates.filter(template => template.category === category)
}

export function getAllCategories(): string[] {
  return [...new Set(agentTemplates.map(template => template.category))]
}
