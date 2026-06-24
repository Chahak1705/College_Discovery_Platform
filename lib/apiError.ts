import { NextResponse } from "next/server"

export function handleError(error: unknown) {
  // 1. Log the full, raw error on the server side so YOU can see it in Vercel logs
  console.error(" Internal API Error Logged:", error)

  // 2. Return a sanitized, completely safe message to the client/browser
  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  )
}