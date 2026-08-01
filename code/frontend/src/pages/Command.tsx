import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  Activity,
  BarChart3,
  Bell,
  BrainCircuit,
  Expand,
  Gauge,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'

type Metric = {
  key: string
  label: string
  value: number
  suffix: string
  format: 'number' | 'ms' | 'percent'
  accent: string
}

const metricDefaults: Metric[] = [
  { key: 'messagesToday', label: 'Total Messages Today', value: 12840, suffix: '', format: 'number', accent: '#67e8f9' },
  { key: 'messagesMinute', label: 'Messages / Minute', value: 184, suffix: '', format: 'number', accent: '#8b5cf6' },
  { key: 'activeDecisions', label: 'Active AI Decisions', value: 26, suffix: '', format: 'number', accent: '#34d399' },
  { key: 'avgResponse', label: 'Average Response Time', value: 214, suffix: 'ms', format: 'ms', accent: '#fbbf24' },
  { key: 'aiAccuracy', label: 'AI Accuracy', value: 98.7, suffix: '%', format: 'percent', accent: '#67e8f9' },
  { key: 'confidence', label: 'Confidence Average', value: 96.4, suffix: '%', format: 'percent', accent: '#a78bfa' },
  { key: 'threatsBlocked', label: 'Threats Blocked Today', value: 318, suffix: '', format: 'number', accent: '#f87171' },
  { key: 'businessesVerified', label: 'Businesses Verified', value: 128, suffix: '', format: 'number', accent: '#4ade80' },
  { key: 'queueSize', label: 'Queue Size', value: 64, suffix: '', format: 'number', accent: '#c084fc' },
  { key: 'systemHealth', label: 'System Health', value: 99.2, suffix: '%', format: 'percent', accent: '#34d399' },
]

type AlertItem = { id: number; text: string; tone: 'info' | 'warn' | 'danger' | 'success' }

const topSenders = [
  { name: 'Mom', messages: 284, confidence: '99%', notifyRate: '88%', trust: '99%' },
  { name: 'Amazon', messages: 196, confidence: '97%', notifyRate: '76%', trust: '98%' },
  { name: 'College Group', messages: 174, confidence: '95%', notifyRate: '82%', trust: '97%' },
  { name: 'HDFC Bank', messages: 136, confidence: '98%', notifyRate: '73%', trust: '99%' },
  { name: 'Swiggy', messages: 128, confidence: '96%', notifyRate: '74%', trust: '96%' },
  { name: 'Flipkart', messages: 120, confidence: '94%', notifyRate: '70%', trust: '95%' },
]

const topBusinesses = [
  { name: 'Amazon India', logo: 'A', trust: '98%', risk: 'Low', messages: 284, activity: '2 min ago' },
  { name: 'HDFC Bank', logo: 'H', trust: '99%', risk: 'Low', messages: 196, activity: '1 min ago' },
  { name: 'Swiggy', logo: 'S', trust: '96%', risk: 'Low', messages: 174, activity: '4 min ago' },
  { name: 'Uber', logo: 'U', trust: '96%', risk: 'Low', messages: 148, activity: '7 min ago' },
  { name: 'Paytm', logo: 'P', trust: '95%', risk: 'Low', messages: 123, activity: '12 min ago' },
]

const threatItems = [
  { name: 'Blocked Spam', value: 84, color: '#f87171' },
  { name: 'Fake Promotions', value: 68, color: '#fbbf24' },
  { name: 'Scam Attempts', value: 72, color: '#f97316' },
  { name: 'Suspicious Businesses', value: 41, color: '#a78bfa' },
  { name: 'Forward Spam', value: 61, color: '#fb7185' },
  { name: 'Crypto Scam', value: 32, color: '#ef4444' },
  { name: 'Lottery Scam', value: 47, color: '#f59e0b' },
]

const pipelineStages = [
  'Incoming Message',
  'Text Analysis',
  'Intent Detection',
  'Context Analysis',
  'Business Verification',
  'Spam Detection',
  'Confidence Calculation',
  'Decision Engine',
  'Notify / Digest / Mute',
]

