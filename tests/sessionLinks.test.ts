import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResolvedViewerSessionLink,
  buildSessionResolveUrl,
  buildHostSessionLink,
  buildViewerSessionLink,
  parseViewerJoinInput,
  createSessionRuntimeTargets,
  resolveViewerSessionByKey,
  resolveSessionRuntimeTarget,
  sanitizeRoomKey,
} from "../src/sessionLinks.js";

test("sanitizeRoomKey keeps room keys stable and URL-safe", () => {
  assert.equal(sanitizeRoomKey("  Sunday Scratch Lesson!  "), "sunday-scratch-lesson");
  assert.equal(sanitizeRoomKey("___"), "");
});

test("local host links use the localhost runtime and preserve metadata", () => {
  const hostAccessToken = "host-token-123";
  const link = new URL(
    buildHostSessionLink({
      room: "Practice Room",
      mode: "local",
      visibility: "private",
      sessionTitle: "Sunday scratch lesson",
      hostName: "Rafael",
      hostAccessToken,
    }),
  );

  assert.equal(`${link.origin}${link.pathname}`, "http://localhost:8080/host.html");
  assert.equal(link.searchParams.get("room"), "practice-room");
  assert.equal(link.searchParams.get("ws"), "ws://localhost:8787");
  assert.equal(link.searchParams.get("mode"), "local");
  assert.equal(link.searchParams.get("visibility"), "private");
  assert.equal(link.searchParams.get("sessionTitle"), "Sunday scratch lesson");
  assert.equal(link.searchParams.get("hostName"), "Rafael");
  assert.equal(link.searchParams.get("hostAccess"), hostAccessToken);
});

test("generated session links default to the remote runtime", () => {
  const env = {
    VITE_REMOTE_RUNTIME_ORIGIN: "https://runtime.ddj.test",
  };
  const hostLink = new URL(
    buildHostSessionLink(
      {
        room: "Shared Room",
        visibility: "private",
        hostAccessToken: "host-token-123",
      },
      env,
    ),
  );
  const viewerLink = new URL(
    buildViewerSessionLink(
      {
        room: "Shared Room",
        visibility: "public",
      },
      env,
    ),
  );
  const resolveUrl = new URL(buildSessionResolveUrl("Shared Room", undefined, env));

  assert.equal(`${hostLink.origin}${hostLink.pathname}`, "https://runtime.ddj.test/host.html");
  assert.equal(hostLink.searchParams.get("mode"), "remote");
  assert.equal(hostLink.searchParams.get("ws"), "wss://runtime.ddj.test");
  assert.equal(
    `${viewerLink.origin}${viewerLink.pathname}`,
    "https://runtime.ddj.test/viewer.html",
  );
  assert.equal(viewerLink.searchParams.get("mode"), "remote");
  assert.equal(
    `${resolveUrl.origin}${resolveUrl.pathname}`,
    "https://runtime.ddj.test/api/sessions/resolve",
  );
  assert.equal(resolveUrl.searchParams.get("key"), "shared-room");
});

test("session resolve URLs reuse the centralized runtime target and keep private access when present", () => {
  const resolveUrl = new URL(
    buildSessionResolveUrl("  Practice Room  ", "local", undefined, {
      accessToken: "invite-token-1",
    }),
  );

  assert.equal(
    `${resolveUrl.origin}${resolveUrl.pathname}`,
    "http://localhost:8080/api/sessions/resolve",
  );
  assert.equal(resolveUrl.searchParams.get("key"), "practice-room");
  assert.equal(resolveUrl.searchParams.get("access"), "invite-token-1");
});

test("remote viewer links stay honest with placeholder targets until configured", () => {
  const accessToken = "viewer-token-456";
  const runtimeTarget = resolveSessionRuntimeTarget("remote", {});
  const link = new URL(
    buildViewerSessionLink(
      {
        room: "Public Lesson",
        mode: "remote",
        visibility: "public",
        viewerName: "Ari",
        viewerEmail: "ari@example.com",
        accessToken,
      },
      {},
    ),
  );

  assert.equal(runtimeTarget.isReady, false);
  assert.equal(
    `${link.origin}${link.pathname}`,
    "https://runtime.example.invalid/viewer.html",
  );
  assert.equal(link.searchParams.get("room"), "public-lesson");
  assert.equal(link.searchParams.get("ws"), "wss://runtime.example.invalid");
  assert.equal(link.searchParams.get("mode"), "remote");
  assert.equal(link.searchParams.get("visibility"), "public");
  assert.equal(link.searchParams.get("viewerName"), "Ari");
  assert.equal(link.searchParams.get("viewerEmail"), "ari@example.com");
  assert.equal(link.searchParams.get("access"), accessToken);
});

test("remote runtime config can derive a ws target from the configured origin", () => {
  const env = {
    VITE_REMOTE_RUNTIME_ORIGIN: "https://runtime.ddj.test",
  };
  const runtimeTarget = createSessionRuntimeTargets(env).remote;
  const link = new URL(
    buildHostSessionLink(
      {
        room: "Remote Booth",
        mode: "remote",
      },
      env,
    ),
  );

  assert.equal(runtimeTarget.isReady, true);
  assert.equal(runtimeTarget.httpOrigin, "https://runtime.ddj.test");
  assert.equal(runtimeTarget.wsUrl, "wss://runtime.ddj.test");
  assert.equal(`${link.origin}${link.pathname}`, "https://runtime.ddj.test/host.html");
  assert.equal(link.searchParams.get("ws"), "wss://runtime.ddj.test");
});

test("remote runtime config respects an explicit websocket target", () => {
  const env = {
    VITE_REMOTE_RUNTIME_ORIGIN: "https://runtime.ddj.test",
    VITE_REMOTE_RUNTIME_WS_URL: "wss://sync.ddj.test/socket",
  };
  const link = new URL(
    buildViewerSessionLink(
      {
        room: "Remote Booth",
        mode: "remote",
      },
      env,
    ),
  );

  assert.equal(`${link.origin}${link.pathname}`, "https://runtime.ddj.test/viewer.html");
  assert.equal(link.searchParams.get("ws"), "wss://sync.ddj.test/socket");
});

test("resolved viewer links trust same-origin runtime joinUrlPath and fall back on unsafe origins", () => {
  const runtimeTarget = resolveSessionRuntimeTarget("local");

  const trustedLink = buildResolvedViewerSessionLink(
    {
      ok: true,
      room: "practice-room",
      mode: "local",
      visibility: "private",
      title: "Warmup",
      hostName: "Rafa",
      status: "waiting",
      viewerCount: 0,
      hostCount: 1,
      adHoc: false,
      joinUrlPath: "/viewer.html?room=practice-room&ws=ws%3A%2F%2Flocalhost%3A8787%2F",
    },
    runtimeTarget,
  );

  const fallbackLink = buildResolvedViewerSessionLink(
    {
      ok: true,
      room: "practice-room",
      mode: "local",
      visibility: "private",
      title: "Warmup",
      hostName: "Rafa",
      status: "waiting",
      viewerCount: 0,
      hostCount: 1,
      adHoc: false,
      joinUrlPath: "https://evil.example.com/viewer.html?room=practice-room",
    },
    runtimeTarget,
    { accessToken: "invite-token-1" },
  );

  assert.equal(
    trustedLink,
    "http://localhost:8080/viewer.html?room=practice-room&ws=ws%3A%2F%2Flocalhost%3A8787%2F",
  );
  assert.equal(
    fallbackLink,
    "http://localhost:8080/viewer.html?room=practice-room&ws=ws%3A%2F%2Flocalhost%3A8787&access=invite-token-1",
  );
});

test("parseViewerJoinInput extracts room and access from a pasted private invite link", () => {
  const parsed = parseViewerJoinInput(
    "http://localhost:8080/viewer.html?room=practice-room&ws=ws%3A%2F%2Flocalhost%3A8787&access=invite-token-1",
  );

  assert.equal(parsed.roomKey, "practice-room");
  assert.equal(parsed.accessToken, "invite-token-1");
  assert.equal(parsed.inputKind, "invite-link");
});

test("resolveViewerSessionByKey returns a safe viewer URL for known runtime sessions", async () => {
  let requestedUrl = "";

  const result = await resolveViewerSessionByKey({
    key: "  Practice Room  ",
    mode: "local",
    accessToken: "invite-token-1",
    fetchImpl: async (input) => {
      requestedUrl = input;

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            ok: true,
            room: "practice-room",
            mode: "local",
            visibility: "public",
            title: "Warehouse Warmup",
            hostName: "Rafa",
            status: "live",
            viewerCount: 3,
            hostCount: 1,
            adHoc: false,
            joinUrlPath:
              "/viewer.html?room=practice-room&ws=ws%3A%2F%2Flocalhost%3A8787%2F",
          };
        },
      };
    },
  });

  assert.equal(
    requestedUrl,
    "http://localhost:8080/api/sessions/resolve?key=practice-room&access=invite-token-1",
  );
  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.roomKey, "practice-room");
  assert.equal(result.session.room, "practice-room");
  assert.equal(result.session.visibility, "public");
  assert.equal(
    result.viewerUrl,
    "http://localhost:8080/viewer.html?room=practice-room&ws=ws%3A%2F%2Flocalhost%3A8787%2F&access=invite-token-1",
  );
});

test("resolveViewerSessionByKey maps missing and unreachable runtime states to clean failures", async () => {
  const missing = await resolveViewerSessionByKey({
    key: "Missing Room",
    mode: "local",
    fetchImpl: async () => ({
      ok: false,
      status: 404,
      async json() {
        return { ok: false, error: "session not found", key: "missing-room" };
      },
    }),
  });

  const remotePending = await resolveViewerSessionByKey({
    key: "Remote Booth",
    mode: "remote",
    env: {},
  });

  const unreachable = await resolveViewerSessionByKey({
    key: "Practice Room",
    mode: "local",
    fetchImpl: async () => {
      throw new Error("connect ECONNREFUSED");
    },
  });

  assert.equal(missing.ok, false);
  assert.equal(missing.ok ? "" : missing.code, "session-not-found");
  assert.equal(remotePending.ok, false);
  assert.equal(remotePending.ok ? "" : remotePending.code, "runtime-not-configured");
  assert.equal(unreachable.ok, false);
  assert.equal(unreachable.ok ? "" : unreachable.code, "runtime-unreachable");
});

test("resolveViewerSessionByKey maps private invite enforcement failures to clean UI-safe errors", async () => {
  const inviteRequired = await resolveViewerSessionByKey({
    key: "Private Room",
    mode: "local",
    fetchImpl: async () => ({
      ok: false,
      status: 403,
      async json() {
        return {
          ok: false,
          error: "private invite required",
          code: "invite_required",
          requiresAccess: true,
        };
      },
    }),
  });

  const invalidInvite = await resolveViewerSessionByKey({
    key: "Private Room",
    mode: "local",
    accessToken: "bad-token",
    fetchImpl: async () => ({
      ok: false,
      status: 403,
      async json() {
        return {
          ok: false,
          error: "invalid private invite",
          code: "invalid_access",
          requiresAccess: true,
        };
      },
    }),
  });

  assert.equal(inviteRequired.ok, false);
  assert.equal(
    inviteRequired.ok ? "" : inviteRequired.code,
    "private-invite-required",
  );
  assert.equal(invalidInvite.ok, false);
  assert.equal(
    invalidInvite.ok ? "" : invalidInvite.code,
    "invalid-private-invite",
  );
});
