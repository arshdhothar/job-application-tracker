import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";

const API = "http://127.0.0.1:8000";

type Job = {
  id: number;
  company: string;
  role: string;
  status: string;
  location: string | null;
  url: string | null;
  notes: string | null;
  date_applied: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  Applied: "bg-blue-100 text-blue-800",
  Interview: "bg-yellow-100 text-yellow-800",
  Offer: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const STATUS_HEX: Record<string, string> = {
  Applied: "#3b82f6",
  Interview: "#f59e0b",
  Offer: "#22c55e",
  Rejected: "#ef4444",
};

const STATUSES = ["Applied", "Interview", "Offer", "Rejected"];

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [form, setForm] = useState({
    company: "", role: "", status: "Applied",
    location: "", url: "", notes: "", date_applied: "",
  });

  const fetchJobs = async () => {
    const res = await fetch(`${API}/jobs`);
    const data = await res.json();
    setJobs(data);
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleSubmit = async () => {
    if (!form.company || !form.role) return;
    await fetch(`${API}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ company: "", role: "", status: "Applied", location: "", url: "", notes: "", date_applied: "" });
    setShowForm(false);
    fetchJobs();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`${API}/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchJobs();
  };

  const deleteJob = async (id: number) => {
    await fetch(`${API}/jobs/${id}`, { method: "DELETE" });
    fetchJobs();
  };

  // Chart data
  const barData = STATUSES.map(s => ({
    status: s,
    count: jobs.filter(j => j.status === s).length,
    fill: STATUS_HEX[s],
  }));

  const lineData = Object.entries(
    jobs
      .filter(j => j.date_applied)
      .reduce((acc, j) => {
        const date = j.date_applied!;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const filteredJobs = filterStatus === "All"
    ? jobs
    : jobs.filter(j => j.status === filterStatus);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = jobs.filter(j => j.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Tracker</h1>
            <p className="text-gray-500 mt-1">{jobs.length} applications total</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Application
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {STATUSES.map(s => (
            <div key={s} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">{s}</p>
              <p className="text-2xl font-bold text-gray-900">{counts[s]}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Applications by Status</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={40}>
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Applications Over Time</h2>
            {lineData.length < 2 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
                Add more applications with dates to see the trend
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-lg font-semibold mb-4">New Application</h2>
            <div className="grid grid-cols-2 gap-4">
              {(["company", "role", "location", "url", "date_applied"] as const).map(field => (
                <input
                  key={field}
                  placeholder={field.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  value={form[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                Save
              </button>
              <button onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {["All", ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === s
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Company", "Role", "Location", "Date Applied", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No applications yet. Add your first one!</td></tr>
              ) : (
                filteredJobs.map(job => (
                  <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{job.company}</td>
                    <td className="px-4 py-3 text-gray-600">{job.role}</td>
                    <td className="px-4 py-3 text-gray-500">{job.location || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{job.date_applied || "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={job.status}
                        onChange={e => updateStatus(job.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[job.status]}`}
                      >
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteJob(job.id)} className="text-red-400 hover:text-red-600 text-xs">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default App;