const initialAlerts: AlertItem[] = [
  { id: 1, text: 'Spam attack detected', tone: 'danger' },
  { id: 2, text: 'High confidence scam blocked', tone: 'warn' },
  { id: 3, text: 'Business verification delayed', tone: 'info' },
  { id: 4, text: 'Server latency increased', tone: 'warn' },
]

const formatMetricValue = (metric: Metric) => {
  if (metric.format === 'number') return new Intl.NumberFormat('en-US').format(Math.round(metric.value))
  if (metric.format === 'ms') return `${Math.round(metric.value)}ms`
  return `${metric.value.toFixed(1)}%`
}

export default function Command() {
  const [now, setNow] = useState(new Date())
  const [metrics, setMetrics] = useState<Metric[]>(() => metricDefaults.map((metric) => ({ ...metric })))
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts)
  const [feed, setFeed] = useState([
    { time: '10:24 PM', sender: 'Mom', decision: 'Notify', confidence: '99%' },
    { time: '10:24 PM', sender: 'Amazon', decision: 'Digest', confidence: '94%' },
    { time: '10:25 PM', sender: 'Lottery Winner', decision: 'Mute', confidence: '99%' },
    { time: '10:26 PM', sender: 'HDFC', decision: 'Notify', confidence: '98%' },
    { time: '10:27 PM', sender: 'Swiggy', decision: 'Digest', confidence: '96%' },
    { time: '10:28 PM', sender: 'Paytm', decision: 'Notify', confidence: '95%' },
  ])
  const [currentMessage, setCurrentMessage] = useState({
    sender: 'Mom',
    category: 'Personal',
    intent: 'Family Check-In',
    confidence: '99%',
    time: '214ms',
    stage: 'Business Verification',
    decision: 'Notify',
    progress: 88,
  })

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric, index) => {
          const drift = index === 0 ? 8 : index === 1 ? 3 : index === 2 ? 2 : index === 3 ? 18 : index === 4 ? 0.25 : index === 5 ? 0.2 : index === 6 ? 4 : index === 7 ? 1 : index === 8 ? 2 : 0.08
          const next = metric.value + (Math.random() - 0.5) * drift
          const bounded = Math.min(Math.max(next, metric.format === 'percent' ? 80 : 0), metric.format === 'percent' ? 100 : 99999)
          return { ...metric, value: bounded } as Metric
        })
      )

      setAlerts((prev) => {
        const entries = [
          'Spam attack detected',
          'High confidence scam blocked',
          'Business verification delayed',
          'Server latency increased',
          'New trusted business verified',
        ]
        const newEntry = entries[Math.floor(Math.random() * entries.length)]
        const toneValue: AlertItem['tone'] = newEntry.includes('spam') || newEntry.includes('scam') ? 'danger' : newEntry.includes('latency') || newEntry.includes('delayed') ? 'warn' : 'success'
        const next: AlertItem[] = [{ id: Date.now(), text: newEntry, tone: toneValue }, ...prev].slice(0, 5)
        return next
      })

      setFeed((prev) => {
        const events = [
          { time: '10:28 PM', sender: 'Mom', decision: 'Notify', confidence: '99%' },
          { time: '10:29 PM', sender: 'Amazon', decision: 'Digest', confidence: '94%' },
          { time: '10:29 PM', sender: 'Lottery Winner', decision: 'Mute', confidence: '99%' },
          { time: '10:30 PM', sender: 'HDFC', decision: 'Notify', confidence: '98%' },
          { time: '10:31 PM', sender: 'Swiggy', decision: 'Digest', confidence: '96%' },
          { time: '10:32 PM', sender: 'Zomato', decision: 'Notify', confidence: '97%' },
        ]
        const nextEvent = events[Math.floor(Math.random() * events.length)]
        return [nextEvent, ...prev].slice(0, 6)
      })

      setCurrentMessage((prev) => ({
        ...prev,
        confidence: `${(Math.random() * 5 + 94).toFixed(1)}%`,
        time: `${Math.floor(160 + Math.random() * 180)}ms`,
        progress: Math.min(100, Math.max(65, prev.progress + (Math.random() - 0.5) * 18)),
        stage: pipelineStages[Math.floor(Math.random() * pipelineStages.length)],
        decision: ['Notify', 'Digest', 'Mute'][Math.floor(Math.random() * 3)],
      }))
    }, 2200)

    return () => clearInterval(interval)
  }, [])

  const uptime = useMemo(() => {
    const totalSeconds = 18 * 60 * 60 + 42 * 60 + 17
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h}h ${m}m ${s}s`
  }, [])

  const trafficCounts = useMemo(() => ({
    incoming: 1480,
    notify: 620,
    digest: 460,
    mute: 210,
    business: 390,
    personal: 540,
    spam: 110,
  }), [])

  const currentTimeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="page-shell command-shell">
      <style>{`
        .command-shell {
          position: relative;
          min-height: calc(100vh - 48px);
          width: 100%;
          background: #000000;
          background-image:
            radial-gradient(circle at 15% 15%, rgba(34, 211, 238, 0.07), transparent 40%),
            radial-gradient(circle at 85% 10%, rgba(168, 85, 247, 0.07), transparent 40%),
            radial-gradient(circle at 50% 90%, rgba(52, 211, 153, 0.05), transparent 50%);
          color: #f8fafc;
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 30px 80px rgba(0, 0, 0, 0.9);
        }
        .command-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(circle at center, black 60%, transparent 100%);
          pointer-events: none;
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(52,211,153,0.55); }
          70% { box-shadow: 0 0 0 12px rgba(52,211,153,0); }
          100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowUp {
          0% { filter: brightness(1); }
          50% { filter: brightness(1.25); }
          100% { filter: brightness(1); }
        }
        @keyframes flow {
          0% { transform: translateX(-10px); opacity: 0.2; }
          30% { opacity: 1; }
          100% { transform: translateX(18px); opacity: 0.55; }
        }
        .glass {
          background: rgba(12, 14, 18, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 16px 32px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(16px);
        }
        .metric-card {
          background: rgba(10, 12, 16, 0.75);
          padding: 16px 18px;
          border-radius: 16px;
          transition: all 0.25s ease;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(16px);
        }
        .metric-card:hover {
          transform: translateY(-2px);
          border-color: rgba(103, 232, 249, 0.35);
          background: rgba(16, 20, 26, 0.85);
        }
        .status-pulse {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(52, 211, 153, 0.2);
          color: #a7f3d0;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          animation: pulseGlow 2s infinite;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 16px rgba(52, 211, 153, 0.9);
        }
        .chart-bar {
          animation: glowUp 2.2s ease-in-out infinite;
        }
        .traffic-line {
          position: absolute;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(103,232,249,0.2), rgba(103,232,249,0.8), rgba(168,85,247,0.65));
          box-shadow: 0 0 18px rgba(103,232,249,0.4);
          animation: flow 4s ease-in-out infinite alternate;
        }
        .alert-slide {
          animation: slideIn 0.35s ease-out;
        }
        .progress-fill {
          transition: width 0.5s ease;
        }
        .gauge-ring {
          position: relative;
          width: 88px;
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: conic-gradient(var(--ring-color) var(--value), rgba(255,255,255,0.04) 0);
          box-shadow: inset 0 0 20px rgba(255,255,255,0.02), 0 0 18px rgba(52,211,153,0.08);
        }
        .gauge-ring::before {
          content: '';
          position: absolute;
          inset: 12px;
          background: rgba(8, 10, 14, 0.9);
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .gauge-ring span {
          position: relative;
          z-index: 1;
          font-size: 11px;
          color: #f1f5f9;
          font-weight: 700;
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, padding: '20px 18px 16px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', letterSpacing: '-0.03em', fontWeight: 700, color: '#ffffff' }}>Command Center</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(148,163,184,0.82)', fontSize: '12px' }}>Real-time AI Operations & System Monitoring</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="status-pulse"><span className="status-dot" /> Live Status</div>
            <div className="glass" style={{ padding: '7px 12px', borderRadius: '12px', fontSize: '11px', color: '#f1f5f9', minWidth: '120px', textAlign: 'center' }}>
              {currentTimeLabel}
            </div>
            <div className="glass" style={{ padding: '7px 12px', borderRadius: '12px', fontSize: '11px', color: '#f1f5f9' }}>
              Uptime {uptime}
            </div>
            <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '12px', color: '#f1f5f9', fontSize: '11px', cursor: 'pointer' }}>
              <RefreshCw size={12} /> Refresh
            </button>
            <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '12px', color: '#f1f5f9', fontSize: '11px', cursor: 'pointer' }}>
              <Expand size={12} /> Full Screen
            </button>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
          {metrics.map((metric, index) => (
            <div
              key={metric.key}
              className="metric-card animated-card"
              style={{ animationDelay: `${index * 40}ms`, borderColor: `rgba(255,255,255,0.06)`, boxShadow: `inset 0 0 0 1px ${metric.accent}15, 0 10px 25px rgba(0,0,0,0.5)` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{metric.label}</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: metric.accent, boxShadow: `0 0 12px ${metric.accent}` }} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.05em', color: metric.accent }}>{formatMetricValue(metric)}</div>
              <div style={{ marginTop: '8px', fontSize: '10px', color: '#64748b' }}>
                {index % 2 === 0 ? '+12.4%' : 'stable'}
              </div>
            </div>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.35fr 1.1fr', gap: '16px', alignItems: 'stretch' }}>
          <div className="glass" style={{ padding: '16px', borderRadius: '18px', position: 'relative', overflow: 'hidden', minHeight: '360px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={15} color="#67e8f9" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Real-time Message Traffic</span>
              </div>
              <div style={{ display: 'flex', gap: '14px', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <span>Incoming {trafficCounts.incoming}</span>
                <span>Live</span>
              </div>
            </div>

            <div style={{ position: 'relative', height: '260px', borderRadius: '14px', background: 'rgba(6, 8, 12, 0.6)', border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}>
              <div className="traffic-line" style={{ top: '18%', left: '8%', width: '64%' }} />
              <div className="traffic-line" style={{ top: '34%', left: '16%', width: '72%', animationDelay: '0.5s' }} />
              <div className="traffic-line" style={{ top: '58%', left: '12%', width: '68%', animationDelay: '1s' }} />
              <div className="traffic-line" style={{ top: '76%', left: '20%', width: '60%', animationDelay: '1.5s' }} />

              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 30%, rgba(103,232,249,0.05), transparent 25%), radial-gradient(circle at 50% 60%, rgba(168,85,247,0.05), transparent 35%)' }} />

              {[
                { label: 'Notify', value: trafficCounts.notify, left: '14%', top: '12%', color: '#67e8f9' },
                { label: 'Digest', value: trafficCounts.digest, left: '36%', top: '30%', color: '#a78bfa' },
                { label: 'Mute', value: trafficCounts.mute, left: '56%', top: '48%', color: '#f87171' },
                { label: 'Business', value: trafficCounts.business, left: '62%', top: '18%', color: '#4ade80' },
                { label: 'Personal', value: trafficCounts.personal, left: '72%', top: '70%', color: '#fbbf24' },
                { label: 'Spam', value: trafficCounts.spam, left: '40%', top: '74%', color: '#f87171' },
              ].map((entry) => (
                <div key={entry.label} style={{ position: 'absolute', left: entry.left, top: entry.top, transform: 'translate(-50%, -50%)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: entry.color, boxShadow: `0 0 18px ${entry.color}` }} />
                    <div style={{ fontSize: '10px', color: '#f1f5f9', fontWeight: 700 }}>{entry.label}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{entry.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: '16px', borderRadius: '18px', minHeight: '360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <BrainCircuit size={15} color="#a78bfa" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Live AI Pipeline</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
              {pipelineStages.map((stage, index) => (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: index === 0 || index === pipelineStages.length - 1 ? '#67e8f9' : '#a78bfa', boxShadow: `0 0 12px ${index === 0 || index === pipelineStages.length - 1 ? '#67e8f9' : '#a78bfa'}` }} />
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: index === 4 ? 'rgba(103,232,249,0.06)' : 'rgba(10,12,16,0.6)', color: index === 4 ? '#bfdbfe' : '#f1f5f9', fontSize: '11px', fontWeight: 600 }}>
                    {stage}
                  </div>
                  {index < pipelineStages.length - 1 && <div style={{ fontSize: '12px', color: '#64748b' }}>↓</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <MessageSquare size={15} color="#67e8f9" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Live Message Stream</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {feed.slice(0, 6).map((entry) => (
                <div key={`${entry.sender}-${entry.time}-${entry.decision}`} className="alert-slide" style={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,12,16,0.6)', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '10px', marginBottom: '6px' }}>
                    <span>{entry.time}</span>
                    <span>{entry.confidence}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '12px' }}>{entry.sender}</div>
                    <div style={{ fontWeight: 700, color: entry.decision === 'Mute' ? '#fca5a5' : entry.decision === 'Digest' ? '#a78bfa' : '#67e8f9', fontSize: '11px' }}>{entry.decision}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.15fr', gap: '16px', marginTop: '18px' }}>
          <div className="glass" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} color="#67e8f9" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>AI Decision Monitor</span>
              </div>
              <span style={{ fontSize: '10px', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
              <div>
                <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 700 }}>Message Preview</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{currentMessage.sender} • {currentMessage.category}</div>
              </div>
              <div style={{ borderRadius: '10px', padding: '6px 10px', background: 'rgba(103,232,249,0.08)', color: '#bfdbfe', fontSize: '11px', fontWeight: 700 }}>{currentMessage.decision}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div className="glass" style={{ padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px' }}>Detected Intent</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{currentMessage.intent}</div>
              </div>
              <div className="glass" style={{ padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px' }}>Confidence</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{currentMessage.confidence}</div>
              </div>
              <div className="glass" style={{ padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px' }}>Processing Time</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{currentMessage.time}</div>
              </div>
              <div className="glass" style={{ padding: '10px 12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '6px' }}>Current Stage</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{currentMessage.stage}</div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px', color: '#94a3b8' }}>
                <span>Decision engine</span>
                <span>{Math.round(currentMessage.progress)}%</span>
              </div>
              <div style={{ position: 'relative', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                <div className="progress-fill" style={{ width: `${currentMessage.progress}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #67e8f9, #8b5cf6, #34d399)' }} />
              </div>
            </div>
          </div>

          <div className="glass" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Gauge size={15} color="#34d399" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>System Health</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
              {[
                { label: 'CPU', value: 74, color: '#34d399' },
                { label: 'RAM', value: 68, color: '#67e8f9' },
                { label: 'Storage', value: 59, color: '#a78bfa' },
                { label: 'Network', value: 82, color: '#4ade80' },
                { label: 'Inference Speed', value: 91, color: '#67e8f9' },
                { label: 'GPU Usage', value: 77, color: '#c084fc' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div className="gauge-ring" style={{ '--ring-color': item.color, '--value': `${item.value}%` } as CSSProperties}>
                    <span>{item.value}%</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <BarChart3 size={15} color="#c084fc" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Queue Monitor</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Messages Waiting', value: 84, color: '#67e8f9' },
                { label: 'Processing', value: 68, color: '#a78bfa' },
                { label: 'Completed', value: 91, color: '#34d399' },
                { label: 'Failed', value: 18, color: '#f87171' },
                { label: 'Retry Queue', value: 39, color: '#fbbf24' },
              ].map((queue) => (
                <div key={queue.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '6px' }}>
                    <span>{queue.label}</span>
                    <span>{queue.value}%</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div className="chart-bar" style={{ height: '100%', width: `${queue.value}%`, borderRadius: '999px', background: `linear-gradient(90deg, ${queue.color}, rgba(255,255,255,0.8))` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gap: '16px', marginTop: '18px' }}>
          <div className="glass" style={{ padding: '16px', borderRadius: '18px', minHeight: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Bell size={15} color="#fbbf24" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Alert Center</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.map((alert) => (
                <div key={alert.id} className="alert-slide" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '12px', background: alert.tone === 'success' ? 'rgba(16,185,129,0.08)' : alert.tone === 'warn' ? 'rgba(251,191,36,0.07)' : alert.tone === 'danger' ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: alert.tone === 'success' ? '#34d399' : alert.tone === 'warn' ? '#fbbf24' : alert.tone === 'danger' ? '#f87171' : '#67e8f9', fontWeight: 700 }}>•</span>
                  <span style={{ fontSize: '12px', color: '#f1f5f9' }}>{alert.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Activity size={15} color="#67e8f9" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>AI Performance</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {['Accuracy Trend', 'Confidence Distribution', 'Message Categories', 'Decision Distribution'].map((label, idx) => (
                <div key={label} style={{ background: 'rgba(10,12,16,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '10px', minHeight: '78px' }}>
                  <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>{label}</div>
                  <svg viewBox="0 0 120 40" width="100%" height="40" style={{ overflow: 'visible' }}>
                    <path d={idx % 2 === 0 ? 'M 0 30 L 25 22 L 50 26 L 75 18 L 100 12 L 120 6' : 'M 0 20 L 25 24 L 50 14 L 75 18 L 100 9 L 120 12'} fill="none" stroke={idx % 2 === 0 ? '#67e8f9' : '#a78bfa'} strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={15} color="#34d399" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Threat Monitor</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {threatItems.map((item) => (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginBottom: '6px' }}>
                    <span>{item.name}</span>
                    <span>{item.value}</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div className="chart-bar" style={{ height: '100%', width: `${item.value}%`, borderRadius: '999px', background: `linear-gradient(90deg, ${item.color}, rgba(255,255,255,0.82))` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.2fr 1.1fr 1.1fr', gap: '16px', marginTop: '18px' }}>
          <div className="glass" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>Top Senders</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topSenders.map((sender) => (
                <div key={sender.name} style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.7fr 0.65fr 0.7fr', gap: '8px', alignItems: 'center', padding: '10px 10px', borderRadius: '10px', background: 'rgba(10,12,16,0.6)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '11px' }}>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{sender.name}</div>
                  <div style={{ color: '#a7f3d0' }}>{sender.messages}</div>
                  <div style={{ color: '#bfdbfe' }}>{sender.confidence}</div>
                  <div style={{ color: '#d8b4fe' }}>{sender.trust}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: '16px', borderRadius: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#ffffff' }}>Top Businesses</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topBusinesses.map((business) => (
                <div key={business.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,12,16,0.6)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#000000', background: 'linear-gradient(135deg, #67e8f9, #a78bfa)' }}>{business.logo}</div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{business.name}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Last activity {business.activity}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px' }}>
                    <div style={{ color: '#a7f3d0', fontWeight: 700 }}>{business.trust}</div>
                    <div style={{ color: '#f1f5f9', marginTop: '2px' }}>{business.messages}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: '16px', borderRadius: '18px', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Zap size={15} color="#fbbf24" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Activity Timeline</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                ['10:24:02', 'Message Received'],
                ['10:24:03', 'Intent Analysis'],
                ['10:24:03', 'Business Verified'],
                ['10:24:04', 'Spam Check'],
                ['10:24:04', 'Confidence 99%'],
                ['10:24:05', 'Decision Notify'],
              ].map(([time, label]) => (
                <div key={time + label} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                  <div style={{ color: '#94a3b8' }}>{time}</div>
                  <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(10,12,16,0.6)', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr 1fr 1fr', gap: '14px' }}>
          <div className="glass" style={{ padding: '12px 14px', borderRadius: '14px' }}>
            <div style={{ color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> AI Engine Online</div>
          </div>
          <div className="glass" style={{ padding: '12px 14px', borderRadius: '14px' }}>
            <div style={{ color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> Database Connected</div>
          </div>
          <div className="glass" style={{ padding: '12px 14px', borderRadius: '14px' }}>
            <div style={{ color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> Business Verification Active</div>
          </div>
          <div className="glass" style={{ padding: '12px 14px', borderRadius: '14px' }}>
            <div style={{ color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> Queue Healthy</div>
          </div>
          <div className="glass" style={{ padding: '12px 14px', borderRadius: '14px' }}>
            <div style={{ color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '11px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> Last Sync {currentTimeLabel}</div>
          </div>
        </section>
      </div>
    </div>
  )
}