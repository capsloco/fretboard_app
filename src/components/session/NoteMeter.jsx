import React from 'react';
import { frequencyToMidi, midiToNoteLabel } from '../../lib/fretLogic';

// The pivot sits below the face, hidden behind the bezel strip that carries the note name
const PIVOT = { x: 100, y: 150 };
const SCALE_RADIUS = 112;
const BEZEL_TOP = 94;
const REST_ANGLE = -52;
const DEGREES_PER_CENT = 0.9; // ±50 cents -> ±45°
const LEVEL_FLOOR_DB = -70;

const TICKS = Array.from({ length: 11 }, (_, i) => -50 + i * 10);

function polar(angleDeg, radius) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: PIVOT.x + radius * Math.sin(rad), y: PIVOT.y - radius * Math.cos(rad) };
}

function arc(fromDeg, toDeg, radius) {
  const from = polar(fromDeg, radius);
  const to = polar(toDeg, radius);
  return `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 1 ${to.x} ${to.y}`;
}

const textAt = (angleDeg, radius) => {
  const { x, y } = polar(angleDeg, radius);
  return { x, y: y + 4, textAnchor: 'middle' };
};

const levelPercent = (db) =>
  Math.max(0, Math.min(100, ((db - LEVEL_FLOOR_DB) / -LEVEL_FLOOR_DB) * 100));

// Meter hardware (bezel, strip) is black in both themes, like the real thing

/**
 * Analog-style meter: the needle shows how sharp or flat the note is,
 * the window shows the note it hears.
 *
 * Fed one of two ways:
 * - frame:   a listener frame; the needle measures against the nearest note (practice screen).
 *            A pitch not clear enough to count as a note shows dimmed, like a held one.
 * - reading: { cents, heardMidi, live, inTune } worked out by the caller, e.g. the tuner
 *            measuring against its target string. The needle pins at the end of the scale
 *            past ±50 cents and dims while a reading is only being held.
 * levelDb (defaults to the frame's) and gateDb drive the level bar and the signal lamp.
 * inTuneCents: half-width of the in-tune band
 */
export default function NoteMeter({
  frame,
  reading,
  levelDb,
  gateDb,
  noteDisplay = 'sharps',
  inTuneCents = 10,
  className = ''
}) {
  let cents = null;
  let heardMidi = null;
  let live = false;
  let inTune = false;
  if (reading) {
    cents = reading.cents ?? null;
    heardMidi = reading.heardMidi ?? null;
    live = Boolean(reading.live);
    inTune = Boolean(reading.inTune);
  } else if (frame) {
    const frequency = frame.frequency ?? frame.heldFrequency ?? null;
    if (frequency) {
      const midiFloat = frequencyToMidi(frequency);
      heardMidi = Math.round(midiFloat);
      cents = (midiFloat - heardMidi) * 100;
      live = Boolean(frame.frequency) && frame.clear !== false;
    }
  }

  const label = heardMidi === null ? null : midiToNoteLabel(heardMidi, noteDisplay);
  // Rounded so a needle settling on zero doesn't write 1e-20deg into the style
  const angle = cents === null ? REST_ANGLE : Math.round(Math.max(-50, Math.min(50, cents)) * DEGREES_PER_CENT * 100) / 100;
  const db = levelDb ?? frame?.levelDb ?? -Infinity;
  const level = levelPercent(db);
  const gate = levelPercent(gateDb);
  const signalOn = Number.isFinite(db) && db >= gateDb;
  const band = inTuneCents * DEGREES_PER_CENT;

  return (
    <div className={`relative rounded-box border-4 border-[#1c1916] shadow-inner overflow-hidden ${className}`}>
      {/* Face */}
      <div className="relative bg-(image:--meter-face) text-(--meter-ink)">
        <svg viewBox="0 0 200 132" className="block w-full" role="img" aria-label={label ? `Hearing ${label.name}${label.octave}` : 'No note detected'}>
          {/* In-tune band: lights up once the note has settled inside it */}
          <path
            d={arc(-band, band, SCALE_RADIUS)}
            className={`transition-opacity duration-150 ${inTune ? 'stroke-success' : 'stroke-accent'}`}
            strokeWidth="8"
            fill="none"
            opacity={inTune ? 1 : 0.85}
          />
          {/* Scale */}
          <path d={arc(-45, 45, SCALE_RADIUS)} stroke="currentColor" strokeWidth="1.2" fill="none" />
          {TICKS.map((tick) => {
            const major = tick % 50 === 0;
            const a = tick * DEGREES_PER_CENT;
            const outer = polar(a, SCALE_RADIUS);
            const inner = polar(a, SCALE_RADIUS - (major ? 12 : 7));
            return (
              <line key={tick} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="currentColor" strokeWidth={major ? 2 : 1.1} />
            );
          })}
          <text {...textAt(-45, SCALE_RADIUS + 10)} className="font-display" fontSize="13" fontWeight="700" fill="currentColor">♭</text>
          <text {...textAt(45, SCALE_RADIUS + 10)} className="font-display" fontSize="13" fontWeight="700" fill="currentColor">♯</text>
          <text
            x={PIVOT.x}
            y={PIVOT.y - SCALE_RADIUS - 6}
            textAnchor="middle"
            className={`font-display ${inTune ? 'fill-success' : ''}`}
            fontSize="9"
            fontWeight="700"
            letterSpacing="1.5"
            fill="currentColor"
          >
            IN TUNE
          </text>

          {/* Needle: quick to follow, dimmed while the last reading is only being held */}
          <g
            className="transition-[transform,opacity] duration-100 ease-out"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
              opacity: cents !== null && !live ? 0.5 : 1
            }}
          >
            <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2={PIVOT.y - SCALE_RADIUS + 3} className="stroke-secondary" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Bezel strip with the note it hears */}
          <rect x="0" y={BEZEL_TOP} width="200" height={132 - BEZEL_TOP} fill="#1c1916" />
          <text
            x={PIVOT.x}
            y="124"
            textAnchor="middle"
            className={`font-display ${inTune ? 'fill-success' : ''}`}
            fill="#ede3ce"
            fontSize="30"
            fontWeight="800"
            opacity={label ? (live ? 1 : 0.5) : 0.3}
          >
            {label ? label.name : '—'}
            {label && <tspan fontSize="16" dy="-11">{label.octave}</tspan>}
          </text>
        </svg>

        {/* Glass */}
        <div className="pointer-events-none absolute inset-0 bg-linear-150 from-white/40 via-white/5 to-transparent" />

        {/* Signal lamp */}
        <span
          className={`absolute top-2 right-2 size-2.5 rounded-full border border-black/40 transition-shadow ${
            signalOn ? 'bg-[#e8452c] shadow-[0_0_8px_2px_rgb(232_69_44/0.7)]' : 'bg-[#6b2a22]'
          }`}
          aria-hidden="true"
        />
      </div>

      {/* Input level with the sensitivity threshold marked */}
      <div className="relative h-1.5 bg-[#1c1916]">
        <div className="h-full bg-primary transition-[width] duration-75" style={{ width: `${level}%` }} />
        <div className="absolute inset-y-0 w-0.5 bg-[#ede3ce]/70" style={{ left: `${gate}%` }} title="Sensitivity threshold" />
      </div>
    </div>
  );
}
