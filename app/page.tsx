'use client'

import { useState, useEffect, useCallback } from 'react'

interface Placement {
  id: number
  year: number
  avgPackage: number
  highestPackage: number
  placementRate: number
}

interface College {
  id: number
  name: string
  location: string
  state: string
  fees: number
  rating: number
  description: string
  placements?: Placement[]
  _count?: { reviews: number }
}

interface Cutoff {
  id: number
  exam: string
  category: string
  openingRank: number
  closingRank: number
}

interface Course {
  id: number
  name: string
  duration: string
  seats: number
  fees: number
}

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

interface PredictorSummary {
  safeColleges: number
  moderateColleges: number
  totalEligible: number
}

interface CurrentUser {
  id: number
  name: string
  email: string
}

type CompareKey = 'location' | 'state' | 'fees' | 'rating'

const C = {
  bg:         '#070d1a',
  surface:    '#0d1528',
  surfaceHi:  '#121e36',
  border:     '#1a2d4a',
  borderHi:   '#2a4a72',
  text:       '#e2e8f0',
  textMuted:  '#64748b',
  textDim:    '#1e2d44',
  accent:     '#60a5fa',
  accentDim:  '#93c5fd',
  accentGlow: 'rgba(96,165,250,0.10)',
  danger:     '#f87171',
  success:    '#4ade80',
  warning:    '#fbbf24',
}

