import chalk from "chalk";
import redis from "@/db";
import * as general from "./general";
import * as userRepresentations from "./user-representations";

export interface Migration {
  description: string;
  migrator: () => Promise<void>;
}

export type Version = `v${number}`;

export type Migrations = Record<Version, Migration>;

const getVersionKey = (scope: string) => `__version__:${scope}`;
const log = (msg: string, func: (...args: any[]) => void = console.log) =>
  func(`${chalk.magenta("[MIGRATION]:")} ${msg}`);

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

  log(`Version for '${scope}' is ${currentVersion}`);

  if (currentVersion === latestVersion)
    return log(
      chalk.green(`No migrations required for '${scope}' as it is up to date.`),
    );

  if (!Object.keys(migrations).length)
    return log(
      chalk.cyan(`No migrations present for '${scope}'.`),
      console.warn,
    );

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
      log(
        chalk.red(`'${scope}' is missing migration data. Stopping.`),
        console.error,
      );
      throw new Error(`Missing migration data for '${scope}@${newVersion}'`);
    }

    log(`Migrating '${scope}@${previousVersion}' to ${newVersion}`);

    try {
      await data.migrator();
      await redis.set(versionKey, newVersion);
      log(
        chalk.green(`Migrated '${scope}@${previousVersion}' to ${newVersion}`),
      );
    } catch (error) {
      log(
        chalk.red(
          `Failed to migrate '${scope}@${previousVersion}' to ${newVersion}. Stopping.`,
        ),
        (msg) => console.error(msg, error),
      );
      throw error;
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
