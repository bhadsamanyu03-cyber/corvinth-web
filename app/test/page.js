'use client';
import { useState } from 'react';

export default function TestLab() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      // This calls your internal Next.js bridge (app/api/check/route.js)
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdq_hash: '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff', // Dummy hash
          pdq_dihedral_hashes: ['dummy1', 'dummy2']
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center pt-32 p-6">
      <h1 className="text-3xl text-emerald-500 font-bold mb-2">Engine Test Lab</h1>
      <p className="text-zinc-400 mb-8">Pinging the Render Engine & MongoDB</p>
      
      <button
        onClick={runTest}
        disabled={loading}
        className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-500 transition disabled:opacity-50"
      >
        {loading ? 'Firing Engine...' : 'Run Test Ping'}
      </button>

      {result && (
        <div className="mt-8 w-full max-w-2xl">
          <p className="text-sm text-zinc-500 mb-2">Live Server Response:</p>
          <pre className="bg-zinc-900 p-6 rounded-lg text-emerald-400 text-sm overflow-x-auto border border-zinc-800 shadow-2xl">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}