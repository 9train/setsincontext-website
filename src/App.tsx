import { useEffect, useId, useState, type ReactNode } from "react";
import { howItWorksSteps, modeGuides } from "./data";
import DocumentationSection from "./DocumentationSection";
import StartSessionDialog from "./StartSessionDialog";
import ViewSessionDialog from "./ViewSessionDialog";

type ActiveDialog = "start" | "view" | "how" | null;

function App() {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  useEffect(() => {
    if (!activeDialog) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveDialog(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDialog]);

  return (
    <div className="app-shell">
      <div className="ambient ambient-warm" aria-hidden="true" />
      <div className="ambient ambient-cool" aria-hidden="true" />

      <header className="site-header">
        <a className="site-mark" href="#top">
          <span className="site-mark-kicker">Sets In Context</span>
          <strong>Live visual board</strong>
        </a>

        <span className="site-status">Built first for DDJ-FLX6</span>
      </header>

      <main id="top" className="landing">
        <section className="doorway-panel">
          <div className="doorway-copy">
            <p className="doorway-kicker">Visual board first for lessons, coaching, and streams</p>
            <h1>Help the room follow the set.</h1>
            <p className="doorway-summary">
              Sets In Context gives your DDJ-FLX6 a live board that helps
              students, viewers, and second screens follow the set in real
              time.
            </p>

            <div className="doorway-actions">
              <button
                className="button button-primary"
                type="button"
                onClick={() => setActiveDialog("start")}
              >
                Start a session
              </button>

              <button
                className="button button-secondary"
                type="button"
                onClick={() => setActiveDialog("view")}
              >
                View a session
              </button>
            </div>

            <div className="doorway-links">
              <a className="text-link" href="#documentation">
                Documentation
              </a>

              <button
                className="text-link text-link-button"
                type="button"
                onClick={() => setActiveDialog("how")}
              >
                How it works
              </button>
            </div>

            <p className="doorway-note">
              Start here for the teaching board. The runtime still owns
              controller truth, sync, and advanced debugging.
            </p>
          </div>

          <div className="doorway-visual" aria-hidden="true">
            <div className="board-stage">
              <span className="board-stage-label">Live board</span>
              <img src="/project-assets/board.svg" alt="" />
            </div>
          </div>
        </section>

        <DocumentationSection
          onOpenHow={() => setActiveDialog("how")}
        />
      </main>

      <footer className="site-footer">
        <p>Built first for DDJ-FLX6: the website opens the room, and the runtime keeps the controller, sync, and debugger truth.</p>
      </footer>

      {activeDialog === "start" ? (
        <DialogShell
          ariaLabel="Start a session"
          hideHeader
          onClose={() => setActiveDialog(null)}
        >
          <StartSessionDialog onClose={() => setActiveDialog(null)} />
        </DialogShell>
      ) : null}

      {activeDialog === "view" ? (
        <DialogShell
          ariaLabel="View a session"
          hideHeader
          onClose={() => setActiveDialog(null)}
        >
          <ViewSessionDialog onClose={() => setActiveDialog(null)} />
        </DialogShell>
      ) : null}

      {activeDialog === "how" ? (
        <DialogShell
          eyebrow="How it works"
          title="How the room works"
          onClose={() => setActiveDialog(null)}
        >
          <p className="modal-intro">
            Start on the computer with the DDJ-FLX6, share the room, and let
            viewers follow the live board. The website opens the flow; the
            runtime handles the real controller truth underneath.
          </p>

          <ol className="steps-list">
            {howItWorksSteps.map((step) => (
              <li key={step.step} className="step-card">
                <span className="step-count">{step.step}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mode-helper" aria-label="Local and remote modes">
            {modeGuides.map((guide) => (
              <p key={guide.eyebrow}>
                <strong>{guide.eyebrow}:</strong> {guide.text}
              </p>
            ))}
          </div>

          <p className="advanced-layer-note">
            Advanced layer: the debugger remains available when you need exact
            input, mapping, or board-target inspection.
          </p>
        </DialogShell>
      ) : null}
    </div>
  );
}

function DialogShell({
  eyebrow,
  title,
  children,
  onClose,
  hideHeader = false,
  ariaLabel,
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  hideHeader?: boolean;
  ariaLabel?: string;
}) {
  const titleId = useId();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        aria-label={hideHeader ? ariaLabel : undefined}
        aria-labelledby={hideHeader ? undefined : titleId}
        aria-modal="true"
        className="modal-card"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        {hideHeader ? null : (
          <div className="modal-header">
            <div>
              <p className="section-kicker">{eyebrow}</p>
              <h2 id={titleId}>{title}</h2>
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
        )}

        {children}
      </section>
    </div>
  );
}

export default App;
