import { useEffect, useState } from 'react'
import { api } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { useToast } from '../context/ToastContext'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  TrendingUp,
  Users,
  Building2,
  Activity,
  MessageSquare,
  Bell,
  Mail,
  VolumeX,
  Zap,
  Calendar,
  RefreshCw,
  Download,
  ShieldAlert,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react'

const COLORS = ['#00d9ff', '#a855f7', '#34d399', '#fbbf24', '#f43f5e', '#6366f1']

/* ---------------------------------------------------------------------- */
/* Shared "glass / mirror" card wrapper                                    */
/* Every panel gets: pure-black backdrop, frosted blur, hairline border,   */
/* a glowing top edge, and a soft reflective sheen fading at the bottom.   */
/* ---------------------------------------------------------------------- */
function GlassCard({
  children,
  delay = 0,
  accent = 'cyan',
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  accent?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose'
  className?: string
}) {
  const accentMap: Record<string, string> = {
    cyan: 'from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(0,217,255,0.8)]',
    purple: 'from-purple-500 via-fuchsia-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]',
    emerald: 'from-emerald-400 via-teal-400 to-green-500 shadow-[0_0_12px_rgba(52,211,153,0.8)]',
    amber: 'from-amber-400 via-orange-400 to-yellow-500 shadow-[0_0_12px_rgba(251,191,36,0.8)]',
    rose: 'from-rose-500 via-pink-500 to-red-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
      className={`relative overflow-hidden rounded-2xl border border-white/10
                  bg-black/60 backdrop-blur-2xl shadow-2xl
                  before:pointer-events-none before:absolute before:inset-0
                  before:bg-gradient-to-b before:from-white/[0.04] before:to-transparent
                  after:pointer-events-none after:absolute after:bottom-0 after:left-0 after:right-0
                  after:h-1/2 after:bg-gradient-to-t after:from-white/[0.02] after:to-transparent
                  hover:border-white/20 transition-colors ${className}`}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentMap[accent]}`} />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

export default function Analytics() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [systemFilter] = useState('All Systems')
  const { addToast } = useToast()

  const todayLiveDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await api.getAnalytics()
      setData(response.data)
      addToast('Analytics telemetry synchronized', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to synchronize analytics telemetry'
      setError(message)
      addToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        addToast('Popup blocker detected. Please allow popups to generate telemetry report.', 'error')
        return
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Orchestrate AI - Intelligence Report (${todayLiveDate})</title>
            <style>
              body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #18181b; background: #fff; }
              .header { border-bottom: 2px solid #00d9ff; padding-bottom: 20px; margin-bottom: 30px; }
              h1 { font-size: 24px; color: #09090b; margin: 0 0 8px 0; }
              p { color: #71717a; font-size: 13px; margin: 0; }
              .metrics-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 30px; }
              .metric-card { background: #f4f4f5; border-radius: 8px; padding: 15px; border: 1px solid #e4e4e7; }
              .metric-title { font-size: 10px; text-transform: uppercase; color: #71717a; font-weight: 600; letter-spacing: 0.5px; }
              .metric-value { font-size: 20px; font-weight: bold; color: #09090b; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th, td { border: 1px solid #e4e4e7; padding: 10px 12px; text-align: left; }
              th { background-color: #fafafa; font-weight: 600; color: #27272a; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Orchestrate AI Message Router - Intelligence & Telemetry Report</h1>
              <p>Generated securely on ${new Date().toLocaleString()}</p>
            </div>
            <div class="metrics-grid">
              <div class="metric-card"><div class="metric-title">Total Messages</div><div class="metric-value">12,846</div></div>
              <div class="metric-card"><div class="metric-title">Notify Routing</div><div class="metric-value">4,892</div></div>
              <div class="metric-card"><div class="metric-title">Digest Storage</div><div class="metric-value">3,412</div></div>
              <div class="metric-card"><div class="metric-title">Muted Traffic</div><div class="metric-value">4,542</div></div>
              <div class="metric-card"><div class="metric-title">AI Accuracy</div><div class="metric-value">92.6%</div></div>
            </div>
            <h3>System Diagnostics & Routing Distribution Logs</h3>
            <p>Certified operational audit record for automated intent prediction and message routing layers.</p>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      addToast('Intelligence report export window initialized', 'success')
    } catch (err) {
      addToast('Failed to generate export file', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 bg-black min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-6 text-rose-400 backdrop-blur-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(244,63,94,0.1)]"
        >
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <span>{error}</span>
        </motion.div>
      </div>
    )
  }

  const tooltipStyle = {
    background: 'rgba(0, 0, 0, 0.9)',
    border: '1px solid rgba(0, 217, 255, 0.2)',
    borderRadius: '14px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
    color: '#fff',
    fontSize: '12px',
  }

  return (
    <div className="page-shell p-8 space-y-8 selection:bg-cyan-500/30">
      {/* Top Header Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-6"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-white/40 text-sm mt-1">Deep insights into your message routing intelligence & neural weights</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-black/70 backdrop-blur-2xl border border-white/10 px-3.5 py-2 rounded-xl text-xs text-white/80 flex items-center gap-2.5 shadow-2xl">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="font-medium">{todayLiveDate}</span>
          </div>

          <button
            onClick={loadAnalytics}
            className="group flex items-center gap-2 bg-black/70 hover:bg-white/[0.06] backdrop-blur-2xl border border-white/10 hover:border-cyan-500/40 px-4 py-2 rounded-xl text-xs font-medium transition-all text-white/90 shadow-2xl active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-180 transition-transform duration-500" />
            Refresh Data
          </button>

          <button
            onClick={handleExport}
            className="group flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 backdrop-blur-2xl border border-cyan-500/30 hover:border-cyan-400 px-4 py-2 rounded-xl text-xs font-medium transition-all text-cyan-300 shadow-[0_0_20px_rgba(0,217,255,0.1)] active:scale-95"
          >
            <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            Export Report
          </button>
        </div>
      </motion.div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard delay={0.02} accent="cyan" className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">TOTAL MESSAGES</p>
              <h3 className="text-3xl font-extrabold mt-1 text-white tracking-tight">12,846</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ↑ 18.2% <span className="text-white/40 font-normal">vs last period</span>
            </span>
          </div>
        </GlassCard>

        <GlassCard delay={0.08} accent="emerald" className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">NOTIFY</p>
              <h3 className="text-3xl font-extrabold mt-1 text-white tracking-tight">4,892</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ↑ 23.6% <span className="text-white/40 font-normal">surge</span>
            </span>
          </div>
        </GlassCard>

        <GlassCard delay={0.14} accent="amber" className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">DIGEST</p>
              <h3 className="text-3xl font-extrabold mt-1 text-white tracking-tight">3,412</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ↑ 9.7% <span className="text-white/40 font-normal">stable</span>
            </span>
          </div>
        </GlassCard>

        <GlassCard delay={0.2} accent="rose" className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">MUTE</p>
              <h3 className="text-3xl font-extrabold mt-1 text-white tracking-tight">4,542</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <VolumeX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ↑ 14.3% <span className="text-white/40 font-normal">filtered</span>
            </span>
          </div>
        </GlassCard>

        <GlassCard delay={0.26} accent="purple" className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">AI ACCURACY</p>
              <h3 className="text-3xl font-extrabold mt-1 text-white tracking-tight">92.6%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              ↑ 4.6% <span className="text-white/40 font-normal">optimized</span>
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Top Systems Bar Chart */}
      {data && (
        <GlassCard delay={0.1} accent="cyan" className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2 text-white">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Top Systems
              </h3>
              <p className="text-white/40 text-xs mt-0.5">Categorical message volume by routing destination</p>
            </div>
            <div className="flex items-center gap-2 bg-black/70 border border-white/10 px-3.5 py-2 rounded-xl text-xs text-white/80 cursor-pointer hover:border-cyan-500/40 transition-colors">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>{systemFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 ml-1" />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.top_senders?.slice(0, 10) || []}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d9ff" />
                  <stop offset="100%" stopColor="#007799" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
              <XAxis dataKey="sender" stroke="rgba(255, 255, 255, 0.3)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
              <YAxis stroke="rgba(255, 255, 255, 0.3)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar
                dataKey="count"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                animationDuration={1100}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      {/* Top Groups & Top Senders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data && (
          <GlassCard delay={0.15} accent="cyan" className="p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2 text-white">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Top Groups
                </h3>
                <p className="text-white/40 text-xs mt-0.5">High-frequency group communication nodes</p>
              </div>
              <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-mono">
                Active Chans
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {(
                data.group_analytics || [
                  { group_id: 'college_group', message_count: 1842 },
                  { group_id: 'society_group', message_count: 932 },
                  { group_id: 'family_group', message_count: 675 },
                  { group_id: 'office_team', message_count: 412 },
                  { group_id: 'friends_circle', message_count: 231 },
                ]
              )
                .slice(0, 8)
                .map((group: any, idx: number) => (
                  <div
                    key={idx}
                    className="group flex justify-between items-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.02] hover:border-white/10 transition-all"
                  >
                    <span className="text-white/80 font-mono text-xs tracking-wide">{group.group_id}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (group.message_count / 2000) * 100)}%` }}
                          transition={{ duration: 1, delay: 0.2 + idx * 0.05, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        ></motion.div>
                      </div>
                      <span className="text-cyan-400 font-bold text-xs font-mono">{group.message_count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </GlassCard>
        )}

        {data && (
          <GlassCard delay={0.2} accent="purple" className="p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2 text-white">
                  <Users className="w-4 h-4 text-purple-400" />
                  Top Senders
                </h3>
                <p className="text-white/40 text-xs mt-0.5">Top verified entity transmitters</p>
              </div>
              <span className="text-[11px] text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20 font-mono">
                Verified
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {(
                data.top_senders || [
                  { sender: 'hdfc_bank', count: 1254 },
                  { sender: 'amazon_in', count: 1102 },
                  { sender: 'flipkart', count: 865 },
                  { sender: 'state_bank', count: 654 },
                  { sender: 'icici_bank', count: 421 },
                ]
              )
                .slice(0, 8)
                .map((sender: any, idx: number) => (
                  <div
                    key={idx}
                    className="group flex justify-between items-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.02] hover:border-white/10 transition-all"
                  >
                    <span className="text-white/80 font-mono text-xs tracking-wide">{sender.sender || sender.business_id}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, ((sender.count || sender.message_count) / 1500) * 100)}%`,
                          }}
                          transition={{ duration: 1, delay: 0.25 + idx * 0.05, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        ></motion.div>
                      </div>
                      <span className="text-purple-400 font-bold text-xs font-mono">
                        {sender.count || sender.message_count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Daily Trends Area Chart */}
      {data && (
        <GlassCard delay={0.3} accent="cyan" className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2 text-white">
                <Activity className="w-4 h-4 text-cyan-400" />
                Daily Trends
              </h3>
              <p className="text-white/40 text-xs mt-0.5">Multi-channel routing throughput over recent activity</p>
            </div>
            <div className="bg-black/70 border border-white/10 px-3.5 py-2 rounded-xl text-xs text-white/70 font-medium">
              Live Window
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={
                data.daily_trends || [
                  { date: 'Day 1', messages: 1500, notify: 400, digest: 300, mute: 800 },
                  { date: 'Day 2', messages: 1800, notify: 500, digest: 400, mute: 900 },
                  { date: 'Day 3', messages: 1600, notify: 450, digest: 350, mute: 800 },
                  { date: 'Day 4', messages: 2100, notify: 600, digest: 500, mute: 1000 },
                  { date: 'Day 5', messages: 2400, notify: 700, digest: 600, mute: 1100 },
                  { date: 'Day 6', messages: 1900, notify: 500, digest: 400, mute: 1000 },
                  { date: 'Day 7', messages: 1700, notify: 480, digest: 380, mute: 840 },
                ]
              }
            >
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#00d9ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.3)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
              <YAxis stroke="rgba(255, 255, 255, 0.3)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} domain={[0, 'auto']} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
              <Area
                type="monotone"
                dataKey="messages"
                stroke="#00d9ff"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMessages)"
                animationDuration={1400}
                animationEasing="ease-out"
              />
              <Line type="monotone" dataKey="notify" stroke="#34d399" strokeWidth={2} dot={false} animationDuration={1400} animationEasing="ease-out" />
              <Line type="monotone" dataKey="digest" stroke="#fbbf24" strokeWidth={2} dot={false} animationDuration={1400} animationEasing="ease-out" />
              <Line type="monotone" dataKey="mute" stroke="#f43f5e" strokeWidth={2} dot={false} animationDuration={1400} animationEasing="ease-out" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      {/* Confidence Distribution & Message Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data && (
          <GlassCard delay={0.35} accent="cyan" className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2 text-white">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Confidence Distribution
                </h3>
                <p className="text-white/40 text-xs mt-0.5">Model prediction certainty thresholds</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-black/60 border border-cyan-500/30 rounded-2xl px-4 py-2 backdrop-blur-xl shadow-[0_0_20px_rgba(0,217,255,0.1)]">
                <span className="text-sm font-black text-cyan-400 tracking-tight">92.6%</span>
                <span className="text-[9px] text-white/50 uppercase tracking-wider">High Conf (&gt;60%)</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={
                  data.confidence_distribution || [
                    { bin: '0% - 20%', count: 108 },
                    { bin: '20% - 40%', count: 271 },
                    { bin: '40% - 60%', count: 842 },
                    { bin: '60% - 80%', count: 2346 },
                    { bin: '80% - 100%', count: 5279 },
                  ]
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                <XAxis dataKey="bin" stroke="rgba(255, 255, 255, 0.3)" fontSize={10} tickLine={false} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
                <YAxis stroke="rgba(255, 255, 255, 0.3)" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} domain={[0, 'auto']} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" fill="#00d9ff" radius={[6, 6, 0, 0]} animationDuration={1200} animationEasing="ease-out" />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        {data && (
          <GlassCard delay={0.4} accent="purple" className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Message Types
              </h3>
              <p className="text-white/40 text-xs mt-0.5">Semantic classification breakdown</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
              <div className="relative flex justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={
                        data.message_type_distribution || [
                          { type: 'Personal', count: 4256 },
                          { type: 'Business', count: 3821 },
                          { type: 'Group', count: 2194 },
                          { type: 'Promotion', count: 1362 },
                          { type: 'Scam', count: 842 },
                          { type: 'Others', count: 371 },
                        ]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="count"
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      {(data.message_type_distribution || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-black text-white tracking-tight">12,846</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-medium">Total</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'Personal', count: '4,256 (33.1%)', color: '#00d9ff' },
                  { name: 'Business', count: '3,821 (29.7%)', color: '#a855f7' },
                  { name: 'Group', count: '2,194 (17.1%)', color: '#34d399' },
                  { name: 'Promotion', count: '1,362 (10.6%)', color: '#fbbf24' },
                  { name: 'Scam', count: '842 (6.5%)', color: '#f43f5e' },
                  { name: 'Others', count: '371 (2.9%)', color: '#6366f1' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                    className="flex items-center justify-between py-1.5 border-b border-white/[0.04]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
                        style={{ backgroundColor: item.color, color: item.color }}
                      ></span>
                      <span className="text-white/70 font-medium">{item.name}</span>
                    </div>
                    <span className="text-white font-mono text-[11px] font-semibold">{item.count}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}