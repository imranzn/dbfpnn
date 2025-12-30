// src/app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // SESUAIKAN: lihat poin di bawah
import { query } from "@/lib/db";

// POST /api/reviews
// Body: { movieId: number, rating: 1-5, content?: string }
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const movieId = Number(body.movieId);
  const rating = Number(body.rating);
  const content = body.content ?? null;

  if (!movieId || Number.isNaN(movieId)) {
    return NextResponse.json(
      { message: "movieId wajib ada" },
      { status: 400 }
    );
  }

  // 1–5 saja
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { message: "rating harus antara 1 sampai 5" },
      { status: 400 }
    );
  }

  try {
    const userId = Number(session.user.id);

    // Upsert: kalau user sudah pernah review, update
    const result = await query(
      `
      INSERT INTO reviews (user_id, movie_id, rating, content)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, movie_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        content = EXCLUDED.content,
        updated_at = now()
      RETURNING *;
    `,
      [userId, movieId, rating, content]
    );

    const statsResult = await query<{
      count: number;
      avg_rating: number;
    }>(
      `
      SELECT
        COUNT(*)::int AS count,
        COALESCE(AVG(rating), 0)::float AS avg_rating
      FROM reviews
      WHERE movie_id = $1;
    `,
      [movieId]
    );

    return NextResponse.json({
      review: result.rows[0],
      stats: statsResult.rows[0],
    });
  } catch (err) {
    console.error("Error POST /api/reviews", err);
    return NextResponse.json(
      { message: "Gagal menyimpan rating" },
      { status: 500 }
    );
  }
}

// GET /api/reviews?movieId=123
export async function GET(req: NextRequest) {
  const session = await auth();
  const url = new URL(req.url);
  const movieIdParam = url.searchParams.get("movieId");
  const movieId = movieIdParam ? Number(movieIdParam) : NaN;

  if (!movieId || Number.isNaN(movieId)) {
    return NextResponse.json(
      { message: "movieId query wajib ada" },
      { status: 400 }
    );
  }

  try {
    const userId = session?.user?.id ? Number(session.user.id) : null;

    const reviewsPromise = query(
      `
      SELECT
        r.*,
        u.name,
        u.username,
        u.avatar_url
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.movie_id = $1
      ORDER BY r.created_at DESC;
    `,
      [movieId]
    );

    const statsPromise = query<{
      count: number;
      avg_rating: number;
    }>(
      `
      SELECT
        COUNT(*)::int AS count,
        COALESCE(AVG(rating), 0)::float AS avg_rating
      FROM reviews
      WHERE movie_id = $1;
    `,
      [movieId]
    );

    const userReviewPromise =
      userId != null
        ? query(
            `
        SELECT *
        FROM reviews
        WHERE movie_id = $1 AND user_id = $2
        LIMIT 1;
      `,
            [movieId, userId]
          )
        : Promise.resolve({ rows: [] } as any);

    const [reviewsRes, statsRes, userReviewRes] = await Promise.all([
      reviewsPromise,
      statsPromise,
      userReviewPromise,
    ]);

    return NextResponse.json({
      reviews: reviewsRes.rows,
      stats: statsRes.rows[0],
      userReview: userReviewRes.rows[0] ?? null,
    });
  } catch (err) {
    console.error("Error GET /api/reviews", err);
    return NextResponse.json(
      { message: "Gagal mengambil rating" },
      { status: 500 }
    );
  }
}
