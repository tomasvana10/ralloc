import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import redis from "./redis";

export interface LuaScript {
  sha: string | null;
  source: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadLuaScript(
  name: string,
  relPath: string,
): Promise<LuaScript> {
  const filePath = path.join(__dirname, relPath, name);
  const source = fs.readFileSync(filePath, "utf8");
  return { sha: null, source };
}

export async function getLuaScriptSha(script: LuaScript) {
  if (!script.sha) script.sha = await redis.scriptLoad(script.source);
  return script.sha;
}
