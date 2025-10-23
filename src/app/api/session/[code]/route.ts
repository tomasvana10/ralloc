import { auth } from "@/auth";
import { deleteGroupSession } from "@/db/session";
import { getHostId } from "@/db/session/helpers";

export async function DELETE({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = (await auth())!;
  const { code } = await params;
  const hostId = await getHostId(code);

  if (session.user.id !== hostId)
    return new Response("unauthorised", { status: 403 });

  await deleteGroupSession(hostId, code);
  return new Response("success");
}
