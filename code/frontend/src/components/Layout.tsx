import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Activity,
  MessageSquare,
  BarChart3,
  Brain,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Ticket,
  Play,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface LayoutProps {
  children: ReactNode
  isConnected: boolean
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [activeType, setActiveType] = useState('Notify')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/inspector', label: 'AI Inspector', icon: Brain },
    { path: '/live', label: 'Live', icon: Activity },
    { path: '/business', label: 'Business', icon: Ticket },
    { path: '/command', label: 'Command', icon: Play },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  const typeOptions = ['Notify', 'Digest', 'Mute']
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="app-shell flex h-screen w-screen overflow-hidden text-slate-200 bg-black selection:bg-cyan-500/30 selection:text-cyan-200 font-sans">
      
      {/* SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? '72px' : '240px' }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="sidebar-shell border-r border-neutral-900 flex flex-col h-full bg-black shrink-0 relative overflow-hidden"
      >
        {/* Top Header / Branding */}
        <div className="p-3.5 border-b border-neutral-900 bg-black">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="brand-block w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-xs font-black tracking-tight text-white">IQ</span>
              </div>
              <motion.div 
                animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="text-xs font-bold leading-tight tracking-tight text-white truncate">InboxIQ</h1>
                <p className="text-[10px] text-neutral-400 truncate">Smarter Notifications. Better Focus.</p>
              </motion.div>
            </div>
            
            {!isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="icon-button text-neutral-500 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-900 cursor-pointer" 
                aria-label="Collapse panel"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full mt-2 flex items-center justify-center p-1.5 text-neutral-500 hover:text-white bg-black hover:bg-neutral-900 border border-neutral-900 rounded-md transition-colors cursor-pointer"
              aria-label="Expand panel"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Type Slider */}
        <div className="overflow-hidden">
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="px-3 pb-2 pt-2.5 bg-black"
            >
              <div className="type-slider bg-black p-1 rounded-lg border border-neutral-900">
                <div className="type-slider-track grid grid-cols-3 gap-1">
                  {typeOptions.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveType(type)}
                      className={`type-chip py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        activeType === type
                          ? 'bg-neutral-900 text-white border border-neutral-800 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 pb-3 mt-1 overflow-y-auto bg-black [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="nav-list space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <Link key={item.path} to={item.path} className="nav-link block" title={isCollapsed ? item.label : undefined}>
                  <motion.div
                    whileHover={{ x: isCollapsed ? 0 : 3 }}
                    transition={{ duration: 0.15 }}
                    className={`nav-item flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors relative ${
                      active
                        ? 'bg-neutral-900 text-cyan-400 border border-neutral-800 shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/40'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <div className="nav-icon-wrap shrink-0">
                      <Icon className={`nav-icon h-3.5 w-3.5 ${active ? 'text-cyan-400' : 'text-neutral-500'}`} />
                    </div>
                    {!isCollapsed && <span className="truncate whitespace-nowrap">{item.label}</span>}
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Card */}
        <div className="p-2.5 border-t border-neutral-900 bg-black">
          <div className={`user-card flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-2 rounded-lg bg-black border border-neutral-900 overflow-hidden`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="user-avatar w-6 h-6 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-neutral-300 text-[10px] shrink-0">
                OP
              </div>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="user-meta overflow-hidden whitespace-nowrap"
                >
                  <div className="user-name text-[11px] font-semibold text-white truncate">Operator 01</div>
                  <div className="user-role text-[9px] text-neutral-400">Admin</div>
                </motion.div>
              )}
            </div>
            {!isCollapsed && (
              <button className="user-arrow text-neutral-500 hover:text-white p-0.5 cursor-pointer shrink-0" aria-label="Open user menu">
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto bg-black [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-neutral-900 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="p-6 min-h-full">
          {/* Content-level type selector for collapsed-sidebar layouts */}
          {isCollapsed && (
            <div className="mb-5 rounded-2xl border border-neutral-900 bg-[#08080a]/80 p-3 shadow-inner shadow-black/20">
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                <span className="font-semibold text-neutral-200">Routing View</span>
                <span className="text-white/50">Select the active action type for the current pages.</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {typeOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveType(type)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-semibold transition-colors ${
                      activeType === type
                        ? 'bg-neutral-900 text-white border border-neutral-800 shadow-sm'
                        : 'bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700 border border-transparent'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  )
}