const CHANCE_COLORS = {
  Safe:       { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', border: 'rgba(74,222,128,0.25)' },
  Moderate:   { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  Borderline: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.25)' },
}

export default function Home() {
  const [colleges, setColleges] = useState<College[]>([])
  const [search, setSearch] = useState('')
  const [state, setState] = useState('')
  const [maxFees, setMaxFees] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(false)
  const [selectedCollege, setSelectedCollege] = useState<CollegeDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [compareData, setCompareData] = useState<any[]>([])
  const [predictorExam, setPredictorExam] = useState('JEE Advanced')
  const [predictorRank, setPredictorRank] = useState('')
  const [predictorCategory, setPredictorCategory] = useState('General')
  const [predictorResults, setPredictorResults] = useState<PredictorResult[]>([])
  const [predictorSummary, setPredictorSummary] = useState<PredictorSummary | null>(null)
  const [predictorLoading, setPredictorLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'compare' | 'predictor' | 'account'>('list')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [authError, setAuthError] = useState('')
  const [savedColleges, setSavedColleges] = useState<College[]>([])
  const [saveMsg, setSaveMsg] = useState('')

  const API = 'https://college-discovery-sooty.vercel.app'

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
    setDetailLoading(true)
    setSelectedCollege(null)
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
    setPredictorLoading(true)
    setPredictorResults([])
    const res = await fetch(`${API}/api/predictor?exam=${encodeURIComponent(predictorExam)}&rank=${predictorRank}&category=${predictorCategory}&limit=30`)
    const data = await res.json()
    setPredictorResults(data.data || [])
    setPredictorSummary(data.summary || null)
    setPredictorLoading(false)
  }

  const handleSignup = async () => {
    setAuthError('')
    const res = await fetch(`${API}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
    })
    const data = await res.json()
    if (!res.ok) return setAuthError(data.error || 'Signup failed')
    setAuthMode('login')
    setAuthError('Account created! Please log in.')
  }

  const handleLogin = async () => {
    setAuthError('')
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: authEmail, password: authPassword })
    })
    const data = await res.json()
    if (!res.ok) return setAuthError(data.error || 'Login failed')
    const user = data.user || { id: data.id, name: data.name || data.email, email: data.email }
    setToken(data.token)
    setCurrentUser(user)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(user))
    setAuthEmail('')
    setAuthPassword('')
  }

  const handleLogout = () => {
    setToken(null)
    setCurrentUser(null)
    setSavedColleges([])
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const fetchSavedColleges = useCallback(async () => {
    if (!token) return
    const res = await fetch(`${API}/api/user/saved`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setSavedColleges(data.data || [])
  }, [token])

  const saveCollege = async (collegeId: number) => {
    if (!token) return alert('Please log in to save colleges')
    const res = await fetch(`${API}/api/colleges/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ collegeId })
    })
    if (res.ok) {
      fetchSavedColleges()
      setSaveMsg('Saved!')
      setTimeout(() => setSaveMsg(''), 2000)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (saved) setToken(saved)
    if (savedUser) { try { setCurrentUser(JSON.parse(savedUser)) } catch {} }
  }, [])

  useEffect(() => { if (token) fetchSavedColleges() }, [token, fetchSavedColleges])
  useEffect(() => { fetchColleges() }, [fetchColleges])

  const toggleCompare = (id: number) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const fmt = (n: number) => n >= 10000000
    ? `₹${(n / 10000000).toFixed(1)}Cr`
    : n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : `₹${n.toLocaleString()}`

  // ── Auth Screen ──
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse at 60% 0%, rgba(37,99,235,0.18) 0%, transparent 60%), ${C.bg}`,
        color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎓</div>
            <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>College Discovery</h1>
            <p style={{ margin: 0, color: C.textMuted, fontSize: '13px' }}>Find your perfect college</p>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '28px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 700, color: C.text }}>
              {authMode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            {authMode === 'signup' && (
              <input placeholder="Full Name" value={authName} onChange={e => setAuthName(e.target.value)}
                style={authInput({ marginBottom: '10px' })} />
            )}
            <input placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
              style={authInput({ marginBottom: '10px' })} />
            <input placeholder="Password" type="password" value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleSignup())}
              style={authInput({ marginBottom: '4px' })} />
            {authError && (
              <p style={{ color: authError.includes('created') ? C.success : C.danger, fontSize: '12px', margin: '10px 0 4px', textAlign: 'center' }}>
                {authError}
              </p>
            )}
            <button onClick={authMode === 'login' ? handleLogin : handleSignup}
              style={{ width: '100%', marginTop: '16px', padding: '13px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,99,235,0.4)' }}>
              {authMode === 'login' ? 'Log In' : 'Create Account'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '18px', marginBottom: 0, fontSize: '13px', color: C.textMuted }}>
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError('') }}
                style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }}>
                {authMode === 'login' ? 'Sign Up' : 'Log In'}
              </span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Main App ──
  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(ellipse at 70% 0%, rgba(37,99,235,0.1) 0%, transparent 55%), ${C.bg}`, color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Save toast */}
      {saveMsg && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: C.success, color: '#000', padding: '10px 18px', borderRadius: '10px', fontWeight: 700, fontSize: '13px', zIndex: 200, boxShadow: '0 4px 16px rgba(74,222,128,0.4)' }}>
          ✓ {saveMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ background: `${C.surface}e0`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: C.text }}>🎓 College Discovery Portal</h1>
        <div style={{ display: 'flex', gap: '2px', background: C.bg, padding: '3px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
          {(['list', 'compare', 'predictor', 'account'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px',
              background: activeTab === tab ? C.surfaceHi : 'transparent',
              color: activeTab === tab ? C.accent : C.textMuted,
              boxShadow: activeTab === tab ? `inset 0 0 0 1px ${C.border}` : 'none',
            }}>
              {tab === 'list' ? '🏫 Colleges' : tab === 'compare' ? '⚖️ Compare' : tab === 'predictor' ? '🎯 Predictor' : `👤 ${currentUser.name.split(' ')[0]}`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '28px 20px 64px' }}>

        {/* ── COLLEGES TAB ── */}
        {activeTab === 'list' && (
          <div>
            {/* Filters */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <input placeholder="Search colleges, cities..." value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setPage(1)} style={iStyle({ flex: 1, minWidth: '200px' })} />
                <input placeholder="State" value={state} onChange={e => setState(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setPage(1)} style={iStyle({ width: '130px' })} />
                <input placeholder="Max Fees (₹)" value={maxFees} onChange={e => setMaxFees(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setPage(1)} style={iStyle({ width: '130px' })} />
                <input placeholder="Min Rating" value={minRating} onChange={e => setMinRating(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setPage(1)} style={iStyle({ width: '110px' })} />
                <button onClick={() => { setPage(1); fetchColleges() }} style={btn({ padding: '10px 22px' })}>Search</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: C.textMuted, fontSize: '12px' }}>Sort by:</span>
                {[['rating', 'Rating'], ['fees', 'Fees'], ['name', 'Name']].map(([val, label]) => (
                  <button key={val} onClick={() => { setSortBy(val); setPage(1) }}
                    style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${sortBy === val ? C.accent : C.border}`, background: sortBy === val ? C.accentGlow : 'transparent', color: sortBy === val ? C.accent : C.textMuted, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                    {label}
                  </button>
                ))}
                <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                  style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: '12px' }}>
                  {sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
                </button>
                {(search || state || maxFees || minRating) && (
                  <button onClick={() => { setSearch(''); setState(''); setMaxFees(''); setMinRating(''); setPage(1) }}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, background: 'transparent', color: C.danger, cursor: 'pointer', fontSize: '12px' }}>
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            <p style={{ color: C.textMuted, fontSize: '13px', marginBottom: '14px' }}>
              {loading ? 'Searching…' : `${total} college${total !== 1 ? 's' : ''} found`}
              {compareIds.length > 0 && <span style={{ marginLeft: '12px', color: C.accent }}>• {compareIds.length} selected for compare</span>}
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px', color: C.textMuted }}>Loading…</div>
            ) : colleges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px', color: C.textDim }}>
                <p style={{ fontSize: '32px', margin: '0 0 10px' }}>🔍</p>
                <p style={{ margin: 0, fontSize: '14px' }}>No colleges match your filters.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
                  {colleges.map(college => {
                    const placement = college.placements?.[0]
                    return (
                      <div key={college.id}
                        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '18px', transition: 'border-color 0.15s, box-shadow 0.15s', display: 'flex', flexDirection: 'column' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.12)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{college.name}</h3>
                          <span style={{ background: C.accentGlow, color: C.accentDim, padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', border: `1px solid ${C.border}`, flexShrink: 0 }}>⭐ {college.rating}</span>
                        </div>
                        <p style={{ margin: '0 0 2px', color: C.textMuted, fontSize: '12.5px' }}>📍 {college.location}, {college.state}</p>
                        <p style={{ margin: '0 0 10px', color: C.accent, fontSize: '13px', fontWeight: 600 }}>₹{college.fees.toLocaleString()}/yr</p>

                        {/* Placement strip */}
                        {placement && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ flex: 1, background: C.bg, borderRadius: '7px', padding: '7px 10px', border: `1px solid ${C.border}` }}>
                              <p style={{ margin: '0 0 1px', fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Package</p>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: C.success }}>{fmt(placement.avgPackage)}</p>
                            </div>
                            <div style={{ flex: 1, background: C.bg, borderRadius: '7px', padding: '7px 10px', border: `1px solid ${C.border}` }}>
                              <p style={{ margin: '0 0 1px', fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Placed</p>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: C.text }}>{placement.placementRate}%</p>
                            </div>
                          </div>
                        )}

                        <p style={{ margin: '0 0 14px', color: C.textMuted, fontSize: '12px', lineHeight: 1.55, flex: 1 }}>
                          {college.description?.slice(0, 100)}{(college.description?.length || 0) > 100 ? '…' : ''}
                        </p>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => fetchCollegeDetail(college.id)}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                            View Details
                          </button>
                          <button onClick={() => saveCollege(college.id)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: '12px' }} title="Save">
                            💾
                          </button>
                          <button onClick={() => toggleCompare(college.id)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                              background: compareIds.includes(college.id) ? C.accent : C.surfaceHi,
                              color: compareIds.includes(college.id) ? '#fff' : C.textMuted }}>
                            {compareIds.includes(college.id) ? '✓' : '+'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: page === 1 ? C.textDim : C.text, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                      ← Prev
                    </button>
                    <span style={{ color: C.textMuted, fontSize: '13px' }}>Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: page === totalPages ? C.textDim : C.text, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Detail Modal */}
            {(selectedCollege || detailLoading) && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,20,0.88)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
                onClick={() => { setSelectedCollege(null) }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
                  onClick={e => e.stopPropagation()}>
                  {detailLoading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: C.textMuted }}>Loading…</div>
                  ) : selectedCollege && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0, color: C.text, fontSize: '17px', fontWeight: 700, lineHeight: 1.3 }}>{selectedCollege.name}</h2>
                        <button onClick={() => setSelectedCollege(null)} style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer', width: '28px', height: '28px', borderRadius: '6px', fontSize: '14px', flexShrink: 0 }}>✕</button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                        {[
                          { label: 'Location', value: `${selectedCollege.location}, ${selectedCollege.state}` },
                          { label: 'Rating', value: `⭐ ${selectedCollege.rating}` },
                          { label: 'Annual Fees', value: `₹${selectedCollege.fees?.toLocaleString()}` },
                          { label: 'Courses Offered', value: `${selectedCollege.courses?.length || 0}` },
                          { label: 'Reviews', value: `${selectedCollege._count?.reviews || 0}` },
                          { label: 'Students Saved', value: `${selectedCollege._count?.savedBy || 0}` },
                        ].map(item => (
                          <div key={item.label} style={{ background: C.bg, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                            <p style={{ margin: '0 0 3px', fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                            <p style={{ margin: 0, fontWeight: 600, color: C.text, fontSize: '13px' }}>{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <p style={{ color: C.textMuted, fontSize: '13px', lineHeight: 1.65, marginBottom: '16px' }}>{selectedCollege.description}</p>

                      {/* Placements */}
                      {selectedCollege.placements?.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Placement History</p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {selectedCollege.placements.map(p => (
                              <div key={p.id} style={{ flex: 1, minWidth: '140px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 12px' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '11px', color: C.textMuted, fontWeight: 600 }}>{p.year}</p>
                                <p style={{ margin: '0 0 2px', fontSize: '12px', color: C.success, fontWeight: 700 }}>Avg: {fmt(p.avgPackage)}</p>
                                <p style={{ margin: '0 0 2px', fontSize: '12px', color: C.accentDim }}>Highest: {fmt(p.highestPackage)}</p>
                                <p style={{ margin: 0, fontSize: '12px', color: C.textMuted }}>Placed: {p.placementRate}%</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Courses */}
                      {selectedCollege.courses?.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Courses</p>
                          {selectedCollege.courses.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '7px', marginBottom: '5px', fontSize: '12.5px', border: `1px solid ${C.border}` }}>
                              <span style={{ color: C.text }}>{c.name}</span>
                              <span style={{ color: C.textMuted }}>{c.duration} • {c.seats} seats</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Cutoffs */}
                      {selectedCollege.cutoffs?.length > 0 && (
                        <div>
                          <p style={{ fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Cutoff Ranks</p>
                          {selectedCollege.cutoffs.map((c: Cutoff) => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: C.bg, borderRadius: '7px', marginBottom: '5px', fontSize: '12.5px', border: `1px solid ${C.border}` }}>
                              <span style={{ color: C.textMuted }}>{c.exam} — {c.category}</span>
                              <span style={{ color: C.accent, fontWeight: 600 }}>{c.openingRank.toLocaleString()} – {c.closingRank.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COMPARE TAB ── */}
        {activeTab === 'compare' && (
          <div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px', color: C.textMuted, fontSize: '13.5px' }}>Select 2–3 colleges from the Colleges tab using the <strong style={{ color: C.text }}>+</strong> button, then compare here.</p>
              <p style={{ margin: '0 0 14px', color: C.accent, fontSize: '13px' }}>Selected: {compareIds.length > 0 ? `${compareIds.length} colleges` : 'None'}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={fetchCompare} style={btn({ padding: '10px 24px' })}>Compare Now</button>
                {compareIds.length > 0 && (
                  <button onClick={() => { setCompareIds([]); setCompareData([]) }}
                    style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.danger, cursor: 'pointer', fontSize: '13px' }}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {compareData.length > 0 ? (
              <div style={{ overflowX: 'auto', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '13px 16px', textAlign: 'left', color: C.textMuted, fontSize: '11px', borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase', letterSpacing: '0.04em', width: '140px' }}>Feature</th>
                      {compareData.map((c: any) => (
                        <th key={c.id} style={{ padding: '13px 16px', textAlign: 'left', color: C.accent, fontSize: '13px', borderBottom: `1px solid ${C.border}`, fontWeight: 700 }}>{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Location', render: (c: any) => `${c.location}, ${c.state}` },
                      { label: 'Rating', render: (c: any) => `⭐ ${c.rating}` },
                      { label: 'Annual Fees', render: (c: any) => `₹${c.fees?.toLocaleString()}` },
                      { label: 'Avg Package (2024)', render: (c: any) => c.placements?.[0] ? fmt(c.placements[0].avgPackage) : '—' },
                      { label: 'Highest Package', render: (c: any) => c.placements?.[0] ? fmt(c.placements[0].highestPackage) : '—' },
                      { label: 'Placement Rate', render: (c: any) => c.placements?.[0] ? `${c.placements[0].placementRate}%` : '—' },
                      { label: 'Courses', render: (c: any) => `${c.courses?.length || 0}` },
                    ].map(row => (
                      <tr key={row.label}>
                        <td style={{ padding: '12px 16px', color: C.textMuted, fontSize: '12.5px', borderBottom: `1px solid ${C.border}` }}>{row.label}</td>
                        {compareData.map((c: any) => (
                          <td key={c.id} style={{ padding: '12px 16px', color: C.text, fontSize: '13px', borderBottom: `1px solid ${C.border}`, fontWeight: 500 }}>
                            {row.render(c)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: C.textDim }}>
                <p style={{ fontSize: '32px', margin: '0 0 10px' }}>⚖️</p>
                <p style={{ margin: 0, fontSize: '14px' }}>Pick colleges to compare and they'll appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* ── PREDICTOR TAB ── */}
        {activeTab === 'predictor' && (
          <div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 4px', color: C.text, fontSize: '17px', fontWeight: 700 }}>🎯 College Predictor</h2>
              <p style={{ margin: '0 0 18px', color: C.textMuted, fontSize: '13px' }}>Enter your exam and rank to see which colleges you can get into.</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exam</p>
                  <select value={predictorExam} onChange={e => setPredictorExam(e.target.value)} style={iStyle({})}>
                    <option>JEE Advanced</option>
                    <option>JEE Mains</option>
                    <option>BITSAT</option>
                    <option>WBJEE</option>
                  </select>
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Rank</p>
                  <input placeholder="e.g. 500" value={predictorRank} onChange={e => setPredictorRank(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchPredictor()}
                    type="number" style={iStyle({ width: '130px' })} />
                </div>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</p>
                  <select value={predictorCategory} onChange={e => setPredictorCategory(e.target.value)} style={iStyle({})}>
                    <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
                  </select>
                </div>
                <button onClick={fetchPredictor} style={btn({ padding: '10px 24px', alignSelf: 'flex-end' })}>
                  {predictorLoading ? 'Searching…' : 'Predict'}
                </button>
              </div>
            </div>

            {/* Summary */}
            {predictorSummary && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Safe', count: predictorSummary.safeColleges, color: C.success },
                  { label: 'Moderate', count: predictorSummary.moderateColleges, color: C.warning },
                  { label: 'Total Eligible', count: predictorSummary.totalEligible, color: C.accent },
                ].map(s => (
                  <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px 18px', flex: 1, minWidth: '100px' }}>
                    <p style={{ margin: '0 0 3px', fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: s.color }}>{s.count}</p>
                  </div>
                ))}
              </div>
            )}

            {predictorLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: C.textMuted }}>Searching colleges for rank {predictorRank}…</div>
            ) : predictorResults.length > 0 ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                {predictorResults.map((r, i) => {
                  const chance = r.admissionChance as keyof typeof CHANCE_COLORS
                  const cc = CHANCE_COLORS[chance]
                  return (
                    <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h4 style={{ margin: 0, color: C.text, fontSize: '14px', fontWeight: 700 }}>{r.college.name}</h4>
                          <span style={{ padding: '2px 8px', borderRadius: '5px', fontSize: '11px', fontWeight: 700, background: cc.bg, color: cc.color, border: `1px solid ${cc.border}` }}>
                            {chance}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: C.textMuted, fontSize: '12.5px' }}>
                          📍 {r.college.location} • ⭐ {r.college.rating}
                          {r.latestPlacement && <span style={{ color: C.success }}> • Avg: {fmt(r.latestPlacement.avgPackage)}</span>}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0 0 1px', fontSize: '10px', color: C.textMuted, textTransform: 'uppercase' }}>Cutoff Range</p>
                          <p style={{ margin: 0, color: C.accent, fontWeight: 700, fontSize: '13px' }}>
                            {r.cutoff.openingRank.toLocaleString()} – {r.cutoff.closingRank.toLocaleString()}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: '0 0 1px', fontSize: '10px', color: C.textMuted, textTransform: 'uppercase' }}>Safety Margin</p>
                          <p style={{ margin: 0, color: C.success, fontWeight: 700, fontSize: '13px' }}>+{r.safetyMargin.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : predictorRank && !predictorLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: C.textDim }}>
                <p style={{ fontSize: '32px', margin: '0 0 10px' }}>😔</p>
                <p style={{ margin: 0, fontSize: '14px' }}>No colleges found for rank {predictorRank} in {predictorExam} ({predictorCategory}). Try a higher rank or different category.</p>
              </div>
            ) : null}
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {activeTab === 'account' && (
          <div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', border: `1px solid ${C.borderHi}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, color: C.text, fontSize: '15px' }}>{currentUser.name}</p>
                  <p style={{ margin: 0, color: C.textMuted, fontSize: '12px' }}>{currentUser.email}</p>
                </div>
              </div>
              <button onClick={handleLogout} style={{ padding: '8px 18px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: '13px' }}>
                Log out
              </button>
            </div>

            <p style={{ fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Saved Colleges — {savedColleges.length}
            </p>
            {savedColleges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: C.textDim }}>
                <p style={{ fontSize: '32px', margin: '0 0 10px' }}>🔖</p>
                <p style={{ margin: 0, fontSize: '14px' }}>No saved colleges yet. Hit 💾 on any college card.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {savedColleges.map(c => (
                  <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px' }}>
                    <h4 style={{ margin: '0 0 5px', color: C.text, fontSize: '14px', fontWeight: 700 }}>{c.name}</h4>
                    <p style={{ margin: '0 0 3px', color: C.textMuted, fontSize: '12.5px' }}>📍 {c.location} • ⭐ {c.rating}</p>
                    <p style={{ margin: 0, color: C.accent, fontSize: '12.5px' }}>₹{c.fees?.toLocaleString()}/yr</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function authInput(extra: React.CSSProperties): React.CSSProperties {
  return { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #1a2d4a', background: '#070d1a', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box', ...extra }
}

function iStyle(extra: React.CSSProperties): React.CSSProperties {
  return { padding: '10px 13px', borderRadius: '8px', border: '1px solid #1a2d4a', background: '#070d1a', color: '#e2e8f0', fontSize: '14px', outline: 'none', ...extra }
}

function btn(extra: React.CSSProperties): React.CSSProperties {
  return { borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 8px rgba(37,99,235,0.3)', ...extra }
}