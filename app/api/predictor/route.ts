import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma" // Corrected: Linked to our shared connection instance pool
import { handleError } from "@/lib/apiError"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const exam = searchParams.get("exam")
    const rank = searchParams.get("rank")
    const category = searchParams.get("category") || "General"

    if (!exam || !rank) {
      return NextResponse.json(
        { error: "exam and rank are required" },
        { status: 400 }
      )
    }

    const rankNumber = parseInt(rank)

    if (isNaN(rankNumber)) {
      return NextResponse.json(
        { error: "rank must be a number" },
        { status: 400 }
      )
    }

    // QUERY LOGIC:
    // In entrance exams, a lower numerical rank means a better score. 
    // You are eligible for any branch where your rank safely sits BELOW or EQUAL to the closing cutoff boundary.
    // Therefore, we look for records where the historical closingRank is Greater Than or Equal To (gte) your rank.
    const cutoffs = await prisma.cutoff.findMany({
      where: {
        exam: { equals: exam, mode: "insensitive" },
        category: { equals: category, mode: "insensitive" },
        closingRank: { gte: rankNumber }
      },
      include: {
        college: true
      },
      orderBy: {
        college: {
          rating: "desc"
        }
      }
    })

    if (cutoffs.length === 0) {
      return NextResponse.json({
        message: "No colleges found for your rank",
        data: []
      })
    }

    return NextResponse.json({
      exam,
      rank: rankNumber,
      category,
      total: cutoffs.length,
      data: cutoffs.map((c) => ({
        college: c.college,
        openingRank: c.openingRank,
        closingRank: c.closingRank,
        // METRIC:
        // A higher positive margin means the student cleared the cutoff more safely.
        safetyMargin: c.closingRank - rankNumber
      }))
    })

  } catch (error) {
    return handleError(error)
  }
}