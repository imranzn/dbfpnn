"use client"

type Props = {
  ratingStats: Record<number, number>
  totalRatings: number
}

export default function RatingStats({ ratingStats, totalRatings }: Props) {
  const levels = [5, 4, 3, 2, 1]

  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6">
      <h3 className="text-white font-bold text-lg mb-4">Statistik Rating</h3>

      <div className="text-sm text-gray-400 mb-4">
        Total rating: <span className="text-white font-bold">{totalRatings}</span>
      </div>

      {totalRatings === 0 ? (
        <p className="text-gray-500 italic">Belum ada rating.</p>
      ) : (
        <div className="space-y-2">
          {levels.map((n) => {
            const count = ratingStats?.[n] ?? 0
            const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0

            return (
              <div key={n} className="flex items-center gap-3">
                <div className="w-8 text-sm text-gray-300 font-bold">{n}</div>

                <div className="flex-1 h-2 rounded-full bg-[#252525] overflow-hidden border border-gray-700">
                  <div
                    className="h-full bg-yellow-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="w-14 text-right text-sm text-gray-400">
                  {count} <span className="text-gray-600">({pct}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
