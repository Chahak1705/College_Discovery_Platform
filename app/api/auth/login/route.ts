import { NextResponse, NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma" // Corrected: Uses our safe database singleton pool
import { handleError } from "@/lib/apiError"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Defensive Check: Enforce that JWT_SECRET must exist in production environment variables
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is completely missing on the server.")
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret, // Secure: Will never fallback to a compromised default string
      { expiresIn: "7d" }
    )

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })

  } catch (error) {
    return handleError(error)
  }
}