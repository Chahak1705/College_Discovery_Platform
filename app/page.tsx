'use client'

import { useState, useEffect } from 'react'

interface College {
  id: number
  name: string
  location: string
  state: string
  fees: number
  rating: number
  description: string
}

interface PredictorResult {
  college: College
  openingRank: number
  closingRank: number
}

export default function Home() {
  const [colleges, setColleges] = useState<College[]>([])
  const [search, setSearch] = useState('')
  const [state, setState] = useState('')
  const [maxFees, setMaxFees] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCollege, setSelectedCollege] = useState<any>(null)
  const [compareIds, setCompareIds] = useState<number[]>([])
  const [compareData, setCompareData] = useState<College[]>([])
  const [predictorExam, setPredictorExam] = useState('JEE')
  const [predictorRank, setPredictorRank] = useState('')
  const [predictorCategory, setPredictorCategory] = useState('General')
  const [predictorResults, setPredictorResults] = useState<PredictorResult[]>([])
  const [activeTab, setActiveTab] = useState<'list' | 'compare' | 'predictor'>('list')
  const [total, setTotal] = useState(0)

  const API = 'https://college-discovery-sooty.vercel.app'

  const fetchColleges = async () => {
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
  }

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

  useEffect(() => { fetchColleges() }, [])

  const toggleCompare = (id: number) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0d1528', borderBottom: '1px solid #1e3a5f', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#60a5fa' }}>🎓 College Discovery</h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Find your perfect college</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['list', 'compare', 'predictor'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              background: activeTab === tab ? '#2563eb' : '#1e293b',
              color: activeTab === tab ? '#fff' : '#94a3b8'
            }}>
              {tab === 'list' ? '🏫 Colleges' : tab === 'compare' ? '⚖️ Compare' : '🎯 Predictor'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>

        {/* COLLEGES LIST TAB */}
        {activeTab === 'list' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <input placeholder="Search colleges..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0d1528', color: '#e2e8f0', fontSize: '14px' }} />
              <input placeholder="State (e.g. Delhi)" value={state} onChange={e => setState(e.target.value)}
                style={{ width: '160px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0d1528', color: '#e2e8f0', fontSize: '14px' }} />
              <input placeholder="Max Fees" value={maxFees} onChange={e => setMaxFees(e.target.value)}
                style={{ width: '130px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0d1528', color: '#e2e8f0', fontSize: '14px' }} />
              <button onClick={fetchColleges} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Search
              </button>
            </div>

            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>{total} colleges found</p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {colleges.map(college => (
                  <div key={college.id} style={{ background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#2563eb')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e3a5f')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>{college.name}</h3>
                      <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>⭐ {college.rating}</span>
                    </div>
                    <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '13px' }}>📍 {college.location}, {college.state}</p>
                    <p style={{ margin: '0 0 16px', color: '#60a5fa', fontSize: '13px', fontWeight: 600 }}>💰 ₹{college.fees.toLocaleString()}/yr</p>
                    <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '12px', lineHeight: '1.5' }}>{college.description}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => fetchCollegeDetail(college.id)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: '#1e3a5f', color: '#60a5fa', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                        View Details
                      </button>
                      <button onClick={() => toggleCompare(college.id)} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: compareIds.includes(college.id) ? '#2563eb' : '#1e293b', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>
                        {compareIds.includes(college.id) ? '✓' : '+'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* College Detail Modal */}
            {selectedCollege && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
                <div style={{ background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#60a5fa' }}>{selectedCollege.name}</h2>
                    <button onClick={() => setSelectedCollege(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { label: 'Location', value: `${selectedCollege.location}, ${selectedCollege.state}` },
                      { label: 'Rating', value: `⭐ ${selectedCollege.rating}` },
                      { label: 'Annual Fees', value: `₹${selectedCollege.fees?.toLocaleString()}` },
                      { label: 'Courses', value: `${selectedCollege.courses?.length || 0} offered` },
                    ].map(item => (
                      <div key={item.label} style={{ background: '#0a0f1e', padding: '12px', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{item.label}</p>
                        <p style={{ margin: 0, fontWeight: 600, color: '#e2e8f0' }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>{selectedCollege.description}</p>
                  {selectedCollege.cutoffs?.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h4 style={{ color: '#60a5fa', marginBottom: '12px' }}>Cutoff Ranks</h4>
                      {selectedCollege.cutoffs.map((c: any) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0a0f1e', borderRadius: '6px', marginBottom: '6px', fontSize: '13px' }}>
                          <span>{c.exam} — {c.category}</span>
                          <span style={{ color: '#60a5fa' }}>{c.openingRank} - {c.closingRank}</span>
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
            <div style={{ background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 12px', color: '#94a3b8' }}>Select colleges from the list tab (max 3), then compare here.</p>
              <p style={{ margin: '0 0 16px', color: '#60a5fa', fontSize: '13px' }}>Selected IDs: {compareIds.length > 0 ? compareIds.join(', ') : 'None'}</p>
              <button onClick={fetchCompare} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Compare Now
              </button>
            </div>

            {compareData.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#64748b', fontSize: '13px', borderBottom: '1px solid #1e3a5f' }}>Feature</th>
                      {compareData.map(c => (
                        <th key={c.id} style={{ padding: '12px', textAlign: 'left', color: '#60a5fa', fontSize: '14px', borderBottom: '1px solid #1e3a5f' }}>{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Location', key: 'location' },
                      { label: 'State', key: 'state' },
                      { label: 'Annual Fees', key: 'fees', format: (v: number) => `₹${v?.toLocaleString()}` },
                      { label: 'Rating', key: 'rating', format: (v: number) => `⭐ ${v}` },
                    ].map(row => (
                      <tr key={row.label}>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: '13px', borderBottom: '1px solid #0a0f1e' }}>{row.label}</td>
                        {compareData.map(c => (
                          <td key={c.id} style={{ padding: '12px', color: '#e2e8f0', fontSize: '13px', borderBottom: '1px solid #0a0f1e' }}>
                            {row.format ? row.format((c as any)[row.key]) : (c as any)[row.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PREDICTOR TAB */}
        {activeTab === 'predictor' && (
          <div>
            <div style={{ background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 20px', color: '#60a5fa' }}>🎯 College Predictor</h2>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <select value={predictorExam} onChange={e => setPredictorExam(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0a0f1e', color: '#e2e8f0', fontSize: '14px' }}>
                  <option>JEE</option>
                  <option>NEET</option>
                  <option>CAT</option>
                </select>
                <input placeholder="Your Rank" value={predictorRank} onChange={e => setPredictorRank(e.target.value)} type="number"
                  style={{ width: '150px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0a0f1e', color: '#e2e8f0', fontSize: '14px' }} />
                <select value={predictorCategory} onChange={e => setPredictorCategory(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #1e3a5f', background: '#0a0f1e', color: '#e2e8f0', fontSize: '14px' }}>
                  <option>General</option>
                  <option>OBC</option>
                  <option>SC</option>
                  <option>ST</option>
                </select>
                <button onClick={fetchPredictor} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  Predict
                </button>
              </div>
            </div>

            {predictorResults.length > 0 ? (
              <div>
                <p style={{ color: '#64748b', marginBottom: '16px' }}>{predictorResults.length} colleges found for your rank</p>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {predictorResults.map((r, i) => (
                    <div key={i} style={{ background: '#0d1528', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px', color: '#f1f5f9' }}>{r.college.name}</h4>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>📍 {r.college.location} • ⭐ {r.college.rating}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#64748b' }}>Cutoff Range</p>
                        <p style={{ margin: 0, color: '#60a5fa', fontWeight: 600 }}>{r.openingRank} - {r.closingRank}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : predictorRank && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No colleges found for this rank. Try a different rank or category.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}