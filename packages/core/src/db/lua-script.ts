import fs from "node:fs";
import path from "node:path";
import redis from ".";

export interface LuaScript {
  sha: Promise<string> | null;
  source: string;
}

export async function loadLuaScript(name: string): Promise<LuaScript> {
  const filePath = path.join(
    process.cwd(),
    "../../packages/core/src/db/lua",
    `${name}.lua`,
  );
  const source = fs.readFileSync(filePath, "utf8");
  return { sha: null, source };
}

export async function getLuaScriptSha(script: LuaScript) {
  if (!script.sha) script.sha = redis.scriptLoad(script.source);
  return script.sha;
}
