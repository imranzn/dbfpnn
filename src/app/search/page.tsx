import { searchAll, searchMovies, searchPeople } from "@/app/actions/search"
import SearchHeader from "@/components/search/SearchHeader"
import MovieCard from "@/components/shared/MovieCard"
import PersonCard from "@/components/shared/PersonCard"
import { type Metadata } from "next"

export const metadata: Metadata = {
    title: "Pencarian | DBFPN",
    description: "Cari film, sutradara, dan aktor favoritmu",
}

interface SearchPageProps {
    searchParams: Promise<{
        q?: string
        status?: string
        genre?: string
        yearFrom?: string
        yearTo?: string
        sortBy?: "latest" | "popularity" | "rating"
        page?: string
        type?: "Semua" | "Film" | "Sutradara" | "Aktor"
        personSort?: "name_asc" | "name_desc" | "popularity" | "oldest" | "youngest"
        directorSort?: "name_asc" | "name_desc" | "popularity" | "oldest" | "youngest"
        actorSort?: "name_asc" | "name_desc" | "popularity" | "oldest" | "youngest"
    }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams
    const query = params.q || ""
    const type = params.type || "Semua"
    const currentPage = Number(params.page) || 1

    let content

    if (type === "Film") {
        const { movies, pagination } = await searchMovies({
            query,
            status: params.status,
            genre: params.genre,
            yearFrom: params.yearFrom ? Number(params.yearFrom) : undefined,
            yearTo: params.yearTo ? Number(params.yearTo) : undefined,
            sortBy: params.sortBy,
            page: currentPage,
        })

        content = (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {movies.map((movie) => (
                    <MovieCard
                        key={movie.id}
                        id={movie.id.toString()}
                        title={movie.title}
                        description={movie.synopsis || ""}
                        imageUrl={movie.posterUrl}
                        year={movie.year}
                        releaseDate={movie.releaseDate ? new Date(movie.releaseDate).toISOString() : undefined}
                    />
                ))}
                {movies.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        Tidak ada film yang ditemukan
                    </div>
                )}
            </div>
        )
    } else if (type === "Sutradara" || type === "Aktor") {
        const roleRole = type === "Sutradara" ? "director" : "actor"
        const { people, pagination } = await searchPeople({
            query,
            role: roleRole,
            page: currentPage,
            sortBy: params.sortBy as any
        })

        content = (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {people.map((person) => (
                    <PersonCard
                        key={person.id}
                        id={person.id}
                        name={person.name}
                        slug={person.slug}
                        imageUrl={person.imageUrl}
                        role={type === "Sutradara" ? "Director" : "Actor"}
                        movies={person.movies.map(m => ({ title: m.movie.title }))}
                    />
                ))}
                {people.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        Tidak ada {type} yang ditemukan
                    </div>
                )}
            </div>
        )
    } else {
        // "Semua" - All
        const results = await searchAll(query, {
            genre: params.genre,
            status: params.status,
            yearFrom: params.yearFrom ? Number(params.yearFrom) : undefined,
            yearTo: params.yearTo ? Number(params.yearTo) : undefined,
            movieSort: params.sortBy,
            directorSort: params.directorSort as any,
            actorSort: params.actorSort as any
        })

        // Helper to construct URL with params
        const buildUrl = (targetType: string, extraParams: Record<string, any>) => {
            const urlParams = new URLSearchParams()
            urlParams.set("q", query)
            urlParams.set("type", targetType)

            Object.entries(extraParams).forEach(([key, value]) => {
                if (value) urlParams.set(key, String(value))
            })

            return `/search?${urlParams.toString()}`
        }

        content = (
            <div className="space-y-12">
                {/* Movies Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Film</h2>
                        {results.movies.length > 0 && (
                            <a
                                href={buildUrl("Film", {
                                    status: params.status,
                                    genre: params.genre,
                                    yearFrom: params.yearFrom,
                                    yearTo: params.yearTo,
                                    sortBy: params.sortBy
                                })}
                                className="text-primary hover:underline text-sm font-medium"
                            >
                                Lihat Semua Film
                            </a>
                        )}
                    </div>
                    {results.movies.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {results.movies.map((movie: any) => (
                                <MovieCard
                                    key={movie.id}
                                    id={movie.id.toString()}
                                    title={movie.title}
                                    description={movie.synopsis || ""}
                                    imageUrl={movie.posterUrl}
                                    year={movie.year}
                                    releaseDate={movie.releaseDate ? new Date(movie.releaseDate).toISOString() : undefined}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Tidak ada film ditemukan.</p>
                    )}
                </section>

                {/* Directors Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Sutradara</h2>
                        {results.directors.length > 0 && (
                            <a
                                href={buildUrl("Sutradara", { sortBy: params.directorSort })}
                                className="text-primary hover:underline text-sm font-medium"
                            >
                                Lihat Semua Sutradara
                            </a>
                        )}
                    </div>
                    {results.directors.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {results.directors.map((person: any) => (
                                <PersonCard
                                    key={person.id}
                                    id={person.id}
                                    name={person.name}
                                    slug={person.slug}
                                    imageUrl={person.imageUrl}
                                    role="Director"
                                    movies={person.movies.map((m: any) => ({ title: m.movie.title }))}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Tidak ada sutradara ditemukan.</p>
                    )}
                </section>

                {/* Actors Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Aktor</h2>
                        {results.actors.length > 0 && (
                            <a
                                href={buildUrl("Aktor", { sortBy: params.actorSort })}
                                className="text-primary hover:underline text-sm font-medium"
                            >
                                Lihat Semua Aktor
                            </a>
                        )}
                    </div>
                    {results.actors.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {results.actors.map((person: any) => (
                                <PersonCard
                                    key={person.id}
                                    id={person.id}
                                    name={person.name}
                                    slug={person.slug}
                                    imageUrl={person.imageUrl}
                                    role="Actor"
                                    movies={person.movies.map((m: any) => ({ title: m.movie.title }))}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">Tidak ada aktor ditemukan.</p>
                    )}
                </section>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#121212]">
            <main className="flex-grow pt-8 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Search Header */}
                    <SearchHeader />

                    {/* Results */}
                    {content}
                </div>
            </main>
        </div>
    )
}
