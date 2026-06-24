import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Corrected: Reuses our centralized database singleton
import { handleError } from "@/lib/apiError"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const collegeId = parseInt(id)

    if (isNaN(collegeId)) {
      return NextResponse.json(
        { error: "Invalid college ID" },
        { status: 400 }
      )
    }

    const college = await prisma.college.findUnique({
      where: { id: collegeId },
      include: {
        courses: true,
        placements: true,
        reviews: true,
        cutoffs: true,
      }
    })

    if (!college) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(college)

  } catch (error) {
    return handleError(error)
  }
}