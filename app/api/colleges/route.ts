import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma" // Corrected: Linked to our shared database instance pool
import { handleError } from "@/lib/apiError"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const state = searchParams.get("state")
    const maxFees = searchParams.get("maxFees")
    
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" as const } } : {},
        state ? { state: state } : {},
        maxFees ? { fees: { lte: parseInt(maxFees) } } : {},
      ]
    }

    // Performance optimization: Promise.all runs queries in parallel concurrently
    const [colleges, total] = await Promise.all([
      prisma.college.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: "desc" }
      }),
      prisma.college.count({ where })
    ])

    return NextResponse.json({
      data: colleges,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    return handleError(error)
  }
}