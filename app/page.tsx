'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types (unchanged) ──────────────────────────────────────────────
interface Placement {
  id: number; year: number; avgPackage: number; highestPackage: number; placementRate: number
}
interface College {
  id: number; name: string; location: string; state: string; fees: number
  rating: number; description: string; placements?: Placement[]; _count?: { reviews: number }
}
interface Cutoff { id: number; exam: string; category: string; openingRank: number; closingRank: number }
interface Course { id: number; name: string; duration: string; seats: number; fees: number }
interface CollegeDetail extends College {
  courses: Course[]
  placements: Placement[]
  reviews: { id: number; rating: number; comment: string; user: { name: string } }[]
  cutoffs: Cutoff[]
  _count: { reviews: number; savedBy: number }
}
interface PredictorResult {
  college: College
  cutoff: { exam: string; category: string; openingRank: number; closingRank: number }
  safetyMargin: number
  admissionChance: 'Safe' | 'Moderate' | 'Borderline'
  latestPlacement: Placement | null
}
interface PredictorSummary { safeColleges: number; moderateColleges: number; totalEligible: number }
interface CurrentUser { id: number; name: string; email: string }

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 10000000 ? `₹${(n/10000000).toFixed(1)}Cr`
  : n >= 100000  ? `₹${(n/100000).toFixed(1)}L`
  : `₹${n.toLocaleString()}`

const CHANCE = {
  Safe:       { bg:'rgba(52,211,153,0.12)', color:'#34d399', border:'rgba(52,211,153,0.3)'  },
  Moderate:   { bg:'rgba(251,191,36,0.12)',  color:'#fbbf24', border:'rgba(251,191,36,0.3)'  },
  Borderline: { bg:'rgba(248,113,113,0.12)', color:'#f87171', border:'rgba(248,113,113,0.3)' },
}

// accent cycling for cards
const CARD_ACCENTS = [
  'rgba(96,165,250,0.7)',  // blue
  'rgba(167,139,250,0.7)', // purple
  'rgba(34,211,238,0.7)',  // cyan
  'rgba(52,211,153,0.7)',  // emerald
  'rgba(251,191,36,0.7)',  // amber
  'rgba(248,113,113,0.7)', // rose
]

