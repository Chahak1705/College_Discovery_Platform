'use client'

import { useState, useEffect, useCallback } from 'react'

interface College {
  id: number
  name: string
  location: string
  state: string
  fees: number
  rating: number
  description: string
}

interface Cutoff {
  id: number
  exam: string
  category: string
  openingRank: number
  closingRank: number
}

interface CollegeDetail extends College {
  courses: { id: number; name: string }[]
  placements: { id: number; year: number; avgPackage: number }[]
  reviews: { id: number; rating: number; comment: string }[]
  cutoffs: Cutoff[]
}

interface PredictorResult {
  college: College
  openingRank: number
  closingRank: number
}

interface CurrentUser {
  id: number
  name: string
  email: string
}

type CompareKey = 'location' | 'state' | 'fees' | 'rating'

// ── Design tokens — navy/blue palette like the inspo ──
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
}

export default function Home() {
  const [colleges, setColleges] = useState<College[]>([])
  const [search, setSearch] = useState('')
  const [state, setState] = useState('')
  const [maxFees, setMaxFees] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCollege, setSelectedCollege] = useState<CollegeDetail | null>(null)
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [compareData, setCompareData] = useState<College[]>([])
  const [predictorExam, setPredictorExam] = useState('JEE')
  const [predictorRank, setPredictorRank] = useState('')
  const [predictorCategory, setPredictorCategory] = useState('General')
  const [predictorResults, setPredictorResults] = useState<PredictorResult[]>([])
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

  const API = 'https://college-discovery-sooty.vercel.app'

  const fetchColleges = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (state) params.append('state', state)
    if (maxFees) params.append('maxFees', maxFees)
    params.append('page', String(page))
    params.append('limit', '10')
    const res = await fetch(`${API}/api/colleges?${params}`)
    const data = await res.json()
    setColleges(data.data || [])
    setTotal(data.total || 0)
    setTotalPages(data.totalPages || 1)
    setLoading(false)
  }, [search, state, maxFees, page])

  const fetchCollegeDetail = async (id: number) => {
    const res = await fetch(`${API}/api/colleges/${id}`)
    const data = await res.json()
    setSelectedCollege(data)
  }

  const fetchCompare = async () => {
    if (compareIds.length < 2) return alert('Select at least 2 colleges to compare')
    const res = await fetch(`${API}/api/colleges/compare?ids=${compareIds.join(',')}`)
    const data = await res.json()
    setCompareData(data.colleges || [])
  }

  const fetchPredictor = async () => {
    if (!predictorRank) return alert('Enter your rank')
    const res = await fetch(`${API}/api/predictor?exam=${predictorExam}&rank=${predictorRank}&category=${predictorCategory}`)
    const data = await res.json()
    setPredictorResults(data.data || [])
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
    if (res.ok) fetchSavedColleges()
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

  const compareRows: { label: string; key: CompareKey; format?: (v: number) => string }[] = [
    { label: 'Location', key: 'location' },
    { label: 'State', key: 'state' },
    { label: 'Annual Fees', key: 'fees', format: (v) => `₹${v?.toLocaleString()}` },
    { label: 'Rating', key: 'rating', format: (v) => `⭐ ${v}` },
  ]

  // ── NOT LOGGED IN → full-screen auth ──
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse at 60% 0%, rgba(37,99,235,0.18) 0%, transparent 60%), ${C.bg}`,
        color: C.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎓</div>
            <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>College Discovery</h1>
            <p style={{ margin: 0, color: C.textMuted, fontSize: '13px' }}>Find your perfect college</p>
          </div>

          <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(96,165,250,0.04)',
          }}>
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

            <button
              onClick={authMode === 'login' ? handleLogin : handleSignup}
              style={{
                width: '100%', marginTop: '16px', padding: '13px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
              }}
            >
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

  // ── LOGGED IN → main app ──
  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at 70% 0%, rgba(37,99,235,0.1) 0%, transparent 55%), ${C.bg}`,
      color: C.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Header */}
      <div style={{
        background: `${C.surface}e0`,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: C.text }}> College Discovery Portal</h1>
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
            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px' }}>
              <input placeholder="Search colleges..." value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setPage(1)} style={iStyle({ flex: 1, minWidth: '200px' })} />
              <input placeholder="State" value={state} onChange={e => setState(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setPage(1)} style={iStyle({ width: '150px' })} />
              <input placeholder="Max Fees (₹)" value={maxFees} onChange={e => setMaxFees(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setPage(1)} style={iStyle({ width: '140px' })} />
              <button onClick={() => setPage(1)} style={btn({ padding: '10px 22px' })}>Search</button>
            </div>

            <p style={{ color: C.textMuted, fontSize: '13px', marginBottom: '14px' }}>
              {loading ? 'Searching…' : `${total} college${total !== 1 ? 's' : ''} found`}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                  {colleges.map(college => (
                    <div key={college.id}
                      style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '18px', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.boxShadow = '0 4px 24px rgba(37,99,235,0.12)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{college.name}</h3>
                        <span style={{ background: C.accentGlow, color: C.accentDim, padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', border: `1px solid ${C.border}` }}>⭐ {college.rating}</span>
                      </div>
                      <p style={{ margin: '0 0 4px', color: C.textMuted, fontSize: '13px' }}>📍 {college.location}, {college.state}</p>
                      <p style={{ margin: '0 0 12px', color: C.accent, fontSize: '13px', fontWeight: 600 }}>₹{college.fees.toLocaleString()}/yr</p>
                      <p style={{ margin: '0 0 16px', color: C.textMuted, fontSize: '12.5px', lineHeight: 1.55 }}>{college.description}</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => fetchCollegeDetail(college.id)}
                          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          View Details
                        </button>
                        <button onClick={() => saveCollege(college.id)}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, background: 'transparent', color: C.textMuted, cursor: 'pointer', fontSize: '12px' }}>
                          💾
                        </button>
                        <button onClick={() => toggleCompare(college.id)}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                            background: compareIds.includes(college.id) ? C.accent : C.surfaceHi,
                            color: compareIds.includes(college.id) ? '#fff' : C.textMuted }}>
                          {compareIds.includes(college.id) ? '✓' : '+'}
                        </button>
                      </div>
                    </div>
                  ))}
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
            {selectedCollege && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,20,0.88)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
                onClick={() => setSelectedCollege(null)}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', maxWidth: '560px', width: '100%', maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: C.text, fontSize: '18px', fontWeight: 700 }}>{selectedCollege.name}</h2>
                    <button onClick={() => setSelectedCollege(null)} style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, color: C.textMuted, cursor: 'pointer', width: '28px', height: '28px', borderRadius: '6px', fontSize: '14px' }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                    {[
                      { label: 'Location', value: `${selectedCollege.location}, ${selectedCollege.state}` },
                      { label: 'Rating', value: `⭐ ${selectedCollege.rating}` },
                      { label: 'Annual Fees', value: `₹${selectedCollege.fees?.toLocaleString()}` },
                      { label: 'Courses', value: `${selectedCollege.courses?.length || 0} offered` },
                    ].map(item => (
                      <div key={item.label} style={{ background: C.bg, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
                        <p style={{ margin: '0 0 3px', fontSize: '10px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                        <p style={{ margin: 0, fontWeight: 600, color: C.text, fontSize: '13px' }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ color: C.textMuted, fontSize: '13.5px', lineHeight: 1.65 }}>{selectedCollege.description}</p>
                  {selectedCollege.cutoffs?.length > 0 && (
                    <div style={{ marginTop: '18px' }}>
                      <p style={{ fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Cutoff Ranks</p>
                      {selectedCollege.cutoffs.map((c: Cutoff) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: C.bg, borderRadius: '7px', marginBottom: '5px', fontSize: '13px', border: `1px solid ${C.border}` }}>
                          <span style={{ color: C.textMuted }}>{c.exam} — {c.category}</span>
                          <span style={{ color: C.accent, fontWeight: 600 }}>{c.openingRank} – {c.closingRank}</span>
                        </div>
                      ))}
                    </div>
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
              <p style={{ margin: '0 0 10px', color: C.textMuted, fontSize: '13.5px' }}>Select 2–3 colleges from the Colleges tab, then compare here.</p>
              <p style={{ margin: '0 0 14px', color: C.accent, fontSize: '13px' }}>Selected IDs: {compareIds.length > 0 ? compareIds.join(', ') : 'None'}</p>
              <button onClick={fetchCompare} style={btn({ padding: '10px 24px' })}>Compare Now</button>
            </div>
            {compareData.length > 0 ? (
              <div style={{ overflowX: 'auto', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '13px', textAlign: 'left', color: C.textMuted, fontSize: '12px', borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Feature</th>
                      {compareData.map(c => (
                        <th key={c.id} style={{ padding: '13px', textAlign: 'left', color: C.accent, fontSize: '13px', borderBottom: `1px solid ${C.border}`, fontWeight: 700 }}>{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map(row => (
                      <tr key={row.label}>
                        <td style={{ padding: '13px', color: C.textMuted, fontSize: '13px', borderBottom: `1px solid ${C.border}` }}>{row.label}</td>
                        {compareData.map(c => (
                          <td key={c.id} style={{ padding: '13px', color: C.text, fontSize: '13px', borderBottom: `1px solid ${C.border}` }}>
                            {row.format ? row.format(c[row.key] as number) : c[row.key]}
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
                <p style={{ margin: 0, fontSize: '14px' }}>Pick colleges to compare and they'll show up here.</p>
              </div>
            )}
          </div>
        )}

        {/* ── PREDICTOR TAB ── */}
        {activeTab === 'predictor' && (
          <div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 4px', color: C.text, fontSize: '17px', fontWeight: 700 }}>🎯 College Predictor</h2>
              <p style={{ margin: '0 0 18px', color: C.textMuted, fontSize: '13px' }}>Enter your exam rank to see colleges you're eligible for.</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select value={predictorExam} onChange={e => setPredictorExam(e.target.value)} style={iStyle({})}>
                  <option>JEE</option><option>NEET</option><option>CAT</option>
                </select>
                <input placeholder="Your Rank" value={predictorRank} onChange={e => setPredictorRank(e.target.value)} type="number" style={iStyle({ width: '140px' })} />
                <select value={predictorCategory} onChange={e => setPredictorCategory(e.target.value)} style={iStyle({})}>
                  <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
                </select>
                <button onClick={fetchPredictor} style={btn({ padding: '10px 24px' })}>Predict</button>
              </div>
            </div>
            {predictorResults.length > 0 ? (
              <div>
                <p style={{ color: C.textMuted, marginBottom: '14px', fontSize: '13px' }}>{predictorResults.length} colleges found</p>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {predictorResults.map((r, i) => (
                    <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 3px', color: C.text, fontSize: '14px', fontWeight: 700 }}>{r.college.name}</h4>
                        <p style={{ margin: 0, color: C.textMuted, fontSize: '12.5px' }}>📍 {r.college.location} • ⭐ {r.college.rating}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 2px', fontSize: '10px', color: C.textMuted, textTransform: 'uppercase' }}>Cutoff Range</p>
                        <p style={{ margin: 0, color: C.accent, fontWeight: 700, fontSize: '13px' }}>{r.openingRank} – {r.closingRank}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : predictorRank ? (
              <div style={{ textAlign: 'center', padding: '60px', color: C.textDim }}>
                <p style={{ margin: 0, fontSize: '14px' }}>No colleges found for this rank. Try a different rank or category.</p>
              </div>
            ) : null}
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {activeTab === 'account' && (
          <div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                  border: `1px solid ${C.borderHi}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 700, color: '#fff',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}>
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
                <p style={{ margin: 0, fontSize: '14px' }}>No saved colleges yet. Hit 💾 on any college!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {savedColleges.map(c => (
                  <div key={c.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px' }}>
                    <h4 style={{ margin: '0 0 5px', color: C.text, fontSize: '14px' }}>{c.name}</h4>
                    <p style={{ margin: 0, color: C.textMuted, fontSize: '12.5px' }}>📍 {c.location} • ⭐ {c.rating}</p>
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
  return {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid #1a2d4a', background: '#070d1a',
    color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    ...extra,
  }
}

function iStyle(extra: React.CSSProperties): React.CSSProperties {
  return {
    padding: '10px 13px', borderRadius: '8px',
    border: '1px solid #1a2d4a', background: '#070d1a',
    color: '#e2e8f0', fontSize: '14px', outline: 'none',
    ...extra,
  }
}

function btn(extra: React.CSSProperties): React.CSSProperties {
  return {
    borderRadius: '8px', border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#fff',
    fontWeight: 700, cursor: 'pointer', fontSize: '13px',
    boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
    ...extra,
  }
}