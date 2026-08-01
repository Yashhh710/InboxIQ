import { useState } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import {
  Brain,
  Bell,
  ShieldAlert,
  CheckCircle2,
  Activity,
  Sliders,
  Save,
  Plus,
  X,
  User,
  Building,
  Users,
  Layers
} from 'lucide-react'

export default function Settings() {
  const { addToast } = useToast()

  const [aiVersion] = useState('NotifyAI v2.6')
  const [modelAccuracy] = useState(92.0)
  const [avgResponseTime] = useState('184ms')

  const [aiBehaviour, setAiBehaviour] = useState({
    spamDetection: true,
    scamProtection: true,
    smartDigest: true,
    autoPriority: 'High',
    businessVerification: true,
  })

  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    desktopNotifications: true,
    emailSummary: false,
    quietHours: true,
    soundAlerts: true,
  })

  const [quietHoursRange] = useState('10:00 PM - 08:00 AM')
  const [confidenceThreshold, setConfidenceThreshold] = useState(92)

  const [keywords, setKeywords] = useState(['lottery', 'crypto', 'investment', 'free money', 'claim reward'])
  const [newKeyword, setNewKeyword] = useState('')

  const [trustedContacts] = useState([
    { name: 'Mom', type: 'Personal', icon: User },
    { name: 'Dad', type: 'Personal', icon: User },
    { name: 'HDFC Bank', type: 'Business', icon: Building },
    { name: 'Amazon', type: 'Business', icon: Building },
    { name: 'College Group', type: 'Group', icon: Users },
  ])

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyword.trim()) return
    if (keywords.includes(newKeyword.trim().toLowerCase())) {
      addToast('Keyword already exists', 'error')
      return
    }
    setKeywords([...keywords, newKeyword.trim().toLowerCase()])
    setNewKeyword('')
    addToast('Blocked keyword added successfully', 'success')
  }

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw))
    addToast('Keyword removed', 'success')
  }

  const handleSaveAll = () => {
    addToast('All AI control center settings saved successfully!', 'success')
  }

  return (
    <div className="page-shell p-8 space-y-8 selection:bg-cyan-500/30">
      
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-[#121216] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">AI Control Center</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(52,211,153,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              AI Engine Online
            </span>
          </div>
          <p className="text-white/40 text-sm mt-1">Customize your AI message routing engine</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveAll}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(0,217,255,0.3)] transition-all text-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </motion.button>
      </div>

      {/* Top Metric Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Engine Status */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-5 shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(52,211,153,0.6)]"></div>
          <div>
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">AI Engine Status</span>
            <div className="text-2xl font-black text-emerald-400 tracking-tight mt-1">Online</div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-white/40">Neural core active</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* AI Version */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-5 shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(0,217,255,0.6)]"></div>
          <div>
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">AI Version</span>
            <div className="text-xl font-bold text-white tracking-tight mt-1">{aiVersion}</div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-cyan-400">Latest Stable Release</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Model Accuracy */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-5 shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.6)]"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Model Accuracy</span>
              <div className="text-2xl font-black text-white tracking-tight mt-1">{modelAccuracy}%</div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-cyan-400 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono">
              92%
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400">
            <span>↑ 4.6% improvement</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-5 shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-400 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
          <div>
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Avg Response Time</span>
            <div className="text-2xl font-black text-white tracking-tight mt-1">{avgResponseTime}</div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-white/40">Real-time processing</span>
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
        </div>

      </div>

      {/* Core Settings Grid (Behaviour & Notifications) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* AI Behaviour Settings */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6 transition-all duration-300">
          <div className="flex items-center gap-3 border-b border-[#141418] pb-4">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">AI Behaviour Settings</h3>
              <p className="text-xs text-white/40">Configure threat detection and message routing logic</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Spam Detection</p>
                <p className="text-xs text-white/40">Detect and filter spam messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiBehaviour.spamDetection}
                  onChange={(e) => setAiBehaviour({ ...aiBehaviour, spamDetection: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Scam Protection</p>
                <p className="text-xs text-white/40">Identify scams and suspicious content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiBehaviour.scamProtection}
                  onChange={(e) => setAiBehaviour({ ...aiBehaviour, scamProtection: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Smart Digest</p>
                <p className="text-xs text-white/40">Bundle low priority messages</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiBehaviour.smartDigest}
                  onChange={(e) => setAiBehaviour({ ...aiBehaviour, smartDigest: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Auto Priority</p>
                <p className="text-xs text-white/40">Automatically prioritize important messages</p>
              </div>
              <select
                value={aiBehaviour.autoPriority}
                onChange={(e) => setAiBehaviour({ ...aiBehaviour, autoPriority: e.target.value })}
                className="bg-black border border-[#141418] rounded-xl px-4 py-2 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-500/50 shadow-inner cursor-pointer"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Business Verification</p>
                <p className="text-xs text-white/40">Verify business senders and domains</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiBehaviour.businessVerification}
                  onChange={(e) => setAiBehaviour({ ...aiBehaviour, businessVerification: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6 transition-all duration-300">
          <div className="flex items-center gap-3 border-b border-[#141418] pb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Notification Preferences</h3>
              <p className="text-xs text-white/40">Manage alert delivery and quiet hours</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Push Notifications</p>
                <p className="text-xs text-white/40">Receive notifications in real-time</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.pushNotifications}
                  onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Desktop Notifications</p>
                <p className="text-xs text-white/40">Show notifications on desktop</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.desktopNotifications}
                  onChange={(e) => setNotifications({ ...notifications, desktopNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Email Summary</p>
                <p className="text-xs text-white/40">Receive daily email digest</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailSummary}
                  onChange={(e) => setNotifications({ ...notifications, emailSummary: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Quiet Hours</p>
                <p className="text-xs text-white/40">Mute notifications during selected time</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-cyan-300 font-mono bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-xl">
                  {quietHoursRange}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.quietHours}
                    onChange={(e) => setNotifications({ ...notifications, quietHours: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Sound Alerts</p>
                <p className="text-xs text-white/40">Play sound for important alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.soundAlerts}
                  onChange={(e) => setNotifications({ ...notifications, soundAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* AI Confidence Threshold Slider Section */}
      <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-4 transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              AI Confidence Threshold
            </h3>
            <p className="text-xs text-white/40 mt-0.5">Adjust the minimum confidence required for actions</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-cyan-400 font-mono">{confidenceThreshold}%</span>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Current Threshold</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <input
            type="range"
            min="50"
            max="100"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-cyan-500 rounded-lg appearance-none cursor-pointer accent-cyan-400 shadow-[0_0_15px_rgba(0,217,255,0.3)]"
          />
          <div className="flex justify-between text-[11px] text-white/40 font-mono">
            <span>50%</span>
            <span>60%</span>
            <span>70%</span>
            <span>80%</span>
            <span>90%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-white/50 pt-2 border-t border-[#141418]">
          <span>Higher threshold = More strict filtering</span>
          <span>Lower threshold = More messages delivered</span>
        </div>
      </div>

      {/* Three Column Bottom Grid (Keywords, Trusted Contacts, Pipeline Modules) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Blocked Keywords */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Blocked Keywords
              </h3>
            </div>

            <form onSubmit={handleAddKeyword} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add Keyword"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1 bg-black border border-[#141418] rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="submit"
                className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {keywords.map((kw) => (
                <div key={kw} className="flex justify-between items-center p-2.5 rounded-xl bg-black border border-[#141418] text-xs">
                  <span className="text-white/80 font-medium">{kw}</span>
                  <button
                    onClick={() => handleRemoveKeyword(kw)}
                    className="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trusted Contacts / Senders */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Trusted Contacts / Senders
              </h3>
              <button 
                onClick={() => addToast('Contact modal opened', 'success')}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Contact
              </button>
            </div>

            <div className="space-y-2.5">
              {trustedContacts.map((contact, idx) => {
                const IconComponent = contact.icon
                return (
                  <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-black border border-[#141418] text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-white font-medium">{contact.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      contact.type === 'Personal' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : contact.type === 'Business'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {contact.type}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* AI Pipeline Modules */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                AI Pipeline Modules
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { name: 'Text Analysis', status: 'Enabled' },
                { name: 'Context Analysis', status: 'Enabled' },
                { name: 'Business Verification', status: 'Enabled' },
                { name: 'Scam Detection', status: 'Enabled' },
                { name: 'Confidence Engine', status: 'Enabled' },
                { name: 'Final Decision Engine', status: 'Enabled' },
              ].map((mod, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-black border border-[#141418]">
                  <span className="text-white/80 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {mod.name}
                  </span>
                  <span className="text-emerald-400 font-semibold">{mod.status}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-emerald-400 mt-4 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            All systems operational
          </p>
        </div>

      </div>

      {/* Bottom Footer Info Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-4 shadow-xl text-center transition-all duration-300">
        <div>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Last Updated</span>
          <p className="text-xs font-semibold text-white mt-1">2 minutes ago</p>
        </div>
        <div>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">AI Model</span>
          <p className="text-xs font-semibold text-white mt-1">NotifyAI Routing v2.6</p>
        </div>
        <div>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Dataset</span>
          <p className="text-xs font-semibold text-white mt-1">110,542 messages</p>
        </div>
        <div>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Last Training</span>
          <p className="text-xs font-semibold text-white mt-1">May 5, 2025 + 11:30 PM</p>
        </div>
        <div>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Data Retention</span>
          <p className="text-xs font-semibold text-white mt-1">30 Days</p>
        </div>
        <div>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Language Model</span>
          <p className="text-xs font-semibold text-white mt-1">GPT-4o Mini</p>
        </div>
      </div>

    </div>
  )
}