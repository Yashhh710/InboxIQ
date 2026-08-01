import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../context/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  FileStack,
  Ban,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Search,
  Zap,
  Shield,
  User,
  Megaphone,
  Share2,
  CreditCard,
  Building2,
  Calendar,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Brain,
  Check,
  Users2,
  type LucideIcon,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  LabelList,
} from 'recharts'

// ============================================================================
// Types
// ============================================================================

interface DashboardStats {
  total_messages: number
  notify_count: number
  digest_count: number
  mute_count: number
  ai_accuracy: number
  confidence_average: number
}

interface ChartPoint {
  name: string
  value: number
}

interface ChartData {
  notification_trend: ChartPoint[]
  message_categories: ChartPoint[]
  user_activity: ChartPoint[]
}

interface MessageRow {
  message_id: string
  message_text?: string
  sender_user_id?: string
  user_id?: string
  group_id?: string
  business_id?: string
  conversation_type?: string
  created_at?: string
  action: string
  message_type: string
  confidence: number
  reason?: string
}

interface Directory {
  groups: Record<string, string>
  businesses: Record<string, string>
}

// ============================================================================
// Static config (visual language for actions / categories)
// ============================================================================

// Shared dark-mode card shell. Every panel on this page uses this instead of
// relying on a global ".card" class, so the dashboard always renders dark
// regardless of what layout/theme wraps it.
const CARD =
  'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-24px_rgba(0,0,0,0.65)] p-6'

const ACTION_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  notify: { label: 'Notify', color: '#34d399', bg: 'rgba(0, 0, 0, 0.95)', border: 'rgba(52, 211, 153, 0.35)' },
  digest: { label: 'Digest', color: '#60a5fa', bg: 'rgba(0, 0, 0, 0.15)', border: 'rgba(96, 165, 250, 0.35)' },
  mute: { label: 'Mute', color: '#f87171', bg: 'rgba(0, 0, 0, 0.15)', border: 'rgba(248, 113, 113, 0.35)' },
}

const CATEGORY_STYLES: Record<string, { icon: LucideIcon; color: string }> = {
  urgent: { icon: Zap, color: '#34d399' },
  scam: { icon: Shield, color: '#f87171' },
  personal: { icon: User, color: '#60a5fa' },
  promotion: { icon: Megaphone, color: '#a78bfa' },
  forward: { icon: Share2, color: '#22d3ee' },
  payment: { icon: CreditCard, color: '#facc15' },
  business_update: { icon: Building2, color: '#4ade80' },
  event: { icon: Calendar, color: '#f472b6' },
  spam: { icon: Ban, color: '#fb923c' },
}
const DEFAULT_CATEGORY_STYLE = { icon: MessageSquare, color: '#94a3b8' }

const NOTIFICATION_COLORS: Record<string, string> = {
  Notify: '#34d399',
  Digest: '#60a5fa',
  Mute: '#f87171',
}

const CONVERSATION_COLORS: Record<string, string> = {
  group: '#a78bfa',
  business: '#22d3ee',
  personal: '#34d399',
  individual: '#34d399',
}

const PIPELINE_STEPS = [
  { label: 'Message', sub: 'Received', icon: MessageSquare, caption: 'Reading incoming message…' },
  { label: 'NLP', sub: 'Analysis', icon: Sparkles, caption: 'Running language analysis…' },
  { label: 'User', sub: 'Context', icon: User, caption: 'Loading user context…' },
  { label: 'Business', sub: 'Context', icon: Building2, caption: 'Loading business & group context…' },
  { label: 'Scam', sub: 'Detection', icon: Shield, caption: 'Checking for scam & spam signals…' },
  { label: 'Confidence', sub: 'Score', icon: BarChart3, caption: 'Calculating confidence score…' },
]

