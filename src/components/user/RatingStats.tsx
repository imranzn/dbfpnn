"use client";

import { useState } from "react";

export default function RatingModal({ movieId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!rating) return alert("Pilih rating dulu");

    setLoading(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      body: JSON.stringify({ movieId, rating, content }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.message || "Gagal submit rating");
      return;
    }

    onSuccess?.(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-80">
        <h3 className="text-lg font-bold mb-2">Beri Rating</h3>

        <div className="flex gap-1 mb-3">
          {[1,2,3,4,5].map((s) => (
            <button
              key={s}
              onClick={() => setRating(s)}
              className={`p-2 text-xl ${rating >= s ? "text-yellow-500" : "text-gray-400"}`}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          className="w-full border rounded p-2 mb-3"
          placeholder="Tulis komentar..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Mengirim..." : "Submit Rating"}
        </button>

        <button
          className="w-full mt-2 text-gray-500"
          onClick={onClose}
        >
          Batal
        </button>
      </div>
    </div>
  );
}
