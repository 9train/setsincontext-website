# Session Runtime Contract

This document defines the boundary between the website doorway and the DDJ runtime. The website can make session links easier to use, but the runtime remains the source of truth.

## Website Responsibilities

- Start Session builds host links for the selected room, visibility, runtime HTTP origin, and websocket URL.
- View Session resolves room keys before opening the viewer.
- The website may collect optional viewer name/email.
- Viewer name/email must be treated as private participant metadata only.
- The website must not pretend private rooms are joinable by room key alone.
- The website should keep private invite flows honest: a private viewer needs a generated invite link with an access token.
- The website should not store durable account/session data.
- The website should not expose token hashes or host access hashes.
- The website should not send viewer name/email in public resolve requests. If viewer metadata is sent to the runtime later, it must use a runtime path that stores it only as private participant metadata.

## Runtime Responsibilities

- The runtime owns actual session state.
- The runtime owns public/private enforcement.
- The runtime owns invite validation.
- The runtime owns websocket join enforcement.
- The runtime owns durable session, participant, and invite records.
- The runtime persists those records when `SESSION_STORE_FILE` is set.
- The runtime stores only invite/host secret hashes durably, never raw URL tokens.
- The runtime keeps viewer name/email out of public session payloads.

## Link Shapes

Host link:

```text
/host.html?room=<room>&ws=<ws-url>&mode=<mode>&visibility=<visibility>
```

Private host link:

```text
/host.html?room=<room>&ws=<ws-url>&mode=<mode>&visibility=private&hostAccess=<raw-host-access-token>
```

Private viewer invite:

```text
/viewer.html?room=<room>&ws=<ws-url>&access=<raw-viewer-invite-token>
```

Public viewer link:

```text
/viewer.html?room=<room>&ws=<ws-url>&mode=<mode>&visibility=public
```

Resolve lookup:

```text
GET /api/sessions/resolve?key=<room>[&access=<raw-viewer-invite-token>]
```

Current behavior:

- A public viewer link may resolve by room key.
- A private viewer invite includes an access token.
- A private viewer room key alone should fail with `invite_required` or the equivalent UI-safe website error.
- An invalid private viewer invite should fail with `invalid_access` or the equivalent UI-safe website error.
- A private invite response may include a raw access token inside `joinUrlPath`; this is required by current invite URLs and must not be confused with durable storage.

## Environment Variables

Website Vite variables:

- `VITE_REMOTE_RUNTIME_ORIGIN`: deployed runtime HTTP origin used by website-generated runtime links and resolve calls.
- `VITE_REMOTE_RUNTIME_WS_URL`: websocket URL used when it differs from the HTTP origin. If omitted, the website derives `ws://` or `wss://` from `VITE_REMOTE_RUNTIME_ORIGIN`.

Runtime hosting variables:

- `SESSION_STORE_FILE`: optional path to the durable JSON session store. When omitted, session/account-ready records are in-memory only.
- `PORT`: HTTP port. Defaults to `8080`.
- `HOST`: HTTP/WebSocket bind host. Defaults to `0.0.0.0`.
- `WSPORT`: websocket port when not using single-port mode. Defaults to `8787`, or to `PORT` in single-port mode.
- `SINGLE_PORT`: set to `1` to attach websocket handling to the HTTP server.
- `FLY_IO` / `FLY_MACHINE_ID`: also enable single-port behavior in Fly-style deployments.
- `ALLOWED_ORIGIN`: optional single websocket origin allow-list value.
- `ALLOWED_ORIGINS`: optional comma-separated websocket origin allow-list values.
- `NODE_ENV`: affects local development origin allowances.
- `MAP_FILE`: room map persistence path; this affects runtime room hosting state but is separate from account-ready session storage.

## Boundaries

- The website is not the source of truth for session privacy.
- The website should not store durable account/session data.
- The website should not expose token hashes.
- The website should not expose host access hashes.
- The website should not add login, signup, public profile, payment, public discovery, or account dashboard UI around this contract yet.
- Future auth should attach to runtime session and participant records; it should not replace room keys, invite URLs, or websocket enforcement.
