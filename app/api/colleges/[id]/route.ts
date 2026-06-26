import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleError } from "@/lib/apiError"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid college ID" }, { status: 400 })
    }

    const college = await prisma.college.findUnique({
      where: { id },
      include: {
        courses: true,
        placements: { orderBy: { year: "desc" } },
        cutoffs: { orderBy: { category: "asc" } },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10
        },
        _count: { select: { reviews: true, savedBy: true } }
      }
    })

    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 })
    }

    return NextResponse.json({ data: college })
  } catch (error) {
    return handleError(error)
  }
}