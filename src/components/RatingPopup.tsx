"use client";

import React, { useEffect, useState } from "react";

export default function RatingPopup({ movieId }: { movieId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Listener event popup
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-rating-popup", handler);
    return () => window.removeEventListener("open-rating-popup", handler);
  }, []);

  const submitReview = async () => {
    if (!rating) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId: Number(movieId),
          rating,
          content: comment,
        }),
      });

      if (!res.ok) throw new Error("failed");

      // Reset
      setOpen(false);
      setRating(0);
      setComment("");

      // Refresh page
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-80">
        <h2 className="text-lg font-bold mb-4">Beri Rating</h2>

        {/* Rating */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`w-10 h-10 rounded flex items-center justify-center
                border transition
                ${rating >= n ? "bg-yellow-400" : "bg-gray-200"}
              `}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          className="w-full border rounded p-2 text-sm mb-4"
          rows={3}
          placeholder="Tulis komentar..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-1 text-sm border rounded"
          >
            Batal
          </button>

          <button
            onClick={submitReview}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded shadow"
          >
            {loading ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
