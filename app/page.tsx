"use client";

import { useEffect, useState } from "react";

type College = {
  id: number;
  name: string;
  location: string;
  fees: number;
  rating: number;
};

export default function Home() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/colleges")
      .then((res) => res.json())
      .then((data) => setColleges(data.data || []))
      .catch(console.error);
  }, []);

  const filtered = colleges.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-2">
        🎓 College Discovery Platform
      </h1>

      <p className="text-center text-gray-600 mb-8">
        Backend Engineer Demo • Next.js • Prisma • PostgreSQL
      </p>

      <div className="max-w-2xl mx-auto mb-8">
        <input
          className="w-full border rounded-lg p-3"
          placeholder="Search colleges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="max-w-4xl mx-auto grid gap-4">
        {filtered.map((college) => (
          <div
            key={college.id}
            className="bg-white rounded-xl shadow p-5 border"
          >
            <h2 className="text-2xl font-semibold">{college.name}</h2>

            <p className="text-gray-600">
              📍 {college.location}
            </p>

            <p>💰 Fees: ₹{college.fees}</p>

            <p>⭐ Rating: {college.rating}</p>

            <div className="mt-3 flex gap-3">
              <a
                href={`/api/colleges/${college.id}`}
                target="_blank"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                View API
              </a>

              <a
                href={`/api/colleges/compare?ids=${college.id},17`}
                target="_blank"
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Compare
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}