"use server"

import prisma from "@/lib/prisma"

export async function searchUsers(query: string) {
    if (!query || query.length < 3) {
        return []
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { username: { contains: query, mode: "insensitive" } }
                ]
            },
            take: 3,
            select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true
            }
        })

        return users
    } catch (error) {
        console.error("Error searching users:", error)
        return []
    }
}

export async function searchMovies({
    query,
    genre,
    status,
    yearFrom,
    yearTo,
    sortBy = "latest",
    page = 1,
    limit = 20
}: {
    query?: string
    genre?: string
    status?: string
    yearFrom?: number
    yearTo?: number
    sortBy?: "latest" | "popularity" | "rating"
    page?: number
    limit?: number
}) {
    try {
        const baseWhere: any = {}

        // Filter by genre
        if (genre) {
            baseWhere.genres = {
                some: {
                    genre: {
                        slug: genre
                    }
                }
            }
        }

        // Filter by status
        if (status === "released") {
            baseWhere.status = "approved"
            baseWhere.releaseDate = {
                lte: new Date()
            }
        } else if (status === "coming_soon") {
            baseWhere.status = "approved"
            baseWhere.releaseDate = {
                gt: new Date()
            }
        } else if (status) {
            baseWhere.status = status
        } else {
            baseWhere.status = "approved"
        }

        // Filter by year range
        if (yearFrom || yearTo) {
            if (!baseWhere.releaseDate) baseWhere.releaseDate = {}
            if (yearFrom) {
                baseWhere.releaseDate.gte = new Date(`${yearFrom}-01-01`)
            }
            if (yearTo) {
                baseWhere.releaseDate.lte = new Date(`${yearTo}-12-31`)
            }
        }

        // Sorting
        let orderBy: any = { createdAt: "desc" }
        if (sortBy === "latest") {
            orderBy = { releaseDate: "desc" }
        } else if (sortBy === "rating") {
            orderBy = { createdAt: "desc" }
        }

        const skip = (page - 1) * limit
        let movies: any[] = []
        let total = 0

        if (query) {
            // Priority 1: Title matches
            const titleWhere = {
                ...baseWhere,
                title: { contains: query, mode: "insensitive" }
            }

            // Priority 2: Synopsis matches but NOT Title matches
            const synopsisWhere = {
                ...baseWhere,
                synopsis: { contains: query, mode: "insensitive" },
                NOT: {
                    title: { contains: query, mode: "insensitive" }
                }
            }

            // Get total counts first
            const [titleCount, synopsisCount] = await Promise.all([
                prisma.movie.count({ where: titleWhere }),
                prisma.movie.count({ where: synopsisWhere })
            ])

            total = titleCount + synopsisCount

            if (skip < titleCount) {
                // We are still within title matches
                const titleMovies = await prisma.movie.findMany({
                    where: titleWhere,
                    include: {
                        genres: { include: { genre: true } },
                        reviews: { select: { rating: true } }
                    },
                    orderBy,
                    take: limit,
                    skip: skip
                })

                movies = [...titleMovies]

                // If we didn't fill the page with title matches, fill with synopsis matches
                if (movies.length < limit && (skip + movies.length) < total) {
                    const remainingLimit = limit - movies.length
                    const synopsisMovies = await prisma.movie.findMany({
                        where: synopsisWhere,
                        include: {
                            genres: { include: { genre: true } },
                            reviews: { select: { rating: true } }
                        },
                        orderBy,
                        take: remainingLimit,
                        skip: 0
                    })
                    movies = [...movies, ...synopsisMovies]
                }
            } else {
                // We are past title matches, fetch only synopsis matches
                const synopsisSkip = skip - titleCount
                const synopsisMovies = await prisma.movie.findMany({
                    where: synopsisWhere,
                    include: {
                        genres: { include: { genre: true } },
                        reviews: { select: { rating: true } }
                    },
                    orderBy,
                    take: limit,
                    skip: synopsisSkip
                })
                movies = [...synopsisMovies]
            }

        } else {
            // No query, standard behavior
            total = await prisma.movie.count({ where: baseWhere })
            movies = await prisma.movie.findMany({
                where: baseWhere,
                include: {
                    genres: { include: { genre: true } },
                    reviews: { select: { rating: true } }
                },
                orderBy,
                take: limit,
                skip
            })
        }

        // Process movies to add average rating
        const moviesWithRating = movies.map(movie => {
            const totalRating = movie.reviews.reduce((acc: any, review: any) => acc + review.rating, 0)
            const averageRating = movie.reviews.length > 0 ? totalRating / movie.reviews.length : 0

            return {
                ...movie,
                rating: averageRating,
                year: movie.releaseDate ? movie.releaseDate.getFullYear().toString() : ""
            }
        })

        // Handle client-side sorting for rating
        if (sortBy === "rating") {
            moviesWithRating.sort((a, b) => b.rating - a.rating)
        }

        return {
            movies: moviesWithRating,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page
            }
        }

    } catch (error) {
        console.error("Error searching movies:", error)
        return { movies: [], pagination: { total: 0, pages: 0, current: 1 } }
    }
}

