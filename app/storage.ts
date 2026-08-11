import { env } from "cloudflare:workers";
import { courses as defaultCourses, resourceTypes as defaultResourceTypes, resources as fallbackResources } from "./data";
import type { AdminResource } from "./data";

type D1DatabaseLike = {
  prepare(sql: string): D1PreparedStatementLike;
  batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<T[]>;
};

type D1PreparedStatementLike = {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<{ meta?: { last_row_id?: number } }>;
};

type R2BucketLike = {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBodyLike | null>;
  delete(key: string): Promise<unknown>;
};

type R2ObjectBodyLike = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
};

type StoredResourceRow = {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  course: string;
  type: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
  downloads: number;
  pinned: number;
  weekly: number;
  status: "published" | "hidden";
  r2ObjectKey: string;
};

export type TeacherAccount = {
  id: string;
  name: string;
  username: string;
  password: string;
};

function getD1Binding() {
  return (env as unknown as { DB?: D1DatabaseLike }).DB;
}

function getR2Binding() {
  return (env as unknown as { RESOURCE_BUCKET?: R2BucketLike }).RESOURCE_BUCKET;
}

export function hasCloudflareStorage() {
  return Boolean(getD1Binding() && getR2Binding());
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${bytes} B`;
}

function fileTypeFromName(filename: string, mimeType: string) {
  const extension = filename.split(".").pop();

  if (extension) {
    return extension.toUpperCase();
  }

  return mimeType.split("/").pop()?.toUpperCase() || "FILE";
}

function safeFilename(filename: string) {
  return filename.replace(/[\\/:*?"<>|]+/g, "-").trim() || "blank.html";
}

function mapResourceRow(row: StoredResourceRow): AdminResource {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary || "",
    description: row.description || row.summary || "",
    course: row.course,
    type: row.type,
    filename: row.filename,
    fileType: fileTypeFromName(row.filename, row.mimeType),
    size: formatBytes(row.sizeBytes),
    updatedAt: row.updatedAt.slice(0, 10),
    downloads: row.downloads,
    pinned: Boolean(row.pinned),
    weekly: Boolean(row.weekly),
    status: row.status === "published" ? "公开" : "隐藏",
  };
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
    display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('course', 'resource_type')),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    course_id INTEGER NOT NULL,
    resource_type_id INTEGER NOT NULL,
    owner_user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_weekly INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS resource_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id INTEGER NOT NULL,
    r2_object_key TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    checksum TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    detail TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  "CREATE INDEX IF NOT EXISTS idx_resources_public ON resources(status, is_pinned, updated_at)",
  "CREATE INDEX IF NOT EXISTS idx_resources_owner ON resources(owner_user_id, updated_at)",
  "CREATE INDEX IF NOT EXISTS idx_resource_files_resource ON resource_files(resource_id)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash, expires_at)",
];

async function ensureSchema(db: D1DatabaseLike) {
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
}

async function seedDefaults(db: D1DatabaseLike, bucket?: R2BucketLike) {
  await db
    .prepare(
      "INSERT OR IGNORE INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)",
    )
    .bind("teacher01", "teacher123", "teacher", "信息科技教师")
    .run();

  for (const [index, course] of defaultCourses.entries()) {
    await db
      .prepare(
        "INSERT OR IGNORE INTO categories (type, name, slug, sort_order) VALUES (?, ?, ?, ?)",
      )
      .bind("course", course, `course-${toSlug(course)}`, index)
      .run();
  }

  for (const [index, resourceType] of defaultResourceTypes.entries()) {
    await db
      .prepare(
        "INSERT OR IGNORE INTO categories (type, name, slug, sort_order) VALUES (?, ?, ?, ?)",
      )
      .bind("resource_type", resourceType, `resource-type-${toSlug(resourceType)}`, index)
      .run();
  }

  const existing = await db.prepare("SELECT COUNT(*) AS count FROM resources").first<{ count: number }>();

  if ((existing?.count ?? 0) > 0) {
    return;
  }

  const owner = await db.prepare("SELECT id FROM users WHERE username = ?").bind("teacher01").first<{ id: number }>();

  for (const resource of fallbackResources) {
    const course = await getOrCreateCategory(db, "course", resource.course);
    const type = await getOrCreateCategory(db, "resource_type", resource.type);
    const r2ObjectKey = `seed/${resource.id}/blank.html`;
    const blankContent = `<!doctype html><meta charset="utf-8"><title>${resource.title}</title><p>${resource.title}</p>`;

    if (bucket) {
      await bucket.put(r2ObjectKey, blankContent, {
        httpMetadata: { contentType: "text/html; charset=utf-8" },
      });
    }

    await db
      .prepare(
        `INSERT OR IGNORE INTO resources
          (public_id, title, summary, description, course_id, resource_type_id, owner_user_id, status, is_pinned, is_weekly, download_count, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      )
      .bind(
        resource.id,
        resource.title,
        resource.summary,
        resource.description,
        course.id,
        type.id,
        owner?.id ?? 1,
        "published",
        resource.pinned ? 1 : 0,
        resource.weekly ? 1 : 0,
        resource.downloads,
      )
      .run();

    const stored = await db
      .prepare("SELECT id FROM resources WHERE public_id = ?")
      .bind(resource.id)
      .first<{ id: number }>();

    if (stored) {
      await db
        .prepare(
          `INSERT OR IGNORE INTO resource_files
            (resource_id, r2_object_key, original_filename, stored_filename, mime_type, size_bytes)
            VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(stored.id, r2ObjectKey, resource.filename, "blank.html", "text/html; charset=utf-8", 0)
        .run();
    }
  }
}

async function getOrCreateCategory(db: D1DatabaseLike, type: "course" | "resource_type", name: string) {
  const slug = `${type}-${toSlug(name)}`;
  const existing = await db
    .prepare("SELECT id, name FROM categories WHERE type = ? AND name = ?")
    .bind(type, name)
    .first<{ id: number; name: string }>();

  if (existing) {
    return existing;
  }

  await db
    .prepare("INSERT INTO categories (type, name, slug) VALUES (?, ?, ?)")
    .bind(type, name, slug)
    .run();

  const created = await db
    .prepare("SELECT id, name FROM categories WHERE type = ? AND name = ?")
    .bind(type, name)
    .first<{ id: number; name: string }>();

  if (!created) {
    throw new Error(`无法创建分类：${name}`);
  }

  return created;
}

export async function ensureStorageReady() {
  const db = getD1Binding();

  if (!db) {
    return null;
  }

  await ensureSchema(db);
  await seedDefaults(db, getR2Binding());

  return db;
}

const resourceSelectSql = `
  SELECT
    r.public_id AS id,
    r.title AS title,
    r.summary AS summary,
    r.description AS description,
    c.name AS course,
    rt.name AS type,
    f.original_filename AS filename,
    f.mime_type AS mimeType,
    f.size_bytes AS sizeBytes,
    r.updated_at AS updatedAt,
    r.download_count AS downloads,
    r.is_pinned AS pinned,
    r.is_weekly AS weekly,
    r.status AS status,
    f.r2_object_key AS r2ObjectKey
  FROM resources r
  JOIN categories c ON c.id = r.course_id
  JOIN categories rt ON rt.id = r.resource_type_id
  JOIN resource_files f ON f.resource_id = r.id
`;

export async function listResources(options: { includeHidden?: boolean } = {}) {
  const db = await ensureStorageReady();

  if (!db) {
    return fallbackResources.map((resource) => ({
      ...resource,
      status: "公开" as const,
    }));
  }

  const where = options.includeHidden ? "" : "WHERE r.status = 'published'";
  const rows = await db
    .prepare(`${resourceSelectSql} ${where} ORDER BY r.is_pinned DESC, r.updated_at DESC, r.id DESC`)
    .all<StoredResourceRow>();

  return (rows.results ?? []).map(mapResourceRow);
}

export async function getStoredResource(id: string, options: { includeHidden?: boolean } = {}) {
  const db = await ensureStorageReady();

  if (!db) {
    const fallback = fallbackResources.find((resource) => resource.id === id);
    return fallback
      ? {
          row: null,
          resource: { ...fallback, status: "公开" as const },
        }
      : null;
  }

  const statusClause = options.includeHidden ? "" : "AND r.status = 'published'";
  const row = await db
    .prepare(`${resourceSelectSql} WHERE r.public_id = ? ${statusClause} LIMIT 1`)
    .bind(id)
    .first<StoredResourceRow>();

  if (!row) {
    return null;
  }

  return {
    row,
    resource: mapResourceRow(row),
  };
}

export async function createResource(formData: FormData) {
  const db = await ensureStorageReady();
  const bucket = getR2Binding();

  if (!db || !bucket) {
    throw new Error("D1 或 R2 绑定不可用，当前环境只能预览，不能永久保存上传。");
  }

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim() || "暂无简介";
  const courseName = String(formData.get("course") ?? "").trim();
  const typeName = String(formData.get("type") ?? "").trim();
  const pinned = formData.get("pinned") === "on" ? 1 : 0;
  const weekly = formData.get("weekly") === "on" ? 1 : 0;
  const rawFile = formData.get("file");

  if (!title || !courseName || !typeName) {
    throw new Error("请填写资源标题、所属课程和资源类型。");
  }

  const hasRealFile = rawFile instanceof File && rawFile.size > 0;
  const file = hasRealFile
    ? rawFile
    : new File(["<!doctype html><meta charset=\"utf-8\"><p>空白资源文件</p>"], "blank.html", {
        type: "text/html; charset=utf-8",
      });
  const filename = safeFilename(file.name);
  const publicId = `${toSlug(title) || "resource"}-${Date.now().toString(36)}`;
  const r2ObjectKey = `resources/${publicId}/${filename}`;
  const course = await getOrCreateCategory(db, "course", courseName);
  const resourceType = await getOrCreateCategory(db, "resource_type", typeName);
  const owner = await db.prepare("SELECT id FROM users WHERE username = ?").bind("teacher01").first<{ id: number }>();

  await bucket.put(r2ObjectKey, file, {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
    },
  });

  await db
    .prepare(
      `INSERT INTO resources
        (public_id, title, summary, description, course_id, resource_type_id, owner_user_id, status, is_pinned, is_weekly, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(
      publicId,
      title,
      summary,
      summary,
      course.id,
      resourceType.id,
      owner?.id ?? 1,
      "published",
      pinned,
      weekly,
    )
    .run();

  const stored = await db
    .prepare("SELECT id FROM resources WHERE public_id = ?")
    .bind(publicId)
    .first<{ id: number }>();

  if (!stored) {
    throw new Error("资源信息保存失败。");
  }

  await db
    .prepare(
      `INSERT INTO resource_files
        (resource_id, r2_object_key, original_filename, stored_filename, mime_type, size_bytes)
        VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(stored.id, r2ObjectKey, filename, filename, file.type || "application/octet-stream", file.size)
    .run();

  const created = await getStoredResource(publicId, { includeHidden: true });

  if (!created) {
    throw new Error("资源已保存，但读取失败。");
  }

  return created.resource;
}

export async function listCoursesFromStorage() {
  const db = await ensureStorageReady();

  if (!db) {
    return defaultCourses;
  }

  const rows = await db
    .prepare("SELECT name FROM categories WHERE type = ? AND is_active = 1 ORDER BY sort_order ASC, id ASC")
    .bind("course")
    .all<{ name: string }>();

  return (rows.results ?? []).map((row) => row.name);
}

export async function createCourseInStorage(name: string) {
  const db = await ensureStorageReady();
  const trimmedName = name.trim();

  if (!db) {
    throw new Error("D1 绑定不可用。");
  }

  if (!trimmedName) {
    throw new Error("请填写课程名称。");
  }

  await getOrCreateCategory(db, "course", trimmedName);

  return listCoursesFromStorage();
}

export async function renameCourseInStorage(oldName: string, newName: string) {
  const db = await ensureStorageReady();
  const trimmedOldName = oldName.trim();
  const trimmedNewName = newName.trim();

  if (!db) {
    throw new Error("D1 绑定不可用。");
  }

  if (!trimmedOldName || !trimmedNewName) {
    throw new Error("请填写课程名称。");
  }

  await db
    .prepare("UPDATE categories SET name = ?, slug = ?, updated_at = CURRENT_TIMESTAMP WHERE type = ? AND name = ?")
    .bind(trimmedNewName, `course-${toSlug(trimmedNewName)}`, "course", trimmedOldName)
    .run();

  return listCoursesFromStorage();
}

export async function deleteCourseInStorage(name: string) {
  const db = await ensureStorageReady();
  const trimmedName = name.trim();

  if (!db) {
    throw new Error("D1 绑定不可用。");
  }

  const course = await db
    .prepare("SELECT id FROM categories WHERE type = ? AND name = ?")
    .bind("course", trimmedName)
    .first<{ id: number }>();

  if (!course) {
    return listCoursesFromStorage();
  }

  const usage = await db
    .prepare("SELECT COUNT(*) AS count FROM resources WHERE course_id = ?")
    .bind(course.id)
    .first<{ count: number }>();

  if ((usage?.count ?? 0) > 0) {
    throw new Error("这个课程下还有资源，不能删除。");
  }

  await db.prepare("DELETE FROM categories WHERE id = ?").bind(course.id).run();

  return listCoursesFromStorage();
}

export async function listTeachersFromStorage() {
  const db = await ensureStorageReady();

  if (!db) {
    return [
      {
        id: "teacher-1",
        name: "信息科技教师",
        username: "teacher01",
        password: "teacher123",
      },
    ];
  }

  const rows = await db
    .prepare(
      "SELECT id, display_name AS name, username, password_hash AS password FROM users WHERE role = ? ORDER BY id ASC",
    )
    .bind("teacher")
    .all<TeacherAccount>();

  return (rows.results ?? []).map((teacher) => ({
    ...teacher,
    id: String(teacher.id),
  }));
}

export async function createTeacherInStorage(formData: FormData) {
  const db = await ensureStorageReady();
  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!db) {
    throw new Error("D1 绑定不可用。");
  }

  if (!name || !username || !password) {
    throw new Error("请填写老师姓名、用户名和密码。");
  }

  await db
    .prepare("INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)")
    .bind(username, password, "teacher", name)
    .run();

  return listTeachersFromStorage();
}

export async function deleteTeacherInStorage(id: string) {
  const db = await ensureStorageReady();

  if (!db) {
    throw new Error("D1 绑定不可用。");
  }

  await db.prepare("DELETE FROM users WHERE id = ? AND role = ?").bind(id, "teacher").run();

  return listTeachersFromStorage();
}

export async function updateResourceFlag(id: string, action: string) {
  const db = await ensureStorageReady();

  if (!db) {
    throw new Error("D1 绑定不可用。");
  }

  const target = await db
    .prepare("SELECT is_pinned AS pinned, is_weekly AS weekly, status FROM resources WHERE public_id = ?")
    .bind(id)
    .first<{ pinned: number; weekly: number; status: "published" | "hidden" }>();

  if (!target) {
    throw new Error("资源不存在。");
  }

  if (action === "togglePinned") {
    await db
      .prepare("UPDATE resources SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE public_id = ?")
      .bind(target.pinned ? 0 : 1, id)
      .run();
  } else if (action === "toggleWeekly") {
    await db
      .prepare("UPDATE resources SET is_weekly = ?, updated_at = CURRENT_TIMESTAMP WHERE public_id = ?")
      .bind(target.weekly ? 0 : 1, id)
      .run();
  } else if (action === "toggleStatus") {
    await db
      .prepare("UPDATE resources SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE public_id = ?")
      .bind(target.status === "published" ? "hidden" : "published", id)
      .run();
  } else {
    throw new Error("未知操作。");
  }

  const updated = await getStoredResource(id, { includeHidden: true });

  if (!updated) {
    throw new Error("资源更新后读取失败。");
  }

  return updated.resource;
}

export async function deleteStoredResource(id: string) {
  const db = await ensureStorageReady();
  const bucket = getR2Binding();

  if (!db) {
    throw new Error("D1 绑定不可用。");
  }

  const stored = await db
    .prepare(
      `SELECT r.id AS id, f.r2_object_key AS r2ObjectKey
       FROM resources r
       LEFT JOIN resource_files f ON f.resource_id = r.id
       WHERE r.public_id = ?`,
    )
    .bind(id)
    .first<{ id: number; r2ObjectKey?: string }>();

  if (!stored) {
    throw new Error("资源不存在。");
  }

  if (bucket && stored.r2ObjectKey) {
    await bucket.delete(stored.r2ObjectKey);
  }

  await db.prepare("DELETE FROM resource_files WHERE resource_id = ?").bind(stored.id).run();
  await db.prepare("DELETE FROM resources WHERE id = ?").bind(stored.id).run();
}

export async function readDownloadObject(id: string) {
  const stored = await getStoredResource(id);
  const db = await ensureStorageReady();
  const bucket = getR2Binding();

  if (!stored) {
    return null;
  }

  if (!bucket || !stored.row) {
    const body = `当前环境没有连接 R2，正式部署后会下载文件：${stored.resource.filename}`;
    return {
      resource: stored.resource,
      body,
      contentType: "text/plain; charset=utf-8",
    };
  }

  const object = await bucket.get(stored.row.r2ObjectKey);

  if (!object) {
    return null;
  }

  if (db) {
    await db
      .prepare("UPDATE resources SET download_count = download_count + 1 WHERE public_id = ?")
      .bind(id)
      .run();
  }

  return {
    resource: stored.resource,
    body: object.body,
    contentType: object.httpMetadata?.contentType || "application/octet-stream",
  };
}
