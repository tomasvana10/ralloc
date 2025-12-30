import redis from "@core/db";
import { getLogger } from "../logger";
import * as general from "./general";
import * as userRepresentations from "./user-representations";

export interface Migration {
  description: string;
  migrator: () => Promise<void>;
}
export type Migrations = Record<Version, Migration>;

export type Version = `v${number}`;

const getVersionKey = (scope: string) => `__version__:${scope}`;
const log = getLogger("migration");

export async function migrate() {
  await applyMigrations(
    general.migrations,
    general.scope,
    general.latestVersion,
  );
  await applyMigrations(
    userRepresentations.migrations,
    userRepresentations.scope,
    userRepresentations.latestVersion,
  );
}

async function applyMigrations(
  migrations: Migrations,
  scope: string,
  latestVersion: Version,
) {
  const versionKey = getVersionKey(scope);
  let currentVersion = await redis.get(versionKey);
  if (!currentVersion) {
    await redis.set(versionKey, latestVersion);
    currentVersion = latestVersion;
  }

  log.info(`version for '${scope}' is ${currentVersion}`);

  if (currentVersion === latestVersion)
    return log.info(
      `no migrations required for '${scope}' as it is up to date.`,
    );

  if (!Object.keys(migrations).length)
    return log.warn(`no migrations present for '${scope}'.`);

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
      log.error(`'${scope}' is missing migration data. stopping...`);
      throw new Error(`missing migration data for '${scope}@${newVersion}'`);
    }

    log.info(`migrating '${scope}@${previousVersion}' to ${newVersion}`);

    try {
      await data.migrator();
      await redis.set(versionKey, newVersion);
      log.info(`migrated '${scope}@${previousVersion}' to ${newVersion}`);
    } catch (e) {
      log.error(
        e,
        `failed to migrate '${scope}@${previousVersion}' to ${newVersion}. stopping...`,
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
