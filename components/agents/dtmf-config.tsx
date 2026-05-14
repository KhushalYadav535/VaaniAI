'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Phone, Plus, Trash2, Settings, Hash, Voicemail, 
  ArrowRight, UserCheck, MessageSquare, Headphones
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DTMFAction {
  type: 'route' | 'voicemail' | 'hangup' | 'callback' | 'invalid'
  target?: string
  message: string
}

interface DTMFMenuItem {
  digit: string
  description: string
  action: DTMFAction
}

interface DTMFConfigProps {
  value?: any
  onChange: (config: any) => void
}

export function DTMFConfig({ value, onChange }: DTMFConfigProps) {
  const [enabled, setEnabled] = useState(value?.enabled || false)
  const [menuType, setMenuType] = useState<'mainMenu' | 'pinEntry' | 'queuePosition' | 'custom'>(
    value?.menuType || 'mainMenu'
  )
  const [customMenu, setCustomMenu] = useState<DTMFMenuItem[]>(value?.customMenu || [])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const templates = {
    mainMenu: {
      prompt: 'Press 1 for sales, 2 for support, or 3 to leave a message.',
      expectedDigits: 1,
      maxAttempts: 3,
      timeout: 5000,
      actions: {
        '1': { type: 'route', target: 'sales', message: 'Connecting you to sales...' },
        '2': { type: 'route', target: 'support', message: 'Connecting you to support...' },
        '3': { type: 'voicemail', message: 'Please leave a message after the tone.' },
        'default': { type: 'invalid', message: 'Invalid selection. Please try again.' },
      }
    },
    pinEntry: {
      prompt: 'Please enter your 4-digit PIN.',
      expectedDigits: 4,
      maxAttempts: 3,
      timeout: 10000,
      actions: {
        '#1-9999': { type: 'validate_pin', message: 'Validating PIN...' },
        'default': { type: 'invalid', message: 'Invalid PIN format.' },
      }
    },
    queuePosition: {
      prompt: 'You are caller number 3. Press 1 to continue holding or 2 to request a callback.',
      expectedDigits: 1,
      maxAttempts: 1,
      timeout: 3000,
      actions: {
        '1': { type: 'continue_hold', message: 'Thank you for holding.' },
        '2': { type: 'callback', message: 'We will call you back shortly.' },
      }
    }
  }

  const handleConfigChange = (updates: any) => {
    const newConfig = {
      enabled,
      menuType,
      ...(menuType === 'custom' ? { customMenu } : templates[menuType]),
      ...updates
    }
    onChange(newConfig)
  }

  const addCustomMenuItem = () => {
    const newItem: DTMFMenuItem = {
      digit: '',
      description: '',
      action: { type: 'invalid', message: '' }
    }
    setCustomMenu([...customMenu, newItem])
  }

  const updateCustomMenuItem = (index: number, field: keyof DTMFMenuItem, value: any) => {
    const updated = [...customMenu]
    if (field === 'action') {
      updated[index].action = { ...updated[index].action, ...value }
    } else {
      updated[index][field] = value
    }
    setCustomMenu(updated)
    handleConfigChange({})
  }

  const removeCustomMenuItem = (index: number) => {
    setCustomMenu(customMenu.filter((_, i) => i !== index))
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'route': return <ArrowRight className="w-4 h-4" />
      case 'voicemail': return <Voicemail className="w-4 h-4" />
      case 'callback': return <Phone className="w-4 h-4" />
      case 'validate_pin': return <Hash className="w-4 h-4" />
      case 'continue_hold': return <Headphones className="w-4 h-4" />
      default: return <Settings className="w-4 h-4" />
    }
  }

  const getActionColor = (type: string) => {
    switch (type) {
      case 'route': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'voicemail': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'callback': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'validate_pin': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'continue_hold': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Enable DTMF */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-base font-medium flex items-center gap-2">
            <Phone className="w-4 h-4" />
            DTMF (Keypad Input)
          </Label>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Allow callers to use phone keypad for navigation
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(checked) => {
            setEnabled(checked)
            handleConfigChange({ enabled: checked })
          }}
        />
      </div>

      {enabled && (
        <>
          {/* Menu Type Selection */}
          <div className="space-y-2">
            <Label>Menu Type</Label>
            <Select value={menuType} onValueChange={(value: any) => {
              setMenuType(value)
              handleConfigChange({ menuType: value })
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mainMenu">Main Menu</SelectItem>
                <SelectItem value="pinEntry">PIN Entry</SelectItem>
                <SelectItem value="queuePosition">Queue Position</SelectItem>
                <SelectItem value="custom">Custom Menu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template-based Configuration */}
          {menuType !== 'custom' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {menuType === 'mainMenu' && 'Main Menu Configuration'}
                  {menuType === 'pinEntry' && 'PIN Entry Configuration'}
                  {menuType === 'queuePosition' && 'Queue Position Configuration'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Prompt Message</Label>
                  <Textarea
                    value={templates[menuType].prompt}
                    onChange={(e) => handleConfigChange({ 
                      prompt: e.target.value 
                    })}
                    placeholder="What the caller hears"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Expected Digits</Label>
                    <Input
                      type="number"
                      value={templates[menuType].expectedDigits}
                      onChange={(e) => handleConfigChange({ 
                        expectedDigits: parseInt(e.target.value) 
                      })}
                    />
                  </div>
                  <div>
                    <Label>Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={templates[menuType].timeout / 1000}
                      onChange={(e) => handleConfigChange({ 
                        timeout: parseInt(e.target.value) * 1000 
                      })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Max Attempts</Label>
                  <Input
                    type="number"
                    value={templates[menuType].maxAttempts}
                    onChange={(e) => handleConfigChange({ 
                      maxAttempts: parseInt(e.target.value) 
                    })}
                  />
                </div>

                {/* Actions Preview */}
                <div>
                  <Label>Key Actions</Label>
                  <div className="space-y-2 mt-2">
                    {Object.entries(templates[menuType].actions).map(([key, action]) => (
                      <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <Badge variant="outline" className="font-mono">
                          {key}
                        </Badge>
                        <Badge className={cn(getActionColor(action.type), "flex items-center gap-1")}>
                          {getActionIcon(action.type)}
                          {action.type}
                        </Badge>
                        <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                          {action.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Menu Configuration */}
          {menuType === 'custom' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Custom Menu Items</CardTitle>
                  <Button onClick={addCustomMenuItem} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {customMenu.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    No menu items yet. Click "Add Item" to create one.
                  </p>
                ) : (
                  customMenu.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Input
                            placeholder="Digit (e.g., 1, 2, 3, #, *)"
                            value={item.digit}
                            onChange={(e) => updateCustomMenuItem(index, 'digit', e.target.value)}
                            className="w-32"
                          />
                          <Input
                            placeholder="Description (e.g., Sales, Support)"
                            value={item.description}
                            onChange={(e) => updateCustomMenuItem(index, 'description', e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomMenuItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            value={item.action.type}
                            onValueChange={(value) => updateCustomMenuItem(index, 'action', { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="route">Route to Department</SelectItem>
                              <SelectItem value="voicemail">Leave Voicemail</SelectItem>
                              <SelectItem value="callback">Request Callback</SelectItem>
                              <SelectItem value="hangup">End Call</SelectItem>
                              <SelectItem value="invalid">Invalid Input</SelectItem>
                            </SelectContent>
                          </Select>

                          {(item.action.type === 'route' || item.action.type === 'validate_pin') && (
                            <Input
                              placeholder={item.action.type === 'route' ? 'Department name' : 'Validation logic'}
                              value={item.action.target || ''}
                              onChange={(e) => updateCustomMenuItem(index, 'action', { 
                                target: e.target.value 
                              })}
                            />
                          )}
                        </div>

                        <div>
                          <Label className="text-sm">Response Message</Label>
                          <Input
                            placeholder="Message to play when this key is pressed"
                            value={item.action.message}
                            onChange={(e) => updateCustomMenuItem(index, 'action', { 
                              message: e.target.value 
                            })}
                          />
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Advanced Settings */}
          <div>
            <Button
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </Button>

            {showAdvanced && (
              <Card className="mt-3">
                <CardHeader>
                  <CardTitle className="text-base">Advanced Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Custom TwiML URL (Optional)</Label>
                    <Input
                      placeholder="https://your-server.com/twilio/dtmf"
                      value={value?.customTwimlUrl || ''}
                      onChange={(e) => handleConfigChange({ 
                        customTwimlUrl: e.target.value 
                      })}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Override default DTMF handling with custom TwiML
                    </p>
                  </div>

                  <div>
                    <Label>Webhook URL for DTMF Events</Label>
                    <Input
                      placeholder="https://your-server.com/dtmf-webhook"
                      value={value?.webhookUrl || ''}
                      onChange={(e) => handleConfigChange({ 
                        webhookUrl: e.target.value 
                      })}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Receive DTMF events via webhook
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
