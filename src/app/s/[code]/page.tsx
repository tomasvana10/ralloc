import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { BasePage } from "@/components/base-page";
import { getGroupSessionByCode } from "@/db/session";
import { doesGroupSessionExist } from "@/db/session/helpers";

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
      <p>placeholder (you are viewing session {code})</p>
    </BasePage>
  );
}
