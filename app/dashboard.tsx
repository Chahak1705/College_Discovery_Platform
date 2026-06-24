"use client"

import { useState, useEffect } from "react"

interface College {
  id: number
  name: string
  location: string
  state: string
  fees: number
  rating: number
  description: string | null
}

// Added strict interface matching your dynamic API's output shape
interface PredictedItem {
  college: College
  openingRank: number
  closingRank: number
  safetyMargin: number
}

export default function Dashboard() {
  // Colleges list aur filters ke liye states
  const [colleges, setColleges] = useState<College[]>([])
  const [search, setSearch] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [maxFees, setMaxFees] = useState("500000")
  const [loading, setLoading] = useState(true)

  // Predictor ke liye states with proper typing instead of "any[]"
  const [exam, setExam] = useState("JEE")
  const [rank, setRank] = useState("")
  const [predictedColleges, setPredictedColleges] = useState<PredictedItem[]>([])
  const [predictorLoading, setPredictorLoading] = useState(false)

  // 1. Live API se Colleges Data fetch karna
  useEffect(() => {
    async function fetchColleges() {
      setLoading(true)
      try {
        const query = new URLSearchParams({
          search,
          state: stateFilter,
          maxFees,
        }).toString()

        const res = await fetch(`/api/colleges?${query}`)
        const json = await res.json()
        setColleges(json.data || [])
      } catch (err) {
        console.error("Failed to fetch colleges", err)
      } finally {
        setLoading(false)
      }
    }

    const delayDebounce = setTimeout(() => {
      fetchColleges()
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [search, stateFilter, maxFees])

  // 2. Predictor API call handle karna
  async function handlePredict(e: React.FormEvent) {
    e.preventDefault()
    if (!rank) return
    setPredictorLoading(true)
    try {
      const res = await fetch(`/api/predictor?exam=${exam}&rank=${rank}`)
      const json = await res.json()
      // Safely access the array from json.data
      setPredictedColleges(json.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setPredictorLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <header className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-blue-400 mb-2">College Discovery & Predictor</h1>
        <p className="text-gray-400">Search top engineering institutions and check exam eligibility live.</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Search & Colleges Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Bar */}
          <div className="bg-gray-800 p-4 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Search Name</label>
              <input
                type="text"
                placeholder="e.g. IIT"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-1">State</label>
              <input
                type="text"
                placeholder="e.g. Delhi"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Max Fees: ₹{parseInt(maxFees).toLocaleString('en-IN')}</label>
              <input
                type="range"
                min="100000"
                max="500000"
                step="50000"
                className="w-full accent-blue-500 mt-2"
                value={maxFees}
                onChange={(e) => setMaxFees(e.target.value)}
              />
            </div>
          </div>

          {/* Colleges Cards */}
          <h2 className="text-xl font-bold text-gray-300">Available Institutions</h2>
          {loading ? (
            <p className="text-blue-400">Loading metrics from database...</p>
          ) : colleges.length === 0 ? (
            <p className="text-gray-500">No colleges match your filter variables.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colleges.map((college) => (
                <div key={college.id} className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-blue-500 transition-all shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white">{college.name}</h3>
                    <span className="bg-blue-900 text-blue-300 text-xs font-bold px-2 py-1 rounded">
                      ⭐ {college.rating}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">{college.location}, {college.state}</p>
                  <div className="border-t border-gray-700 pt-3 flex justify-between items-center text-xs text-gray-400">
                    <span>Annual Fees:</span>
                    <span className="text-white font-semibold">₹{college.fees.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Predictor Tool Widget */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit shadow-md space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🎯 Rank Predictor Widget
          </h2>
          <p className="text-xs text-gray-400">Input your cutoff data to evaluate your entrance test scores dynamically against standard historical closing metrics.</p>
          
          <form onSubmit={handlePredict} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-400">Select Exam</label>
              <select 
                className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
              >
                <option value="JEE">JEE Main / Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-400">Your Rank</label>
              <input
                type="number"
                placeholder="e.g. 75"
                className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:outline-none"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
              disabled={predictorLoading}
            >
              {predictorLoading ? "Calculating Boundaries..." : "Predict Eligible Pools"}
            </button>
          </form>

          {/* Predictor Outcomes */}
          <div className="pt-2 border-t border-gray-700">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Matching Pools</h4>
            {predictedColleges.length === 0 ? (
              <p className="text-xs text-gray-500">Run an evaluation matrix above to map targets.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {predictedColleges.map((item, idx) => (
                  <div key={idx} className="bg-gray-950 p-3 rounded-lg text-xs border border-gray-800">
                    <div className="font-bold text-white mb-1">{item.college.name}</div>
                    <div className="text-gray-400 flex justify-between">
                      <span>Cutoff Span: {item.openingRank} - {item.closingRank}</span>
                      <span className="text-green-400 font-semibold">Margin: +{item.safetyMargin}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}