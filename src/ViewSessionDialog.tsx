import { useEffect, useId, useState, type ReactNode } from "react";
import {
  describeRemoteRuntimeSetup,
  parseViewerJoinInput,
  resolveSessionRuntimeTarget,
  resolveViewerSessionByKey,
  type ResolveSessionFailure,
  type ResolvedRuntimeSession,
  type SessionMode,
} from "./sessionLinks";

type FeedbackTone = "error" | "success";
type JoinMethod = "public-room-key" | "private-invite" | null;

type FeedbackMessage = {
  tone: FeedbackTone;
  text: string;
};

const wizardSteps = [
  {
    key: "method",
    label: "Join method",
    title: "How are you joining?",
    description: "Choose the kind of access you were given.",
  },
  {
    key: "details",
    label: "Details",
    title: "Enter your details",
    description: "Keep this step simple and only ask for what is needed.",
  },
  {
    key: "ready",
    label: "Ready",
    title: "Ready to join",
    description: "Review the details, then join the session.",
  },
] as const;

type WizardStep = (typeof wizardSteps)[number]["key"];

function ViewSessionDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<WizardStep>("method");
  const [joinMethod, setJoinMethod] = useState<JoinMethod>(null);
  const [roomKeyInput, setRoomKeyInput] = useState("");
  const [privateInviteInput, setPrivateInviteInput] = useState("");
  const [viewerName, setViewerName] = useState("");
  const [viewerEmail, setViewerEmail] = useState("");
  const [sessionMode, setSessionMode] = useState<SessionMode>("local");
  const [isResolving, setIsResolving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [resolvedSession, setResolvedSession] =
    useState<ResolvedRuntimeSession | null>(null);
  const [resolvedViewerUrl, setResolvedViewerUrl] = useState("");
  const methodGroupName = useId();
  const targetGroupName = useId();

  useEffect(() => {
    if (!feedback || feedback.tone !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback(null);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedback]);

  useEffect(() => {
    if (step === "ready" || !feedback?.tone) {
      return;
    }

    setFeedback(null);
  }, [feedback?.tone, step]);

  const parsedPublicInput = parseViewerJoinInput(roomKeyInput);
  const parsedPrivateInput = parseViewerJoinInput(privateInviteInput);
  const publicRoomKey = parsedPublicInput.roomKey;
  const privateRoomKey = parsedPrivateInput.roomKey;
  const privateAccessToken = parsedPrivateInput.accessToken;
  const hasPrivateInvite = Boolean(privateRoomKey && privateAccessToken);
  const runtimeTarget = resolveSessionRuntimeTarget(sessionMode);
  const remoteRuntimePending = sessionMode === "remote" && !runtimeTarget.isReady;
  const remoteSetupNote = describeRemoteRuntimeSetup();
  const stepIndex = wizardSteps.findIndex((wizardStep) => wizardStep.key === step);
  const stepMeta = wizardSteps[stepIndex];
  const trimmedViewerName = viewerName.trim();
  const trimmedViewerEmail = viewerEmail.trim();
  const canAdvance =
    step === "method"
      ? Boolean(joinMethod)
      : joinMethod === "public-room-key"
        ? Boolean(publicRoomKey)
        : hasPrivateInvite;
  const joinDisabled =
    isResolving ||
    remoteRuntimePending ||
    !joinMethod ||
    (joinMethod === "public-room-key" ? !publicRoomKey : !hasPrivateInvite);

  const clearResolvedState = () => {
    setResolvedSession(null);
    setResolvedViewerUrl("");
  };

  const handleMethodChange = (nextMethod: Exclude<JoinMethod, null>) => {
    setJoinMethod(nextMethod);
    clearResolvedState();
    setFeedback(null);
  };

  const handleRoomKeyChange = (value: string) => {
    setRoomKeyInput(value);
    clearResolvedState();
    setFeedback(null);
  };

  const handlePrivateInviteChange = (value: string) => {
    setPrivateInviteInput(value);
    clearResolvedState();
    setFeedback(null);
  };

  const handleSessionModeChange = (mode: SessionMode) => {
    setSessionMode(mode);
    clearResolvedState();
    setFeedback(null);
  };

  const goBack = () => {
    if (step === "details") {
      setStep("method");
      return;
    }

    if (step === "ready") {
      setStep("details");
    }
  };

  const goNext = () => {
    if (step === "method" && joinMethod) {
      setStep("details");
      return;
    }

    if (step === "details" && canAdvance) {
      setStep("ready");
    }
  };

  const handleResolvedAction = async (action: "join" | "copy") => {
    if (!joinMethod) {
      return;
    }

    const key = joinMethod === "public-room-key" ? publicRoomKey : privateRoomKey;
    const accessToken =
      joinMethod === "private-invite" ? privateAccessToken : undefined;

    setIsResolving(true);
    setFeedback(null);

    const result = await resolveViewerSessionByKey({
      key,
      accessToken,
      mode: sessionMode,
    });

    setIsResolving(false);

    if (!result.ok) {
      clearResolvedState();
      setFeedback({
        tone: "error",
        text: getViewerJoinErrorMessage(result, joinMethod),
      });
      return;
    }

    setResolvedSession(result.session);
    setResolvedViewerUrl(result.viewerUrl);

    if (action === "copy") {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(result.viewerUrl);
          setFeedback({ tone: "success", text: "Viewer link copied." });
          return;
        }
      } catch {}

      setFeedback({
        tone: "error",
        text: "Clipboard is unavailable here. The resolved link stays visible in Advanced details.",
      });
      return;
    }

    setFeedback({
      tone: "success",
      text: "Session found. Opening the viewer now.",
    });
    window.location.assign(result.viewerUrl);
  };

  const renderMethodStep = () => (
    <section
      className="wizard-step-panel"
      aria-labelledby="view-session-step-method"
    >
      <p className="wizard-step-copy">{stepMeta.description}</p>

      <div className="wizard-choice-grid" role="radiogroup" aria-label="Join method">
        <ChoiceCard
          checked={joinMethod === "public-room-key"}
          description="Use this if the host gave you a room key for the session."
          label="Public room key"
          name={methodGroupName}
          onChange={() => handleMethodChange("public-room-key")}
        />

        <ChoiceCard
          checked={joinMethod === "private-invite"}
          description="Use this if the host sent you a private viewer invite."
          label="Private invite"
          name={methodGroupName}
          onChange={() => handleMethodChange("private-invite")}
        />
      </div>

      <p className="wizard-helper-note">
        Private sessions cannot be joined with only the room key.
      </p>
    </section>
  );

  const renderOptionalViewerFields = () => (
    <section className="wizard-surface wizard-optional-surface">
      <div className="wizard-section-copy">
        <span className="field-label">Optional viewer details</span>
        <p className="wizard-note">
          These stay on this website only and are not sent during session
          lookup.
        </p>
      </div>

      <div className="wizard-detail-grid">
        <label className="field">
          <span className="field-label">Viewer name</span>
          <input
            className="input"
            type="text"
            value={viewerName}
            onChange={(event) => setViewerName(event.target.value)}
            placeholder="Optional"
          />
          <span className="field-support">Optional</span>
        </label>

        <label className="field">
          <span className="field-label">Viewer email</span>
          <input
            className="input"
            type="email"
            value={viewerEmail}
            onChange={(event) => setViewerEmail(event.target.value)}
            placeholder="Optional"
          />
          <span className="field-support">Optional</span>
        </label>
      </div>
    </section>
  );

  const renderDetailsStep = () => (
    <section
      className="wizard-step-panel"
      aria-labelledby="view-session-step-details"
    >
      <p className="wizard-step-copy">{stepMeta.description}</p>

      {joinMethod === "public-room-key" ? (
        <>
          <section className="wizard-surface">
            <label className="field">
              <span className="field-label">Room key</span>
              <input
                className="input"
                type="text"
                value={roomKeyInput}
                onChange={(event) => handleRoomKeyChange(event.target.value)}
                placeholder="Enter the room key"
              />
              <span className="field-support">
                Enter the room key the host shared with you.
              </span>
            </label>
          </section>

          {renderOptionalViewerFields()}
        </>
      ) : (
        <>
          <section className="wizard-surface">
            <label className="field">
              <span className="field-label">Private invite link</span>
              <input
                className="input"
                type="text"
                value={privateInviteInput}
                onChange={(event) => handlePrivateInviteChange(event.target.value)}
                placeholder="Paste the private invite link"
              />
              <span className="field-support">
                {privateInviteInput.trim() && !hasPrivateInvite
                  ? "Paste the full private invite the host shared with you."
                  : "Paste the private invite the host shared with you."}
              </span>
            </label>
          </section>

          {renderOptionalViewerFields()}
        </>
      )}
    </section>
  );

  const renderReadyStep = () => (
    <section
      className="wizard-step-panel wizard-ready-panel"
      aria-labelledby="view-session-step-ready"
    >
      <p className="wizard-step-copy">{stepMeta.description}</p>

      <section className="wizard-surface wizard-review-surface">
        <div className="wizard-section-copy">
          <span className="field-label">Session details</span>
          <p className="wizard-note">A quick final check before you join.</p>
        </div>

        <dl className="summary-grid wizard-review-grid">
          <SummaryItem
            label="Join method"
            value={
              joinMethod === "private-invite"
                ? "Private invite"
                : "Public room key"
            }
          />
          {joinMethod === "public-room-key" ? (
            <SummaryItem label="Room key" value={publicRoomKey} />
          ) : (
            <SummaryItem
              label="Private invite"
              value={summarizeInvite(privateInviteInput)}
            />
          )}
          {trimmedViewerName ? (
            <SummaryItem label="Viewer name" value={trimmedViewerName} />
          ) : null}
          {trimmedViewerEmail ? (
            <SummaryItem label="Viewer email" value={trimmedViewerEmail} />
          ) : null}
        </dl>
      </section>

      <section className="wizard-action-stack">
        <article className="wizard-action-card">
          <div className="wizard-action-copy">
            <span className="field-label">Join action</span>
            <h3>Join session</h3>
            <p>
              {joinMethod === "private-invite"
                ? "We’ll verify the private invite first, then open the viewer."
                : "We’ll check the room key first, then open the viewer."}
            </p>
            {remoteRuntimePending ? (
              <p className="wizard-note">
                Shared-room lookup is not available on this site right now.
              </p>
            ) : null}
          </div>

          <div className="preview-actions wizard-action-row">
            <button
              className="button button-primary"
              disabled={joinDisabled}
              type="button"
              onClick={() => void handleResolvedAction("join")}
            >
              {isResolving ? "Joining..." : "Join session"}
            </button>
          </div>

          {feedback ? (
            <p
              className={`copy-feedback ${feedback.tone === "error" ? "is-error" : ""}`}
              role={feedback.tone === "error" ? "alert" : "status"}
            >
              {feedback.text}
            </p>
          ) : null}
        </article>
      </section>

      <details className="advanced-details">
        <summary>Advanced details</summary>
        <div className="advanced-details-body">
          <p className="subtle-note">
            Use this only if you need to change the connection target or copy
            the resolved viewer link manually.
          </p>

          <div
            className="wizard-choice-grid wizard-choice-grid-compact"
            role="radiogroup"
            aria-label="Connection target"
          >
            <ChoiceCard
              checked={sessionMode === "local"}
              compact
              description="Resolve against the runtime on this computer."
              label="This computer"
              name={targetGroupName}
              onChange={() => handleSessionModeChange("local")}
            />

            <ChoiceCard
              checked={sessionMode === "remote"}
              compact
              description="Use a shared-room runtime if this site is connected to one."
              label="Shared room"
              name={targetGroupName}
              onChange={() => handleSessionModeChange("remote")}
            />
          </div>

          <dl className="advanced-details-grid">
            <SummaryItem
              label="Connection"
              value={
                sessionMode === "local"
                  ? "This computer"
                  : remoteRuntimePending
                    ? "Shared room not connected yet"
                    : "Shared room"
              }
            />
            <SummaryItem
              label="Runtime page"
              value={
                remoteRuntimePending
                  ? "Not available yet"
                  : runtimeTarget.httpOrigin
              }
            />
            <SummaryItem
              label="Realtime sync"
              value={
                remoteRuntimePending ? "Not available yet" : runtimeTarget.wsUrl
              }
            />
            <SummaryItem
              label="Resolved viewer link"
              value={resolvedViewerUrl || "Created after the session is verified."}
            />
          </dl>

          {resolvedSession ? (
            <p className="subtle-note">
              {resolvedSession.visibility === "private"
                ? "Private invite verified."
                : "Public room found."}{" "}
              {resolvedSession.title
                ? `Session title: ${resolvedSession.title}.`
                : "The session title is not set yet."}
            </p>
          ) : null}

          {remoteRuntimePending ? (
            <p className="subtle-note">{remoteSetupNote}</p>
          ) : null}

          <div className="preview-actions wizard-action-row">
            <button
              className="button button-secondary"
              disabled={joinDisabled}
              type="button"
              onClick={() => void handleResolvedAction("copy")}
            >
              {isResolving ? "Checking..." : "Resolve and copy link"}
            </button>
          </div>
        </div>
      </details>
    </section>
  );

  return (
    <div className="start-session-wizard">
      <header className="wizard-header">
        <div className="wizard-header-top">
          <div className="wizard-heading">
            <p className="section-kicker wizard-eyebrow">View a session</p>
            <h2 id={`view-session-step-${step}`}>{stepMeta.title}</h2>
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

        <ol className="wizard-progress" aria-label="Session join progress">
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
        {step === "method" ? renderMethodStep() : null}
        {step === "details" ? renderDetailsStep() : null}
        {step === "ready" ? renderReadyStep() : null}
      </div>

      <footer className="wizard-footer">
        {step === "method" ? (
          <span className="wizard-footer-spacer" aria-hidden="true" />
        ) : (
          <button className="button button-secondary" type="button" onClick={goBack}>
            Back
          </button>
        )}

        {step === "method" || step === "details" ? (
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
  compact = false,
}: {
  label: string;
  description: string;
  name: string;
  checked: boolean;
  onChange: () => void;
  compact?: boolean;
}) {
  return (
    <label
      className={`wizard-choice-card ${checked ? "is-selected" : ""} ${compact ? "is-compact" : ""}`.trim()}
    >
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

function summarizeInvite(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Not added yet";
  }

  if (trimmedValue.length <= 56) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, 28)}...${trimmedValue.slice(-18)}`;
}

function getViewerJoinErrorMessage(
  result: ResolveSessionFailure,
  joinMethod: Exclude<JoinMethod, null>,
) {
  switch (result.code) {
    case "missing-room-key":
      return joinMethod === "private-invite"
        ? "That invite link looks incomplete."
        : "Enter the room key first.";
    case "session-not-found":
      return "This session could not be found.";
    case "private-invite-required":
      return "This session needs a private invite from the host.";
    case "invalid-private-invite":
      return "That invite link looks incomplete.";
    case "runtime-unreachable":
    case "runtime-not-configured":
      return result.runtimeTarget.mode === "remote"
        ? "The remote session target is not available right now."
        : "The session target is not available right now.";
    case "invalid-response":
      return "The session details are not available right now. Try again in a moment.";
    default:
      return result.message;
  }
}

export default ViewSessionDialog;
