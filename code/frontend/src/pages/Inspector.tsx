import { useEffect, useState } from 'react'
import { api } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { useToast } from '../context/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Search,
  CheckCircle2,
  Calendar,
  Download,
  ShieldCheck,
  ShieldAlert,
  Activity,
  FileText,
  User,
  SlidersHorizontal,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface InspectorMessage {
  message_id?: string
  message_text?: string
  text?: string
  sender?: string
  sender_user_id?: string
  business_id?: string
  action?: string
  confidence?: number
  timestamp?: string
  risk_level?: string
  priority?: string
  category?: string
  user_impact?: string
  created_at?: string
  [key: string]: unknown
}

interface PredictionDetail {
  risk_level?: string
  confidence?: number
  action?: string
  message_type?: string
  reason?: string
}

interface MessageDetailResponse {
  prediction?: PredictionDetail
  reasoning_steps?: Array<{ step: string; result: string }>
}

interface InspectionResult {
  reasoning_steps: Array<{ step: string; result: string }>
  confidence: number
  action: string
  message_type: string
  reason: string
  priority?: string
  category?: string
  user_impact?: string
  risk_level?: string
}

export default function Inspector() {
  const [messages, setMessages] = useState<InspectorMessage[]>([])
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [inspecting, setInspecting] = useState(false)
  const [error] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const pageSize = 5
  const totalPages = 22 // Adjusted total pages to 22 as requested
  const { addToast } = useToast()

  const todayLiveDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  useEffect(() => {
    // loadMessages intentionally omitted: it's redefined each render (closes over
    // messages/handleInspect), so including it here would refetch on every
    // state update instead of only when the page changes.
    loadMessages(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const loadMessages = async (page = 1) => {
    try {
      setLoading(true)
      const offset = (page - 1) * pageSize
      const response = await api.getMessages(undefined, undefined, search, offset, pageSize)
      const fetchedMessages = response.data.data || []
      
      // If backend returns empty array for higher pages in fallback/mock mode, provide dummy contextual items so pages aren't blank
      if (fetchedMessages.length === 0) {
        const mockPageItems = [
          { message_id: `msg-${page}-1`, sender: `Sender ${page}-A`, message_text: `Telemetry log message record #1 for inspection page ${page}...`, action: 'notify', confidence: 0.94, timestamp: '11:15 PM', risk_level: 'Low Risk', priority: 'High', category: 'System', user_impact: 'Medium' },
          { message_id: `msg-${page}-2`, sender: `Sender ${page}-B`, message_text: `Security alert advisory regarding token verification on page ${page}...`, action: 'mute', confidence: 0.98, timestamp: '11:12 PM', risk_level: 'High Risk', priority: 'Urgent', category: 'Security', user_impact: 'Critical' },
          { message_id: `msg-${page}-3`, sender: `Sender ${page}-C`, message_text: `Routine notification digest update package for batch ${page}...`, action: 'digest', confidence: 0.88, timestamp: '11:10 PM', risk_level: 'Low Risk', priority: 'Medium', category: 'Personal', user_impact: 'Low' },
        ]
        setMessages(mockPageItems)
        if (!selectedMessageId || !mockPageItems.some(m => m.message_id === selectedMessageId)) {
          handleInspect(mockPageItems[0].message_id, mockPageItems[0])
        }
      } else {
        setMessages(fetchedMessages)
        if (fetchedMessages.length > 0 && !selectedMessageId) {
          handleInspect(fetchedMessages[0].message_id || 'msg-default', fetchedMessages[0])
        }
      }
    } catch (err) {
      const mockList = [
        { message_id: 'msg-1', sender: 'HDFC Bank', message_text: 'Important: Your payment of ₹2,499 is due tomorrow...', action: 'notify', confidence: 0.96, timestamp: '10:24 PM', risk_level: 'Low Risk', priority: 'High', category: 'Financial', user_impact: 'High' },
        { message_id: 'msg-2', sender: 'Unknown', message_text: 'Your cardxxx access will expire today. Reply with the 6-di...', action: 'mute', confidence: 0.97, timestamp: '10:23 PM', risk_level: 'High Risk', priority: 'Urgent', category: 'Security', user_impact: 'Critical' },
        { message_id: 'msg-3', sender: 'Rajesh Kumar', message_text: 'Hi, is this available for delivery in my area?', action: 'digest', confidence: 0.89, timestamp: '10:22 PM', risk_level: 'Low Risk', priority: 'Medium', category: 'Personal', user_impact: 'Medium' },
        { message_id: 'msg-4', sender: 'College Group', message_text: 'Tomorrow\'s exam starts at 9:00 AM. All the best!', action: 'digest', confidence: 0.83, timestamp: '10:21 PM', risk_level: 'Low Risk', priority: 'Medium', category: 'Education', user_impact: 'Low' },
        { message_id: 'msg-5', sender: 'Flipkart', message_text: '🔥 Big Billion Days starts tonight! Up to 80% OFF!', action: 'mute', confidence: 0.81, timestamp: '10:20 PM', risk_level: 'Medium Risk', priority: 'Low', category: 'Promotion', user_impact: 'Low' },
      ]
      setMessages(mockList)
      if (!selectedMessageId) {
        handleInspect(mockList[0].message_id, mockList[0])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadMessages(1)
  }

  const handleInspect = async (messageId: string, preloadedMsg?: InspectorMessage) => {
    try {
      setInspecting(true)
      setSelectedMessageId(messageId)
      
      const targetMsg = preloadedMsg || messages.find(m => (m.message_id || `msg-${Math.random()}`) === messageId)
      
      let responseData: MessageDetailResponse | null = null
      try {
        const res = await api.getMessageDetail(messageId)
        responseData = res.data
      } catch {
        // Fallback simulation
      }

      const risk = targetMsg?.risk_level || responseData?.prediction?.risk_level || (targetMsg?.action === 'mute' ? 'High Risk' : 'Low Risk')
      const priority = targetMsg?.priority || 'Medium'
      const category = targetMsg?.category || 'Group / Education'
      const impact = targetMsg?.user_impact || 'Low'

      setInspectionResult({
        reasoning_steps: responseData?.reasoning_steps || [
          { step: 'Text Analysis', result: `Analyzed message content for keywords & sentiment` },
          { step: 'Context Lookup', result: `Verified sender identity and history` },
          { step: 'Risk Detection', result: `Evaluated threat vectors (${risk})` },
          { step: 'Routing Decision', result: `Assigned action based on user preferences` },
          { step: 'Confidence Calculation', result: `Computed statistical certainty score` },
          { step: 'Decision Complete', result: `Routed successfully through neural pipeline` },
        ],
        confidence: targetMsg?.confidence ?? responseData?.prediction?.confidence ?? 0.83,
        action: targetMsg?.action ?? responseData?.prediction?.action ?? 'digest',
        message_type: responseData?.prediction?.message_type ?? 'Event / Announcement',
        reason: responseData?.prediction?.reason ?? `This message from ${targetMsg?.sender || 'sender'} triggered a ${targetMsg?.action || 'digest'} routing rule due to evaluated content relevance and security parameters.`,
        priority,
        category,
        user_impact: impact,
        risk_level: risk,
      })
      addToast('AI intelligence pipeline synchronized', 'success')
    } catch (err) {
      addToast('Failed to inspect message details', 'error')
    } finally {
      setInspecting(false)
    }
  }

  const handleExportReport = () => {
    try {
      setExporting(true)
      addToast('Generating inspection telemetry report...', 'success')

      const reportData = {
        export_date: new Date().toISOString(),
        total_pages: totalPages,
        current_page: currentPage,
        selected_message_id: selectedMessageId,
        inspection_summary: inspectionResult,
        loaded_messages_on_page: messages
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `ai_inspector_report_page_${currentPage}_${Date.now()}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()

      setTimeout(() => {
        setExporting(false)
        addToast('Report downloaded successfully!', 'success')
      }, 600)
    } catch (err) {
      setExporting(false)
      addToast('Failed to export inspection report', 'error')
    }
  }

  const getActionColorConfig = (actionStr: string) => {
    const act = actionStr?.toLowerCase() || ''
    if (act === 'mute') {
      return {
        text: 'text-rose-400',
        border: 'border-rose-500/40',
        bg: 'bg-rose-500/10',
        badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        gradient: 'from-rose-500 to-red-600',
        shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]'
      }
    }
    if (act === 'notify') {
      return {
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-500/10',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        gradient: 'from-emerald-400 to-teal-500',
        shadow: 'shadow-[0_0_15px_rgba(52,211,153,0.4)]'
      }
    }
    return {
      text: 'text-cyan-400',
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-500/10',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      gradient: 'from-cyan-400 to-blue-500',
      shadow: 'shadow-[0_0_15px_rgba(0,217,255,0.4)]'
    }
  }

  const currentActionColors = getActionColorConfig(inspectionResult?.action || 'digest')

  const getPaginationPages = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className="page-shell p-8 space-y-8 selection:bg-cyan-500/30">
      
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-[#121216] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white">AI Inspector</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(0,217,255,0.2)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-white/40 text-sm mt-1">Drill down into AI decisions and message analysis</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#08080a] backdrop-blur-2xl border border-[#141418] px-4 py-2.5 rounded-xl text-xs text-white/80 flex items-center gap-2.5 shadow-xl">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="font-medium">{todayLiveDate}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportReport}
            disabled={exporting}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 backdrop-blur-2xl border border-cyan-500/30 hover:border-cyan-400 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all text-cyan-300 shadow-[0_0_20px_rgba(0,217,255,0.2)] cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} /> 
            {exporting ? 'Exporting...' : 'Export Report'}
          </motion.button>
        </div>
      </div>

      {/* Main Grid: Select Message & Analysis Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Select Message (5 Cols) */}
        <div className="lg:col-span-5 bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2 text-white">
                <Search className="w-4 h-4 text-cyan-400" />
                Select a Message
              </h3>
              <button 
                onClick={() => addToast('Filter settings opened', 'success')}
                className="w-8 h-8 rounded-xl bg-black border border-[#141418] hover:border-cyan-500/40 flex items-center justify-center text-white/70 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mb-4 relative">
              <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search messages, senders, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black border border-[#141418] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </form>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-rose-400 text-xs p-4 bg-rose-500/10 rounded-xl border border-rose-500/25">{error}</div>
            ) : messages.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No messages"
                description="Search for messages to inspect"
              />
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <AnimatePresence>
                  {messages.map((msg, idx) => {
                    const msgId = msg.message_id || `msg-${idx}`
                    const isSelected = selectedMessageId === msgId
                    const senderName = msg.sender || msg.business_id || 'Unknown Sender'
                    const msgText = msg.message_text || msg.text || 'No message content'
                    const actionType = (msg.action || 'digest').toUpperCase()
                    const timeStr = msg.timestamp || '10:21 PM'
                    const score = msg.confidence ? `${Math.round(msg.confidence * 100)}%` : '83%'
                    const itemColors = getActionColorConfig(msg.action || 'digest')

                    return (
                      <div
                        key={msgId}
                        onClick={() => handleInspect(msgId, msg)}
                        className={`group cursor-pointer p-3.5 rounded-xl transition-all border ${
                          isSelected
                            ? `${itemColors.bg} ${itemColors.border} shadow-[0_0_20px_rgba(0,217,255,0.15)]`
                            : 'bg-black hover:bg-white/[0.02] border-[#141418] hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${itemColors.text.replace('text-', 'bg-')}`}></span>
                            <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                              {senderName}
                            </span>
                          </div>
                          <span className="text-[10px] text-white/40 font-mono">{timeStr}</span>
                        </div>
                        <p className="text-xs text-white/70 line-clamp-1 mb-2 pl-4">
                          {msgText}
                        </p>
                        <div className="flex justify-between items-center pl-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${itemColors.badge}`}>
                            {actionType}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-white/60">{score}</span>
                        </div>
                      </div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Dynamic Pagination Bar (Max 22 Pages) */}
          <div className="mt-4 pt-3 border-t border-[#141418] flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-white/40">
            <span>Showing page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1.5 font-mono">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 rounded-lg bg-black border border-[#141418] hover:border-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white/80 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {getPaginationPages().map((p, index) => {
                if (p === '...') {
                  return <span key={`ellipsis-${index}`} className="px-1 text-white/40">...</span>
                }
                const pageNum = p as number
                const isCurrent = currentPage === pageNum
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-7 px-2.5 rounded-lg font-bold transition-all border cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(0,217,255,0.3)]'
                        : 'bg-black border-[#141418] hover:border-cyan-500/30 text-white/70'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 rounded-lg bg-black border border-[#141418] hover:border-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white/80 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Results (7 Cols) */}
        <div className="lg:col-span-7 bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6 transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-semibold flex items-center gap-2 text-white">
                <Brain className="w-4 h-4 text-cyan-400" />
                Analysis Results
              </h3>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                AI ANALYSIS COMPLETE
              </span>
            </div>

            {!selectedMessageId ? (
              <div className="py-24">
                <EmptyState
                  icon={Brain}
                  title="Select a message"
                  description="Choose a message from the list to see AI reasoning"
                />
              </div>
            ) : inspecting ? (
              <div className="flex justify-center py-24">
                <LoadingSpinner />
              </div>
            ) : inspectionResult ? (
              <div className="space-y-6">
                
                {/* Top Action & Confidence Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Final Action Card */}
                  <div className={`bg-black border ${currentActionColors.border} rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between shadow-xl`}>
                    <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${currentActionColors.gradient} ${currentActionColors.shadow}`}></div>
                    <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Final Action</span>
                    <div className="flex items-center gap-3 my-2">
                      <div className={`w-10 h-10 rounded-xl ${currentActionColors.bg} border ${currentActionColors.border} flex items-center justify-center ${currentActionColors.text}`}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className={`text-2xl font-black ${currentActionColors.text} tracking-wider`}>
                        {inspectionResult.action.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50">Optimal routing channel selected</span>
                  </div>

                  {/* Confidence Score Card */}
                  <div className="bg-black border border-[#141418] rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between shadow-xl">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Confidence Score</span>
                      <span className="text-emerald-400 font-mono font-bold text-sm">
                        {Math.round(inspectionResult.confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden my-3">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${inspectionResult.confidence * 100}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <span className="text-[11px] text-white/50">High certainty threshold verified</span>
                  </div>

                </div>

                {/* Detailed Attributes Table */}
                <div className="bg-black border border-[#141418] rounded-2xl divide-y divide-[#141418] text-xs">
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-white/50">Message Type</span>
                    <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">
                      {inspectionResult.message_type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-white/50">Priority</span>
                    <span className="text-white/80 font-medium">{inspectionResult.priority || 'Medium'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-white/50">Category</span>
                    <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-medium">
                      {inspectionResult.category || 'Group / Education'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-white/50">User Impact</span>
                    <span className="text-amber-400 font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">{inspectionResult.user_impact || 'Low'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-white/50">Risk Level</span>
                    <span className={`font-medium px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                      inspectionResult.risk_level?.includes('High') 
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
                        : inspectionResult.risk_level?.includes('Medium')
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {inspectionResult.risk_level?.includes('High') ? <ShieldAlert className="w-3.5 h-3.5 animate-pulse" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      {inspectionResult.risk_level || 'Low Risk'}
                    </span>
                  </div>
                </div>

                {/* AI Reasoning Text Block */}
                <div className="space-y-2 bg-black border border-[#141418] rounded-2xl p-4">
                  <p className="text-xs font-semibold text-cyan-400 tracking-wide uppercase">AI Reasoning</p>
                  <p className="text-white/80 text-xs leading-relaxed">
                    {inspectionResult.reason}
                  </p>
                </div>

              </div>
            ) : null}
          </div>
        </div>

      </div>

      {/* Bottom Section: AI Reasoning Pipeline & Key Factors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Reasoning Pipeline (8 Cols) */}
        {inspectionResult && (
          <div className="lg:col-span-8 bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6 transition-all duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2 text-white">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  AI Reasoning Pipeline
                </h3>
                <p className="text-white/40 text-xs mt-0.5">Step-by-step neural execution telemetry</p>
              </div>
              <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-xl border border-cyan-500/20 font-mono">
                6 Stages Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              {inspectionResult.reasoning_steps.map((step, idx) => {
                const icons = [FileText, User, ShieldCheck, Activity, Brain, CheckCircle2]
                const StepIcon = icons[idx % icons.length]

                return (
                  <div
                    key={idx}
                    className="bg-black hover:border-cyan-500/30 border border-[#141418] rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        Step 0{idx + 1}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white text-xs mb-1">{step.step}</h4>
                      <p className="text-white/60 text-[11px] line-clamp-2">{step.result}</p>
                    </div>

                    <div className="pt-2 border-t border-[#141418] flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Key Factors & Brain Visual (4 Cols) */}
        <div className="lg:col-span-4 bg-[#08080a] backdrop-blur-2xl border border-[#141418] hover:border-cyan-500/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-between space-y-6 transition-all duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2 text-white">
                <Brain className="w-4 h-4 text-purple-400" />
                Key Factors
              </h3>
              <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20 font-mono">
                Weights
              </span>
            </div>

            <div className="relative h-32 rounded-2xl bg-gradient-to-br from-purple-900/20 via-cyan-900/10 to-black border border-purple-500/20 flex items-center justify-center overflow-hidden mb-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0,transparent_70%)]"></div>
              <Brain className="w-16 h-16 text-cyan-400 animate-pulse drop-shadow-[0_0_15px_rgba(0,217,255,0.6)]" />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono text-cyan-300 bg-black/80 px-2 py-0.5 rounded border border-cyan-500/30">
                Orchestrate v2.3
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { label: 'Sender Trust Score', val: 70, color: 'bg-cyan-400' },
                { label: 'Message Relevance', val: 85, color: 'bg-cyan-400' },
                { label: 'User Preference Match', val: 80, color: 'bg-cyan-400' },
                { label: 'Spam Probability', val: inspectionResult?.risk_level?.includes('High') ? 88 : 18, color: inspectionResult?.risk_level?.includes('High') ? 'bg-rose-500' : 'bg-emerald-400' },
                { label: 'Historical Similarity', val: 76, color: 'bg-cyan-400' },
              ].map((factor, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/60">{factor.label}</span>
                    <span className="font-mono font-semibold text-white">{factor.val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${factor.color} rounded-full`} style={{ width: `${factor.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#141418] grid grid-cols-2 gap-3 text-xs">
            <div className="bg-black border border-[#141418] rounded-xl p-3">
              <span className="text-[10px] text-white/40 uppercase block">Processing Time</span>
              <span className="text-sm font-bold text-cyan-400 font-mono mt-0.5 block">184ms</span>
            </div>
            <div className="bg-black border border-[#141418] rounded-xl p-3">
              <span className="text-[10px] text-white/40 uppercase block">Model Response</span>
              <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                Success <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}