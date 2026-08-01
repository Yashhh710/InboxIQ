import { useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react'
import {
  Sparkles,
  QrCode,
  Send,
  Cpu,
  Bell,
  CheckCircle2,
  RefreshCw,
  X,
  Smartphone,
  Wifi,
  Loader2,
  Brain,
  ShieldCheck,
  Radio,
  ArrowDown,
} from 'lucide-react'

/* ────────────────────────────────────────────────────────────────
   TYPES
──────────────────────────────────────────────────────────────── */

type DecisionType = 'notify' | 'digest' | 'mute'

interface DemoMessage {
  sender: string
  text: string
  time: string
  icon: string
  status: DecisionType
  source?: 'demo' | 'mobile' | 'custom'
}

interface ActivityItem extends DemoMessage {
  id: string
  confidence: number
}

interface Decision {
  type: DecisionType
  confidence: number
  reasons: string[]
  processingMs: number
}

/* ────────────────────────────────────────────────────────────────
   STATIC DATA
──────────────────────────────────────────────────────────────── */

const sampleMessages: DemoMessage[] = [
  { sender: 'Mom', text: "Call me ASAP, it's urgent!", time: '10:24 PM', icon: '📞', status: 'notify', source: 'demo' },
  { sender: 'HDFC Bank', text: 'Your credit card payment due tomorrow.', time: '10:23 PM', icon: '💳', status: 'notify', source: 'demo' },
  { sender: 'College Group', text: "Tomorrow's exam starts at 9:00 AM. All the best!", time: '10:22 PM', icon: '🎓', status: 'digest', source: 'demo' },
  { sender: 'Lottery Winner', text: 'Congratulations! You won ₹5,00,000! Click here to claim now.', time: '10:21 PM', icon: '🎁', status: 'mute', source: 'demo' },
  { sender: 'Amazon', text: 'Your order #ORD1234 has been shipped.', time: '10:20 PM', icon: '📦', status: 'digest', source: 'demo' },
]

const activityPool: Omit<ActivityItem, 'id' | 'time'>[] = [
  { sender: 'Mom', text: 'Call me ASAP.', icon: '🟢', status: 'notify', confidence: 99, source: 'demo' },
  { sender: 'Lottery Winner', text: 'Congratulations!', icon: '🟣', status: 'mute', confidence: 99, source: 'demo' },
  { sender: 'College Group', text: 'Tomorrow Exam', icon: '🔵', status: 'digest', confidence: 89, source: 'demo' },
  { sender: 'Boss', text: 'Can you join a call in 5?', icon: '🟢', status: 'notify', confidence: 97, source: 'demo' },
  { sender: 'Zomato', text: 'Your order is on the way.', icon: '🟠', status: 'digest', confidence: 84, source: 'demo' },
  { sender: 'Unknown Number', text: 'You have won a free iPhone!', icon: '🟣', status: 'mute', confidence: 96, source: 'demo' },
  { sender: 'HDFC Bank', text: 'OTP for your transaction is 4521.', icon: '🟢', status: 'notify', confidence: 98, source: 'demo' },
  { sender: 'Landlord', text: 'Rent due date reminder.', icon: '🔵', status: 'digest', confidence: 91, source: 'demo' },
  { sender: 'Casino Offer', text: 'Free spins waiting for you!', icon: '🟣', status: 'mute', confidence: 95, source: 'demo' },
  { sender: 'Sister', text: 'Dinner at 8?', icon: '🟢', status: 'notify', confidence: 93, source: 'demo' },
  { sender: 'Swiggy', text: 'Rate your last order.', icon: '🔵', status: 'digest', confidence: 80, source: 'demo' },
  { sender: 'Spam Bot', text: 'Claim your prize now!!!', icon: '🟣', status: 'mute', confidence: 98, source: 'demo' },
]

const pipelineSteps = [
  'Message Received',
  'Reading Content',
  'Detecting Intent',
  'User Context',
  'Business Verification',
  'Spam Detection',
  'Confidence Calculation',
  'Final Decision',
]

const decisionCopy: Record<DecisionType, { label: string; sub: string; color: string; bg: string; border: string; icon: ReactNode }> = {
  notify: {
    label: 'NOTIFY',
    sub: 'High Priority',
    color: 'text-emerald-400',
    bg: 'bg-black/80 backdrop-blur-md',
    border: 'border-emerald-500/30',
    icon: <Bell className="w-5 h-5" />,
  },
  digest: {
    label: 'DIGEST',
    sub: 'Bundle For Later',
    color: 'text-cyan-400',
    bg: 'bg-black/80 backdrop-blur-md',
    border: 'border-cyan-500/30',
    icon: <Radio className="w-5 h-5" />,
  },
  mute: {
    label: 'MUTE',
    sub: 'Low Priority / Spam',
    color: 'text-rose-400',
    bg: 'bg-black/80 backdrop-blur-md',
    border: 'border-rose-500/30',
    icon: <ShieldCheck className="w-5 h-5" />,
  },
}

const reasonBank: Record<DecisionType, string[]> = {
  notify: [
    'Message from trusted contact',
    'Urgent keywords detected',
    'High personal priority level',
    'No spam or suspicious patterns found',
  ],
  digest: [
    'Informational content, not time-critical',
    'Matches recurring sender pattern',
    'No urgent keywords detected',
    'Safe to bundle into daily digest',
  ],
  mute: [
    'Sender not in trusted contacts',
    'Matches known spam / scam pattern',
    'Suspicious links or claims detected',
    'Confidence exceeds mute threshold',
  ],
}

/* ────────────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────────────── */

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

function useAnimatedNumber(target: number, duration = 700) {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const tick = (now: number) => {
      const t = clamp((now - start) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (target - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return display
}

function nowTimeLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

/* ────────────────────────────────────────────────────────────────
   DECORATIVE BACKGROUND
──────────────────────────────────────────────────────────────── */

function LiveBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 14 + Math.random() * 12,
        size: 2 + Math.random() * 3,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    []
  )

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(56,189,248,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.04) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          animation: 'gridDrift 22s linear infinite',
        }}
      />
      <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full blur-[140px] bg-cyan-500/10" />
      <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full blur-[140px] bg-purple-600/10" />
      <div className="absolute bottom-0 left-1/3 w-[26rem] h-[26rem] rounded-full blur-[140px] bg-blue-600/10" />
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-cyan-300"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `floatUp ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   SMALL UI PRIMITIVES
──────────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  suffix = '',
  decimals = 0,
  hint,
  barPct,
  barColor,
}: {
  label: string
  value: number
  suffix?: string
  decimals?: number
  hint: string
  barPct: number
  barColor: string
}) {
  const animated = useAnimatedNumber(value, 900)
  return (
    <div className="p-4 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/5 border bg-black/60 backdrop-blur-md border-slate-800/80 hover:border-slate-700">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="flex items-baseline justify-between mt-2">
        <h3 className="text-2xl font-black tabular-nums text-white">
          {animated.toFixed(decimals)}
          {suffix}
        </h3>
        <span className="text-xs font-bold text-slate-400">{hint}</span>
      </div>
      <div className="mt-3 h-1 rounded-full overflow-hidden bg-black/60">
        <div
          className={`h-full ${barColor} transition-[width] duration-700 ease-out`}
          style={{ width: `${clamp(barPct, 0, 100)}%` }}
        />
      </div>
    </div>
  )
}

