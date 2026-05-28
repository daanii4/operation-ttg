/**
 * Sprint 6 / Workstream C — API helpers that translate PermissionError to 403.
 */

import { NextResponse } from "next/server";
import { PermissionError } from "./ttg-permissions";

export function isPermissionError(err: unknown): err is PermissionError {
  return err instanceof PermissionError;
}

export function permissionDeniedResponse(err: PermissionError) {
  return NextResponse.json(
    {
      error: "Forbidden",
      code: "PERMISSION_DENIED",
      permission: err.permission,
    },
    { status: 403 }
  );
}

export function handleApiError(err: unknown) {
  if (isPermissionError(err)) return permissionDeniedResponse(err);
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }
  }
  throw err;
}
