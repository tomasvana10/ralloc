import { randomBytes } from "node:crypto";
import type { Session } from "next-auth";
import type { SupportedProvider } from "../types";

type SupportedUrlProvider = SupportedProvider | "ui-avatars";

export class UserRepresentation {
  public name: string;
  public userId: string;
  public avatarUrl: string;

  private sessionProvider: SupportedUrlProvider;
  private avatarId: string;

  private static UNIT_SEPARATOR = "\u001f";
  private static NULL_UNIT = "\u001e";

  private static AVATAR_CONFIG: Record<
    SupportedUrlProvider,
    { urlPrefix: string; urlSuffix: string; matcher: RegExp | null }
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
    "ui-avatars": {
      urlPrefix: "https://ui-avatars.com/api/?name=",
      urlSuffix: "",
      matcher: null,
    },
  };

  private static DECOMPRESSION_MATCHER = new RegExp(
    `^([^${this.UNIT_SEPARATOR}]+)` + // name
      `${this.UNIT_SEPARATOR}` +
      `([^${this.UNIT_SEPARATOR}]+)` + // userId
      `${this.UNIT_SEPARATOR}` +
      `([^${this.UNIT_SEPARATOR}]+)` + // provider
      `${this.UNIT_SEPARATOR}` +
      `([^${this.UNIT_SEPARATOR}]+)$`, // avatarId
  );

  private static DEFAULT_IMAGE_URL = this.AVATAR_CONFIG["ui-avatars"].urlPrefix;

  private constructor(
    name: string,
    userId: string,
    sessionProvider: SupportedUrlProvider,
    avatar: { url?: string; id?: string },
  ) {
    this.name = name;
    this.sessionProvider = sessionProvider;
    this.userId = userId;

    const { url: avatarUrl, id: avatarId } = avatar;

    if (sessionProvider === "ui-avatars") {
      this.avatarUrl = UserRepresentation.DEFAULT_IMAGE_URL + name;
      this.avatarId = UserRepresentation.NULL_UNIT;
      return;
    }

    this.avatarUrl =
      avatarUrl ?? this.getAvatarUrl(avatarId!, this.sessionProvider);

    this.avatarId =
      avatarId ?? this.getAvatarId(avatarUrl!, this.sessionProvider);
  }

  public static async from(session: Session) {
    const username =
      session.user.name ?? `User ${randomBytes(10).toString("hex")}`;
    const image =
      session.user?.image ?? UserRepresentation.DEFAULT_IMAGE_URL + username;

    return new UserRepresentation(
      username,
      session.user.id,
      image.startsWith(UserRepresentation.AVATAR_CONFIG["ui-avatars"].urlPrefix)
        ? "ui-avatars"
        : (session.provider as SupportedProvider),
      { url: image },
    );
  }

  public static fromCompressedString(compressedString: string) {
    const [, name, userId, sessionProvider, avatarId] = compressedString.match(
      UserRepresentation.DECOMPRESSION_MATCHER,
    ) as string[];

    return new UserRepresentation(
      name,
      userId,
      sessionProvider as SupportedUrlProvider,
      {
        id: avatarId,
      },
    );
  }

  public static is(userId: string, compressedString: string) {
    return (
      UserRepresentation.fromCompressedString(compressedString).userId ===
      userId
    );
  }

  private getAvatarId(
    avatarUrl: string,
    sessionProvider: SupportedUrlProvider,
  ) {
    const { matcher } = UserRepresentation.AVATAR_CONFIG[sessionProvider];

    return avatarUrl.match(matcher!)?.[1] ?? UserRepresentation.NULL_UNIT;
  }

  private getAvatarUrl(
    avatarId: string,
    sessionProvider: SupportedUrlProvider,
  ) {
    const { urlPrefix, urlSuffix } =
      UserRepresentation.AVATAR_CONFIG[sessionProvider];

    return `${urlPrefix}${avatarId}${urlSuffix}`;
  }

  public toCompressedString() {
    return [this.name, this.userId, this.sessionProvider, this.avatarId].join(
      UserRepresentation.UNIT_SEPARATOR,
    );
  }
}
