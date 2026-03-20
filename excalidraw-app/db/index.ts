import {
  createRxDatabase,
  addRxPlugin,
} from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { RxDBDevModePlugin, disableWarnings } from "rxdb/plugins/dev-mode";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import React, { createContext, useContext, useEffect, useState } from "react";
import { commentSchema, reactionSchema } from "./schema";
import type { RxDatabase, RxCollection, RxStorage } from "rxdb";
import type { CommentDocType, ReactionDocType } from "./schema";

const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  addRxPlugin(RxDBDevModePlugin);
  disableWarnings(); // suppress dev-mode / dexie premium upsell noise
}
addRxPlugin(RxDBMigrationSchemaPlugin);

// ─── stable DB name ────────────────────────────────────────────────────────
// Bump this constant whenever the schema changes in a breaking way instead of
// relying on RxDB migrations, which can't handle Dexie's non-required index
// restriction during the migration-open phase.
const DB_NAME = "excalidraw_collab_v2";

// Names of every IDB database RxDB may have created for this project.
// Keep old names here so they get cleaned up on the next load.
const LEGACY_DB_NAMES = ["excalidraw_collab", "excalidraw_collab_v2"];

function getStorage(): RxStorage<any, any> {
  const base = getRxStorageDexie();
  // Dev mode requires a validating storage wrapper
  return isDev ? wrappedValidateAjvStorage({ storage: base }) : base;
}

export type AppDatabase = RxDatabase<{
  comments: RxCollection<CommentDocType>;
  reactions: RxCollection<ReactionDocType>;
}>;

/** Delete a single IndexedDB database by name, resolving when done. */
function deleteIdb(name: string): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve(); // best-effort
      req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Wipe all known project databases so the next init starts from scratch. */
async function nukeAllProjectDbs(): Promise<void> {
  await Promise.all(LEGACY_DB_NAMES.map(deleteIdb));

  // If the browser supports listing all IDB dbs, also sweep any stragglers.
  if ("databases" in indexedDB) {
    const all = await (indexedDB as any).databases() as Array<{ name?: string }>;
    await Promise.all(
      all
        .filter((d) => d.name?.startsWith("excalidraw_collab"))
        .map((d) => deleteIdb(d.name!)),
    );
  }
}

async function createDb(): Promise<AppDatabase> {
  const db = await createRxDatabase<{
    comments: RxCollection<CommentDocType>;
    reactions: RxCollection<ReactionDocType>;
  }>({
    name: DB_NAME,
    storage: getStorage(),
    ignoreDuplicate: true,
  });
  await db.addCollections({
    comments: { schema: commentSchema },
    reactions: { schema: reactionSchema },
  });
  return db;
}

let _db: AppDatabase | null = null;

export async function getDatabase(): Promise<AppDatabase> {
  if (_db) return _db;
  try {
    _db = await createDb();
  } catch (err) {
    // Stale IDB with an incompatible schema (e.g. old index layout or version
    // mismatch).  Wipe everything and start fresh — acceptable in dev; in prod
    // you would run proper migrations instead.
    console.warn(
      "[RxDB] Init failed due to stale schema — wiping IndexedDB and retrying.",
      err,
    );
    _db = null;
    await nukeAllProjectDbs();
    _db = await createDb();
  }
  return _db;
}

const DbContext = createContext<AppDatabase | null>(null);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<AppDatabase | null>(null);

  useEffect(() => {
    getDatabase().then(setDb);
  }, []);

  if (!db) return null;

  return React.createElement(DbContext.Provider, { value: db }, children);
};

export function useDb(): AppDatabase {
  const db = useContext(DbContext);
  if (!db) throw new Error("useDb must be used inside <DbProvider>");
  return db;
}
