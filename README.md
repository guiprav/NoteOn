NoteOn
======

JavaScriptable music.

Current objectives:

* Define a JSON schema for modelling programmable musical sequences.
    * Sequences include time signatures (optional), notes, chords, and rests. These are _sequence elements_.
    * Notes and chords can be individually or commonly ornamented.
        * Accents, arpeggios, portamenti, vibrato, tremolo, etc.
    * Played element durations are described in terms of beat ratios, seconds, or milliseconds.
    * Start offset and duration may be affected by ornaments, but can also be manually specified.
* Allow sequences, sequence elements, and element properties to be:
    * subdivided, concatenated, extracted, repeated (for sequences),
    * transposed (for sequences and subsequences),
    * reordered (for sequences and subsequences of notes, chords, and / or durations),
    * mirrored (for note-delimited sequences and subsequences of notes and chords),
    * and what else? I'm not sure yet.
* Stack those transformations. This keeps visible the abstractions used by the composer. He can selectively
  flatten them, though.
* Fully-programmable. Graphical interfaces are not the focus right now.
* Generate a canonical sequence of MIDI-like events that can be used to control synthesizers.
* Bind to TSS chiptune emulators, for great justice.