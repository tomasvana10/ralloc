import { randomBytes } from "node:crypto";
import type { Session } from "next-auth";
import type { SupportedProvider } from "@/auth/data";
import type { Version } from "@/types";

export const VERSION: Version = "v1";

/**
 * Utility class that supports the storage of users in the Redis
 * database as a set of fields, allowing other clients to reconstruct
 * information such as their name and avatar URL.
 */
export class UserRepresentation {
  public userId: string;
  public name: string;
  public avatarUrl: string;
  public provider: SupportedProvider;

  private avatarId: string;

  /**
   * ASCII Information Separator One
   */
  public static UNIT_SEPARATOR = "\u001f";
  /**
   * ASCII Information Separator Two
   */
  public static UNIT_EMPTY = "\u001e";

  private static SERIALISATION_ORDER = [
    /**
     * WARNING: userId must always be the first field of the user representation
     * If it must be changed, you will have to refactor these parts of the code:
     *   1. user-representation.ts#areSameCompressedUser()
     *   2. leave-group.lua:29  (removing groupMembers set item; comparing raw id to compressed)
     *   3. remove-group.lua:28 (removing userGroup mappings   ; comparing compressed to raw id)
     */
    "userId",
    "name",
    "provider",
    "avatarId",
  ] as const;

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
    "^" +
      this.SERIALISATION_ORDER.map(() => `([^${this.UNIT_SEPARATOR}]+)`).join(
        this.UNIT_SEPARATOR,
      ) +
      "$",
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

  /**
   * Deserialise a compressed string to a {@link UserRepresentation}.
   */
  public static fromCompressedString(compressedString: string) {
    const matches = compressedString.match(
      UserRepresentation.DECOMPRESSION_MATCHER,
    );
    if (!matches) throw new Error("Invalid compressed string format");

    const data = UserRepresentation.SERIALISATION_ORDER.reduce(
      (acc, field, index) => {
        acc[field] = matches[index + 1];
        return acc;
      },
      {} as Record<
        (typeof UserRepresentation.SERIALISATION_ORDER)[number],
        string
      >,
    );

    return new UserRepresentation({
      userId: data.userId,
      name: data.name,
      provider: data.provider as SupportedProvider,
      avatar: { id: data.avatarId },
    });
  }

  /**
   * Serialise this {@link UserRepresentation} to a compressed string.
   */
  public toCompressedString() {
    return UserRepresentation.SERIALISATION_ORDER.map(
      (field) => this[field],
    ).join(UserRepresentation.UNIT_SEPARATOR);
  }

  /**
   * Compare two compressed strings to see if their ids match (and thus
   * are the same user)
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
