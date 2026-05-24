import { NextResponse } from "next/server";

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized", code: "UNAUTHORIZED" },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: "Forbidden", code: "FORBIDDEN" },
    { status: 403 }
  );
}

export function notFoundResponse(code = "NOT_FOUND") {
  return NextResponse.json({ error: "Not found", code }, { status: 404 });
}

export function badRequestResponse(message: string) {
  return NextResponse.json({ error: message, code: "BAD_REQUEST" }, { status: 400 });
}

export function handleAuthError(err: unknown) {
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
    if (err.message === "FORBIDDEN") return forbiddenResponse();
  }
  throw err;
}
