import React from 'react';
import { Mic, Speech, Keyboard } from 'lucide-react';

const SECTIONS = [
  {
    icon: Mic,
    title: 'Mic: play the note',
    body: (
      <>
        <p>
          FretLearn listens for the pitch you play. The right note scores a point. Any other
          note counts as a miss, and you move on to the next prompt. In flashcards a wrong note doesn’t end the
          card: keep playing until you find it or time runs out.
        </p>
        <p>
          On “find it on the A string” prompts you have to play the exact pitch that string makes
          inside your fret range, so the same note on the wrong string usually won’t count. A mic
          can’t tell strings apart when the pitch is identical, though.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tune up first. Notes more than a quarter-tone off can be read as the neighbouring note.</li>
          <li>If it misses quiet notes, turn sensitivity up. If it reacts to room noise, turn it down.</li>
          <li>Acoustic guitars work fine with a phone or laptop mic. For electric guitar, play through an amp or an audio interface.</li>
        </ul>
      </>
    )
  },
  {
    icon: Speech,
    title: 'Voice: call it yourself',
    body: (
      <p>
        Say <strong>“got it”</strong>, <strong>“yes”</strong> or <strong>“correct”</strong> to score a point, and{' '}
        <strong>“missed”</strong>, <strong>“no”</strong> or <strong>“skip”</strong> for a miss. Works in Chrome, Edge and Safari.
        These browsers may send your speech to their own recognition service. Mic mode never sends audio anywhere.
      </p>
    )
  },
  {
    icon: Keyboard,
    title: 'Keys and footswitches',
    body: (
      <p>
        <kbd className="kbd kbd-sm">Space</kbd> or <kbd className="kbd kbd-sm">Enter</kbd> scores a point,{' '}
        <kbd className="kbd kbd-sm">M</kbd> or <kbd className="kbd kbd-sm">Backspace</kbd> is a miss. Bluetooth
        page-turner pedals that send these keys work too. Shortcuts work in every mode.
      </p>
    )
  }
];

export default function InputHelpDialog({ ref }) {
  return (
    <dialog ref={ref} className="modal" aria-labelledby="input-help-title">
      <div className="modal-box max-w-lg">
        <h3 id="input-help-title" className="font-display text-2xl font-bold uppercase tracking-wide">
          How answering works
        </h3>
        <div className="mt-4 space-y-5 text-sm leading-relaxed">
          {SECTIONS.map(({ icon: Icon, title, body }) => (
            <section key={title} className="space-y-2">
              <h4 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide">
                <Icon className="size-5 text-secondary" aria-hidden="true" />
                {title}
              </h4>
              {body}
            </section>
          ))}
        </div>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn">Close</button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
