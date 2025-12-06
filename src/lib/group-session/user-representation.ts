import { randomBytes } from "node:crypto";
import type { Session } from "next-auth";
import type { SupportedProvider } from "@/types";

/**
 * Utility class that supports the storage of users in the Redis
 * database as a set of fields, allowing other clients to reconstruct
 * information such as their name and avatar URL.
 *
 * An alternative to the functionality this class provides would be
 * persistently storing user details on session creation, and having
 * other clients fetch this information from an API.
 */
export class UserRepresentation {
  public userId: string;
  public name: string;
  public avatarUrl: string;
  public provider: SupportedProvider;

  private avatarId: string;

  /**
   * Uses ASCII Information Separator One
   */
  public static UNIT_SEPARATOR = "\u001f";
  /**
   * Uses ASCII Information Separator Two
   */
  public static UNIT_EMPTY = "\u001e";

  private static AVATAR_CONFIG: Record<
    SupportedProvider,
    { urlPrefix: string; urlSuffix: string; matcher: RegExp }
  > = {
    github: {
      urlPrefix: "https://avatars.githubusercontent.com/u/",
      urlSuffix: "?v=4",
      matcher: /^https?:\/\/avatars\.githubusercontent\.com\/u\/(.+)\?v=4$/,
    },
    google: {
      urlPrefix: "https://lh3.googleusercontent.com/a/",
      urlSuffix: "=s96-c",
      matcher: /^https?:\/\/lh3\.googleusercontent\.com\/a\/(.+)=s96-c$/,
    },
  };

  private static DECOMPRESSION_MATCHER = new RegExp(
    `^([^${this.UNIT_SEPARATOR}]+)` + // userId
      `${this.UNIT_SEPARATOR}` +
      `([^${this.UNIT_SEPARATOR}]+)` + // name
      `${this.UNIT_SEPARATOR}` +
      `([^${this.UNIT_SEPARATOR}]+)` + // provider
      `${this.UNIT_SEPARATOR}` +
      `([^${this.UNIT_SEPARATOR}]+)$`, // avatarId
  );

  private static DEFAULT_IMAGE_URL = "https://ui-avatars.com/api/?name=";

  private constructor({
    userId,
    name,
    provider,
    avatar,
  }: {
    userId: string;
    name?: string | null;
    provider: SupportedProvider;
    avatar: {
      url?: string | null;
      id?: string;
    };
  }) {
    this.userId = userId;
    this.name = name ?? `User ${randomBytes(4).toString("hex")}`;
    this.provider = provider;

    const { url: avatarUrl, id: avatarId } = avatar;

    if (avatarUrl === UserRepresentation.UNIT_EMPTY) {
      this.avatarUrl = UserRepresentation.DEFAULT_IMAGE_URL + this.name;
      this.avatarId = UserRepresentation.UNIT_EMPTY;
      return;
    }
    if (avatarId === UserRepresentation.UNIT_EMPTY) {
      this.avatarUrl = UserRepresentation.DEFAULT_IMAGE_URL + this.name;
      this.avatarId = avatarId;
      return;
    }

    this.avatarUrl = avatarUrl ?? this.getAvatarUrl(avatarId!, this.provider);
    this.avatarId = avatarId ?? this.getAvatarId(avatarUrl!, this.provider);
  }

  /**
   * Create a new {@link UserRepresentation} from a {@link Session}
   */
  public static from(session: Session) {
    return new UserRepresentation({
      userId: session.user.id,
      name: session.user.name,
      provider: session.provider as SupportedProvider,
      avatar: { url: session.user?.image },
    });
  }

  public static fromCompressedString(compressedString: string) {
    const [, userId, name, provider, avatarId] = compressedString.match(
      UserRepresentation.DECOMPRESSION_MATCHER,
    ) as string[];

    return new UserRepresentation({
      userId,
      name,
      provider: provider as SupportedProvider,
      avatar: { id: avatarId },
    });
  }

  public toCompressedString() {
    return [this.userId, this.name, this.provider, this.avatarId].join(
      UserRepresentation.UNIT_SEPARATOR,
    );
  }

  /**
   * Compare two compressed strings to see if their ids match
   */
  public static areSameCompressedUser(
    aCompressed: string,
    bCompressed: string,
  ) {
    const indexA = aCompressed.indexOf(UserRepresentation.UNIT_SEPARATOR);
    const indexB = bCompressed.indexOf(UserRepresentation.UNIT_SEPARATOR);

    if (indexA === -1 || indexB === -1) return false;

    return (
      aCompressed.substring(0, indexA) === bCompressed.substring(0, indexB)
    );
  }

  /**
   * Extract the avatar ID/discriminator from an avatar URL.
   */
  private getAvatarId(avatarUrl: string, provider: SupportedProvider) {
    const { matcher } = UserRepresentation.AVATAR_CONFIG[provider];

    return avatarUrl.match(matcher)?.[1] ?? UserRepresentation.UNIT_EMPTY;
  }

  /**
   * Compose an avatar URL from an avatar ID/discriminator and provider.
   */
  private getAvatarUrl(avatarId: string, provider: SupportedProvider) {
    const { urlPrefix, urlSuffix } = UserRepresentation.AVATAR_CONFIG[provider];

    return urlPrefix.concat(avatarId, urlSuffix);
  }
}
