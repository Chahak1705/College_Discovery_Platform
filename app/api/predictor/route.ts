import { NextResponse, NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client"
import { handleError } from "@/lib/apiError"

const prisma = new PrismaClient()

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

    const cutoffs = await prisma.cutoff.findMany({
      where: {
        exam: { equals: exam, mode: "insensitive" },
        category: { equals: category, mode: "insensitive" },
        openingRank: { lte: rankNumber },
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
        closingRank: c.closingRank
      }))
    })

  } catch (error) {
    return handleError(error)
  }
}