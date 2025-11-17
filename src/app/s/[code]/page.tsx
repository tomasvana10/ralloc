import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { BasePage } from "@/components/base-page";
import GroupSessionViewer from "@/components/group-session-viewer";
import {
  doesGroupSessionExist,
  getGroupSessionByCode,
} from "@/db/group-session";

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

  if (!(await doesGroupSessionExist(code))) notFound();

  return (
    <BasePage returnTo="/">
      <GroupSessionViewer code={code} />
    </BasePage>
  );
}
