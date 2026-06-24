import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma" // Corrected: Reuses our safe singleton pool
import { handleError } from "@/lib/apiError"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get("ids")

    if (!idsParam) {
      return NextResponse.json(
        { error: "Please provide college ids" },
        { status: 400 }
      )
    }

    const ids = idsParam.split(",").map((id) => parseInt(id))

    if (ids.some(isNaN)) {
      return NextResponse.json(
        { error: "Invalid college IDs" },
        { status: 400 }
      )
    }

    if (ids.length < 2 || ids.length > 3) {
      return NextResponse.json(
        { error: "Please provide 2 or 3 college ids" },
        { status: 400 }
      )
    }

    const colleges = await prisma.college.findMany({
      where: { id: { in: ids } },
      include: {
        placements: true,
        courses: true,
      }
    })

    return NextResponse.json({
      colleges,
      total: colleges.length
    })

  } catch (error) {
    return handleError(error)
  }
}