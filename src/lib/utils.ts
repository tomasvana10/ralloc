import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type z from "zod";
import { SESSION_CODE_CHARACTERS } from "@/lib/group-session";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function areSameCase(a: string, b: string) {
  return (
    (a === a.toLowerCase() && b === b.toLowerCase()) ||
    (a === a.toUpperCase() && b === b.toUpperCase())
  );
}

export function getZodSafeParseErrorResponse<T>(
  parseResult: z.ZodSafeParseError<T>,
) {
  const messages = parseResult.error.issues.map((issue) => issue.message);

  return Response.json(
    {
      error: {
        name: parseResult.error.name,
        message: messages.join("; "),
      },
    },
    { status: 400 },
  );
}

export function generateSessionCode(n: number): string {
  let result = "";
  for (let i = 0; i < n; i++) {
    result +=
      SESSION_CODE_CHARACTERS[
        Math.floor(Math.random() * SESSION_CODE_CHARACTERS.length)
      ];
  }
  return result;
}
