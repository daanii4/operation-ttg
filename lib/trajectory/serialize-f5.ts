import type { F5Result } from "@/lib/calculations/f5";

/** JSON-safe F5 for client trajectory charts. */
export type SerializedF5 = Omit<F5Result, "lockInDate"> & {
  lockInDate: string | null;
};

export function serializeF5(f5: F5Result): SerializedF5 {
  return {
    ...f5,
    lockInDate: f5.lockInDate ? f5.lockInDate.toISOString() : null,
  };
}

export function deserializeF5(f5: SerializedF5): F5Result {
  return {
    ...f5,
    lockInDate: f5.lockInDate ? new Date(f5.lockInDate) : null,
  };
}
