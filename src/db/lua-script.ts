import fs from "node:fs";
import path from "node:path";
import redis from ".";

export interface LuaScript {
  sha: string | null;
  source: string;
}

export async function loadLuaScript(name: string): Promise<LuaScript> {
  const filePath = path.join(
    process.cwd(),
    "src/assets/lua",
    name.concat(".lua"),
  );
  const source = fs.readFileSync(filePath, "utf8");
  return { sha: null, source };
}

export async function getLuaScriptSha(script: LuaScript) {
  if (!script.sha) script.sha = await redis.scriptLoad(script.source);
  return script.sha;
}
