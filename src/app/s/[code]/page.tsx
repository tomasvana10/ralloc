import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { BasePage } from "@/components/base-page";
import {
  doesGroupSessionExist,
  getGroupSessionByCode,
  getHostId,
} from "@/db/group-session";
import { GroupSessionViewer } from "@/features/group-session-viewer";
import { UserRepresentation } from "@/lib/group-session";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { code } = await params;
  const session = await getGroupSessionByCode(code);

  if (!session) return { title: "Session not found" };

  return {
    title: session.name,
    description: session.description,
  };
}

export default async function GroupSessionPage({ params }: Props) {
  const { code } = await params;
  const rep = UserRepresentation.from((await auth())!);

  if (!(await doesGroupSessionExist(code))) notFound();

  const hostId = (await getHostId(code))!;

  return (
    <BasePage returnTo="/">
      <GroupSessionViewer
        code={code}
        hostId={hostId}
        userRepresentation={{
          avatarUrl: rep.avatarUrl,
          name: rep.name,
          userId: rep.userId,
          compressedUser: rep.toCompressedString(),
        }}
      />
    </BasePage>
  );
}
