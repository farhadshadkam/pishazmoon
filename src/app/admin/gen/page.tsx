{result && !result.ok && (
  <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-5">
    <b className="text-rose-600 text-lg">❌ {result.message || result.error}</b>
    {result.hint && <p className="text-xs text-rose-400 mt-2 font-mono">{result.hint}</p>}
    {result.errors && (
      <div className="mt-3">
        <b className="text-sm">جزئیات خطاها ({result.totalErrors} مورد):</b>
        <ul className="text-xs mt-2 space-y-1">
          {result.errors.map((e: string, i: number) => (
            <li key={i} className="bg-rose-100 rounded px-2 py-1">• {e}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}
