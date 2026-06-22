import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"

export function getUserFromToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      userId: number
      email: string
    }
    return decoded
  } catch {
    return null
  }
}