import { deleteGroupSession, getGroupSessionCodesOfHost } from "./crud";

export async function pruneUserData(hostId: string) {
  const codes = await getGroupSessionCodesOfHost(hostId);
  await Promise.all(codes.map((code) => deleteGroupSession(hostId, code)));
}
