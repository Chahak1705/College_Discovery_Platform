import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleError } from "@/lib/apiError"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const state = searchParams.get("state")
    const type = searchParams.get("type") // IIT, NIT, IIIT, Private, State
    const maxFees = searchParams.get("maxFees")
    const minFees = searchParams.get("minFees")
    const minRating = searchParams.get("minRating")
    const sortBy = searchParams.get("sortBy") || "rating" // rating, fees, name
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50)
    const skip = (page - 1) * limit

    if (page < 1) {
      return NextResponse.json({ error: "Page must be >= 1" }, { status: 400 })
    }

    const where: any = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { location: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } }
          ]
        } : {},
        state ? { state: { equals: state, mode: "insensitive" as const } } : {},
        maxFees ? { fees: { lte: parseInt(maxFees) } } : {},
        minFees ? { fees: { gte: parseInt(minFees) } } : {},
        minRating ? { rating: { gte: parseFloat(minRating) } } : {},
      ]
    }

    const validSortFields = ["rating", "fees", "name"]
    const orderByField = validSortFields.includes(sortBy) ? sortBy : "rating"
    const orderByDir = sortOrder === "asc" ? "asc" : "desc"

    const [colleges, total] = await Promise.all([
      prisma.college.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: orderByDir },
        include: {
          placements: {
            orderBy: { year: "desc" },
            take: 1
          },
          _count: { select: { reviews: true } }
        }
      }),
      prisma.college.count({ where })
    ])

    return NextResponse.json({
      data: colleges,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: { search, state, maxFees, minFees, minRating, sortBy, sortOrder }
    })
  } catch (error) {
    return handleError(error)
  }
}