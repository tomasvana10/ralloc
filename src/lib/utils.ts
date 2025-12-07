import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type z from "zod";
import { getRateLimitMessage } from "@/db/rate-limit";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function areSameCase(a: string, b: string) {
  return (
    (a === a.toLowerCase() && b === b.toLowerCase()) ||
    (a === a.toUpperCase() && b === b.toUpperCase())
  );
}

/**
 * Create a {@link Response} based on `parseResult`
 */
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

export async function checkResponse(res: Response, context: string) {
  const json = await res.json().catch(() => null);

  if (res.url.includes("/signin"))
    throw new Error("You aren't authenticated. Please reload the page.");
  if (res.status === 429) throw new Error(getRateLimitMessage(res));

  // successful
  if (res.ok) {
    if (!json) return null;
    return json;
  }

  // unsuccessful
  if (res.status === 403) throw new Error("You don't own this session.");
  if (json) {
    const sharedErrMsg = `An error occurred while processing '${context}'`;

    // the reasoning behind not returning a combination of both the API error and the
    // shared message is ralloc's APIs only return error messages directly if the error
    // can be naturally encountered by the user. this removes the need for concatenating
    // both `sharedErrMsg` and the message from the API.
    throw new Error(json?.error.message ?? sharedErrMsg);
  }

  throw new Error(`Failed to process '${context}' (code ${res.status})`);
}
