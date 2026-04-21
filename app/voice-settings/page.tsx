'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mic, Volume2, Languages, Settings, Play, Pause, RotateCcw } from 'lucide-react'

const voiceProviders = [
  { id: 'elevenlabs', name: 'ElevenLabs', models: ['Rachel', 'Domi', 'Bella', 'Antoni', 'Elli'] },
  { id: 'google', name: 'Google TTS', models: ['en-US-Neural2-A', 'en-US-Neural2-C', 'en-US-Neural2-D'] },
  { id: 'azure', name: 'Azure Speech', models: ['en-US-AriaNeural', 'en-US-JennyNeural', 'en-US-GuyNeural'] },
  { id: 'openai', name: 'OpenAI TTS', models: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] },
]

const languages = [
  { code: 'en-US', name: 'English (US)', flag: 'US' },
  { code: 'en-GB', name: 'English (UK)', flag: 'GB' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: 'ES' },
  { code: 'fr-FR', name: 'French (France)', flag: 'FR' },
  { code: 'de-DE', name: 'German (Germany)', flag: 'DE' },
  { code: 'it-IT', name: 'Italian (Italy)', flag: 'IT' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: 'BR' },
  { code: 'ja-JP', name: 'Japanese (Japan)', flag: 'JP' },
  { code: 'ko-KR', name: 'Korean (South Korea)', flag: 'KR' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: 'CN' },
]

export default function VoiceSettingsPage() {
  const [selectedProvider, setSelectedProvider] = useState('elevenlabs')
  const [selectedModel, setSelectedModel] = useState('Rachel')
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [pitch, setPitch] = useState([1.0])
  const [speed, setSpeed] = useState([1.0])
  const [volume, setVolume] = useState([0.8])
  const [isPlaying, setIsPlaying] = useState(false)
  const [testText, setTestText] = useState('Hello! This is a sample of how your voice agent will sound.')
  const [advancedSettings, setAdvancedSettings] = useState({
    enableNoiseReduction: true,
    enableEchoCancellation: true,
    enableBackgroundMusic: false,
    enableVoiceCloning: false,
    enableEmotionalTone: true,
  })

  const currentProvider = voiceProviders.find(p => p.id === selectedProvider)

  const handleTestVoice = () => {
    setIsPlaying(!isPlaying)
    // Simulate voice playback
    if (!isPlaying) {
      setTimeout(() => setIsPlaying(false), 3000)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Voice Settings</h1>
          <p className="text-slate-400 mt-2">Configure voice synthesis and audio settings for your agents.</p>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="bg-slate-900 border-slate-800">
          <TabsTrigger value="basic" className="data-[state=active]:bg-slate-800">Basic Settings</TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-slate-800">Advanced</TabsTrigger>
          <TabsTrigger value="testing" className="data-[state=active]:bg-slate-800">Voice Testing</TabsTrigger>
          <TabsTrigger value="cloning" className="data-[state=active]:bg-slate-800">Voice Cloning</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          {/* Voice Provider Selection */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50 flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Voice Provider
              </CardTitle>
              <CardDescription className="text-slate-400">
                Choose your preferred text-to-speech provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {voiceProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedProvider === provider.id
                        ? 'border-purple-600 bg-purple-600/10'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-50">{provider.name}</span>
                      {selectedProvider === provider.id && (
                        <Badge variant="outline" className="border-purple-600 text-purple-600">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{provider.models.length} voices available</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Voice Model Selection */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Voice Model</CardTitle>
              <CardDescription className="text-slate-400">
                Select the specific voice model for your agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {currentProvider?.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-800 rounded-lg">
                  <h4 className="font-medium text-slate-50 mb-2">Voice Characteristics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gender:</span>
                      <span className="text-slate-50">Female</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Age Range:</span>
                      <span className="text-slate-50">25-35</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Accent:</span>
                      <span className="text-slate-50">Neutral</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <h4 className="font-medium text-slate-50 mb-2">Quality Settings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sample Rate:</span>
                      <span className="text-slate-50">24kHz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bitrate:</span>
                      <span className="text-slate-50">128kbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Format:</span>
                      <span className="text-slate-50">MP3</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice Parameters */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Voice Parameters
              </CardTitle>
              <CardDescription className="text-slate-400">
                Fine-tune voice characteristics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-slate-200">Pitch</Label>
                  <span className="text-sm text-slate-400">{pitch[0].toFixed(2)}</span>
                </div>
                <Slider
                  value={pitch}
                  onValueChange={setPitch}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-slate-200">Speed</Label>
                  <span className="text-sm text-slate-400">{speed[0].toFixed(2)}x</span>
                </div>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-slate-200">Volume</Label>
                  <span className="text-sm text-slate-400">{Math.round(volume[0] * 100)}%</span>
                </div>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  min={0}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Advanced Audio Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure advanced audio processing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(advancedSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-slate-200">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </Label>
                    <p className="text-sm text-slate-400">
                      {key === 'enableNoiseReduction' && 'Reduce background noise in audio input'}
                      {key === 'enableEchoCancellation' && 'Remove echo from audio output'}
                      {key === 'enableBackgroundMusic' && 'Add subtle background music'}
                      {key === 'enableVoiceCloning' && 'Allow voice cloning capabilities'}
                      {key === 'enableEmotionalTone' && 'Detect and respond to emotional tone'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) =>
                      setAdvancedSettings(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Language Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure language and accent preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Accent Style</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                      <SelectValue placeholder="Select accent" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Speaking Style</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="narrative">Narrative</SelectItem>
                      <SelectItem value="news">News Report</SelectItem>
                      <SelectItem value="customer-service">Customer Service</SelectItem>
                      <SelectItem value="empathetic">Empathetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Voice Testing
              </CardTitle>
              <CardDescription className="text-slate-400">
                Test your voice configuration with custom text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Test Text</Label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full h-24 p-3 bg-slate-800 border-slate-700 text-slate-50 rounded-lg resize-none focus:border-purple-600 focus:outline-none"
                  placeholder="Enter text to test voice synthesis..."
                />
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={handleTestVoice}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play Sample
                    </>
                  )}
                </Button>
                <Button variant="outline" className="border-slate-700 text-slate-300">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Settings
                </Button>
              </div>

              {isPlaying && (
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-400">Playing audio sample...</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Audio Quality Metrics</CardTitle>
              <CardDescription className="text-slate-400">
                Monitor voice synthesis quality and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Latency</span>
                    <span className="text-green-500 text-sm">Good</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-50">120ms</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Quality Score</span>
                    <span className="text-green-500 text-sm">Excellent</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-50">9.2/10</p>
                </div>
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Naturalness</span>
                    <span className="text-yellow-500 text-sm">Good</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-50">85%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cloning" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-50">Voice Cloning</CardTitle>
              <CardDescription className="text-slate-400">
                Create custom voice models from audio samples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
                <Mic className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-50 font-medium mb-2">Upload Voice Sample</p>
                <p className="text-sm text-slate-400 mb-4">
                  Upload a 30-60 second audio sample for voice cloning
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Choose Audio File
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Sample Quality</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="low">Low (8kHz)</SelectItem>
                      <SelectItem value="medium">Medium (16kHz)</SelectItem>
                      <SelectItem value="high">High (44.1kHz)</SelectItem>
                      <SelectItem value="studio">Studio Quality (48kHz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Voice Type</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-50">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="elderly">Elderly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
