import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import z from "zod";

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
  parseResult: z.ZodSafeParseError<T>
) {
  const { name, message } = parseResult.error;
  return Response.json({ name, message }, { status: 400 });
}
