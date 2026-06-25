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

type CompareKey = 'location' | 'state' | 'fees' | 'rating'

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
  const [activeTab, setActiveTab] = useState<'list' | 'compare' | 'predictor'>('list')
  const [total, setTotal] = useState(0)

  const API = 'https://college-discovery-sooty.vercel.app'

  const fetchColleges = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (state) params.append('state', state)
    if (maxFees) params.append('maxFees', maxFees)
    const res = await fetch(`${API}/api/colleges?${params}`)
    const data = await res.json()
    setColleges(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [search, state, maxFees])

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

  useEffect(() => {
    fetchColleges()
  }, [fetchColleges])

  const toggleCompare = (id: number) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const compareRows: { label: string; key: CompareKey; format?: (v: number) => string }[] = [
    { label: 'Location', key: 'location' },
    { label: 'State', key: 'state' },
    { label: 'Annual Fees', key: 'fees', format: (v: number) => `₹${v?.toLocaleString()}` },
    { label: 'Rating', key: 'rating', format: (v: number) => `⭐ ${v}` },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0f1e 0%, #0c1322 100%)', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1528 0%, #0f1c38 100%)',
        borderBottom: '1px solid #1e3a5f',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.02em' }}>🎓 College Discovery</h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>Find, compare, and predict your perfect college</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', background: '#0a0f1e', padding: '4px', borderRadius: '12px', border: '1px solid #1e3a5f' }}>
          {(['list', 'compare', 'predictor'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '9px 18px',
                borderRadius: '9px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.15s ease',
                background: activeTab === tab ? '#2563eb' : 'transparent',
                color: activeTab === tab ? '#fff' : '#94a3b8',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(37,99,235,0.4)' : 'none',
              }}
            >
              {tab === 'list' ? '🏫 Colleges' : tab === 'compare' ? '⚖️ Compare' : '🎯 Predictor'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* COLLEGES LIST TAB */}
        {activeTab === 'list' && (
          <div>
            {/* Filters */}
            <div style={{
              display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
              background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '16px',
            }}>
              <input
                placeholder="🔍 Search colleges..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchColleges()}
                style={inputStyle({ flex: 1, minWidth: '220px' })}
              />
              <input
                placeholder="State (e.g. Delhi)"
                value={state}
                onChange={e => setState(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchColleges()}
                style={inputStyle({ width: '170px' })}
              />
              <input
                placeholder="Max Fees (₹)"
                value={maxFees}
                onChange={e => setMaxFees(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchColleges()}
                style={inputStyle({ width: '140px' })}
              />
              <button onClick={fetchColleges} style={primaryBtnStyle({ padding: '11px 26px' })}>
                Search
              </button>
            </div>

            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px', fontWeight: 500 }}>
              {loading ? 'Searching…' : `${total} college${total !== 1 ? 's' : ''} found`}
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px', color: '#64748b', fontSize: '14px' }}>Loading colleges…</div>
            ) : colleges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px', color: '#475569' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                <p style={{ margin: 0, fontSize: '14px' }}>No colleges match your filters.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
                {colleges.map(college => (
                  <div
                    key={college.id}
                    style={{
                      background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '20px',
                      transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#2563eb'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.15)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#1e3a5f'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1.3 }}>{college.name}</h3>
                      <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '3px 9px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        ⭐ {college.rating}
                      </span>
                    </div>
                    <p style={{ margin: '0 0 6px', color: '#94a3b8', fontSize: '13px' }}>📍 {college.location}, {college.state}</p>
                    <p style={{ margin: '0 0 14px', color: '#60a5fa', fontSize: '13px', fontWeight: 700 }}>💰 ₹{college.fees.toLocaleString()}/yr</p>
                    <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '12.5px', lineHeight: '1.55' }}>{college.description}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => fetchCollegeDetail(college.id)}
                        style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #2563eb', background: 'transparent', color: '#60a5fa', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 }}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => toggleCompare(college.id)}
                        style={{
                          padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12.5px', fontWeight: 700,
                          background: compareIds.includes(college.id) ? '#2563eb' : '#1e293b',
                          color: compareIds.includes(college.id) ? '#fff' : '#94a3b8',
                        }}
                      >
                        {compareIds.includes(college.id) ? '✓ Added' : '+ Compare'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* College Detail Modal */}
            {selectedCollege && (
              <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
                onClick={() => setSelectedCollege(null)}
              >
                <div
                  style={{ background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '18px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
                    <h2 style={{ margin: 0, color: '#60a5fa', fontSize: '20px', fontWeight: 800 }}>{selectedCollege.name}</h2>
                    <button onClick={() => setSelectedCollege(null)} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', width: '30px', height: '30px', borderRadius: '8px' }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
                    {[
                      { label: 'Location', value: `${selectedCollege.location}, ${selectedCollege.state}` },
                      { label: 'Rating', value: `⭐ ${selectedCollege.rating}` },
                      { label: 'Annual Fees', value: `₹${selectedCollege.fees?.toLocaleString()}` },
                      { label: 'Courses', value: `${selectedCollege.courses?.length || 0} offered` },
                    ].map(item => (
                      <div key={item.label} style={{ background: '#0a0f1e', padding: '12px 14px', borderRadius: '10px', border: '1px solid #16243f' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '10.5px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{item.label}</p>
                        <p style={{ margin: 0, fontWeight: 700, color: '#e2e8f0', fontSize: '14px' }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.65', marginBottom: '8px' }}>{selectedCollege.description}</p>
                  {selectedCollege.cutoffs?.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '14px', fontWeight: 700 }}>Cutoff Ranks</h4>
                      {selectedCollege.cutoffs.map((c: Cutoff) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0a0f1e', borderRadius: '8px', marginBottom: '6px', fontSize: '13px', border: '1px solid #16243f' }}>
                          <span style={{ color: '#cbd5e1' }}>{c.exam} — {c.category}</span>
                          <span style={{ color: '#60a5fa', fontWeight: 600 }}>{c.openingRank} - {c.closingRank}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPARE TAB */}
        {activeTab === 'compare' && (
          <div>
            <div style={{ background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '22px', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '14px' }}>Select 2–3 colleges from the Colleges tab, then compare here.</p>
              <p style={{ margin: '0 0 18px', color: '#60a5fa', fontSize: '13px', fontWeight: 600 }}>
                Selected: {compareIds.length > 0 ? compareIds.join(', ') : 'None'}
              </p>
              <button onClick={fetchCompare} style={primaryBtnStyle({ padding: '11px 28px' })}>
                Compare Now
              </button>
            </div>

            {compareData.length > 0 ? (
              <div style={{ overflowX: 'auto', background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '14px', textAlign: 'left', color: '#64748b', fontSize: '12.5px', borderBottom: '1px solid #1e3a5f', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Feature</th>
                      {compareData.map(c => (
                        <th key={c.id} style={{ padding: '14px', textAlign: 'left', color: '#60a5fa', fontSize: '14px', borderBottom: '1px solid #1e3a5f', fontWeight: 700 }}>{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map(row => (
                      <tr key={row.label}>
                        <td style={{ padding: '14px', color: '#64748b', fontSize: '13px', borderBottom: '1px solid #0a0f1e', fontWeight: 500 }}>{row.label}</td>
                        {compareData.map(c => (
                          <td key={c.id} style={{ padding: '14px', color: '#e2e8f0', fontSize: '13.5px', borderBottom: '1px solid #0a0f1e' }}>
                            {row.format ? row.format(c[row.key] as number) : c[row.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚖️</div>
                <p style={{ margin: 0, fontSize: '14px' }}>Pick colleges to compare and they'll show up here.</p>
              </div>
            )}
          </div>
        )}

        {/* PREDICTOR TAB */}
        {activeTab === 'predictor' && (
          <div>
            <div style={{ background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '14px', padding: '26px', marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 6px', color: '#60a5fa', fontSize: '18px', fontWeight: 800 }}>🎯 College Predictor</h2>
              <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '13px' }}>Enter your exam rank to see colleges you're eligible for.</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <select value={predictorExam} onChange={e => setPredictorExam(e.target.value)} style={inputStyle({})}>
                  <option>JEE</option>
                  <option>NEET</option>
                  <option>CAT</option>
                </select>
                <input
                  placeholder="Your Rank"
                  value={predictorRank}
                  onChange={e => setPredictorRank(e.target.value)}
                  type="number"
                  style={inputStyle({ width: '150px' })}
                />
                <select value={predictorCategory} onChange={e => setPredictorCategory(e.target.value)} style={inputStyle({})}>
                  <option>General</option>
                  <option>OBC</option>
                  <option>SC</option>
                  <option>ST</option>
                </select>
                <button onClick={fetchPredictor} style={primaryBtnStyle({ padding: '11px 28px' })}>
                  Predict
                </button>
              </div>
            </div>

            {predictorResults.length > 0 ? (
              <div>
                <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>
                  {predictorResults.length} college{predictorResults.length !== 1 ? 's' : ''} found for your rank
                </p>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {predictorResults.map((r, i) => (
                    <div key={i} style={{ background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', color: '#f1f5f9', fontSize: '15px', fontWeight: 700 }}>{r.college.name}</h4>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>📍 {r.college.location} • ⭐ {r.college.rating}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Cutoff Range</p>
                        <p style={{ margin: 0, color: '#60a5fa', fontWeight: 700, fontSize: '14px' }}>{r.openingRank} - {r.closingRank}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : predictorRank ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🤷</div>
                <p style={{ margin: 0, fontSize: '14px' }}>No colleges found for this rank. Try a different rank or category.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

function inputStyle(extra: React.CSSProperties): React.CSSProperties {
  return {
    padding: '11px 14px',
    borderRadius: '9px',
    border: '1px solid #1e3a5f',
    background: '#0a0f1e',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    ...extra,
  }
}

function primaryBtnStyle(extra: React.CSSProperties): React.CSSProperties {
  return {
    borderRadius: '9px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '13.5px',
    transition: 'background 0.15s ease',
    ...extra,
  }
}