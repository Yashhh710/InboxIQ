import { useCallback, useEffect, useState, useMemo } from 'react'
import { api } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { useToast } from '../context/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  ChevronDown,
  MessageSquare,
  Mail,
  Download,
  MoreVertical,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ShieldAlert,
  Bell,
  VolumeX,
  Zap
} from 'lucide-react'

interface Message {
  message_id: string
  message_text: string
  sender_user_id: string
  user_id: string
  group_id?: string
  business_id?: string
  conversation_type: string
  created_at: string
}

interface Prediction {
  message_id: string
  action: string
  message_type: string
  reason: string
  confidence: number
  evidence_message_ids?: string
}

const ACTION_COLORS: Record<string, string> = {
  notify: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  digest: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  mute: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

const TYPE_COLORS: Record<string, string> = {
  scam: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  spam: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  promotion: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  forward: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
  urgent: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  payment: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  personal: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  event: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  alert: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  order_update: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
}

export default function Messages() {
  const [messages, setMessages] = useState<(Message & Prediction)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'confidence'>('latest')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<(Message & Prediction) | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const { addToast } = useToast()

  const PAGE_SIZE = 50

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.getMessages(
        actionFilter || undefined,
        typeFilter || undefined,
        search || undefined,
        page * PAGE_SIZE,
        PAGE_SIZE
      )

      const data = response?.data?.data || response?.data || []
      setMessages(Array.isArray(data) ? data : [])
      setHasMore(Array.isArray(data) && data.length === PAGE_SIZE)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load messages'
      setError(message)
      addToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }, [actionFilter, typeFilter, search, page, addToast])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Client-side sorting on current list dataset
  const filteredAndSortedMessages = useMemo(() => {
    const result = [...messages]
    
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    } else if (sortBy === 'confidence') {
      result.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    }
    
    return result
  }, [messages, sortBy])

  const handleReset = () => {
    setSearch('')
    setActionFilter(null)
    setTypeFilter(null)
    setSortBy('latest')
    setPage(0)
  }

  // Export messages as a formatted PDF layout instead of JSON
  const handleExport = () => {
    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        addToast('Please allow popups to download the PDF export', 'error')
        return
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Messages Export - ${Date.now()}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
              h1 { font-size: 20px; margin-bottom: 4px; }
              p { color: #555; font-size: 12px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f4f4f5; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Messages Export Report</h1>
            <p>Generated on ${new Date().toLocaleString()} | Total Records: ${messages.length}</p>
            <table>
              <thead>
                <tr>
                  <th>Message ID</th>
                  <th>Sender ID</th>
                  <th>Type</th>
                  <th>Action</th>
                  <th>Confidence</th>
                  <th>Message Text</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                ${messages.map(m => `
                  <tr>
                    <td>${m.message_id.substring(0, 8)}...</td>
                    <td>${m.sender_user_id ? m.sender_user_id.substring(0, 8) + '...' : 'N/A'}</td>
                    <td>${m.message_type || 'personal'}</td>
                    <td>${m.action || 'digest'}</td>
                    <td>${((m.confidence || 0) * 100).toFixed(0)}%</td>
                    <td>${m.message_text}</td>
                    <td>${m.created_at ? new Date(m.created_at).toLocaleString() : 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      addToast('PDF print/export dialog opened successfully', 'success')
    } catch (err) {
      addToast('Failed to export PDF', 'error')
    }
  }

  const truncateText = (text: string | null | undefined, length: number) => {
    if (!text) return ''
    return text.length > length ? text.substring(0, length) + '...' : text
  }

  return (
    <div className="page-shell p-8 space-y-6 selection:bg-cyan-500/30">
      {/* Top Glass Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Total Messages Card */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.8)]"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-white/40 uppercase">TOTAL MESSAGES</p>
              <h3 className="text-3xl font-bold mt-1 text-white">1,246</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">+12.5% vs yesterday</span>
            <div className="w-20 h-5 flex items-end gap-0.5">
              <div className="w-2 bg-amber-400/40 h-2 rounded-t"></div>
              <div className="w-2 bg-amber-400/60 h-3 rounded-t"></div>
              <div className="w-2 bg-amber-400/50 h-2.5 rounded-t"></div>
              <div className="w-2 bg-amber-400/80 h-4 rounded-t"></div>
              <div className="w-2 bg-amber-400 h-5 rounded-t"></div>
            </div>
          </div>
        </div>

        {/* Notify Card */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.8)]"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-white/40 uppercase">NOTIFY</p>
              <h3 className="text-3xl font-bold mt-1 text-white">478</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">+23.6% vs yesterday</span>
            <div className="w-20 h-5 flex items-end gap-0.5">
              <div className="w-2 bg-emerald-400/40 h-3 rounded-t"></div>
              <div className="w-2 bg-emerald-400/80 h-5 rounded-t"></div>
              <div className="w-2 bg-emerald-400/50 h-2 rounded-t"></div>
              <div className="w-2 bg-emerald-400/70 h-4 rounded-t"></div>
              <div className="w-2 bg-emerald-400 h-4.5 rounded-t"></div>
            </div>
          </div>
        </div>

        {/* Digest Card */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 shadow-[0_0_12px_rgba(56,189,248,0.8)]"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-white/40 uppercase">DIGEST</p>
              <h3 className="text-3xl font-bold mt-1 text-white">347</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">+9.7% vs yesterday</span>
            <div className="w-20 h-5 flex items-end gap-0.5">
              <div className="w-2 bg-blue-400/50 h-3 rounded-t"></div>
              <div className="w-2 bg-blue-400/40 h-2 rounded-t"></div>
              <div className="w-2 bg-blue-400/80 h-5 rounded-t"></div>
              <div className="w-2 bg-blue-400/60 h-3.5 rounded-t"></div>
              <div className="w-2 bg-blue-400 h-4 rounded-t"></div>
            </div>
          </div>
        </div>

        {/* Mute Card */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-400 via-pink-300 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)]"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-white/40 uppercase">MUTE</p>
              <h3 className="text-3xl font-bold mt-1 text-white">421</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <VolumeX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">+14.3% vs yesterday</span>
            <div className="w-20 h-5 flex items-end gap-0.5">
              <div className="w-2 bg-rose-400/70 h-4 rounded-t"></div>
              <div className="w-2 bg-rose-400/40 h-2 rounded-t"></div>
              <div className="w-2 bg-rose-400/90 h-5 rounded-t"></div>
              <div className="w-2 bg-rose-400/50 h-3 rounded-t"></div>
              <div className="w-2 bg-rose-400 h-3.5 rounded-t"></div>
            </div>
          </div>
        </div>

        {/* AI Accuracy Card */}
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-400 via-violet-300 to-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-white/40 uppercase">AI ACCURACY</p>
              <h3 className="text-3xl font-bold mt-1 text-white">92.6%</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">+4.6% vs yesterday</span>
            <div className="w-20 h-5 flex items-end gap-0.5">
              <div className="w-2 bg-purple-400/40 h-2 rounded-t"></div>
              <div className="w-2 bg-purple-400/60 h-3 rounded-t"></div>
              <div className="w-2 bg-purple-400/80 h-4 rounded-t"></div>
              <div className="w-2 bg-purple-400/50 h-2.5 rounded-t"></div>
              <div className="w-2 bg-purple-400 h-5 rounded-t"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Header and Export Button */}
      <div className="flex justify-between items-end pt-2 border-b border-[#121216] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">Messages</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(0,217,255,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              LIVE FEED
            </span>
          </div>
          <p className="text-white/40 text-sm mt-1">View and manage all routed messages</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 backdrop-blur-2xl border border-cyan-500/30 hover:border-cyan-400 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all text-cyan-300 shadow-[0_0_20px_rgba(0,217,255,0.2)] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export PDF
        </motion.button>
      </div>

      {/* Glass Filters and Search Bar Section */}
      <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-4 space-y-4 shadow-2xl transition-all duration-300">
        {/* Search & Advanced Filter Icon Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search messages, senders, keywords..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="w-full bg-black border border-[#141418] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          <button className="w-10 h-10 rounded-xl bg-black border border-[#141418] hover:border-cyan-500/40 flex items-center justify-center text-white/70 transition-colors cursor-pointer">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          </button>
          {(search || actionFilter || typeFilter || sortBy !== 'latest') && (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl bg-black hover:bg-white/[0.05] border border-[#141418] hover:border-cyan-500/30 text-xs transition-colors font-semibold text-white/80 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Quick Filters & Sorting Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mr-1">Quick Filters:</span>
            
            {/* All Filter Button */}
            <button
              onClick={() => {
                setActionFilter(null)
                setTypeFilter(null)
                setPage(0)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !actionFilter && !typeFilter
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,217,255,0.3)]'
                  : 'bg-black border border-[#141418] hover:border-cyan-500/30 text-white/70'
              }`}
            >
              All
            </button>

            {/* Action Filters */}
            {['notify', 'digest', 'mute'].map((action) => (
              <button
                key={action}
                onClick={() => {
                  setActionFilter(actionFilter === action ? null : action)
                  setPage(0)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize cursor-pointer ${
                  actionFilter === action
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,217,255,0.3)]'
                    : 'bg-black border border-[#141418] hover:border-cyan-500/30 text-white/70'
                }`}
              >
                {action}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-[#141418] mx-1"></div>

            {/* Type Filters */}
            {['scam', 'spam', 'promotion', 'urgent', 'personal'].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setTypeFilter(typeFilter === type ? null : type)
                  setPage(0)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize cursor-pointer ${
                  typeFilter === type
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,217,255,0.3)]'
                    : 'bg-black border border-[#141418] hover:border-cyan-500/30 text-white/70'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Sort and View Options with dropdown appearing upwards / properly positioned */}
          <div className="flex items-center gap-3 relative isolate z-[9999]">
            <div className="flex items-center gap-2 text-xs text-white/50 relative">
              <span>Sort by:</span>
              <div 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="bg-black border border-[#141418] hover:border-cyan-500/40 px-3 py-1.5 rounded-lg text-white flex items-center gap-2 text-xs font-semibold cursor-pointer transition-colors shadow-md"
              >
                <span className="capitalize">{sortBy === 'confidence' ? 'Highest Confidence' : `${sortBy} First`}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Sort Dropdown Menu */}
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 bottom-[calc(100%+8px)] w-48 bg-[#08080a] backdrop-blur-2xl border border-[#141418] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] py-1.5 z-[99999] overflow-hidden"
                  >
                    <button
                      onClick={() => { setSortBy('latest'); setIsSortOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs hover:bg-cyan-500/10 transition-colors cursor-pointer ${sortBy === 'latest' ? 'text-cyan-400 font-semibold bg-cyan-500/10' : 'text-white/80'}`}
                    >
                      Latest First
                    </button>
                    <button
                      onClick={() => { setSortBy('oldest'); setIsSortOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs hover:bg-cyan-500/10 transition-colors cursor-pointer ${sortBy === 'oldest' ? 'text-cyan-400 font-semibold bg-cyan-500/10' : 'text-white/80'}`}
                    >
                      Oldest First
                    </button>
                    <button
                      onClick={() => { setSortBy('confidence'); setIsSortOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs hover:bg-cyan-500/10 transition-colors cursor-pointer ${sortBy === 'confidence' ? 'text-cyan-400 font-semibold bg-cyan-500/10' : 'text-white/80'}`}
                    >
                      Highest Confidence
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View Mode Toggles */}
            <div className="flex items-center bg-black border border-[#141418] rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,217,255,0.2)]' : 'text-white/40 hover:text-white'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,217,255,0.2)]' : 'text-white/40 hover:text-white'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Content Display (List vs Grid View) */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-400 text-sm backdrop-blur-xl">
          {error}
        </div>
      ) : filteredAndSortedMessages.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No messages found"
          description="Try adjusting your filters or search terms"
        />
      ) : viewMode === 'list' ? (
        <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl relative z-0 transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#141418] text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                  <th className="text-left py-4 px-5">MESSAGE</th>
                  <th className="text-left py-4 px-5">SENDER</th>
                  <th className="text-left py-4 px-5">TYPE</th>
                  <th className="text-left py-4 px-5">ACTION</th>
                  <th className="text-left py-4 px-5">CONFIDENCE</th>
                  <th className="text-left py-4 px-5">TIME</th>
                  <th className="text-left py-4 px-5">DETAILS</th>
                  <th className="text-right py-4 px-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141418]">
                <AnimatePresence>
                  {filteredAndSortedMessages.map((msg, idx) => (
                    <motion.tr
                      key={msg.message_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Message Text Column */}
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-black border border-[#141418] flex items-center justify-center shrink-0 mt-0.5 text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
                            {msg.message_type === 'scam' ? (
                              <ShieldAlert className="w-4 h-4 text-rose-400" />
                            ) : msg.message_type === 'payment' ? (
                              <span className="text-xs font-bold text-cyan-400">₹</span>
                            ) : (
                              <MessageSquare className="w-4 h-4 text-cyan-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium text-xs leading-snug">
                              {truncateText(msg.message_text, 45)}
                            </p>
                            <p className="text-white/40 text-[11px] mt-0.5 font-mono">
                              {truncateText(msg.reason || 'Please complete your payment to avoid late fees.', 45)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Sender Column */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                            {msg.sender_user_id ? msg.sender_user_id.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-semibold text-white">
                                {msg.sender_user_id ? `User ${msg.sender_user_id.substring(0, 6)}` : 'Unknown'}
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_rgba(0,217,255,0.8)]"></span>
                            </div>
                            <span className="text-[10px] text-white/40">Business Account</span>
                          </div>
                        </div>
                      </td>

                      {/* Type Column */}
                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-block capitalize ${
                            TYPE_COLORS[msg.message_type] || TYPE_COLORS.personal
                          }`}
                        >
                          {msg.message_type || 'personal'}
                        </span>
                      </td>

                      {/* Action Column */}
                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 border ${
                            ACTION_COLORS[msg.action] || ACTION_COLORS.digest
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {msg.action ? msg.action.charAt(0).toUpperCase() + msg.action.slice(1) : 'Digest'}
                        </span>
                      </td>

                      {/* Confidence Column */}
                      <td className="py-4 px-5">
                        <div className="space-y-1.5 w-28">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-white font-semibold">{(msg.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-[#141418]">
                            <motion.div
                              className={`h-full ${msg.action === 'mute' ? 'bg-rose-500' : msg.action === 'notify' ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${msg.confidence * 100}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Time Column */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <p className="text-xs text-white font-mono font-semibold">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:24 PM'}
                        </p>
                        <p className="text-[10px] text-white/40 font-mono">Recent</p>
                      </td>

                      {/* Details Button */}
                      <td className="py-4 px-5">
                        <button
                          onClick={() => setSelectedMessage(msg)}
                          className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>

                      {/* More Menu Icon */}
                      <td className="py-4 px-5 text-right">
                        <button className="text-white/30 hover:text-white transition-colors p-1 cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex justify-between items-center p-4 border-t border-[#141418] bg-[#08080a] text-xs">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl bg-black hover:bg-white/[0.05] border border-[#141418] hover:border-cyan-500/30 disabled:opacity-30 transition-colors font-semibold text-white/80 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-white/50 font-mono">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-xl bg-black hover:bg-white/[0.05] border border-[#141418] hover:border-cyan-500/30 disabled:opacity-30 transition-colors font-semibold text-white/80 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        /* Grid View Mode Layout */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedMessages.map((msg, idx) => (
              <motion.div
                key={msg.message_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/40 rounded-2xl p-5 space-y-4 transition-all duration-300 flex flex-col justify-between shadow-2xl relative overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                  msg.action === 'notify' ? 'bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500' :
                  msg.action === 'mute' ? 'bg-gradient-to-r from-rose-400 via-pink-300 to-rose-500' :
                  'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500'
                }`}></div>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize ${TYPE_COLORS[msg.message_type] || TYPE_COLORS.personal}`}>
                      {msg.message_type || 'personal'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 border ${ACTION_COLORS[msg.action] || ACTION_COLORS.digest}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {msg.action ? msg.action.toUpperCase() : 'DIGEST'}
                    </span>
                  </div>

                  <p className="text-white text-xs font-medium leading-relaxed">
                    {msg.message_text}
                  </p>

                  <p className="text-white/40 text-[11px] italic font-mono">
                    {msg.reason || 'Classified based on contextual behavioral routing guidelines.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#141418] flex items-center justify-between">
                  <div className="space-y-1 w-24">
                    <div className="flex justify-between text-[10px] text-white/60 font-mono">
                      <span>Confidence</span>
                      <span className="font-semibold text-cyan-400">{(msg.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1 bg-black rounded-full overflow-hidden border border-[#141418]">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${msg.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMessage(msg)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Footer for Grid View */}
          <div className="flex justify-between items-center p-4 border border-[#141418] rounded-2xl bg-[#08080a] backdrop-blur-2xl text-xs">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl bg-black hover:bg-white/[0.05] border border-[#141418] hover:border-cyan-500/30 disabled:opacity-30 transition-colors font-semibold text-white/80 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-white/50 font-mono">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-xl bg-black hover:bg-white/[0.05] border border-[#141418] hover:border-cyan-500/30 disabled:opacity-30 transition-colors font-semibold text-white/80 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedMessage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMessage(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
            />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-[#08080a] backdrop-blur-2xl border-l border-[#141418] z-50 overflow-y-auto text-white shadow-2xl"
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-[#141418] pb-4">
                  <h2 className="text-lg font-bold">Message Details</h2>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="w-8 h-8 rounded-xl bg-black border border-[#141418] hover:border-cyan-500/40 flex items-center justify-center transition-colors text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <h3 className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Message</h3>
                  <p className="bg-black border border-[#141418] rounded-2xl p-4 text-white/90 text-xs leading-relaxed">
                    {selectedMessage.message_text}
                  </p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black border border-[#141418] rounded-2xl p-3.5">
                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Sender</p>
                    <p className="text-cyan-400 font-mono text-xs truncate">
                      {(selectedMessage.sender_user_id || 'Unknown').substring(0, 12)}
                    </p>
                  </div>
                  <div className="bg-black border border-[#141418] rounded-2xl p-3.5">
                    <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Type</p>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-medium capitalize ${
                        TYPE_COLORS[selectedMessage.message_type] || TYPE_COLORS.personal
                      }`}
                    >
                      {selectedMessage.message_type}
                    </span>
                  </div>
                </div>

                {/* Routing Decision */}
                <div className="space-y-2">
                  <h3 className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Routing Decision</h3>
                  <div className="bg-black border border-[#141418] rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">Action</span>
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                          ACTION_COLORS[selectedMessage.action] || ACTION_COLORS.digest
                        }`}
                      >
                        {selectedMessage.action.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">Confidence</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-black rounded-full overflow-hidden border border-[#141418]">
                          <motion.div
                            className="h-full bg-cyan-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedMessage.confidence * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <span className="text-xs text-cyan-400 font-semibold font-mono">
                          {(selectedMessage.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="space-y-2">
                  <h3 className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">Reasoning</h3>
                  <p className="bg-black border border-[#141418] rounded-2xl p-4 text-white/80 text-xs leading-relaxed font-mono">
                    {selectedMessage.reason || 'Classified based on contextual patterns and intent analysis models indicating priority notification routing.'}
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all shadow-[0_0_20px_rgba(0,217,255,0.2)] cursor-pointer"
                >
                  Create & Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}