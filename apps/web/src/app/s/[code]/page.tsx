import {
  doesGroupSessionExist,
  getGroupSessionByCode,
  getHostId,
} from "@core/db/group-session";
import { UserRepresentation } from "@core/lib/group-session";
import { auth } from "@web/auth";
import { BasePage } from "@web/components/layout/base-page";
import { SessionViewer } from "@web/features/session-viewer";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";

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
  const session = (await auth())!;

  if (!(await doesGroupSessionExist(code))) notFound();
  const hostId = await getHostId(code);
  if (!hostId) notFound();

  const isHost = session.user.id === hostId;

  return (
    <BasePage returnTo={isHost ? "/sessions" : "/"}>
      <SessionViewer
        code={code}
        userRepresentation={UserRepresentation.from(session).toJSONSummary()}
      />
    </BasePage>
  );
}
