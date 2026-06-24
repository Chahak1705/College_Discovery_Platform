import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma" // Corrected: Reuses our safe singleton pool
import { getUserFromToken } from "@/lib/auth"
import { handleError } from "@/lib/apiError"

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - please login first" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { collegeId } = body

    if (!collegeId) {
      return NextResponse.json(
        { error: "College ID is required" },
        { status: 400 }
      )
    }

    const college = await prisma.college.findUnique({
      where: { id: collegeId }
    })

    if (!college) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      )
    }

    const alreadySaved = await prisma.savedCollege.findUnique({
      where: {
        userId_collegeId: {
          userId: user.userId,
          collegeId
        }
      }
    })

    if (alreadySaved) {
      return NextResponse.json(
        { error: "College already saved" },
        { status: 400 }
      )
    }

    const saved = await prisma.savedCollege.create({
      data: {
        userId: user.userId,
        collegeId
      }
    })

    return NextResponse.json({
      message: "College saved successfully",
      saved
    }, { status: 201 })

  } catch (error) {
    return handleError(error) // Securely intercepts any unexpected operational failure
  }
}