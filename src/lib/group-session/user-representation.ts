import { randomBytes } from "node:crypto";
import type { Session } from "next-auth";
import {
  EPHEMERAL_PROVIDER,
  type OfficialProvider,
  type SupportedProvider,
} from "@/authentication/provider";
import type { Version } from "@/types";

export const VERSION: Version = "v1";

/**
 * Utility class that supports the storage of users in the Redis
 * database as a set of fields, allowing other clients to reconstruct
 * information such as their name and avatar URL.
 */
export class UserRepresentation {
  /**
   * ASCII Information Separator One
   *
   * Used to separate serialised units.
   */
  public static UNIT_SEPARATOR = "\u001f" as const;
  /**
   * ASCII Information Separator Two
   *
   * Use to indicate an empty unit.
   */
  public static UNIT_EMPTY = "\u001e" as const;

  public userId: string;
  public name: string;
  public imageId: string | null;
  public provider: SupportedProvider;

  public image: string | null;

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
    "imageId",
  ] as const satisfies readonly (keyof UserRepresentation)[];
  private static SERIALISED_FIELD_COUNT = this.SERIALISATION_ORDER.length;

  private static PROVIDER_IMAGE_CONFIG: Record<
    OfficialProvider,
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
      matcher:
        /^https?:\/\/lh\d+\.googleusercontent\.com\/(?:a|iA)\/(.+)=s96-c$/,
    },
  };

  private constructor({
    userId,
    name,
    provider,
    imageId,
    image,
  }: {
    userId: string;
    name: string;
    provider: SupportedProvider;
    imageId: string | null;
    image: string | null;
  }) {
    this.userId = userId;
    this.name = name;
    this.provider = provider;
    this.imageId = imageId;
    this.image = image;
  }

  /**
   * Create a new {@link UserRepresentation} from a {@link Session}
   */
  public static from(session: Session) {
    const provider = session.provider as SupportedProvider;
    const name =
      session.user.name || UserRepresentation.generateRandomUsername();
    const { image: _image, imageId: _imageId } = session.user;

    // assume this session doesn't support an image
    let imageId: string | null = null;
    let image: string | null = null;

    // this session supports an image
    if (_image && _imageId) {
      image = _image;
      imageId = _imageId;
    }

    return new UserRepresentation({
      userId: session.user.id,
      name,
      provider,
      imageId,
      image,
    });
  }

  /**
   * Create a new {@link UserRepresentation} by deserialising a compressed string.
   */
  public static fromCompressedString(compressedString: string) {
    const parts = compressedString.split(UserRepresentation.UNIT_SEPARATOR);

    if (parts.length !== UserRepresentation.SERIALISED_FIELD_COUNT) {
      throw new Error(
        `compressed string fields must equal ${UserRepresentation.SERIALISED_FIELD_COUNT}`,
      );
    }

    const [userId, name, _provider, _imageId] = parts;
    const provider = _provider as SupportedProvider;
    const imageId = UserRepresentation.parsePossiblyEmptyUnitvalue(_imageId);

    let image: string | null = null;

    if (provider !== EPHEMERAL_PROVIDER && imageId) {
      image = UserRepresentation.getImageUrl(imageId, provider);
    }

    return new UserRepresentation({
      userId,
      name,
      provider,
      imageId,
      image,
    });
  }

  /**
   * Serialise this {@link UserRepresentation} to a compressed string.
   */
  public toCompressedString() {
    return UserRepresentation.SERIALISATION_ORDER.map(
      (field) => this[field] ?? UserRepresentation.UNIT_EMPTY,
    ).join(UserRepresentation.UNIT_SEPARATOR);
  }

  public toJSONSummary() {
    return {
      image: this.image,
      name: this.name,
      userId: this.userId,
      compressedUser: this.toCompressedString(),
    };
  }

  /**
   * Compare two compressed strings to see if their ids match (and thus
   * are the same user)
   */
  public static areSameCompressedUser(a: string, b: string) {
    const [idA] = a.split(UserRepresentation.UNIT_SEPARATOR, 1);
    const [idB] = b.split(UserRepresentation.UNIT_SEPARATOR, 1);

    return idA === idB;
  }

  /**
   * Extract the avatar ID/discriminator from an avatar URL.
   */
  public static getImageId(image: string, provider: OfficialProvider) {
    const config = UserRepresentation.PROVIDER_IMAGE_CONFIG[provider];

    return image.match(config.matcher)?.[1] ?? null;
  }

  /**
   * Compose an avatar URL from an avatar ID/discriminator and provider.
   */
  private static getImageUrl(imageId: string, provider: OfficialProvider) {
    const { urlPrefix, urlSuffix } =
      UserRepresentation.PROVIDER_IMAGE_CONFIG[provider];

    return `${urlPrefix}${imageId}${urlSuffix}`;
  }

  private static generateRandomUsername() {
    return `User ${randomBytes(4).toString("hex")}`;
  }

  private static parsePossiblyEmptyUnitvalue(value: string) {
    if (value === UserRepresentation.UNIT_EMPTY) return null;
    return value;
  }
}
