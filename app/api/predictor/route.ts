import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleError } from "@/lib/apiError"

const VALID_EXAMS = ["jee advanced", "jee mains", "bitsat", "wbjee"]
const VALID_CATEGORIES = ["general", "obc", "sc", "st"]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const exam = searchParams.get("exam")
    const rank = searchParams.get("rank")
    const category = searchParams.get("category") || "General"
    const minRating = searchParams.get("minRating")
    const state = searchParams.get("state")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const skip = (page - 1) * limit

    // Validation
    if (!exam || !rank) {
      return NextResponse.json(
        { error: "exam and rank are required", validExams: VALID_EXAMS },
        { status: 400 }
      )
    }

    const rankNumber = parseInt(rank)
    if (isNaN(rankNumber) || rankNumber < 1) {
      return NextResponse.json(
        { error: "rank must be a positive number" },
        { status: 400 }
      )
    }

    if (!VALID_EXAMS.includes(exam.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid exam. Valid options: ${VALID_EXAMS.join(", ")}` },
        { status: 400 }
      )
    }

    if (!VALID_CATEGORIES.includes(category.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid category. Valid options: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      )
    }

    const collegeFilter: any = {}
    if (minRating) collegeFilter.rating = { gte: parseFloat(minRating) }
    if (state) collegeFilter.state = { equals: state, mode: "insensitive" }

    const cutoffs = await prisma.cutoff.findMany({
      where: {
        exam: { equals: exam, mode: "insensitive" },
        category: { equals: category, mode: "insensitive" },
        closingRank: { gte: rankNumber },
        college: Object.keys(collegeFilter).length > 0 ? collegeFilter : undefined
      },
      include: {
        college: {
          include: {
            placements: { orderBy: { year: "desc" }, take: 1 },
            _count: { select: { reviews: true } }
          }
        }
      },
      orderBy: { college: { rating: "desc" } },
      skip,
      take: limit
    })

    const totalCount = await prisma.cutoff.count({
      where: {
        exam: { equals: exam, mode: "insensitive" },
        category: { equals: category, mode: "insensitive" },
        closingRank: { gte: rankNumber },
        college: Object.keys(collegeFilter).length > 0 ? collegeFilter : undefined
      }
    })

    if (cutoffs.length === 0) {
      return NextResponse.json({
        message: "No colleges found for your rank. Try a higher rank or different category.",
        exam,
        rank: rankNumber,
        category,
        data: [],
        total: 0
      })
    }

    // Categorize results by admission chance
    const safe = cutoffs.filter(c => c.closingRank - rankNumber > 500)
    const moderate = cutoffs.filter(c => {
      const margin = c.closingRank - rankNumber
      return margin >= 0 && margin <= 500
    })

    return NextResponse.json({
      exam,
      rank: rankNumber,
      category,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      summary: {
        safeColleges: safe.length,
        moderateColleges: moderate.length,
        totalEligible: totalCount
      },
      data: cutoffs.map((c) => ({
        college: c.college,
        cutoff: {
          exam: c.exam,
          category: c.category,
          openingRank: c.openingRank,
          closingRank: c.closingRank,
        },
        safetyMargin: c.closingRank - rankNumber,
        admissionChance: c.closingRank - rankNumber > 500
          ? "Safe"
          : c.closingRank - rankNumber > 100
          ? "Moderate"
          : "Borderline",
        latestPlacement: c.college.placements[0] || null
      }))
    })
  } catch (error) {
    return handleError(error)
  }
}