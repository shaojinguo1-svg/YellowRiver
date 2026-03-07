/**
 * API error-handling wrapper — eliminates the repeated try/catch + Unauthorized check
 * pattern across every API route handler.
 *
 * Usage:
 *   export function GET(req: NextRequest) {
 *     return apiHandler("GET /api/foo", async () => {
 *       await requireAdmin();
 *       // ...
 *       return NextResponse.json(data);
 *     });
 *   }
 */

import { NextResponse } from "next/server";

export async function apiHandler(
  label: string,
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    console.error(`${label} error:`, error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
