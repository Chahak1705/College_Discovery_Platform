export default function Home() {
  const endpoints = [
    {
      name: "College Listing",
      url: "/api/colleges",
      method: "GET",
    },
    {
      name: "College Details",
      url: "/api/colleges/{id}",
      method: "GET",
    },
    {
      name: "Compare Colleges",
      url: "/api/colleges/compare?ids=16,17",
      method: "GET",
    },
    {
      name: "Predictor",
      url: "/api/predictor",
      method: "POST",
    },
    {
      name: "Login",
      url: "/api/auth/login",
      method: "POST",
    },
    {
      name: "Signup",
      url: "/api/auth/signup",
      method: "POST",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-3">
          🎓 College Discovery Platform
        </h1>

        <p className="text-lg text-gray-300 mb-8">
          Backend Engineer Demo built with Next.js, TypeScript, PostgreSQL,
          Prisma ORM and JWT Authentication.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">
              🚀 Implemented Features
            </h2>

            <ul className="space-y-2 text-gray-300">
              <li>✅ College Listing & Search</li>
              <li>✅ College Detail API</li>
              <li>✅ Compare Colleges</li>
              <li>✅ Rank Predictor</li>
              <li>✅ JWT Authentication</li>
              <li>✅ Saved Colleges</li>
              <li>✅ PostgreSQL + Prisma ORM</li>
            </ul>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">
              🛠 Tech Stack
            </h2>

            <ul className="space-y-2 text-gray-300">
              <li>• Next.js 16</li>
              <li>• TypeScript</li>
              <li>• PostgreSQL</li>
              <li>• Prisma ORM</li>
              <li>• Tailwind CSS</li>
              <li>• JWT Authentication</li>
              <li>• Vercel Deployment</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 bg-slate-800 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            📡 Available API Endpoints
          </h2>

          <div className="space-y-3">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.url}
                className="flex flex-col md:flex-row md:items-center md:justify-between border border-slate-700 rounded-lg p-3"
              >
                <div>
                  <p className="font-semibold">{endpoint.name}</p>
                  <code className="text-green-400 text-sm">
                    {endpoint.url}
                  </code>
                </div>

                <span className="mt-2 md:mt-0 bg-blue-600 px-3 py-1 rounded-full text-sm w-fit">
                  {endpoint.method}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}