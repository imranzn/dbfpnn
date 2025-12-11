import React from "react";

export default async function FilmDetail({ params }: { params: { id: string } }) {
  const movieId = params.id;

  // Fetch detail film — sesuaikan dengan data source kamu
  const movieRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/movies/${movieId}`, {
    cache: "no-store",
  });
  const movie = await movieRes.json();

  // Fetch rating user + average rating
  const reviewRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/reviews/${movieId}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const reviewData = await reviewRes.json();

  const average = reviewData?.average ?? null;
  const userReview = reviewData?.userReview ?? null;

  return (
    <div className="p-6">
      {/* Judul Film */}
      <h1 className="text-2xl font-bold">{movie.title}</h1>

      {/* Info Film */}
      <p className="mt-2 text-gray-600">{movie.description}</p>

      {/* Rating Summary */}
      <div className="mt-4">
        <p className="text-sm text-gray-700">
          <strong>Average Rating:</strong>{" "}
          {average ? average.toFixed(1) : "Belum ada"}
        </p>

        <p className="text-sm text-gray-700 mt-1">
          <strong>Your Rating:</strong>{" "}
          {userReview?.rating ? userReview.rating : "Belum pernah menilai"}
        </p>

        {userReview?.comment && (
          <p className="text-sm text-gray-700 mt-1 italic">
            “{userReview.comment}”
          </p>
        )}
      </div>

      {/* Button Trigger Popup Rating */}
      <button
        onClick={() => window.dispatchEvent(new Event("open-rating-popup"))}
        className="mt-5 px-4 py-2 bg-blue-600 text-white rounded shadow"
      >
        Beri Rating
      </button>
    </div>
  );
}
