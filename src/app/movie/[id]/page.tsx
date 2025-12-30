import MovieHeader from "@/components/movie/MovieHeader"
import CommentsSection from "@/components/movie/CommentsSection"
import RatingClient from "@/components/movie/RatingClient"
import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function MovieDetail({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const isNumeric = /^\d+$/.test(id)

  const movie = await prisma.movie.findFirst({
    where: isNumeric ? { id: Number(id) } : { slug: id },
    include: {
      people: {
        include: {
          person: {
            include: {
              user: true,
            },
          },
        },
      },
      genres: {
        include: { genre: true },
      },
      reviews: {
        select: { rating: true },
      },
    },
  })

  if (!movie) notFound()

  const movieId = Number(movie.id)
  if (!movieId || Number.isNaN(movieId)) notFound()

  const totalRating = movie.reviews.reduce((sum, review) => sum + review.rating, 0)
  const avg = movie.reviews.length > 0 ? totalRating / movie.reviews.length : 0
  const averageRating = Math.min(5, Math.max(0, avg))

  const director = movie.people.find((p) => p.role === "director")?.person
  const writer = movie.people.find((p) => p.role === "writer")?.person

  const cast = movie.people
    .filter((p) => p.role === "cast")
    .map((p) => ({
      name: p.person.name,
      role: p.characterName || "Cast",
      userId: p.person.userId,
      username: p.person.user?.username,
    }))

  const genres = movie.genres.map((g) => g.genre.name)

  return (
    <div className="pb-12">
      <MovieHeader
        id={movieId}
        title={movie.title}
        year={movie.releaseDate ? new Date(movie.releaseDate).getFullYear().toString() : "TBA"}
        rating={Number(averageRating.toFixed(1))}
        posterUrl={movie.posterUrl}
        bannerUrl={movie.bannerUrl}
        trailerUrl={movie.trailerUrl}
        videoUrl={movie.videoUrl}
        synopsis={movie.synopsis || ""}
        director={director?.name || "Unknown"}
        directorId={director?.userId}
        directorUsername={director?.user?.username}
        writer={writer?.name || "Unknown"}
        writerId={writer?.userId}
        writerUsername={writer?.user?.username}
        cast={cast}
        genres={genres}
        duration={`${movie.duration || 0}m`}
        language="Indonesian"
        releaseDate={
          movie.releaseDate
            ? new Date(movie.releaseDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "Coming Soon"
        }
      />

      <div className="max-w-7xl mx-auto px-4">
        <RatingClient movieId={movieId} />
        <CommentsSection />
      </div>
    </div>
  )
}
