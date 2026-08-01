import React, { useEffect, useState } from 'react'
import { AlertTriangle, MapPin, Compass, Calendar, SlidersHorizontal, TrendingUp, BarChart3, Info } from 'lucide-react'

export const DeliveryIntelligence: React.FC = () => {
  const [showWarning, setShowWarning] = useState(true)
  const [feed, setFeed] = useState([
    { id: 1, tone: 'success', label: 'Amazon verified' },
    { id: 2, tone: 'success', label: 'HDFC verified' },
    { id: 3, tone: 'warn', label: 'Unknown Store under review' },
    { id: 4, tone: 'success', label: 'Swiggy verified' },
  ])

  const todayLabel = `Today, ${new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())}`

  const getZoneColor = (score: number) => {
    if (score < 25) return 'var(--color-red)'
    if (score < 90) return 'var(--color-orange)'
    return 'var(--color-emerald)'
  }

  const zones = [
    { id: 'ecommerce', name: 'E-commerce', share: '36%', trustScore: 98 },
    { id: 'banking', name: 'Banking', share: '24%', trustScore: 97 },
    { id: 'food', name: 'Food Delivery', share: '18%', trustScore: 95 },
    { id: 'transport', name: 'Travel & Transport', share: '12%', trustScore: 93 },
    { id: 'healthcare', name: 'Healthcare', share: '10%', trustScore: 99 },
  ]

  useEffect(() => {
    const activity = [
      { tone: 'success', label: 'Amazon verified' },
      { tone: 'success', label: 'HDFC verified' },
      { tone: 'warn', label: 'Unknown Store under review' },
      { tone: 'success', label: 'Swiggy verified' },
      { tone: 'danger', label: 'Fake Bank blocked' },
    ]

    let index = 0
    const interval = setInterval(() => {
      const entry = activity[index % activity.length]
      setFeed((current) => [{ id: Date.now(), ...entry }, ...current].slice(0, 5))
      index += 1
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  const handleReviewBusiness = () => {
    setShowWarning(false)
  }

  const cardAnimationStyle = {
    animation: 'fadeIn 0.5s ease-out forwards',
    transition: 'all 0.3s ease',
  }

  return (
    <div className="page-shell overflow-x-hidden p-8 space-y-8 selection:bg-cyan-500/30">
      <style>{`
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulseGlow {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animated-card {
          animation: fadeIn 0.4s ease-out both;
        }
        .animated-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .warning-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 200px;
          opacity: 1;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .warning-card.hidden {
          max-height: 0;
          opacity: 0;
          padding-top: 0;
          padding-bottom: 0;
          margin-bottom: 0;
          border: none;
        }
        .trend-line {
          stroke-dasharray: 1000;
          animation: drawLine 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .verification-point {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulseGlow 2.4s ease-in-out infinite;
          box-shadow: 0 0 14px currentColor;
        }
        .feed-item {
          animation: slideIn 0.35s ease-out;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass style={{ color: 'var(--color-cyan)' }} size={20} />
            Business Verification
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Real-time monitoring of verified businesses, trust scores, and AI verification decisions.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ background: '#14161A', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <Calendar size={14} /> {todayLabel}
          </button>
          <button style={{ background: '#14161A', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <SlidersHorizontal size={14} /> Verification Filters
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div className="animated-card" style={{ ...cardAnimationStyle, animationDelay: '0.05s', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>VERIFIED BUSINESSES</span>
              <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: 'var(--color-emerald)' }}>128</div>
            </div>
            <div style={{ color: 'var(--color-emerald)', opacity: 0.6 }}><TrendingUp size={24} /></div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>Verified across the platform today.</span>
        </div>

        <div className="animated-card" style={{ ...cardAnimationStyle, animationDelay: '0.1s', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>AVERAGE TRUST SCORE</span>
              <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: 'var(--color-cyan)' }}>94.8%</div>
            </div>
            <div style={{ color: 'var(--color-cyan)', opacity: 0.6 }}><BarChart3 size={24} /></div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>Based on AI business verification.</span>
        </div>

        <div className="animated-card" style={{ ...cardAnimationStyle, animationDelay: '0.15s', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>PENDING VERIFICATION</span>
              <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '6px', color: 'var(--color-orange)' }}>12 Businesses</div>
            </div>
            <div style={{ color: 'var(--color-orange)', opacity: 0.6 }}><Info size={24} /></div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>High Risk Businesses: 4 • Require manual review.</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 5fr 4fr', gap: '16px', alignItems: 'start' }}>
        <div className="animated-card" style={{ ...cardAnimationStyle, animationDelay: '0.2s', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={16} style={{ color: 'var(--color-cyan)' }} />
            <span>Business Categories</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {zones.map((zone) => {
              const color = getZoneColor(zone.trustScore)
              return (
                <div key={zone.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>{zone.name}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Share: {zone.share}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Trust Score:</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color }}>{zone.trustScore}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>AI confidence:</span>
                      <span>{zone.trustScore}%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${zone.trustScore}%`, height: '100%', background: color, borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="animated-card" style={{ ...cardAnimationStyle, animationDelay: '0.25s', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', height: '320px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={16} style={{ color: 'var(--color-cyan)' }} />
                <span>Business Verification Heatmap</span>
                <span style={{ fontSize: '10px', background: 'rgba(52,211,153,0.1)', color: 'var(--color-emerald)', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>• Live</span>
              </h3>
            </div>
            <div style={{ flex: 1, width: '100%', position: 'relative', overflow: 'hidden' }}>
              <img
                src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGUyNXA1ZHdyNzFmczh0aTF5cWFrYXl0eWtlYmowNXBpMGozbjhyeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oz8xW8Fs4ioqy04gM/giphy.gif"
                alt="Business Verification Heatmap"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, filter: 'saturate(1.15) contrast(1.1)' }}
              />
              <div className="verification-point" style={{ top: '18%', left: '20%', color: 'var(--color-emerald)', background: 'var(--color-emerald)' }} />
              <div className="verification-point" style={{ top: '34%', left: '52%', color: 'var(--color-orange)', background: 'var(--color-orange)' }} />
              <div className="verification-point" style={{ top: '62%', left: '66%', color: 'var(--color-red)', background: 'var(--color-red)' }} />
              <div className="verification-point" style={{ top: '52%', left: '28%', color: 'var(--color-emerald)', background: 'var(--color-emerald)' }} />
              <div className="verification-point" style={{ top: '74%', left: '80%', color: '#8b0000', background: '#8b0000' }} />
              <div className="verification-point" style={{ top: '28%', left: '74%', color: 'var(--color-red)', background: 'var(--color-red)' }} />
              <div className="verification-point" style={{ top: '78%', left: '44%', color: 'var(--color-emerald)', background: 'var(--color-emerald)' }} />
              <div className="verification-point" style={{ top: '44%', left: '82%', color: 'var(--color-orange)', background: 'var(--color-orange)' }} />
            </div>
            <div style={{ padding: '10px 16px', display: 'flex', gap: '16px', fontSize: '10px', color: 'var(--text-secondary)', background: '#000000', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-emerald)' }} /> Verified Businesses</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-orange)' }} /> Under Review</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-red)' }} /> High Risk</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b0000' }} /> Rejected</span>
            </div>
          </div>

          <div className="animated-card" style={{ ...cardAnimationStyle, animationDelay: '0.3s', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>AI Verification Timeline</h3>
              <div style={{ display: 'flex', gap: '14px', fontSize: '11px', fontWeight: '500' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)' }}><span style={{ width: '12px', height: '3px', background: 'var(--color-emerald)', borderRadius: '2px', display: 'inline-block' }} /> Verified</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)' }}><span style={{ width: '12px', height: '3px', background: 'var(--color-orange)', borderRadius: '2px', display: 'inline-block' }} /> Under review</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)' }}><span style={{ width: '12px', height: '3px', background: 'var(--color-red)', borderRadius: '2px', display: 'inline-block' }} /> Blocked</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', height: '150px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'right', width: '24px', height: '120px', paddingRight: '4px' }}>
                <span>160</span>
                <span>120</span>
                <span>80</span>
                <span>40</span>
                <span>0</span>
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <svg viewBox="0 0 600 120" width="100%" height="120px" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <line x1="0" y1="0" x2="600" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="60" x2="600" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="90" x2="600" y2="90" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                  <path className="trend-line" d="M 0 90 L 20 88 L 40 82 L 60 80 L 80 76 L 100 70 L 120 68 L 140 64 L 160 58 L 180 52 L 200 60 L 220 54 L 240 52 L 260 44 L 280 40 L 300 35 L 320 38 L 340 42 L 360 45 L 380 48 L 400 42 L 420 36 L 440 34 L 460 28 L 480 30 L 500 24 L 520 26 L 540 22 L 560 18 L 580 14 L 600 12" fill="none" stroke="var(--color-emerald)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  <path className="trend-line" d="M 0 108 L 20 106 L 40 104 L 60 100 L 80 98 L 100 96 L 120 92 L 140 94 L 160 89 L 180 88 L 200 86 L 220 80 L 240 78 L 260 82 L 280 76 L 300 74 L 320 72 L 340 68 L 360 70 L 380 71 L 400 68 L 420 66 L 440 64 L 460 66 L 480 62 L 500 64 L 520 58 L 540 60 L 560 56 L 580 54 L 600 52" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ animationDelay: '0.15s' }} />
                  <path className="trend-line" d="M 0 120 L 20 120 L 40 118 L 60 118 L 80 116 L 100 116 L 120 114 L 140 110 L 160 110 L 180 108 L 200 110 L 220 106 L 240 108 L 260 105 L 280 103 L 300 104 L 320 101 L 340 100 L 360 98 L 380 96 L 400 96 L 420 92 L 440 90 L 460 94 L 480 88 L 500 86 L 520 82 L 540 84 L 560 80 L 580 76 L 600 78" fill="none" stroke="var(--color-red)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ animationDelay: '0.3s' }} />
                </svg>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', paddingLeft: '2px' }}>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={`warning-card ${!showWarning ? 'hidden' : ''}`}>
            <div style={{ background: 'rgba(255,69,58,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid var(--color-red)', borderRadius: '12px', padding: '16px', height: '100%' }}>
              <h4 style={{ color: 'var(--color-red)', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 8px 0' }}>
                <AlertTriangle size={14} /> Business Verification Alert
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 8px 0' }}>Unknown business "Quick Rewards Ltd."</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 8px 0' }}>Trust Score: 42%</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 12px 0' }}>High probability of spam activity.</p>
              <button onClick={handleReviewBusiness} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-medium)', color: '#FFFFFF', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600', textAlign: 'center', transition: 'background 0.2s' }}>Review Business</button>
            </div>
          </div>

          <div className="animated-card" style={{ ...cardAnimationStyle, animationDelay: '0.4s', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 12px 0' }}>
              <Info size={14} style={{ color: 'var(--color-cyan)' }} />
              <span>Business Verification Summary</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Businesses Verified Today</span>
                <span style={{ color: '#FFFFFF', fontWeight: '600' }}>128</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pending Reviews</span>
                <span style={{ color: '#FFFFFF', fontWeight: '600' }}>12</span>
              </div>
            
            </div>

            <div style={{ marginTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {feed.map((item) => (
                  <div key={item.id} className="feed-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#FFFFFF', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px', padding: '8px 10px' }}>
                    <span style={{ color: item.tone === 'success' ? 'var(--color-emerald)' : item.tone === 'warn' ? 'var(--color-orange)' : 'var(--color-red)', fontWeight: '700' }}>
                      {item.tone === 'success' ? '✓' : item.tone === 'warn' ? '⚠' : '✕'}
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryIntelligence