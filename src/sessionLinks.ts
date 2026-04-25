export type SessionMode = "local" | "remote";
export type SessionVisibility = "private" | "public";
type RuntimeRole = "host" | "viewer";
type SessionStatus = "waiting" | "live" | "ended";

export type SessionRuntimeEnv = {
  VITE_REMOTE_RUNTIME_ORIGIN?: string;
  VITE_REMOTE_RUNTIME_WS_URL?: string;
};

export const REMOTE_RUNTIME_ORIGIN_ENV_VAR = "VITE_REMOTE_RUNTIME_ORIGIN";
export const REMOTE_RUNTIME_WS_ENV_VAR = "VITE_REMOTE_RUNTIME_WS_URL";
const defaultSessionMode: SessionMode = "remote";

type SessionLinkOptions = {
  room: string;
  mode?: SessionMode;
  visibility?: SessionVisibility;
  sessionTitle?: string;
  hostName?: string;
  viewerName?: string;
  viewerEmail?: string;
  accessToken?: string;
  hostAccessToken?: string;
};

export type SessionRuntimeTarget = {
  mode: SessionMode;
  httpOrigin: string;
  hostPath: "/host.html",
  viewerPath: "/viewer.html",
  launcherPath: "/index.html",
  wsUrl: string;
  isReady: boolean;
};

export type ResolvedRuntimeSession = {
  ok: true;
  room: string;
  mode: SessionMode;
  visibility: SessionVisibility;
  title: string;
  hostName: string;
  status: SessionStatus;
  viewerCount: number;
  hostCount: number;
  adHoc: boolean;
  joinUrlPath?: string;
};

export type ResolveSessionFailureCode =
  | "missing-room-key"
  | "session-not-found"
  | "private-invite-required"
  | "invalid-private-invite"
  | "runtime-unreachable"
  | "runtime-not-configured"
  | "invalid-response";

export type ResolveSessionSuccess = {
  ok: true;
  roomKey: string;
  resolveUrl: string;
  runtimeTarget: SessionRuntimeTarget;
  session: ResolvedRuntimeSession;
  viewerUrl: string;
};

export type ResolveSessionFailure = {
  ok: false;
  code: ResolveSessionFailureCode;
  roomKey: string;
  resolveUrl: string | null;
  runtimeTarget: SessionRuntimeTarget;
  message: string;
};

export type ResolveSessionResult = ResolveSessionSuccess | ResolveSessionFailure;

export type ParsedViewerJoinInput = {
  roomKey: string;
  accessToken: string | null;
  inputKind: "room-key" | "invite-link";
};

type SessionResolveResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

type SessionResolveFetch = (input: string) => Promise<SessionResolveResponse>;

const runtimePaths = {
  hostPath: "/host.html",
  viewerPath: "/viewer.html",
  launcherPath: "/index.html",
} as const;

const localRuntimeTarget: SessionRuntimeTarget = {
  mode: "local",
  httpOrigin: "http://localhost:8080",
  wsUrl: "ws://localhost:8787",
  isReady: true,
  ...runtimePaths,
};

const remoteRuntimePlaceholder = {
  httpOrigin: "https://runtime.example.invalid",
  wsUrl: "wss://runtime.example.invalid",
} as const;

const roomAdjectives = [
  "sunset",
  "vinyl",
  "signal",
  "warm",
  "tempo",
  "studio",
];

const roomNouns = ["session", "lesson", "room", "booth", "mix", "set"];

export function describeRemoteRuntimeSetup() {
  return `Set ${REMOTE_RUNTIME_ORIGIN_ENV_VAR} to the deployed runtime HTTP origin. Set ${REMOTE_RUNTIME_WS_ENV_VAR} too when the websocket host is different. Remote is only live after that runtime serves /host.html, /viewer.html, /api/sessions/resolve, /api/sessions/:room/invite, and websocket joins.`;
}

export function createSessionRuntimeTargets(
  env: SessionRuntimeEnv = import.meta.env ?? {},
) {
  const remoteOriginInput = env.VITE_REMOTE_RUNTIME_ORIGIN?.trim();
  const remoteWsInput = env.VITE_REMOTE_RUNTIME_WS_URL?.trim();
  const remoteHttpOrigin =
    normalizeHttpOrigin(remoteOriginInput) ?? remoteRuntimePlaceholder.httpOrigin;
  const remoteWsUrl =
    normalizeWsUrl(remoteWsInput) ??
    (remoteOriginInput ? deriveWsUrlFromHttpOrigin(remoteHttpOrigin) : undefined) ??
    remoteRuntimePlaceholder.wsUrl;

  return {
    local: localRuntimeTarget,
    remote: {
      mode: "remote",
      httpOrigin: remoteHttpOrigin,
      wsUrl: remoteWsUrl,
      isReady: Boolean(normalizeHttpOrigin(remoteOriginInput)),
      ...runtimePaths,
    } satisfies SessionRuntimeTarget,
  } as const;
}

export function resolveSessionRuntimeTarget(
  mode: SessionMode = defaultSessionMode,
  env?: SessionRuntimeEnv,
) {
  const runtimeTargets = createSessionRuntimeTargets(env);

  return mode === "remote" ? runtimeTargets.remote : runtimeTargets.local;
}

export const provisionalRuntimeTargets = createSessionRuntimeTargets();

export const defaultLandingRoom = "studio-a";

export const landingActionLinks = {
  startSession: buildHostSessionLink({ room: defaultLandingRoom }),
  viewSession: buildViewerSessionLink({ room: defaultLandingRoom }),
};

export function sanitizeRoomKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function createSuggestedRoomKey() {
  const adjective =
    roomAdjectives[Math.floor(Math.random() * roomAdjectives.length)];
  const noun = roomNouns[Math.floor(Math.random() * roomNouns.length)];
  const suffix = Math.random().toString(36).slice(2, 6);

  return `${adjective}-${noun}-${suffix}`;
}

export function createEphemeralAccessToken(byteLength = 18) {
  const size = Number.isFinite(byteLength)
    ? Math.max(12, Math.min(48, Math.floor(byteLength)))
    : 18;
  const bytes = new Uint8Array(size);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function buildHostSessionLink(
  options: SessionLinkOptions,
  env?: SessionRuntimeEnv,
) {
  return buildRuntimeLink("host", options, env);
}

export function buildViewerSessionLink(
  options: SessionLinkOptions,
  env?: SessionRuntimeEnv,
) {
  return buildRuntimeLink("viewer", options, env);
}

export function buildSessionResolveUrl(
  key: string,
  mode: SessionMode = defaultSessionMode,
  env?: SessionRuntimeEnv,
  { accessToken }: { accessToken?: string | null } = {},
) {
  const runtimeTarget = resolveSessionRuntimeTarget(mode, env);
  const url = new URL("/api/sessions/resolve", runtimeTarget.httpOrigin);
  const roomKey = sanitizeRoomKey(key);
  const normalizedAccessToken = normalizeAccessToken(accessToken);

  if (roomKey) {
    url.searchParams.set("key", roomKey);
  }

  if (normalizedAccessToken) {
    url.searchParams.set("access", normalizedAccessToken);
  }

  return url.toString();
}

export function buildResolvedViewerSessionLink(
  session: ResolvedRuntimeSession,
  runtimeTarget: SessionRuntimeTarget,
  { accessToken }: { accessToken?: string | null } = {},
) {
  const joinUrlPath = session.joinUrlPath?.trim();
  const normalizedAccessToken = normalizeAccessToken(accessToken);

  if (joinUrlPath) {
    try {
      const resolvedUrl = new URL(joinUrlPath, runtimeTarget.httpOrigin);

      if (
        resolvedUrl.origin === runtimeTarget.httpOrigin &&
        resolvedUrl.pathname === runtimeTarget.viewerPath
      ) {
        if (normalizedAccessToken && !resolvedUrl.searchParams.get("access")) {
          resolvedUrl.searchParams.set("access", normalizedAccessToken);
        }
        return resolvedUrl.toString();
      }
    } catch {}
  }

  const fallbackUrl = new URL(runtimeTarget.viewerPath, runtimeTarget.httpOrigin);
  fallbackUrl.searchParams.set("room", sanitizeRoomKey(session.room) || "studio-a");
  fallbackUrl.searchParams.set("ws", runtimeTarget.wsUrl);
  if (normalizedAccessToken) {
    fallbackUrl.searchParams.set("access", normalizedAccessToken);
  }
  return fallbackUrl.toString();
}

export function parseViewerJoinInput(value: string): ParsedViewerJoinInput {
  const trimmedValue = value.trim();
  const parsedUrl = parseAbsoluteUrl(trimmedValue);

  if (parsedUrl) {
    return {
      roomKey: sanitizeRoomKey(parsedUrl.searchParams.get("room") ?? ""),
      accessToken: normalizeAccessToken(parsedUrl.searchParams.get("access")),
      inputKind: "invite-link",
    };
  }

  return {
    roomKey: sanitizeRoomKey(trimmedValue),
    accessToken: null,
    inputKind: "room-key",
  };
}

export async function resolveViewerSessionByKey(
  {
    key,
    accessToken,
    mode = defaultSessionMode,
    env,
    fetchImpl,
  }: {
    key: string;
    accessToken?: string | null;
    mode?: SessionMode;
    env?: SessionRuntimeEnv;
    fetchImpl?: SessionResolveFetch;
  },
): Promise<ResolveSessionResult> {
  const runtimeTarget = resolveSessionRuntimeTarget(mode, env);
  const roomKey = sanitizeRoomKey(key);
  const normalizedAccessToken = normalizeAccessToken(accessToken);

  if (!roomKey) {
    return {
      ok: false,
      code: "missing-room-key",
      roomKey,
      resolveUrl: null,
      runtimeTarget,
      message: "Enter a room key or paste a private invite link first.",
    };
  }

  const resolveUrl = buildSessionResolveUrl(roomKey, mode, env, {
    accessToken: normalizedAccessToken,
  });

  if (!runtimeTarget.isReady) {
    return {
      ok: false,
      code: "runtime-not-configured",
      roomKey,
      resolveUrl,
      runtimeTarget,
      message:
        mode === "remote"
          ? "Remote session lookup is not configured on this website yet."
          : "The selected runtime target is not ready yet.",
    };
  }

  const fetcher =
    fetchImpl ?? (typeof fetch === "function" ? fetch.bind(globalThis) : undefined);

  if (!fetcher) {
    return {
      ok: false,
      code: "runtime-unreachable",
      roomKey,
      resolveUrl,
      runtimeTarget,
      message: "Session lookup is unavailable in this browser right now.",
    };
  }

  try {
    const response = await fetcher(resolveUrl);
    const payload = await response.json().catch(() => null);

    if (response.status === 404) {
      return {
        ok: false,
        code: "session-not-found",
        roomKey,
        resolveUrl,
        runtimeTarget,
        message: `No session with room key "${roomKey}" was found on this runtime.`,
      };
    }

    if (response.status === 400) {
      return {
        ok: false,
        code: "missing-room-key",
        roomKey,
        resolveUrl,
        runtimeTarget,
        message: "Enter a room key or paste a private invite link first.",
      };
    }

    if (response.status === 403) {
      const errorCode = parseResolveErrorCode(payload);

      if (errorCode === "invite_required") {
        return {
          ok: false,
          code: "private-invite-required",
          roomKey,
          resolveUrl,
          runtimeTarget,
          message:
            "This session is private. Use the private invite link from the host to join it.",
        };
      }

      if (errorCode === "invalid_access") {
        return {
          ok: false,
          code: "invalid-private-invite",
          roomKey,
          resolveUrl,
          runtimeTarget,
          message:
            "That private invite is invalid or no longer matches this session.",
        };
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        code: "runtime-unreachable",
        roomKey,
        resolveUrl,
        runtimeTarget,
        message:
          "The runtime could not resolve that session right now. Check the runtime connection and try again.",
      };
    }

    const session = parseResolvedRuntimeSession(payload);
    if (!session) {
      return {
        ok: false,
        code: "invalid-response",
        roomKey,
        resolveUrl,
        runtimeTarget,
        message:
          "The runtime responded, but the session details were incomplete. Try again in a moment.",
      };
    }

    return {
      ok: true,
      roomKey,
      resolveUrl,
      runtimeTarget,
      session,
      viewerUrl: buildResolvedViewerSessionLink(session, runtimeTarget, {
        accessToken: normalizedAccessToken,
      }),
    };
  } catch {
    return {
      ok: false,
      code: "runtime-unreachable",
      roomKey,
      resolveUrl,
      runtimeTarget,
      message:
        "The runtime could not be reached. Make sure the runtime is running and try again.",
    };
  }
}

function buildRuntimeLink(
  role: RuntimeRole,
  options: SessionLinkOptions,
  env?: SessionRuntimeEnv,
) {
  const runtimeTarget = resolveSessionRuntimeTarget(
    options.mode ?? defaultSessionMode,
    env,
  );
  const path =
    role === "host" ? runtimeTarget.hostPath : runtimeTarget.viewerPath;
  const url = new URL(path, runtimeTarget.httpOrigin);

  url.searchParams.set("room", sanitizeRoomKey(options.room) || "studio-a");
  url.searchParams.set("ws", runtimeTarget.wsUrl);

  url.searchParams.set("mode", options.mode ?? runtimeTarget.mode);
  setOptionalParam(url, "visibility", options.visibility);
  setOptionalParam(url, "sessionTitle", options.sessionTitle);
  setOptionalParam(url, "hostName", options.hostName);
  setOptionalParam(url, "viewerName", options.viewerName);
  setOptionalParam(url, "viewerEmail", options.viewerEmail);
  setOptionalParam(url, "access", normalizeAccessToken(options.accessToken));
  setOptionalParam(
    url,
    "hostAccess",
    normalizeAccessToken(options.hostAccessToken),
  );

  return url.toString();
}

function setOptionalParam(url: URL, key: string, value?: string | null) {
  const nextValue = value?.trim();

  if (!nextValue) {
    return;
  }

  url.searchParams.set(key, nextValue);
}

function normalizeHttpOrigin(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    url.pathname = "/";
    url.search = "";
    url.hash = "";

    return stripTrailingSlash(url.toString());
  } catch {
    return undefined;
  }
}

function normalizeWsUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "ws:" && url.protocol !== "wss:") {
      return undefined;
    }

    url.search = "";
    url.hash = "";

    return stripTrailingSlash(url.toString());
  } catch {
    return undefined;
  }
}

function deriveWsUrlFromHttpOrigin(httpOrigin: string) {
  const url = new URL(httpOrigin);

  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

  return stripTrailingSlash(url.toString());
}

function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeAccessToken(value?: string | null) {
  const nextValue = value?.trim();
  return nextValue ? nextValue.slice(0, 240) : null;
}

function parseAbsoluteUrl(value: string) {
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function parseResolveErrorCode(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Record<string, unknown>;
  return typeof payload.code === "string" ? payload.code : null;
}

function parseResolvedRuntimeSession(value: unknown): ResolvedRuntimeSession | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Record<string, unknown>;
  const viewerCount = payload.viewerCount;
  const hostCount = payload.hostCount;

  if (
    payload.ok !== true ||
    typeof payload.room !== "string" ||
    !isSessionMode(payload.mode) ||
    !isSessionVisibility(payload.visibility) ||
    typeof payload.title !== "string" ||
    typeof payload.hostName !== "string" ||
    !isSessionStatus(payload.status) ||
    !Number.isFinite(viewerCount) ||
    !Number.isFinite(hostCount) ||
    typeof payload.adHoc !== "boolean"
  ) {
    return null;
  }

  const normalizedViewerCount = Number(viewerCount);
  const normalizedHostCount = Number(hostCount);

  return {
    ok: true,
    room: payload.room,
    mode: payload.mode,
    visibility: payload.visibility,
    title: payload.title,
    hostName: payload.hostName,
    status: payload.status,
    viewerCount: normalizedViewerCount,
    hostCount: normalizedHostCount,
    adHoc: payload.adHoc,
    joinUrlPath: typeof payload.joinUrlPath === "string" ? payload.joinUrlPath : undefined,
  };
}

function isSessionMode(value: unknown): value is SessionMode {
  return value === "local" || value === "remote";
}

function isSessionVisibility(value: unknown): value is SessionVisibility {
  return value === "private" || value === "public";
}

function isSessionStatus(value: unknown): value is SessionStatus {
  return value === "waiting" || value === "live" || value === "ended";
}
