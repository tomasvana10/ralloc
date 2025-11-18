export interface CheckResponseSettings {
  hasJSONBody: boolean;
  errCtx: string;
}

export async function checkResponse(
  res: Response,
  settings: CheckResponseSettings,
) {
  const { errCtx, hasJSONBody } = settings;

  if (res.url.includes("/signin"))
    throw new Error("You are unauthenticated. Please reload the page.");
  if (res.status === 429)
    throw new Error(
      "You are sending too many requests. Please try again soon.",
    );

  // successful
  if (res.ok) {
    if (!hasJSONBody) return null;

    try {
      return await res.json();
    } catch {
      throw new Error(
        `Invalid response body received from server when processing '${errCtx}'`,
      );
    }
  }

  // unsuccessful
  if (res.status === 403) throw new Error("You don't own this session.");
  if (hasJSONBody) {
    const sharedErrMsg = `An error occurred while processing '${errCtx}'`;
    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new Error(sharedErrMsg);
    }

    // the reasoning behind not returning a combination of both the API error and the
    // shared message is ralloc's APIs only return error messages directly if the error
    // can be naturally encountered by the user. this removes the need for concatenating
    // both `sharedErrMsg` and the message from the API.
    throw new Error(json?.error.message ?? sharedErrMsg);
  }

  throw new Error(`Failed to process '${errCtx}' (code ${res.status})`);
}
