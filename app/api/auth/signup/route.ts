import { NextResponse, NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma" // Corrected: Reuses the safe global database instance pool
import { handleError } from "@/lib/apiError"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // 1. Enforce payload parameter inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    // 2. Prevent profile duplication via unique email index matching
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      )
    }

    // 3. Transform plaintext string safely via salted crypt iterations
    const hashedPassword = await bcrypt.hash(password, 12)

    // 4. Save record to Neon instance table mappings
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    })

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }, { status: 201 })

  } catch (error) {
    return handleError(error)
  }
}