import { useEffect, useId, useState, type ReactNode } from "react";
import {
  buildHostSessionLink,
  buildViewerSessionLink,
  createEphemeralAccessToken,
  createSuggestedRoomKey,
  describeRemoteRuntimeSetup,
  resolveSessionRuntimeTarget,
  sanitizeRoomKey,
  type SessionMode,
  type SessionVisibility,
} from "./sessionLinks";

type CopyTarget = "host" | "viewer";

const wizardSteps = [
  {
    key: "type",
    label: "Type",
    title: "Where will this session be used?",
    description: "Choose the kind of setup you want to start.",
  },
  {
    key: "privacy",
    label: "Privacy",
    title: "Who should be able to join?",
    description: "Choose how open this session should be.",
  },
  {
    key: "ready",
    label: "Ready",
    title: "Your session is ready",
    description: "Review the details, then open the host page to begin.",
  },
] as const;

type WizardStep = (typeof wizardSteps)[number]["key"];

function StartSessionDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<WizardStep>("type");
  const [sessionTitle, setSessionTitle] = useState("");
  const [hostName, setHostName] = useState("");
  const [roomKeyInput, setRoomKeyInput] = useState(() => createSuggestedRoomKey());
  const [sessionMode, setSessionMode] = useState<SessionMode>("local");
  const [visibility, setVisibility] = useState<SessionVisibility>("private");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [hostAccessToken] = useState(() => createEphemeralAccessToken());
  const typeGroupName = useId();
  const privacyGroupName = useId();

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyFeedback(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyFeedback]);

  useEffect(() => {
    if (step !== "ready" && copyFeedback) {
      setCopyFeedback(null);
    }
  }, [copyFeedback, step]);

  const stepIndex = wizardSteps.findIndex((wizardStep) => wizardStep.key === step);
  const stepMeta = wizardSteps[stepIndex];
  const normalizedRoomKey = sanitizeRoomKey(roomKeyInput) || "studio-a";
  const runtimeTarget = resolveSessionRuntimeTarget(sessionMode);
  const remoteRuntimePending = sessionMode === "remote" && !runtimeTarget.isReady;
  const remoteSetupNote = describeRemoteRuntimeSetup();
  const hostLink = buildHostSessionLink({
    room: normalizedRoomKey,
    mode: sessionMode,
    visibility,
    sessionTitle,
    hostName,
    hostAccessToken: visibility === "private" ? hostAccessToken : undefined,
  });
  const viewerLink =
    visibility === "public"
      ? buildViewerSessionLink({
          room: normalizedRoomKey,
          mode: sessionMode,
          visibility,
          sessionTitle,
          hostName,
        })
      : "";
  const runtimePageValue = remoteRuntimePending
    ? "Not configured yet"
    : runtimeTarget.httpOrigin;
  const realtimeSyncValue = remoteRuntimePending
    ? "Not configured yet"
    : runtimeTarget.wsUrl;
  const remoteHostMessage =
    "Shared-room hosting is not connected on this site yet, so the host page cannot open from here.";
  const remoteViewerMessage =
    "This viewer link will work after shared-room hosting is connected on this site.";
  const privateViewerMessage =
    "Open the host page first to reveal the private viewer invite.";
  const hostActionCopy =
    sessionMode === "local"
      ? "Open the session on the DJ computer to begin."
      : "Open the host page when you are ready to start the shared room.";
  const canAdvance =
    step === "type"
      ? sessionMode === "local" || sessionMode === "remote"
      : visibility === "private" || visibility === "public";

  const copyLink = async (target: CopyTarget, value: string) => {
    const label = target === "host" ? "Host" : "Viewer";

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        setCopyFeedback(`${label} link copied.`);
        return;
      }
    } catch {}

    setCopyFeedback(
      `Clipboard is unavailable here. Open Advanced details to copy the ${label.toLowerCase()} link manually.`,
    );
  };

  const goBack = () => {
    if (step === "privacy") {
      setStep("type");
      return;
    }

    if (step === "ready") {
      setStep("privacy");
    }
  };

  const goNext = () => {
    if (step === "type") {
      setStep("privacy");
      return;
    }

    if (step === "privacy") {
      setStep("ready");
    }
  };

  const renderTypeStep = () => (
    <section className="wizard-step-panel" aria-labelledby="start-session-step-type">
      <p className="wizard-step-copy">{stepMeta.description}</p>

      <div className="wizard-choice-grid" role="radiogroup" aria-label="Session type">
        <ChoiceCard
          checked={sessionMode === "local"}
          description="Use this for OBS, a projector, your own screen, recording, or an in-person lesson."
          label="Local / Presentation"
          name={typeGroupName}
          onChange={() => setSessionMode("local")}
        />

        <ChoiceCard
          checked={sessionMode === "remote"}
          description="Use this when someone else will join from another browser."
          label="Remote / Shared room"
          name={typeGroupName}
          onChange={() => setSessionMode("remote")}
        />
      </div>
    </section>
  );

  const renderPrivacyStep = () => (
    <section className="wizard-step-panel" aria-labelledby="start-session-step-privacy">
      <p className="wizard-step-copy">{stepMeta.description}</p>

      <div className="wizard-choice-grid" role="radiogroup" aria-label="Session privacy">
        <ChoiceCard
          checked={visibility === "private"}
          description="Only people with the invite can join."
          label="Private"
          name={privacyGroupName}
          onChange={() => setVisibility("private")}
        />

        <ChoiceCard
          checked={visibility === "public"}
          description="Anyone with the room key can join."
          label="Public"
          name={privacyGroupName}
          onChange={() => setVisibility("public")}
        />
      </div>

      <p className="wizard-helper-note">
        For private sessions, the viewer invite is revealed after the host opens
        the room.
      </p>
    </section>
  );

  const renderReadyStep = () => (
    <section className="wizard-step-panel wizard-ready-panel" aria-labelledby="start-session-step-ready">
      <p className="wizard-step-copy">{stepMeta.description}</p>

      <section className="wizard-surface">
        <div className="wizard-detail-grid">
          <label className="field">
            <span className="field-label">Session title</span>
            <input
              className="input"
              type="text"
              value={sessionTitle}
              onChange={(event) => setSessionTitle(event.target.value)}
              placeholder="Sunday scratch lesson"
            />
            <span className="field-support">Optional</span>
          </label>

          <label className="field">
            <span className="field-label">Host / DJ display name</span>
            <input
              className="input"
              type="text"
              value={hostName}
              onChange={(event) => setHostName(event.target.value)}
              placeholder="Rafael"
            />
            <span className="field-support">Optional</span>
          </label>

          <label className="field wizard-detail-span">
            <span className="field-label">Room key</span>
            <div className="wizard-room-row">
              <input
                className="input"
                type="text"
                value={roomKeyInput}
                onChange={(event) => setRoomKeyInput(event.target.value)}
                placeholder="practice-room"
              />

              <button
                className="button button-secondary"
                type="button"
                onClick={() => setRoomKeyInput(createSuggestedRoomKey())}
              >
                Regenerate room key
              </button>
            </div>
            <span className="field-support">
              This session will use <code>{normalizedRoomKey}</code>.
            </span>
          </label>
        </div>
      </section>

      <section className="wizard-action-stack">
        <article className="wizard-action-card">
          <div className="wizard-action-copy">
            <span className="field-label">Host actions</span>
            <h3>Open the host page</h3>
            <p>{hostActionCopy}</p>
            {remoteRuntimePending ? (
              <p className="wizard-note">{remoteHostMessage}</p>
            ) : null}
          </div>

          <div className="preview-actions wizard-action-row">
            <a
              className={`button button-primary ${runtimeTarget.isReady ? "" : "is-disabled"}`}
              aria-disabled={!runtimeTarget.isReady}
              href={runtimeTarget.isReady ? hostLink : "#"}
              onClick={(event) => {
                if (!runtimeTarget.isReady) {
                  event.preventDefault();
                }
              }}
              rel="noreferrer noopener"
              tabIndex={runtimeTarget.isReady ? undefined : -1}
              target="_blank"
            >
              Open host page
            </a>

            <button
              className="button button-secondary"
              disabled={!runtimeTarget.isReady}
              type="button"
              onClick={() => copyLink("host", hostLink)}
            >
              Copy host link
            </button>
          </div>
        </article>

        <article className="wizard-action-card wizard-viewer-card">
          <div className="wizard-action-copy">
            <span className="field-label">Viewer access</span>
            <h3>{visibility === "public" ? "Viewer link" : "Private viewer invite"}</h3>
            <p>
              {visibility === "public"
                ? "Share this with viewers joining the session."
                : privateViewerMessage}
            </p>
            {visibility === "public" && remoteRuntimePending ? (
              <p className="wizard-note">{remoteViewerMessage}</p>
            ) : null}
            {visibility === "private" && remoteRuntimePending ? (
              <p className="wizard-note">{remoteHostMessage}</p>
            ) : null}
          </div>

          {visibility === "public" ? (
            <div className="preview-actions wizard-action-row">
              <button
                className="button button-secondary"
                disabled={!runtimeTarget.isReady}
                type="button"
                onClick={() => copyLink("viewer", viewerLink)}
              >
                Copy viewer link
              </button>
            </div>
          ) : (
            <div className="preview-actions wizard-action-row">
              <button className="button button-secondary" disabled type="button">
                Copy viewer link
              </button>
            </div>
          )}
        </article>
      </section>

      {copyFeedback ? (
        <p className="copy-feedback" role="status">
          {copyFeedback}
        </p>
      ) : null}

      <details className="advanced-details">
        <summary>Advanced details</summary>
        <div className="advanced-details-body">
          <p className="subtle-note">
            These details stay out of the main flow but remain available when you
            need to inspect the exact runtime target or copy a link manually.
          </p>

          <dl className="advanced-details-grid">
            <SummaryItem label="Runtime page" value={runtimePageValue} />
            <SummaryItem label="Realtime sync" value={realtimeSyncValue} />
            <SummaryItem
              label="Host link"
              value={
                runtimeTarget.isReady
                  ? hostLink
                  : "Not available until shared-room hosting is connected."
              }
            />
            <SummaryItem
              label={visibility === "public" ? "Viewer link" : "Private viewer invite"}
              value={
                visibility === "public"
                  ? runtimeTarget.isReady
                    ? viewerLink
                    : "Not available until shared-room hosting is connected."
                  : remoteRuntimePending
                    ? "Not available until shared-room hosting is connected."
                    : "Revealed on the host page after the private session starts."
              }
            />
          </dl>

          {remoteRuntimePending ? (
            <p className="subtle-note">{remoteSetupNote}</p>
          ) : null}
        </div>
      </details>
    </section>
  );

  return (
    <div className="start-session-wizard">
      <header className="wizard-header">
        <div className="wizard-header-top">
          <div className="wizard-heading">
            <p className="section-kicker wizard-eyebrow">Start a session</p>
            <h2 id={`start-session-step-${step}`}>{stepMeta.title}</h2>
            <p className="wizard-step-status">
              Step {stepIndex + 1} of {wizardSteps.length}
            </p>
          </div>

          <button
            aria-label="Close dialog"
            className="close-button"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <ol className="wizard-progress" aria-label="Session setup progress">
          {wizardSteps.map((wizardStep, index) => {
            const isCurrent = wizardStep.key === step;
            const isComplete = index < stepIndex;

            return (
              <li
                key={wizardStep.key}
                className={`wizard-progress-item ${isCurrent ? "is-current" : ""} ${isComplete ? "is-complete" : ""}`.trim()}
              >
                <span>{wizardStep.label}</span>
              </li>
            );
          })}
        </ol>
      </header>

      <div className="wizard-body">
        {step === "type" ? renderTypeStep() : null}
        {step === "privacy" ? renderPrivacyStep() : null}
        {step === "ready" ? renderReadyStep() : null}
      </div>

      <footer className="wizard-footer">
        {step === "type" ? <span className="wizard-footer-spacer" aria-hidden="true" /> : null}
        {step !== "type" ? (
          <button className="button button-secondary" type="button" onClick={goBack}>
            Back
          </button>
        ) : null}

        {step === "type" || step === "privacy" ? (
          <button
            className="button button-primary"
            disabled={!canAdvance}
            type="button"
            onClick={goNext}
          >
            Next
          </button>
        ) : (
          <span className="wizard-footer-spacer" aria-hidden="true" />
        )}
      </footer>
    </div>
  );
}

function ChoiceCard({
  label,
  description,
  name,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  name: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className={`wizard-choice-card ${checked ? "is-selected" : ""}`}>
      <input
        className="wizard-choice-input"
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
      />

      <span className="wizard-choice-content">
        <span className="choice-title">{label}</span>
        <span>{description}</span>
      </span>
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="summary-item advanced-summary-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default StartSessionDialog;
