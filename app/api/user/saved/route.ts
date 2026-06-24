import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma" // Corrected: Linked to our shared database singleton
import { getUserFromToken } from "@/lib/auth"
import { handleError } from "@/lib/apiError"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please login first" },
        { status: 401 }
      )
    }

    const savedColleges = await prisma.savedCollege.findMany({
      where: { userId: user.userId },
      include: {
        college: true
      }
    })

    return NextResponse.json({
      data: savedColleges.map((s) => s.college),
      total: savedColleges.length
    })

  } catch (error) {
    return handleError(error)
  }
}