"use client";

import { useState } from "react";
import RatingModal from "@/components/RatingModal";

type Movie = {
  id: number;
};

type MoviePageProps = {
  movie: Movie;
};

export default function MoviePage({ movie }: MoviePageProps) {
  const [showRating, setShowRating] = useState(false);

  return (
    <>
      <button
        className="bg-yellow-500 px-4 py-2 rounded text-white"
        onClick={() => setShowRating(true)}
      >
        Rate This Movie
      </button>

      {showRating && (
        <RatingModal
          movieId={movie.id}
          onClose={() => setShowRating(false)}
          onSuccess={(data) => {
            console.log("Rating OK:", data);
            // TODO: Refetch rating stats
          }}
        />
      )}
    </>
  );
}