export async function searchPeople({
    query,
    role, // 'director' | 'cast' | undefined
    page = 1,
    limit = 20,
    sortBy = "name_asc"
}: {
    query: string
    role?: string
    page?: number
    limit?: number
    sortBy?: "name_asc" | "name_desc" | "popularity" | "oldest" | "youngest"
}) {
    if (!query) return { people: [], pagination: { total: 0, pages: 0, current: 1 } }

    try {
        const where: any = {
            name: { contains: query, mode: "insensitive" }
        }

        if (role) {
            where.movies = {
                some: {
                    role: role === 'director' ? 'director' : { in: ['actor', 'cast', 'actress'] }
                }
            }
        }

        let orderBy: any = { name: 'asc' }
        if (sortBy === "name_desc") {
            orderBy = { name: 'desc' }
        } else if (sortBy === "popularity") {
            orderBy = { movies: { _count: 'desc' } }
        } else if (sortBy === "oldest") {
            orderBy = { birthDate: 'asc' }
        } else if (sortBy === "youngest") {
            orderBy = { birthDate: 'desc' }
        }

        const skip = (page - 1) * limit

        const [people, total] = await Promise.all([
            prisma.person.findMany({
                where,
                include: {
                    movies: {
                        take: 3,
                        include: {
                            movie: {
                                select: {
                                    title: true
                                }
                            }
                        }
                    }
                },
                orderBy: orderBy,
                take: limit,
                skip
            }),
            prisma.person.count({ where })
        ])

        return {
            people,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page
            }
        }
    } catch (error) {
        console.error("Error searching people:", error)
        return { people: [], pagination: { total: 0, pages: 0, current: 1 } }
    }
}


export async function searchAll(
    query: string,
    options: {
        genre?: string
        status?: string
        yearFrom?: number
        yearTo?: number
        movieSort?: "latest" | "popularity" | "rating"
        directorSort?: "name_asc" | "name_desc" | "popularity" | "oldest" | "youngest"
        actorSort?: "name_asc" | "name_desc" | "popularity" | "oldest" | "youngest"
    } = {}
) {
    if (!query) {
        return { movies: [], directors: [], actors: [] }
    }

    const [moviesResult, directorsResult, actorsResult] = await Promise.all([
        searchMovies({
            query,
            limit: 5,
            genre: options.genre,
            status: options.status,
            yearFrom: options.yearFrom,
            yearTo: options.yearTo,
            sortBy: options.movieSort
        }),
        searchPeople({
            query,
            role: 'director',
            limit: 5,
            sortBy: options.directorSort
        }),
        searchPeople({
            query,
            role: 'actor',
            limit: 5,
            sortBy: options.actorSort
        })
    ])

    return {
        movies: moviesResult.movies,
        directors: directorsResult.people,
        actors: actorsResult.people
    }
}