function ConfidenceGauge({ value, size = 96 }: { value: number; size?: number }) {
  const animated = useAnimatedNumber(value, 1100)
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - animated / 100)

  const color = value >= 90 ? '#34d399' : value >= 70 ? '#38bdf8' : '#f43f5e'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#181b24" strokeWidth={8} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s ease-out, stroke 0.4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-white tabular-nums">{animated.toFixed(0)}%</span>
        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">confidence</span>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   FAKE QR CODE
──────────────────────────────────────────────────────────────── */

function FakeQr({ seed = 7 }: { seed?: number }) {
  const size = 21
  const cells = useMemo(() => {
    let s = seed
    const rand = () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }
    const grid: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => rand() > 0.55))

    const finder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const onBorder = r === 0 || r === 6 || c === 0 || c === 6
          const onCore = r >= 2 && r <= 4 && c >= 2 && c <= 4
          grid[r0 + r][c0 + c] = onBorder || onCore
        }
      }
    }
    finder(0, 0)
    finder(0, size - 7)
    finder(size - 7, 0)
    return grid
  }, [seed])

  return (
    <div className="bg-black/80 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-lg">
      <svg viewBox={`0 0 ${size} ${size}`} width={168} height={168}>
        {cells.map((row, r) =>
          row.map((on, c) => (on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#ffffff" /> : null))
        )}
      </svg>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────────── */

export default function LiveDemo() {
  const [activeTab, setActiveTab] = useState<'demo' | 'custom'>('demo')

  // clock
  const [clock, setClock] = useState(nowTimeLabel())
  useEffect(() => {
    const id = setInterval(() => setClock(nowTimeLabel()), 1000)
    return () => clearInterval(id)
  }, [])

  // top-line simulated stats
  const [stats, setStats] = useState({
    accuracy: 92.6,
    responseTime: 184,
    messages: 1246,
    muted: 891,
    usersOnline: 84,
  })

  useEffect(() => {
    const id = setInterval(() => {
      setStats((prev) => ({
        accuracy: Number(clamp(prev.accuracy + (Math.random() - 0.5) * 0.4, 90, 99.4).toFixed(1)),
        responseTime: Math.round(clamp(prev.responseTime + (Math.random() - 0.5) * 14, 130, 260)),
        messages: prev.messages + Math.floor(Math.random() * 3) + 1,
        muted: prev.muted + (Math.random() < 0.45 ? 1 : 0),
        usersOnline: Math.round(clamp(prev.usersOnline + (Math.random() - 0.5) * 7, 42, 140)),
      }))
    }, 2600)
    return () => clearInterval(id)
  }, [])

  // response-time history for the line chart
  const [responseHistory, setResponseHistory] = useState<number[]>(() =>
    Array.from({ length: 16 }, () => 160 + Math.random() * 60)
  )
  useEffect(() => {
    setResponseHistory((prev) => [...prev.slice(1), stats.responseTime])
  }, [stats.responseTime])

  // decision distribution + confidence buckets
  const [distribution, setDistribution] = useState({ notify: 478, digest: 347, mute: 421 })
  const [confidenceBuckets, setConfidenceBuckets] = useState([28, 86, 214, 347, 571])

  const bumpDistribution = useCallback((type: DecisionType, confidence: number) => {
    setDistribution((prev) => ({ ...prev, [type]: prev[type] + 1 }))
    setConfidenceBuckets((prev) => {
      const idx = confidence >= 90 ? 4 : confidence >= 80 ? 3 : confidence >= 70 ? 2 : confidence >= 60 ? 1 : 0
      const next = [...prev]
      next[idx] += 1
      return next
    })
  }, [])

  // live activity feed
  const [feed, setFeed] = useState<ActivityItem[]>(() =>
    activityPool.slice(0, 4).map((item) => ({ ...item, id: uid(), time: nowTimeLabel() }))
  )

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const schedule = () => {
      const delay = 3000 + Math.random() * 2000
      timeoutId = setTimeout(() => {
        const pick = activityPool[Math.floor(Math.random() * activityPool.length)]
        setFeed((prev) => [{ ...pick, id: uid(), time: nowTimeLabel() }, ...prev].slice(0, 6))
        setStats((prev) => ({ ...prev, messages: prev.messages + 1 }))
        bumpDistribution(pick.status, pick.confidence)
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(timeoutId)
  }, [bumpDistribution])

  // AI pipeline / thinking state
  const [selectedMessage, setSelectedMessage] = useState<DemoMessage>(sampleMessages[0])
  const [processing, setProcessing] = useState(false)
  const [stepIndex, setStepIndex] = useState(-1)
  const [progress, setProgress] = useState(0)
  const [decision, setDecision] = useState<Decision | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const runPipeline = useCallback(
    (message: DemoMessage) => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []

      setSelectedMessage(message)
      setDecision(null)
      setProcessing(true)
      setStepIndex(-1)
      setProgress(0)

      const totalTime = 2000
      const stepDelay = totalTime / pipelineSteps.length

      pipelineSteps.forEach((_, i) => {
        const t = setTimeout(() => {
          setStepIndex(i)
          setProgress(Math.round(((i + 1) / pipelineSteps.length) * 100))
        }, stepDelay * (i + 1))
        timersRef.current.push(t)
      })

      const finalTimer = setTimeout(() => {
        const confidence = clamp(
          Math.round(message.status === 'digest' ? 78 + Math.random() * 15 : 90 + Math.random() * 9),
          60,
          99
        )
        const result: Decision = {
          type: message.status,
          confidence,
          reasons: reasonBank[message.status],
          processingMs: Math.round(1800 + Math.random() * 700),
        }
        setDecision(result)
        setProcessing(false)
        bumpDistribution(message.status, confidence)
      }, totalTime + 150)
      timersRef.current.push(finalTimer)
    },
    [bumpDistribution]
  )

  useEffect(() => {
    runPipeline(sampleMessages[0])
    return () => timersRef.current.forEach(clearTimeout)
  }, [runPipeline])

  // custom message form
  const [customSender, setCustomSender] = useState('')
  const [customText, setCustomText] = useState('')
  const sendCustom = () => {
    if (!customText.trim()) return
    const guessSpam = /win|free|prize|click here|congratulations/i.test(customText)
    const guessUrgent = /asap|urgent|now|emergency|call me/i.test(customText)
    const status: DecisionType = guessSpam ? 'mute' : guessUrgent ? 'notify' : 'digest'
    runPipeline({
      sender: customSender.trim() || 'Unknown Sender',
      text: customText.trim(),
      time: nowTimeLabel(),
      icon: '✉️',
      status,
      source: 'custom',
    })
    setCustomText('')
  }

  // QR / mobile simulation
  const [qrOpen, setQrOpen] = useState(false)
  const [qrConnected, setQrConnected] = useState(false)
  const [incomingPhoneMsg, setIncomingPhoneMsg] = useState<DemoMessage | null>(null)

  const openQr = () => {
    setQrOpen(true)
    setQrConnected(false)
    const t = setTimeout(() => setQrConnected(true), 5000)
    timersRef.current.push(t)
  }

  useEffect(() => {
    if (!qrConnected) return
    let timeoutId: ReturnType<typeof setTimeout>
    const mobilePool: DemoMessage[] = [
      { sender: 'Mobile · Rahul', text: 'Hey, are we still on for tonight?', time: nowTimeLabel(), icon: '📱', status: 'notify', source: 'mobile' },
      { sender: 'Mobile · Bank Alert', text: 'Unusual login detected on your account.', time: nowTimeLabel(), icon: '📱', status: 'notify', source: 'mobile' },
      { sender: 'Mobile · Promo', text: 'Flat 70% off — today only!', time: nowTimeLabel(), icon: '📱', status: 'mute', source: 'mobile' },
      { sender: 'Mobile · Team Group', text: 'Standup moved to 11am.', time: nowTimeLabel(), icon: '📱', status: 'digest', source: 'mobile' },
    ]
    const schedule = () => {
      const delay = 6000 + Math.random() * 5000
      timeoutId = setTimeout(() => {
        const msg = { ...mobilePool[Math.floor(Math.random() * mobilePool.length)], time: nowTimeLabel() }
        setIncomingPhoneMsg(msg)
        const clearBubble = setTimeout(() => {
          setIncomingPhoneMsg(null)
          runPipeline(msg)
        }, 1100)
        timersRef.current.push(clearBubble)
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(timeoutId)
  }, [qrConnected, runPipeline])

  // reset demo
  const resetDemo = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setStats({ accuracy: 92.6, responseTime: 184, messages: 1246, muted: 891, usersOnline: 84 })
    setDistribution({ notify: 478, digest: 347, mute: 421 })
    setConfidenceBuckets([28, 86, 214, 347, 571])
    setFeed(activityPool.slice(0, 4).map((item) => ({ ...item, id: uid(), time: nowTimeLabel() })))
    setQrOpen(false)
    setQrConnected(false)
    setIncomingPhoneMsg(null)
    runPipeline(sampleMessages[0])
  }

  const messagesTotal = distribution.notify + distribution.digest + distribution.mute
  const pieSegments = useMemo(() => {
    const total = messagesTotal || 1
    const order: DecisionType[] = ['notify', 'digest', 'mute']
    const colors: Record<DecisionType, string> = { notify: '#34d399', digest: '#22d3ee', mute: '#fb7185' }
    let acc = 0
    return order.map((key) => {
      const pct = (distribution[key] / total) * 100
      const seg = { key, pct, color: colors[key], offset: acc }
      acc += pct
      return seg
    })
  }, [distribution, messagesTotal])

  const maxBucket = Math.max(...confidenceBuckets, 1)
  const messagesAnimated = useAnimatedNumber(stats.messages, 800)
  const mutedAnimated = useAnimatedNumber(stats.muted, 800)
  const usersAnimated = useAnimatedNumber(stats.usersOnline, 800)
  const processingTimeAnimated = useAnimatedNumber(decision?.processingMs ?? 0, 900)

  // Chart coordinate calculations with proper padding & headroom buffers
  const chartWidth = 340
  const chartHeight = 160
  const chartPadding = 24
  const activeChartHeight = chartHeight - chartPadding * 2

  const minHistory = Math.min(...responseHistory)
  const maxHistory = Math.max(...responseHistory)
  const historyRange = maxHistory - minHistory || 1
  const paddedMin = minHistory - historyRange * 0.2
  const paddedMax = maxHistory + historyRange * 0.35 // Headroom buffer
  const paddedRange = paddedMax - paddedMin

  const responsePoints = responseHistory.map((val, i) => {
    const x = (i / (responseHistory.length - 1)) * chartWidth
    const y = chartHeight - chartPadding - ((val - paddedMin) / paddedRange) * activeChartHeight
    return { x, y }
  })

  const linePathD = responsePoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')
  const areaPathD = `${linePathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`

  return (
    <div className="page-shell space-y-6 pb-12 relative text-slate-100">
      <LiveBackground />

      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/80 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Live Demo <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Experience Orchestrate AI in action — send a message and watch AI think in real time
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            LIVE <span className="text-emerald-400">{clock}</span>
          </div>
          <button
            onClick={resetDemo}
            className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md hover:bg-black border border-slate-700/60 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Demo
          </button>
        </div>
      </div>

      {/* Top Stat Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="AI Accuracy" value={stats.accuracy} suffix="%" decimals={1} hint="live" barPct={stats.accuracy} barColor="bg-cyan-400" />
        <StatCard label="Avg Response Time" value={stats.responseTime} suffix="ms" hint="live" barPct={clamp(100 - (stats.responseTime - 130) / 1.3, 0, 100)} barColor="bg-blue-500" />
        <StatCard label="Messages Processed" value={messagesAnimated} decimals={0} hint="today" barPct={85} barColor="bg-purple-500" />
        <StatCard label="Muted Threats" value={mutedAnimated} decimals={0} hint="today" barPct={60} barColor="bg-rose-500" />
        <StatCard label="Users Online" value={usersAnimated} decimals={0} hint="now" barPct={clamp((stats.usersOnline / 140) * 100, 0, 100)} barColor="bg-amber-400" />
      </div>

      {/* Interactive Core Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Column 1: Scan & Select Demo Messages */}
        <div className="bg-black/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col h-[520px] justify-between space-y-4 transition-all duration-300 hover:border-slate-700">
          <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-extrabold border border-cyan-500/30">1</span>
                  Send a Message
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Select a demo message or send your own</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 mt-4 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setActiveTab('demo')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'demo'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Demo Messages
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'custom'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Custom Message
              </button>
            </div>

            {activeTab === 'demo' ? (
              <div className="space-y-2.5 mt-4 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                {sampleMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    onClick={() => runPipeline(msg)}
                    className={`p-3 rounded-xl bg-black/60 backdrop-blur-md hover:bg-black/80 border cursor-pointer transition-all flex items-center justify-between group hover:scale-[1.01] active:scale-[0.99] shrink-0 ${
                      selectedMessage.sender === msg.sender && selectedMessage.time === msg.time
                        ? 'border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : 'border-slate-800/80 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-black/80 flex items-center justify-center text-sm shrink-0 border border-slate-800">
                        {msg.icon}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{msg.sender}</span>
                          <span className="text-[10px] text-slate-400">{msg.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{msg.text}</p>
                      </div>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        msg.status === 'notify' ? 'bg-emerald-400' : msg.status === 'digest' ? 'bg-cyan-400' : 'bg-rose-400'
                      }`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-3 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Sender Name</label>
                  <input
                    type="text"
                    value={customSender}
                    onChange={(e) => setCustomSender(e.target.value)}
                    placeholder="e.g. Boss / Client"
                    className="w-full mt-1 bg-black/60 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Message Content</label>
                  <textarea
                    rows={3}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Type custom message to test AI routing..."
                    className="w-full mt-1 bg-black/60 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
                <button
                  onClick={sendCustom}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" /> Send to AI Pipeline
                </button>
              </div>
            )}
          </div>

          <button
            onClick={openQr}
            className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-300 transition-colors group shrink-0"
          >
            <span>Scan QR to test from mobile</span>
            <QrCode className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Column 2: AI Thinking Live */}
        <div className="bg-black/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all duration-300 hover:border-slate-700">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-extrabold border border-cyan-500/30">2</span>
                  AI Thinking Live
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Watch our AI analyze and decide</p>
              </div>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                  processing ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-black/60 backdrop-blur-md border-slate-800'
                }`}
              >
                <Brain
                  className={`w-4 h-4 text-cyan-400 ${processing ? 'animate-pulse' : ''}`}
                  style={processing ? { filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.8))' } : undefined}
                />
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
              <span className="text-sm">{selectedMessage.icon}</span>
              <span className="font-bold text-white">{selectedMessage.sender}</span>
              <span className="text-slate-500">·</span>
              <span className="truncate text-slate-400">{selectedMessage.text}</span>
            </div>

            <div className="space-y-2 mt-3">
              {pipelineSteps.map((title, idx) => {
                const done = idx <= stepIndex
                const active = idx === stepIndex && processing
                return (
                  <div
                    key={title}
                    className={`flex items-center gap-3 p-2 rounded-xl border transition-all duration-300 ${
                      done
                        ? 'bg-black/60 backdrop-blur-md border-slate-800 opacity-100 translate-x-0'
                        : 'bg-black/30 backdrop-blur-sm border-slate-900 opacity-40 translate-x-1'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 border transition-all ${
                        done
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-black/60 backdrop-blur-md border-slate-800 text-slate-600'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : active ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      )}
                    </div>
                    <p className={`text-xs font-bold ${done ? 'text-white' : 'text-slate-500'}`}>{title}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Cpu className={`w-3.5 h-3.5 ${processing ? 'animate-spin' : ''}`} />
                {processing ? 'AI is thinking...' : 'Ready'}
              </span>
              <span className="text-xs font-bold text-cyan-400 font-mono">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/60 backdrop-blur-md rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-[width] duration-300 ease-out ${
                  processing ? 'animate-pulse' : ''
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Column 3: AI Decision & Message Preview */}
        <div className="space-y-6">
          <div className="bg-black/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl transition-all duration-300 hover:border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-extrabold border border-cyan-500/30">3</span>
                  AI Decision
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Here's the AI decision and reasoning</p>
              </div>
            </div>

            {!decision ? (
              <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
                <p className="text-xs text-slate-400">Waiting for AI decision...</p>
              </div>
            ) : (
              <div key={decision.type + decision.confidence} className="animate-fadeInUp">
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {(['notify', 'digest', 'mute'] as DecisionType[]).map((type) => {
                    const active = decision.type === type
                    const cfg = decisionCopy[type]
                    return (
                      <div
                        key={type}
                        className={`rounded-xl border p-2.5 flex flex-col items-center gap-1 transition-all duration-500 ${
                          active
                            ? `${cfg.bg} ${cfg.border} scale-105 shadow-lg shadow-cyan-500/5`
                            : 'bg-black/60 backdrop-blur-md border-slate-800/60 opacity-50 scale-95'
                        }`}
                      >
                        <span className={active ? cfg.color : 'text-slate-500'}>{cfg.icon}</span>
                        <span className={`text-[10px] font-black tracking-wider ${active ? cfg.color : 'text-slate-500'}`}>{cfg.label}</span>
                      </div>
                    )
                  })}
                </div>

                <div
                  className={`mt-4 p-4 rounded-xl ${decisionCopy[decision.type].bg} border ${
                    decisionCopy[decision.type].border
                  } flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${decisionCopy[decision.type].bg} border ${
                        decisionCopy[decision.type].border
                      } flex items-center justify-center ${decisionCopy[decision.type].color}`}
                    >
                      {decisionCopy[decision.type].icon}
                    </div>
                    <div>
                      <h3 className={`text-sm font-black tracking-wider ${decisionCopy[decision.type].color}`}>
                        {decisionCopy[decision.type].label}
                      </h3>
                      <p className="text-[11px] text-slate-300/80 font-medium">{decisionCopy[decision.type].sub}</p>
                    </div>
                  </div>
                  <ConfidenceGauge value={decision.confidence} size={64} />
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Why this decision?</p>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    {decision.reasons.map((reason, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 animate-fadeInUp"
                        style={{ animationDelay: `${i * 120}ms`, animationFillMode: 'backwards' }}
                      >
                        <span className="text-emerald-400">✓</span> {reason}
                        {reason === decision.reasons[0] && decision.type !== 'digest' ? ` (${selectedMessage.sender})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Processing Time</span>
                  <span className="text-white font-mono font-bold">{processingTimeAnimated.toFixed(0)}ms</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-black/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" /> Live Activity Feed
          </h4>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> streaming
          </span>
        </div>
        <div className="mt-3 space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
          {feed.map((item) => (
            <div
              key={item.id}
              className="animate-slideDown flex items-center justify-between gap-3 p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-sm shrink-0">{item.icon}</span>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{item.sender}</p>
                  <p className="text-[10px] text-slate-400 truncate">{item.text}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[9px] font-black tracking-wider px-2 py-1 rounded-md border ${
                    item.status === 'notify'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : item.status === 'digest'
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-slate-400 w-9 text-right">{item.confidence}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Analytics & Distribution Cards (Fixed Flex Spacing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Decision Distribution (donut) */}
        <div className="bg-black/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white">Decision Distribution</h4>
            <span className="text-xs text-slate-400">live</span>
          </div>
          <div className="flex items-center justify-center py-6 flex-1">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#12141c" strokeWidth="3" />
                {pieSegments.map((seg) => (
                  <circle
                    key={seg.key}
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="3"
                    strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                    strokeDashoffset={-seg.offset}
                    style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white tabular-nums">{messagesTotal.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-800/60">
            <div>
              <p className="text-xs font-bold text-emerald-400 tabular-nums">
                {distribution.notify} ({((distribution.notify / messagesTotal) * 100).toFixed(1)}%)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Notify</p>
            </div>
            <div>
              <p className="text-xs font-bold text-cyan-400 tabular-nums">
                {distribution.digest} ({((distribution.digest / messagesTotal) * 100).toFixed(1)}%)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Digest</p>
            </div>
            <div>
              <p className="text-xs font-bold text-rose-400 tabular-nums">
                {distribution.mute} ({((distribution.mute / messagesTotal) * 100).toFixed(1)}%)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Mute</p>
            </div>
          </div>
        </div>

        {/* Confidence Distribution (bar) */}
        <div className="bg-black/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white">Confidence Distribution</h4>
            <span className="text-xs text-slate-400">live</span>
          </div>
          <div className="flex items-end justify-between h-36 py-4 px-2 gap-3 flex-1">
            {confidenceBuckets.map((count, i) => {
              const labels = ['0-60%', '60-70%', '70-80%', '80-90%', '90-100%']
              const colors = ['bg-cyan-500/40', 'bg-cyan-500/60', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500']
              const heightPct = clamp((count / maxBucket) * 100, 4, 100)
              return (
                <div key={i} className="w-full bg-black/60 backdrop-blur-md rounded-t-lg relative group flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] text-slate-400 mb-1 tabular-nums transition-all">{count}</span>
                  <div
                    className={`w-full ${colors[i]} rounded-t-lg transition-[height] duration-500 ease-out`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] text-slate-500 mt-1.5">{labels[i]}</span>
                </div>
              )
            })}
          </div>
          <div className="pt-3 border-t border-slate-800/60 text-center">
            <p className="text-[10px] text-slate-400">Analyzed confidence distribution spread</p>
          </div>
        </div>

        {/* Response Time (line) */}
        <div className="bg-black/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white">Response Time</h4>
            <span className="text-xs text-slate-400">last {responseHistory.length} ticks</span>
          </div>
          <div className="flex-1 my-4 relative h-32">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaPathD} fill="url(#areaGrad)" />
              <path
                points={linePathD}
                d={linePathD}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ transition: 'd 0.4s ease' }}
              />
              {responsePoints.length > 0 && (
                <circle
                  cx={responsePoints[responsePoints.length - 1].x}
                  cy={responsePoints[responsePoints.length - 1].y}
                  r="4"
                  className="fill-[#c084fc]"
                />
              )}
            </svg>
          </div>
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Current Latency</span>
            <span className="text-white font-bold font-mono text-xs">{stats.responseTime}ms</span>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-black/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h4 className="text-sm font-bold text-white">Top Categories</h4>
          <span className="text-xs text-cyan-400 cursor-pointer hover:underline">View All</span>
        </div>
        <div className="space-y-3 mt-4">
          {[
            { name: 'Payment / Billing', count: 324, width: '90%' },
            { name: 'Personal', count: 298, width: '80%' },
            { name: 'Promotion', count: 276, width: '70%' },
            { name: 'Forward', count: 184, width: '50%' },
            { name: 'Business Update', count: 164, width: '40%' },
          ].map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{cat.name}</span>
                <span className="text-slate-400 font-bold">{cat.count}</span>
              </div>
              <div className="h-1.5 bg-black/60 backdrop-blur-md rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-[width] duration-700"
                  style={{ width: cat.width }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incoming phone message toast */}
      {incomingPhoneMsg && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-slideInRight">
          <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md border border-cyan-500/45 shadow-xl shadow-cyan-500/10 p-3.5 rounded-2xl w-full sm:max-w-xs">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{incomingPhoneMsg.sender}</p>
              <p className="text-[10px] text-slate-400 truncate">{incomingPhoneMsg.text}</p>
            </div>
            <ArrowDown className="w-3.5 h-3.5 text-cyan-400 animate-bounce shrink-0" />
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-black/90 backdrop-blur-lg border border-slate-800 rounded-2xl p-6 w-full max-w-sm relative shadow-2xl shadow-cyan-500/10 animate-fadeInUp">
            <button
              onClick={() => setQrOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors hover:rotate-90 duration-300"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-cyan-400" /> Scan to Connect
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 mb-5">Open Mobile Demo</p>

            <div className="flex justify-center">
              <FakeQr seed={42} />
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-slate-800">
              {qrConnected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">Connected ✓</span>
                  <Smartphone className="w-4 h-4 text-emerald-400 ml-1" />
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-300">Waiting for Mobile...</span>
                </>
              )}
            </div>

            {qrConnected && (
              <p className="text-[10px] text-slate-500 text-center mt-3 animate-fadeIn">
                Your phone is now streaming simulated messages into the dashboard.
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes gridDrift {
          0% { background-position: 0 0; }
          100% { background-position: 42px 42px; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(12px); opacity: 0; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.4s ease-out; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slideInRight { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1); }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 999px; }
      `}</style>
    </div>
  )
}