const STAR_GRADIENT: React.CSSProperties = {
  background: 'linear-gradient(135deg,#2563eb 0%,#7c3aed 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

// Tab labels + icons
const TABS = [
  { id: 'list',      label: 'Colleges',  icon: '⬡' },
  { id: 'compare',   label: 'Compare',   icon: '⇄' },
  { id: 'predictor', label: 'Predictor', icon: '◎' },
  { id: 'account',   label: 'Account',   icon: '◉' },
] as const

// ── Component ─────────────────────────────────────────────────────
export default function Home() {
  // all state kept exactly as original
  const [colleges, setColleges]         = useState<College[]>([])
  const [search, setSearch]             = useState('')
  const [state, setState]               = useState('')
  const [maxFees, setMaxFees]           = useState('')
  const [minRating, setMinRating]       = useState('')
  const [sortBy, setSortBy]             = useState('rating')
  const [sortOrder, setSortOrder]       = useState('desc')
  const [loading, setLoading]           = useState(false)
  const [selectedCollege, setSelectedCollege] = useState<CollegeDetail | null>(null)
  const [detailLoading, setDetailLoading]     = useState(false)
  const [compareIds, setCompareIds]     = useState<number[]>([])
  const [compareData, setCompareData]   = useState<any[]>([])
  const [predictorExam, setPredictorExam]         = useState('JEE Advanced')
  const [predictorRank, setPredictorRank]         = useState('')
  const [predictorCategory, setPredictorCategory] = useState('General')
  const [predictorResults, setPredictorResults]   = useState<PredictorResult[]>([])
  const [predictorSummary, setPredictorSummary]   = useState<PredictorSummary | null>(null)
  const [predictorLoading, setPredictorLoading]   = useState(false)
  const [activeTab, setActiveTab]       = useState<'list'|'compare'|'predictor'|'account'>('list')
  const [total, setTotal]               = useState(0)
  const [page, setPage]                 = useState(1)
  const [totalPages, setTotalPages]     = useState(1)

  const [authMode, setAuthMode]         = useState<'login'|'signup'>('login')
  const [authName, setAuthName]         = useState('')
  const [authEmail, setAuthEmail]       = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [token, setToken]               = useState<string|null>(null)
  const [currentUser, setCurrentUser]   = useState<CurrentUser|null>(null)
  const [authError, setAuthError]       = useState('')
  const [savedColleges, setSavedColleges] = useState<College[]>([])
  const [saveMsg, setSaveMsg]           = useState('')

  const API = 'https://college-discovery-sooty.vercel.app'

  // ── API calls (unchanged) ──────────────────────────────────────
  const fetchColleges = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (state) params.append('state', state)
    if (maxFees) params.append('maxFees', maxFees)
    if (minRating) params.append('minRating', minRating)
    params.append('sortBy', sortBy)
    params.append('sortOrder', sortOrder)
    params.append('page', String(page))
    params.append('limit', '12')
    const res = await fetch(`${API}/api/colleges?${params}`)
    const data = await res.json()
    setColleges(data.data || [])
    setTotal(data.total || 0)
    setTotalPages(data.totalPages || 1)
    setLoading(false)
  }, [search, state, maxFees, minRating, sortBy, sortOrder, page])

  const fetchCollegeDetail = async (id: number) => {
    setDetailLoading(true); setSelectedCollege(null)
    const res = await fetch(`${API}/api/colleges/${id}`)
    const data = await res.json()
    setSelectedCollege(data.data || data)
    setDetailLoading(false)
  }

  const fetchCompare = async () => {
    if (compareIds.length < 2) return alert('Select at least 2 colleges to compare')
    const res = await fetch(`${API}/api/colleges/compare?ids=${compareIds.join(',')}`)
    const data = await res.json()
    setCompareData(data.colleges || [])
  }

  const fetchPredictor = async () => {
    if (!predictorRank) return alert('Enter your rank')
    setPredictorLoading(true); setPredictorResults([])
    const res = await fetch(`${API}/api/predictor?exam=${encodeURIComponent(predictorExam)}&rank=${predictorRank}&category=${predictorCategory}&limit=30`)
    const data = await res.json()
    setPredictorResults(data.data || [])
    setPredictorSummary(data.summary || null)
    setPredictorLoading(false)
  }

  const handleSignup = async () => {
    setAuthError('')
    const res = await fetch(`${API}/api/auth/signup`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name:authName, email:authEmail, password:authPassword })
    })
    const data = await res.json()
    if (!res.ok) return setAuthError(data.error || 'Signup failed')
    setAuthMode('login'); setAuthError('Account created! Please log in.')
  }

  const handleLogin = async () => {
    setAuthError('')
    const res = await fetch(`${API}/api/auth/login`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:authEmail, password:authPassword })
    })
    const data = await res.json()
    if (!res.ok) return setAuthError(data.error || 'Login failed')
    const user = data.user || { id:data.id, name:data.name||data.email, email:data.email }
    setToken(data.token); setCurrentUser(user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(user))
    setAuthEmail(''); setAuthPassword('')
  }

  const handleLogout = () => {
    setToken(null); setCurrentUser(null); setSavedColleges([])
    localStorage.removeItem('token'); localStorage.removeItem('user')
  }

  const fetchSavedColleges = useCallback(async () => {
    if (!token) return
    const res = await fetch(`${API}/api/user/saved`, { headers:{ Authorization:`Bearer ${token}` } })
    const data = await res.json()
    setSavedColleges(data.data || [])
  }, [token])

  const saveCollege = async (collegeId: number) => {
    if (!token) return alert('Please log in to save colleges')
    const res = await fetch(`${API}/api/colleges/save`, {
      method:'POST',
      headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({ collegeId })
    })
    if (res.ok) { fetchSavedColleges(); setSaveMsg('Saved!'); setTimeout(()=>setSaveMsg(''),2000) }
  }

  const toggleCompare = (id: number) =>
    setCompareIds(prev => prev.includes(id) ? prev.filter(i=>i!==id) : prev.length<3 ? [...prev,id] : prev)

  useEffect(() => {
    const saved = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (saved) setToken(saved)
    if (savedUser) { try { setCurrentUser(JSON.parse(savedUser)) } catch {} }
  }, [])
  useEffect(() => { if (token) fetchSavedColleges() }, [token, fetchSavedColleges])
  useEffect(() => { fetchColleges() }, [fetchColleges])

  // ── AUTH SCREEN ──────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div style={{ minHeight:'100vh', position:'relative', display:'flex', overflow:'hidden' }}>
        {/* Animated BG */}
        <div className="auth-bg" />
        <div className="auth-blob" style={{ width:500, height:500, top:'-100px', left:'-120px', background:'rgba(96,165,250,0.15)' }} />
        <div className="auth-blob" style={{ width:400, height:400, bottom:'-80px', right:'100px', background:'rgba(167,139,250,0.12)', animationDelay:'3s' }} />
        <div className="auth-blob" style={{ width:300, height:300, top:'40%', right:'-60px', background:'rgba(34,211,238,0.10)', animationDelay:'6s' }} />

        {/* Left panel — hero */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 64px', position:'relative', zIndex:1 }}
          className="hidden md:flex">
          <div style={{ maxWidth:460 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎓</div>
              <span style={{ fontWeight:800, fontSize:18, letterSpacing:'-0.02em', color:'#f0f4ff' }}>College Discovery</span>
            </div>
            <h1 style={{ fontSize:48, fontWeight:900, lineHeight:1.08, letterSpacing:'-0.04em', color:'#f0f4ff', margin:'0 0 20px' }}>
              Find your{' '}
              <span style={{ background:'linear-gradient(135deg,#60a5fa 0%,#a78bfa 50%,#22d3ee 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                perfect college
              </span>
            </h1>
            <p style={{ fontSize:17, color:'#64748b', lineHeight:1.7, margin:'0 0 48px' }}>
              Search 500+ colleges, compare placements, and predict admission chances with real cutoff data — all in one place.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { icon:'◈', label:'Real placement & salary data' },
                { icon:'⊞', label:'Side-by-side college comparison' },
                { icon:'◎', label:'AI-powered rank predictor' },
              ].map(f => (
                <div key={f.label} style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{f.icon}</div>
                  <span style={{ fontSize:14, color:'#94a3b8' }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — glass card */}
        <div style={{ width:'100%', maxWidth:480, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 32px', position:'relative', zIndex:2, flexShrink:0 }}>
          <div className="glass" style={{ width:'100%', borderRadius:24, padding:'40px 36px', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
            {/* Logo (mobile only) */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎓</div>
              <span style={{ fontWeight:800, fontSize:16, color:'#f0f4ff' }}>College Discovery</span>
            </div>

            <h2 style={{ margin:'0 0 6px', fontSize:24, fontWeight:800, letterSpacing:'-0.03em', color:'#f0f4ff' }}>
              {authMode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ margin:'0 0 28px', fontSize:14, color:'#64748b' }}>
              {authMode === 'login' ? 'Log in to continue your search.' : 'Start finding your dream college.'}
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {authMode === 'signup' && (
                <input className="input-premium" placeholder="Full name" value={authName}
                  onChange={e=>setAuthName(e.target.value)} />
              )}
              <input className="input-premium" placeholder="Email address" type="email" value={authEmail}
                onChange={e=>setAuthEmail(e.target.value)} />
              <input className="input-premium" placeholder="Password" type="password" value={authPassword}
                onChange={e=>setAuthPassword(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&(authMode==='login'?handleLogin():handleSignup())} />
            </div>

            {authError && (
              <p style={{ margin:'14px 0 0', fontSize:13, textAlign:'center',
                color: authError.includes('created') ? '#34d399' : '#f87171' }}>
                {authError}
              </p>
            )}

            <button className="btn-primary" onClick={authMode==='login'?handleLogin:handleSignup}
              style={{ width:'100%', marginTop:20, padding:'14px', borderRadius:14, fontSize:15 }}>
              {authMode==='login' ? 'Log in' : 'Create account'}
            </button>

            <p style={{ textAlign:'center', margin:'22px 0 0', fontSize:13, color:'#64748b' }}>
              {authMode==='login' ? "Don't have an account? " : 'Already have an account? '}
              <span onClick={()=>{ setAuthMode(authMode==='login'?'signup':'login'); setAuthError('') }}
                style={{ color:'#60a5fa', cursor:'pointer', fontWeight:700 }}>
                {authMode==='login' ? 'Sign up' : 'Log in'}
              </span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── MAIN APP ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse at 70% 0%, rgba(37,99,235,0.07) 0%, transparent 60%), #06090f', color:'#f0f4ff' }}>

      {/* Save toast */}
      {saveMsg && (
        <div style={{ position:'fixed', bottom:28, right:28, background:'linear-gradient(135deg,#059669,#34d399)', color:'#fff', padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:13, zIndex:300, boxShadow:'0 8px 32px rgba(52,211,153,0.4)' }}>
          ✓ Saved to your list
        </div>
      )}

      {/* ── NAVBAR ────────────────────────────────────────────────── */}
      <nav className="glass-dark" style={{ position:'sticky', top:0, zIndex:50, borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'0 28px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🎓</div>
            <span style={{ fontWeight:800, fontSize:15, letterSpacing:'-0.02em', color:'#f0f4ff' }}>College Discovery</span>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', alignItems:'center', gap:2, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:4, border:'1px solid rgba(255,255,255,0.07)' }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:9, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.18s',
                  background: activeTab===tab.id ? 'rgba(255,255,255,0.09)' : 'transparent',
                  color: activeTab===tab.id ? '#f0f4ff' : '#64748b',
                  boxShadow: activeTab===tab.id ? '0 1px 8px rgba(0,0,0,0.3)' : 'none',
                }}>
                <span style={{ fontSize:11, opacity:0.7 }}>{tab.icon}</span>
                {tab.id==='account' ? currentUser.name.split(' ')[0] : tab.label}
                {activeTab===tab.id && tab.id==='list' && compareIds.length>0 && (
                  <span style={{ background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', borderRadius:999, padding:'1px 7px', fontSize:10, fontWeight:800 }}>{compareIds.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Right — user avatar */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, color:'#fff', boxShadow:'0 2px 12px rgba(37,99,235,0.4)' }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      {/* ── PAGE BODY ───────────────────────────────────────────── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px 80px' }}>

        {/* ══ COLLEGES TAB ════════════════════════════════════════ */}
        {activeTab==='list' && (
          <div className="fade-up">
            {/* Search hero */}
            <div style={{ marginBottom:24 }}>
              <h2 style={{ margin:'0 0 4px', fontSize:26, fontWeight:800, letterSpacing:'-0.03em', color:'#f0f4ff' }}>
                Discover colleges
              </h2>
              <p style={{ margin:'0 0 20px', fontSize:14, color:'#64748b' }}>
                {loading ? 'Searching…' : `${total.toLocaleString()} college${total!==1?'s':''} in our database`}
                {compareIds.length>0 && <span style={{ marginLeft:12, color:'#60a5fa' }}>· {compareIds.length} queued for compare</span>}
              </p>

              {/* Search bar */}
              <div className="glass" style={{ borderRadius:18, padding:'18px 20px 14px' }}>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:12 }}>
                  <div style={{ flex:1, minWidth:220, position:'relative' }}>
                    <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:16, opacity:0.4 }}>⌕</span>
                    <input className="input-premium" placeholder="Search colleges, cities, courses…"
                      value={search} onChange={e=>setSearch(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&setPage(1)}
                      style={{ paddingLeft:40 }} />
                  </div>
                  <input className="input-premium" placeholder="State" value={state}
                    onChange={e=>setState(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setPage(1)}
                    style={{ width:150 }} />
                  <input className="input-premium" placeholder="Max fees (₹)" type="number" value={maxFees}
                    onChange={e=>setMaxFees(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setPage(1)}
                    style={{ width:150 }} />
                  <input className="input-premium" placeholder="Min rating" type="number" value={minRating}
                    onChange={e=>setMinRating(e.target.value)} onKeyDown={e=>e.key==='Enter'&&setPage(1)}
                    style={{ width:130 }} />
                  <button className="btn-primary" onClick={()=>{setPage(1);fetchColleges()}}
                    style={{ padding:'12px 28px', borderRadius:12, fontSize:14, flexShrink:0 }}>
                    Search
                  </button>
                </div>

                {/* Sort + clear chips */}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:12, color:'#64748b', fontWeight:500 }}>Sort:</span>
                  {[['rating','Rating'],['fees','Fees'],['name','Name']].map(([val,label])=>(
                    <button key={val} className="chip" onClick={()=>{setSortBy(val);setPage(1)}}
                      style={{ background: sortBy===val ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
                        borderColor: sortBy===val ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)',
                        color: sortBy===val ? '#60a5fa' : '#64748b' }}>
                      {label}
                    </button>
                  ))}
                  <button className="chip" onClick={()=>setSortOrder(o=>o==='desc'?'asc':'desc')}
                    style={{ background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.08)', color:'#64748b' }}>
                    {sortOrder==='desc'?'↓ High→Low':'↑ Low→High'}
                  </button>
                  {(search||state||maxFees||minRating) && (
                    <button className="chip" onClick={()=>{setSearch('');setState('');setMaxFees('');setMinRating('');setPage(1)}}
                      style={{ background:'rgba(248,113,113,0.1)', borderColor:'rgba(248,113,113,0.3)', color:'#f87171' }}>
                      ✕ Clear filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cards grid */}
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
                {Array.from({length:6}).map((_,i)=>(
                  <div key={i} className="skeleton" style={{ height:280, borderRadius:16 }} />
                ))}
              </div>
            ) : colleges.length===0 ? (
              <div style={{ textAlign:'center', padding:'100px 0', color:'#64748b' }}>
                <div style={{ fontSize:48, marginBottom:16, opacity:0.4 }}>⌕</div>
                <p style={{ fontSize:15, margin:0 }}>No colleges match your filters.</p>
                <p style={{ fontSize:13, margin:'6px 0 0', color:'#475569' }}>Try adjusting your search terms.</p>
              </div>
            ) : (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
                  {colleges.map((college, i) => {
                    const placement = college.placements?.[0]
                    const accent = CARD_ACCENTS[i % CARD_ACCENTS.length]
                    const isSaved = savedColleges.some(s=>s.id===college.id)
                    const inCompare = compareIds.includes(college.id)
                    return (
                      <div key={college.id} className="card-lift glass"
                        style={{ borderRadius:18, overflow:'hidden', display:'flex', flexDirection:'column', cursor:'default' }}>
                        {/* Card top accent bar */}
                        <div style={{ height:3, background:`linear-gradient(90deg,${accent},transparent)` }} />

                        <div style={{ padding:'20px 20px 16px', flex:1, display:'flex', flexDirection:'column' }}>
                          {/* Header row */}
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:6 }}>
                            <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:'#f0f4ff', lineHeight:1.3, flex:1 }}>
                              {college.name}
                            </h3>
                            <div style={{ background:`rgba(${accent.replace(/rgba\(|\)/g,'').split(',').slice(0,3).join(',')},0.15)`, color:accent.replace(/0\.7\)/,'1)'), border:`1px solid ${accent.replace(/0\.7\)/,'0.3)')}`, padding:'3px 10px', borderRadius:999, fontSize:12, fontWeight:800, whiteSpace:'nowrap', flexShrink:0 }}>
                              ★ {college.rating}
                            </div>
                          </div>

                          {/* Location + fees */}
                          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                            <span style={{ fontSize:12, color:'#64748b' }}>📍 {college.location}, {college.state}</span>
                            <span style={{ fontSize:13, fontWeight:700, color:'#60a5fa' }}>₹{college.fees.toLocaleString()}/yr</span>
                          </div>

                          {/* Placement mini stats */}
                          {placement && (
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                              <div style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:10, padding:'9px 12px' }}>
                                <div style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Avg Package</div>
                                <div style={{ fontSize:14, fontWeight:800, color:'#34d399' }}>{fmt(placement.avgPackage)}</div>
                              </div>
                              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'9px 12px' }}>
                                <div style={{ fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Placement</div>
                                <div style={{ fontSize:14, fontWeight:800, color:'#f0f4ff' }}>{placement.placementRate}%</div>
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          <p style={{ margin:'0 0 14px', fontSize:12.5, color:'#64748b', lineHeight:1.6, flex:1 }}>
                            {college.description?.slice(0,110)}{(college.description?.length||0)>110?'…':''}
                          </p>

                          {/* Action buttons */}
                          <div style={{ display:'flex', gap:8 }}>
                            <button className="btn-primary" onClick={()=>fetchCollegeDetail(college.id)}
                              style={{ flex:1, padding:'9px 14px', borderRadius:10, fontSize:13 }}>
                              View Details
                            </button>
                            <button onClick={()=>saveCollege(college.id)}
                              style={{ width:38, height:38, borderRadius:10, border:'1px solid rgba(255,255,255,0.1)', background: isSaved ? 'rgba(251,191,36,0.12)' : 'transparent', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s', color: isSaved ? '#fbbf24' : '#64748b' }}
                              title="Save college">
                              {isSaved ? '♥' : '♡'}
                            </button>
                            <button onClick={()=>toggleCompare(college.id)}
                              style={{ width:38, height:38, borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.18s',
                                background: inCompare ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : 'rgba(255,255,255,0.06)',
                                color: inCompare ? '#fff' : '#64748b',
                                boxShadow: inCompare ? '0 4px 16px rgba(37,99,235,0.4)' : 'none' }}
                              title={inCompare?'Remove from compare':'Add to compare'}>
                              {inCompare ? '✓' : '+'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages>1 && (
                  <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginTop:32 }}>
                    <button className="btn-outline" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                      style={{ padding:'9px 20px', borderRadius:10, fontSize:13, opacity:page===1?0.4:1 }}>
                      ← Prev
                    </button>
                    <span style={{ fontSize:13, color:'#64748b', padding:'0 8px' }}>Page {page} of {totalPages}</span>
                    <button className="btn-outline" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                      style={{ padding:'9px 20px', borderRadius:10, fontSize:13, opacity:page===totalPages?0.4:1 }}>
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ COMPARE TAB ═════════════════════════════════════════ */}
        {activeTab==='compare' && (
          <div className="fade-up">
            <h2 style={{ margin:'0 0 4px', fontSize:26, fontWeight:800, letterSpacing:'-0.03em' }}>Compare colleges</h2>
            <p style={{ margin:'0 0 24px', fontSize:14, color:'#64748b' }}>Select 2–3 colleges using + on the Colleges tab, then compare here.</p>

            <div className="glass" style={{ borderRadius:16, padding:'20px 24px', marginBottom:20 }}>
              <p style={{ margin:'0 0 6px', fontSize:14, color:'#94a3b8' }}>
                {compareIds.length===0 ? 'No colleges selected yet.' : `${compareIds.length} college${compareIds.length>1?'s':''} selected and ready.`}
              </p>
              <div style={{ display:'flex', gap:10, marginTop:14 }}>
                <button className="btn-primary" onClick={fetchCompare} style={{ padding:'10px 28px', borderRadius:10, fontSize:14 }}>
                  Compare now
                </button>
                {compareIds.length>0 && (
                  <button className="btn-outline" onClick={()=>{setCompareIds([]);setCompareData([])}}
                    style={{ padding:'10px 20px', borderRadius:10, fontSize:14, color:'#f87171', borderColor:'rgba(248,113,113,0.3)' }}>
                    Clear selection
                  </button>
                )}
              </div>
            </div>

            {compareData.length>0 && (
              <div className="glass" style={{ borderRadius:16, overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding:'14px 20px', textAlign:'left', color:'#64748b', fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em', width:140 }}>Feature</th>
                        {compareData.map((c:any)=>(
                          <th key={c.id} style={{ padding:'14px 20px', textAlign:'left', fontSize:13, fontWeight:800, color:'#f0f4ff' }}>{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label:'Location',          render:(c:any)=>`${c.location}, ${c.state}` },
                        { label:'Rating',             render:(c:any)=>`★ ${c.rating}` },
                        { label:'Annual Fees',        render:(c:any)=>`₹${c.fees?.toLocaleString()}` },
                        { label:'Avg Package (2024)', render:(c:any)=>c.placements?.[0]?fmt(c.placements[0].avgPackage):'—' },
                        { label:'Highest Package',    render:(c:any)=>c.placements?.[0]?fmt(c.placements[0].highestPackage):'—' },
                        { label:'Placement Rate',     render:(c:any)=>c.placements?.[0]?`${c.placements[0].placementRate}%`:'—' },
                        { label:'Courses',            render:(c:any)=>`${c.courses?.length||0}` },
                      ].map((row,ri)=>(
                        <tr key={row.label} className="tbl-row" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ padding:'13px 20px', color:'#64748b', fontSize:13 }}>{row.label}</td>
                          {compareData.map((c:any)=>(
                            <td key={c.id} style={{ padding:'13px 20px', color:'#f0f4ff', fontSize:13, fontWeight:600 }}>{row.render(c)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {compareIds.length===0 && compareData.length===0 && (
              <div style={{ textAlign:'center', padding:'80px 0', color:'#64748b' }}>
                <div style={{ fontSize:48, marginBottom:16, opacity:0.3 }}>⇄</div>
                <p style={{ fontSize:15, margin:0 }}>No colleges selected.</p>
                <p style={{ fontSize:13, margin:'6px 0 0', color:'#475569' }}>Go to Colleges and hit + on any card.</p>
              </div>
            )}
          </div>
        )}

        {/* ══ PREDICTOR TAB ═══════════════════════════════════════ */}
        {activeTab==='predictor' && (
          <div className="fade-up">
            <h2 style={{ margin:'0 0 4px', fontSize:26, fontWeight:800, letterSpacing:'-0.03em' }}>Rank predictor</h2>
            <p style={{ margin:'0 0 24px', fontSize:14, color:'#64748b' }}>Enter your exam rank to see which colleges you can get into.</p>

            <div className="glass" style={{ borderRadius:16, padding:'24px', marginBottom:24 }}>
              <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-end' }}>
                <div style={{ flex:1, minWidth:160 }}>
                  <p style={{ margin:'0 0 8px', fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>Exam</p>
                  <select value={predictorExam} onChange={e=>setPredictorExam(e.target.value)}
                    className="input-premium" style={{ cursor:'pointer' }}>
                    <option>JEE Advanced</option>
                    <option>JEE Mains</option>
                    <option>BITSAT</option>
                    <option>WBJEE</option>
                  </select>
                </div>
                <div style={{ flex:1, minWidth:140 }}>
                  <p style={{ margin:'0 0 8px', fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>Your Rank</p>
                  <input className="input-premium" placeholder="e.g. 500" type="number" value={predictorRank}
                    onChange={e=>setPredictorRank(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&fetchPredictor()} />
                </div>
                <div style={{ flex:1, minWidth:140 }}>
                  <p style={{ margin:'0 0 8px', fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>Category</p>
                  <select value={predictorCategory} onChange={e=>setPredictorCategory(e.target.value)}
                    className="input-premium" style={{ cursor:'pointer' }}>
                    <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
                  </select>
                </div>
                <button className="btn-primary" onClick={fetchPredictor}
                  style={{ padding:'12px 28px', borderRadius:12, fontSize:14, flexShrink:0 }}>
                  {predictorLoading ? 'Searching…' : 'Predict colleges'}
                </button>
              </div>
            </div>

            {/* Summary cards */}
            {predictorSummary && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:24 }}>
                {[
                  { label:'Safe colleges',    count:predictorSummary.safeColleges,     color:'#34d399', bg:'rgba(52,211,153,0.08)',  border:'rgba(52,211,153,0.2)'  },
                  { label:'Moderate',         count:predictorSummary.moderateColleges,  color:'#fbbf24', bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.2)'  },
                  { label:'Total eligible',   count:predictorSummary.totalEligible,     color:'#60a5fa', bg:'rgba(96,165,250,0.08)',  border:'rgba(96,165,250,0.2)'  },
                ].map(s=>(
                  <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:14, padding:'18px 20px' }}>
                    <p style={{ margin:'0 0 4px', fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
                    <p style={{ margin:0, fontSize:28, fontWeight:900, color:s.color }}>{s.count}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Results */}
            {predictorLoading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {Array.from({length:4}).map((_,i)=>(
                  <div key={i} className="skeleton" style={{ height:76, borderRadius:14 }} />
                ))}
              </div>
            ) : predictorResults.length>0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {predictorResults.map((r,i)=>{
                  const cc = CHANCE[r.admissionChance as keyof typeof CHANCE]
                  return (
                    <div key={i} className="glass card-lift" style={{ borderRadius:14, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                      <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                          <h4 style={{ margin:0, color:'#f0f4ff', fontSize:14, fontWeight:700 }}>{r.college.name}</h4>
                          <span style={{ padding:'2px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:cc.bg, color:cc.color, border:`1px solid ${cc.border}` }}>
                            {r.admissionChance}
                          </span>
                        </div>
                        <p style={{ margin:0, fontSize:12.5, color:'#64748b' }}>
                          📍 {r.college.location} · ★ {r.college.rating}
                          {r.latestPlacement && <span style={{ color:'#34d399' }}> · Avg: {fmt(r.latestPlacement.avgPackage)}</span>}
                        </p>
                      </div>
                      <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ margin:'0 0 2px', fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>Cutoff range</p>
                          <p style={{ margin:0, color:'#60a5fa', fontWeight:700, fontSize:13 }}>{r.cutoff.openingRank.toLocaleString()} – {r.cutoff.closingRank.toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <p style={{ margin:'0 0 2px', fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>Safety margin</p>
                          <p style={{ margin:0, color:'#34d399', fontWeight:700, fontSize:13 }}>+{r.safetyMargin.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : predictorRank && !predictorLoading ? (
              <div style={{ textAlign:'center', padding:'80px 0', color:'#64748b' }}>
                <div style={{ fontSize:48, marginBottom:16, opacity:0.3 }}>◎</div>
                <p style={{ fontSize:15, margin:0 }}>No colleges found for rank {predictorRank}.</p>
                <p style={{ fontSize:13, margin:'6px 0 0', color:'#475569' }}>Try {predictorExam} with a higher rank or different category.</p>
              </div>
            ) : null}
          </div>
        )}

        {/* ══ ACCOUNT TAB ═════════════════════════════════════════ */}
        {activeTab==='account' && (
          <div className="fade-up">
            <h2 style={{ margin:'0 0 24px', fontSize:26, fontWeight:800, letterSpacing:'-0.03em' }}>Your account</h2>

            {/* Profile card */}
            <div className="glass" style={{ borderRadius:18, padding:'24px', marginBottom:28, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#2563eb,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, color:'#fff', boxShadow:'0 6px 24px rgba(37,99,235,0.4)', flexShrink:0 }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin:'0 0 3px', fontWeight:800, fontSize:16, color:'#f0f4ff' }}>{currentUser.name}</p>
                  <p style={{ margin:0, fontSize:13, color:'#64748b' }}>{currentUser.email}</p>
                </div>
              </div>
              <button className="btn-outline" onClick={handleLogout}
                style={{ padding:'9px 22px', borderRadius:10, fontSize:13 }}>
                Log out
              </button>
            </div>

            {/* Saved colleges */}
            <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'#f0f4ff' }}>Saved colleges</h3>
              <span style={{ background:'rgba(96,165,250,0.12)', color:'#60a5fa', border:'1px solid rgba(96,165,250,0.3)', borderRadius:999, padding:'2px 10px', fontSize:12, fontWeight:700 }}>{savedColleges.length}</span>
            </div>

            {savedColleges.length===0 ? (
              <div style={{ textAlign:'center', padding:'70px 0', color:'#64748b' }}>
                <div style={{ fontSize:40, marginBottom:14, opacity:0.3 }}>♡</div>
                <p style={{ fontSize:15, margin:0 }}>Nothing saved yet.</p>
                <p style={{ fontSize:13, margin:'6px 0 0', color:'#475569' }}>Hit the heart icon on any college card.</p>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:14 }}>
                {savedColleges.map(c=>(
                  <div key={c.id} className="glass card-lift" style={{ borderRadius:16, padding:'18px 20px' }}>
                    <h4 style={{ margin:'0 0 7px', fontSize:14, fontWeight:800, color:'#f0f4ff', lineHeight:1.3 }}>{c.name}</h4>
                    <p style={{ margin:'0 0 4px', fontSize:12.5, color:'#64748b' }}>📍 {c.location} · ★ {c.rating}</p>
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color:'#60a5fa' }}>₹{c.fees?.toLocaleString()}/yr</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DETAIL MODAL ─────────────────────────────────────────── */}
      {(selectedCollege || detailLoading) && (
        <div style={{ position:'fixed', inset:0, background:'rgba(6,9,15,0.88)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}
          onClick={()=>setSelectedCollege(null)}>
          <div className="glass" style={{ maxWidth:640, width:'100%', maxHeight:'88vh', overflowY:'auto', borderRadius:22, padding:'32px', boxShadow:'0 32px 80px rgba(0,0,0,0.7)' }}
            onClick={e=>e.stopPropagation()}>
            {detailLoading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'20px 0' }}>
                <div className="skeleton" style={{ height:28, width:'70%' }} />
                <div className="skeleton" style={{ height:14, width:'40%' }} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {Array.from({length:6}).map((_,i)=><div key={i} className="skeleton" style={{ height:60 }} />)}
                </div>
              </div>
            ) : selectedCollege && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, gap:14 }}>
                  <div>
                    <h2 style={{ margin:'0 0 5px', fontSize:19, fontWeight:800, color:'#f0f4ff', lineHeight:1.3 }}>{selectedCollege.name}</h2>
                    <p style={{ margin:0, fontSize:13, color:'#64748b' }}>📍 {selectedCollege.location}, {selectedCollege.state}</p>
                  </div>
                  <button onClick={()=>setSelectedCollege(null)}
                    style={{ width:32, height:32, borderRadius:8, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.06)', color:'#64748b', cursor:'pointer', fontSize:14, flexShrink:0 }}>
                    ✕
                  </button>
                </div>

                {/* Stat grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:20 }}>
                  {[
                    { label:'Rating',         value:`★ ${selectedCollege.rating}`,              color:'#fbbf24' },
                    { label:'Annual Fees',     value:`₹${selectedCollege.fees?.toLocaleString()}`, color:'#60a5fa' },
                    { label:'Courses',         value:`${selectedCollege.courses?.length||0}`,     color:'#a78bfa' },
                    { label:'Reviews',         value:`${selectedCollege._count?.reviews||0}`,     color:'#34d399' },
                    { label:'Students Saved',  value:`${selectedCollege._count?.savedBy||0}`,    color:'#22d3ee' },
                  ].map(item=>(
                    <div key={item.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'12px 14px' }}>
                      <p style={{ margin:'0 0 4px', fontSize:10, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>{item.label}</p>
                      <p style={{ margin:0, fontWeight:800, fontSize:16, color:item.color }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <p style={{ color:'#94a3b8', fontSize:13.5, lineHeight:1.7, marginBottom:20 }}>{selectedCollege.description}</p>

                {/* Placements */}
                {selectedCollege.placements?.length>0 && (
                  <div style={{ marginBottom:20 }}>
                    <p style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700, marginBottom:10 }}>Placement history</p>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      {selectedCollege.placements.map(p=>(
                        <div key={p.id} style={{ flex:1, minWidth:150, background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:12, padding:'12px 14px' }}>
                          <p style={{ margin:'0 0 8px', fontSize:12, color:'#64748b', fontWeight:700 }}>{p.year}</p>
                          <p style={{ margin:'0 0 3px', fontSize:13, color:'#34d399', fontWeight:800 }}>Avg: {fmt(p.avgPackage)}</p>
                          <p style={{ margin:'0 0 3px', fontSize:12.5, color:'#60a5fa' }}>High: {fmt(p.highestPackage)}</p>
                          <p style={{ margin:0, fontSize:12.5, color:'#94a3b8' }}>{p.placementRate}% placed</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courses */}
                {selectedCollege.courses?.length>0 && (
                  <div style={{ marginBottom:20 }}>
                    <p style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700, marginBottom:10 }}>Courses offered</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {selectedCollege.courses.map(c=>(
                        <div key={c.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', fontSize:13 }}>
                          <span style={{ color:'#f0f4ff', fontWeight:600 }}>{c.name}</span>
                          <span style={{ color:'#64748b' }}>{c.duration} · {c.seats} seats</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cutoffs */}
                {selectedCollege.cutoffs?.length>0 && (
                  <div>
                    <p style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:700, marginBottom:10 }}>Cutoff ranks</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                      {selectedCollege.cutoffs.map((c:Cutoff)=>(
                        <div key={c.id} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', fontSize:13 }}>
                          <span style={{ color:'#94a3b8' }}>{c.exam} — {c.category}</span>
                          <span style={{ color:'#60a5fa', fontWeight:700 }}>{c.openingRank.toLocaleString()} – {c.closingRank.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}