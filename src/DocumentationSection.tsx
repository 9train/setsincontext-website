import { teachingStory } from "./data";

type DocumentationSectionProps = {
  onOpenHow: () => void;
};

function DocumentationSection({ onOpenHow }: DocumentationSectionProps) {
  return (
    <section id="documentation" className="documentation-section">
      <div className="section-copy">
        <p className="section-kicker">For lessons, coaching, and streams</p>
        <h2>Put the board in the room before the debugger.</h2>
        <p>
          Sets In Context keeps the first experience simple: a clear live board
          that helps people follow the DDJ-FLX6 while you teach, coach, stream,
          or rehearse.
        </p>
      </div>

      <div className="documentation-story">
        <div className="documentation-story-copy">
          <p className="card-kicker">Visual board first</p>
          <h3>Make the set visible while it is happening.</h3>
          <p>
            The board is the friendly surface for students, viewers, and second
            screens. The Start and View actions stay close by in the hero, while
            the deeper room details live inside the session dialogs.
          </p>
        </div>

        <ul className="teaching-story-list" aria-label="Where the board helps">
          {teachingStory.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <article className="runtime-reference">
        <div className="runtime-reference-copy">
          <p className="section-kicker">Current product truth</p>
          <h3>The website creates launch links. The runtime owns the controller truth.</h3>
          <p>
            This site handles the handoff into the room. The DDJ-FLX6 runtime
            owns the actual controller, WebMIDI, live board sync, and the
            advanced debugger behavior.
          </p>
          <p className="reference-note">
            No accounts, payments, public browsing, or public-room discovery are
            live here yet.
          </p>
        </div>

        <button
          className="button button-secondary runtime-reference-action"
          type="button"
          onClick={onOpenHow}
        >
          How it works
        </button>
      </article>
    </section>
  );
}

export default DocumentationSection;
