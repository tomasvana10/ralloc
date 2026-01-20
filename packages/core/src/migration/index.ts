import redis from "@core/db";
import { getLogger } from "@core/logger";
import * as general from "./general";
import * as userRepresentation from "./user-representation";

export interface Migration {
  description: string;
  migrator: () => Promise<void>;
}
export type Migrations = Record<Version, Migration>;

export type Version = `v${number}`;

const getVersionKey = (name: string) => `__version__:${name}`;
const log = getLogger("migration");

export async function migrate() {
  await applyMigrations(
    general.migrations,
    general.name,
    general.latestVersion,
  );
  await applyMigrations(
    userRepresentation.migrations,
    userRepresentation.name,
    userRepresentation.latestVersion,
  );
}

async function applyMigrations(
  migrations: Migrations,
  name: string,
  latestVersion: Version,
) {
  const versionKey = getVersionKey(name);
  let currentVersion = await redis.get(versionKey);
  if (!currentVersion) {
    await redis.set(versionKey, latestVersion);
    currentVersion = latestVersion;
  }

  log.info(`version for '${name}' is ${currentVersion}`);

  if (currentVersion === latestVersion)
    return log.info(
      `no migrations required for '${name}' as it is up to date.`,
    );

  if (!Object.keys(migrations).length)
    return log.warn(`no migrations present for '${name}'.`);

  const currentVersionNumber = parseVersionNumber(currentVersion);
  const versions = (Object.keys(migrations) as Version[]).sort((a, b) => {
    return parseVersionNumber(a) - parseVersionNumber(b);
  });

  for (const newVersion of versions) {
    const targetVersionNumber = parseVersionNumber(newVersion);

    if (targetVersionNumber <= currentVersionNumber) continue;

    const previousVersion = getPreviousVersionNumber(newVersion);
    const data = migrations[newVersion];
    if (data === undefined) {
      log.error(`'${name}' is missing migration data. stopping...`);
      throw new Error(`missing migration data for '${name}@${newVersion}'`);
    }

    log.info(`migrating '${name}@${previousVersion}' to ${newVersion}`);

    try {
      await data.migrator();
      await redis.set(versionKey, newVersion);
      log.info(`migrated '${name}@${previousVersion}' to ${newVersion}`);
    } catch (e) {
      log.error(
        e,
        `failed to migrate '${name}@${previousVersion}' to ${newVersion}. stopping...`,
      );
      throw e;
    }
  }
}

function parseVersionNumber(newVersion: string) {
  return parseInt(newVersion.slice(1), 10);
}

function getPreviousVersionNumber(newVersion: Version) {
  const currentVersionNumber = parseVersionNumber(newVersion);
  return `v${currentVersionNumber - 1}`;
}
