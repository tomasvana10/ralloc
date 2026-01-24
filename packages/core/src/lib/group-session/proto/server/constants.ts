/**
 * How many successful responses the server must send to a client before it sends
 * a precautionary {@link Payloads.Synchronise} payload. These responses are generally
 * payloads of {@link Payloads.GroupMembershipStatus}, and since they do not provide the full
 * data, this variable is useful.
 */
export const SUCCESSFUL_RESPONSES_BEFORE_RESYNC = 13;

/**
 * The minimum time in miliseconds between two unsuccessful responses for the server
 * to resend the full group session data.
 */
export const FAILURE_RESYNC_TIMEOUT = 5000;

/**
 * How frequently a ping frame should be sent to the client.
 *
 * Recommended by Cloudflare on [this page](https://developers.cloudflare.com/network/websockets/)
 * to keep sockets alive.
 */
export const PING_INTERVAL_MS = 45000;

/**
 * Largest message size (in bytes) the websocket server will accept.
 */
export const MSG_SIZE_LIMIT = 1024;

/**
 * How many {@link Payloads.MessageRateLimit} payloads within one websocket session is considered
 * suspicious/abusive.
 */
export const MIN_RATELIMITS_CONSIDERED_SUSPICIOUS = 20;