function formatCategoryLabel(value: string) {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function parseDate(raw?: string): Date | null {
  if (!raw) return null
  const iso = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

function getInitials(label: string) {
  const parts = label.replace(/[_-]/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function truncate(text: string | undefined | null, length: number) {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > length ? clean.slice(0, length).trim() + '…' : clean
}

function splitReasoning(reason?: string) {
  if (!reason) return []
  return reason
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
}

// ============================================================================
// Component
// ============================================================================

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [charts, setCharts] = useState<ChartData | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [directory, setDirectory] = useState<Directory>({ groups: {}, businesses: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedFilter, setFeedFilter] = useState('')
  const [trendRange, setTrendRange] = useState<7 | 14>(7)
  const { addToast } = useToast()

  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    const load = async (showLoading: boolean) => {
      try {
        if (showLoading) setLoading(true)
        setError(null)

        const [statsRes, chartsRes, messagesRes] = await Promise.all([
          api.getDashboardStats(),
          api.getDashboardCharts(),
          api.getMessages(undefined, undefined, undefined, 0, 200),
        ])

        setStats(statsRes.data)
        setCharts(chartsRes.data)
        setMessages(messagesRes.data?.data || [])

        // Directory lookup (group/business display names) is optional — if the
        // request fails, sender IDs are shown as a graceful fallback instead
        // of throwing.
        try {
          const dirRes = await api.getDirectory()
          if (dirRes?.data) {
            setDirectory({
              groups: dirRes.data.groups || {},
              businesses: dirRes.data.businesses || {},
            })
          }
        } catch {
          // Directory is a nice-to-have; ignore failures silently.
        }

        if (!hasLoadedOnce.current) {
          addToast('Dashboard loaded successfully', 'success')
          hasLoadedOnce.current = true
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard'
        setError(message)
        addToast(message, 'error')
      } finally {
        if (showLoading) setLoading(false)
      }
    }

    load(true)
    const interval = setInterval(() => load(false), 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sender label resolution -------------------------------------------------
  const getSenderLabel = (msg: MessageRow) => {
    if (msg.conversation_type === 'group' && msg.group_id) {
      return directory.groups[msg.group_id] || msg.group_id
    }
    if (msg.conversation_type === 'business' && msg.business_id) {
      return directory.businesses[msg.business_id] || msg.business_id
    }
    return msg.sender_user_id || msg.user_id || 'Unknown'
  }

  // Sorted messages (most recent first) -------------------------------------
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const da = parseDate(a.created_at)?.getTime() || 0
      const db = parseDate(b.created_at)?.getTime() || 0
      return db - da
    })
  }, [messages])

  // Live feed (filtered) -----------------------------------------------------
  const liveFeed = useMemo(() => {
    const q = feedFilter.trim().toLowerCase()
    const list = q
      ? sortedMessages.filter(
          (m) =>
            (m.message_text || '').toLowerCase().includes(q) ||
            getSenderLabel(m).toLowerCase().includes(q)
        )
      : sortedMessages
    return list.slice(0, 6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedMessages, feedFilter, directory])

  // Message trend (real dates, grouped by day) -------------------------------
  const trendData = useMemo(() => {
    const byDay = new Map<string, number>()
    sortedMessages.forEach((m) => {
      const d = parseDate(m.created_at)
      if (!d) return
      const key = d.toISOString().slice(0, 10)
      byDay.set(key, (byDay.get(key) || 0) + 1)
    })
    const days = Array.from(byDay.keys()).sort()
    const lastDays = days.slice(-trendRange)
    return lastDays.map((day) => ({
      date: day,
      label: new Date(day + 'T00:00:00').toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
      }),
      messages: byDay.get(day) || 0,
    }))
  }, [sortedMessages, trendRange])

  const trendChange = useMemo(() => {
    if (trendData.length < 2) return null
    const last = trendData[trendData.length - 1].messages
    const prev = trendData[trendData.length - 2].messages
    if (prev === 0) return null
    return ((last - prev) / prev) * 100
  }, [trendData])

  // Confidence trend (recent half vs older half) -----------------------------
  const confidenceTrend = useMemo(() => {
    const withDates = [...messages]
      .filter((m) => parseDate(m.created_at))
      .sort((a, b) => (parseDate(a.created_at)!.getTime() - parseDate(b.created_at)!.getTime()))
    if (withDates.length < 4) return null
    const mid = Math.floor(withDates.length / 2)
    const older = withDates.slice(0, mid)
    const recent = withDates.slice(mid)
    const avg = (arr: MessageRow[]) => arr.reduce((s, m) => s + (m.confidence || 0), 0) / arr.length
    return (avg(recent) - avg(older)) * 100
  }, [messages])

  // Total messages day-over-day ----------------------------------------------
  const totalChange = useMemo(() => {
    const byDay = new Map<string, number>()
    sortedMessages.forEach((m) => {
      const d = parseDate(m.created_at)
      if (!d) return
      const key = d.toISOString().slice(0, 10)
      byDay.set(key, (byDay.get(key) || 0) + 1)
    })
    const days = Array.from(byDay.keys()).sort()
    if (days.length < 2) return null
    const last = byDay.get(days[days.length - 1]) || 0
    const prev = byDay.get(days[days.length - 2]) || 0
    if (prev === 0) return null
    return ((last - prev) / prev) * 100
  }, [sortedMessages])

  // Notification distribution with percentages --------------------------------
  const notificationDist = useMemo(() => {
    if (!charts) return []
    const total = charts.notification_trend.reduce((s, c) => s + c.value, 0) || 1
    return charts.notification_trend.map((c) => ({
      ...c,
      pct: (c.value / total) * 100,
      color: NOTIFICATION_COLORS[c.name] || '#94a3b8',
    }))
  }, [charts])

  // Conversation types with percentages ----------------------------------------
  const conversationDist = useMemo(() => {
    if (!charts) return []
    const total = charts.user_activity.reduce((s, c) => s + c.value, 0) || 1
    return charts.user_activity.map((c) => ({
      ...c,
      pct: (c.value / total) * 100,
      color: CONVERSATION_COLORS[c.name] || '#94a3b8',
      label: formatCategoryLabel(c.name),
    }))
  }, [charts])

  // Message categories styled ----------------------------------------------------
  const categoryData = useMemo(() => {
    if (!charts) return []
    return charts.message_categories.map((c) => ({
      ...c,
      label: formatCategoryLabel(c.name),
      style: CATEGORY_STYLES[c.name] || DEFAULT_CATEGORY_STYLE,
    }))
  }, [charts])

  // AI Processing Engine animation ------------------------------------------
  const enginePool = useMemo(() => sortedMessages.slice(0, 8), [sortedMessages])
  const [engineIndex, setEngineIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (enginePool.length === 0) return
    const tick = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < PIPELINE_STEPS.length) return prev + 1
        setEngineIndex((i) => (i + 1) % enginePool.length)
        return 0
      })
    }, 750)
    return () => clearInterval(tick)
  }, [enginePool.length])

  const engineMessage = enginePool[engineIndex] || null
  const engineConfidence = engineMessage ? engineMessage.confidence * 100 : 0
  const engineProgress =
    stepIndex >= PIPELINE_STEPS.length
      ? engineConfidence
      : (stepIndex / PIPELINE_STEPS.length) * engineConfidence
  const engineCaption =
    stepIndex >= PIPELINE_STEPS.length
      ? `Decision: ${(engineMessage?.action || '').toUpperCase()} • ${engineConfidence.toFixed(0)}% confidence`
      : PIPELINE_STEPS[stepIndex]?.caption

  // Selected message for AI Inspector preview = most recent -----------------
  const selectedMessage = liveFeed[0] || sortedMessages[0] || null
  const selectedReasoning = splitReasoning(selectedMessage?.reason)

  // --------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="w-full h-full min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-shell p-8">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div
      className="page-shell min-h-screen w-full text-white p-8 space-y-6"
      style={{
        background:
          'radial-gradient(1100px 700px at 10% -10%, rgba(0,217,255,0.05), transparent 60%),' +
          'radial-gradient(900px 650px at 100% 0%, rgba(52,211,153,0.04), transparent 55%),' +
          '#000000',
      }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-4xl font-bold mb-2 text-white">Dashboard</h1>
          <p className="text-white/60">Real-time message routing intelligence</p>
        </motion.div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={feedFilter}
              onChange={(e) => setFeedFilter(e.target.value)}
              placeholder="Filter live feed…"
              className="w-56 bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-accent/50"
            />
          </div>

          <Link
            to="/messages"
            className="relative w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
            title="View notify messages"
          >
            <Bell className="w-5 h-5 text-white/70" />
            {stats && stats.notify_count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-black text-[10px] font-bold flex items-center justify-center">
                {Math.min(stats.notify_count, 99)}
              </span>
            )}
          </Link>

          <div
            className="w-10 h-10 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-sm"
            title="Admin"
          >
            A
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div whileHover={{ y: -4 }} className={CARD}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm mb-2">Total Messages</p>
              <h3 className="text-3xl font-bold mb-2 text-white">{stats?.total_messages ?? 0}</h3>
              {totalChange !== null && (
                <p className={`text-sm flex items-center gap-1 ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {totalChange >= 0 ? '+' : ''}
                  {totalChange.toFixed(1)}% vs prior day
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className={CARD}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm mb-2">Notify</p>
              <h3 className="text-3xl font-bold mb-2 text-white">{stats?.notify_count ?? 0}</h3>
              <p className="text-sm text-white/50">
                {stats ? ((stats.notify_count / (stats.total_messages || 1)) * 100).toFixed(1) : '0.0'}% of total
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: ACTION_STYLES.notify.bg, color: ACTION_STYLES.notify.color }}
            >
              <Bell className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className={CARD}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm mb-2">Digest</p>
              <h3 className="text-3xl font-bold mb-2 text-white">{stats?.digest_count ?? 0}</h3>
              <p className="text-sm text-white/50">
                {stats ? ((stats.digest_count / (stats.total_messages || 1)) * 100).toFixed(1) : '0.0'}% of total
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: ACTION_STYLES.digest.bg, color: ACTION_STYLES.digest.color }}
            >
              <FileStack className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className={CARD}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm mb-2">Mute</p>
              <h3 className="text-3xl font-bold mb-2 text-white">{stats?.mute_count ?? 0}</h3>
              <p className="text-sm text-white/50">
                {stats ? ((stats.mute_count / (stats.total_messages || 1)) * 100).toFixed(1) : '0.0'}% of total
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: ACTION_STYLES.mute.bg, color: ACTION_STYLES.mute.color }}
            >
              <Ban className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className={CARD}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 text-sm mb-2">AI Accuracy</p>
              <h3 className="text-3xl font-bold mb-2 gradient-text">
                {((stats?.ai_accuracy || 0) * 100).toFixed(1)}%
              </h3>
              {confidenceTrend !== null && (
                <p className={`text-sm flex items-center gap-1 ${confidenceTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {confidenceTrend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {confidenceTrend >= 0 ? '+' : ''}
                  {confidenceTrend.toFixed(1)}% trend
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Engine + Charts (left) / Live Feed + Inspector (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* AI Processing Engine */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Brain className="w-5 h-5 text-accent" />
                AI Processing Engine
              </h3>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                LIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Ambient brain visual */}
              <div className="relative h-40 md:h-full flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-32 h-32 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.35), transparent 70%)' }}
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  className="absolute w-24 h-24 rounded-full border border-dashed border-accent/30"
                />
                <div className="relative w-16 h-16 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-accent" />
                </div>
              </div>

              {/* Pipeline */}
              <div className="md:col-span-2">
                <p className="text-white/50 text-xs mb-2">Analyzing incoming message…</p>
                <p className="text-white/80 text-sm mb-5 line-clamp-2 min-h-[2.5rem]">
                  {engineMessage ? `"${truncate(engineMessage.message_text, 90)}"` : 'Waiting for messages…'}
                </p>

                <div className="flex items-start justify-between mb-5">
                  {PIPELINE_STEPS.map((step, idx) => {
                    const Icon = step.icon
                    const done = idx < stepIndex || stepIndex >= PIPELINE_STEPS.length
                    const active = idx === stepIndex && stepIndex < PIPELINE_STEPS.length
                    return (
                      <div key={step.label} className="flex flex-col items-center flex-1">
                        <div className="flex items-center w-full">
                          <div className={`flex-1 h-px ${idx === 0 ? 'opacity-0' : ''} ${done ? 'bg-accent/50' : 'bg-white/10'}`} />
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                              done
                                ? 'bg-accent/20 border-accent text-accent'
                                : active
                                ? 'bg-accent/10 border-accent/50 text-accent animate-pulse'
                                : 'bg-white/5 border-white/10 text-white/30'
                            }`}
                          >
                            {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                          </div>
                          <div className={`flex-1 h-px ${idx === PIPELINE_STEPS.length - 1 ? 'opacity-0' : ''} ${done ? 'bg-accent/50' : 'bg-white/10'}`} />
                        </div>
                        <span className="text-[10px] text-white/50 mt-2 text-center leading-tight hidden sm:block">
                          {step.label}
                          <br />
                          {step.sub}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full bg-accent"
                    animate={{ width: `${engineProgress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">{engineCaption}</span>
                  <span className="text-accent font-semibold">{engineProgress.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Donuts + Trend row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notification Distribution */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white/80">
                <PieChartIcon className="w-4 h-4 text-accent" />
                Notification Distribution
              </h3>
              <div className="relative h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={notificationDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {notificationDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">{stats?.total_messages ?? 0}</span>
                  <span className="text-[11px] text-white/50">Total</span>
                </div>
              </div>
              <div className="space-y-1.5 mt-2">
                {notificationDist.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-white/70">
                      <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                      {entry.name}
                    </span>
                    <span className="text-white/50">
                      {entry.value} ({entry.pct.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Message Trend */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-white/80">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Message Trend
                </h3>
                <select
                  value={trendRange}
                  onChange={(e) => setTrendRange(Number(e.target.value) as 7 | 14)}
                  className="bg-white/5 border border-white/10 rounded-md text-xs px-2 py-1 text-white/70 focus:outline-none"
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                </select>
              </div>
              {trendChange !== null && (
                <p className={`text-xs mb-2 flex items-center gap-1 ${trendChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trendChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {trendChange >= 0 ? '+' : ''}
                  {trendChange.toFixed(1)}% vs prior day
                </p>
              )}
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00d9ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} width={24} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="messages" stroke="#00d9ff" strokeWidth={2} fill="url(#colorMessages)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Conversation Types */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-white/80">
                <Users2 className="w-4 h-4 text-accent" />
                Conversation Types
              </h3>
              <div className="relative h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conversationDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {conversationDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">{stats?.total_messages ?? 0}</span>
                  <span className="text-[11px] text-white/50">Total</span>
                </div>
              </div>
              <div className="space-y-1.5 mt-2">
                {conversationDist.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-white/70">
                      <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                      {entry.label}
                    </span>
                    <span className="text-white/50">
                      {entry.value} ({entry.pct.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Message Categories */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <BarChart3 className="w-5 h-5 text-accent" />
                Message Categories
              </h3>
              <Link to="/analytics" className="text-xs text-accent hover:text-accent-dim transition-colors flex items-center gap-1">
                View Full Report
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} margin={{ top: 24, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={11}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(0, 0, 0, 0.2)', borderRadius: 8 }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  <LabelList dataKey="value" position="top" fill="#ffffff" fontSize={12} fontWeight={600} />
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.style.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Right column: Live Feed + AI Inspector preview */}
        <div className="space-y-6">
          {/* Live Feed */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-white">Live Feed</h3>
              <Link to="/messages" className="text-xs text-accent hover:text-accent-dim transition-colors">
                View All
              </Link>
            </div>
            <p className="text-white/40 text-xs mb-4">Real-time message stream</p>

            {liveFeed.length === 0 ? (
              <p className="text-white/40 text-sm py-6 text-center">No messages match your filter</p>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {liveFeed.map((msg, idx) => {
                    const senderLabel = getSenderLabel(msg)
                    const style = ACTION_STYLES[msg.action] || ACTION_STYLES.digest
                    const time = parseDate(msg.created_at)
                    return (
                      <motion.div
                        key={msg.message_id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: `${CONVERSATION_COLORS[msg.conversation_type || ''] || '#94a3b8'}22`, color: CONVERSATION_COLORS[msg.conversation_type || ''] || '#94a3b8' }}
                        >
                          {getInitials(senderLabel)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate text-white">{senderLabel}</span>
                            {time && (
                              <span className="text-[10px] text-white/40 shrink-0">
                                {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/60 truncate">{truncate(msg.message_text, 42)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{ background: style.bg, color: style.color, borderColor: style.border }}
                          >
                            {style.label}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-white/40">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.color }} />
                            {(msg.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* AI Inspector Preview */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={CARD}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-accent" />
                AI Inspector
              </h3>
              <Link to="/inspector" className="text-xs text-accent hover:text-accent-dim transition-colors">
                View Full
              </Link>
            </div>
            <p className="text-white/40 text-xs mb-4">Detailed analysis of selected message</p>

            {selectedMessage ? (
              <div className="space-y-4">
                <div>
                  <p className="text-white/50 text-xs font-semibold mb-2">Selected Message</p>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: `${CONVERSATION_COLORS[selectedMessage.conversation_type || ''] || '#94a3b8'}22`,
                        color: CONVERSATION_COLORS[selectedMessage.conversation_type || ''] || '#94a3b8',
                      }}
                    >
                      {getInitials(getSenderLabel(selectedMessage))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-white">{getSenderLabel(selectedMessage)}</p>
                      <p className="text-xs text-white/60 truncate">{truncate(selectedMessage.message_text, 50)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-white/50 text-xs font-semibold mb-2">AI Decision</p>
                  <div
                    className="flex items-center justify-between rounded-xl p-3 border"
                    style={{
                      background: (ACTION_STYLES[selectedMessage.action] || ACTION_STYLES.digest).bg,
                      borderColor: (ACTION_STYLES[selectedMessage.action] || ACTION_STYLES.digest).border,
                    }}
                  >
                    <span
                      className="font-semibold flex items-center gap-2"
                      style={{ color: (ACTION_STYLES[selectedMessage.action] || ACTION_STYLES.digest).color }}
                    >
                      <Bell className="w-4 h-4" />
                      {(ACTION_STYLES[selectedMessage.action] || ACTION_STYLES.digest).label}
                    </span>
                    <span className="text-white/70 text-sm">
                      Confidence <span className="font-semibold text-white">{(selectedMessage.confidence * 100).toFixed(0)}%</span>
                    </span>
                  </div>
                </div>

                {selectedReasoning.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs font-semibold mb-2">Reasoning</p>
                    <ul className="space-y-1.5">
                      {selectedReasoning.map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/70">
                          <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/40">Message ID</span>
                  <span className="font-mono text-white/60">{selectedMessage.message_id}</span>
                </div>
              </div>
            ) : (
              <p className="text-white/40 text-sm py-6 text-center">No message selected</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}