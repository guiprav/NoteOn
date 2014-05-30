Array.prototype.merge = function(array_or_element) {
    if(Array.isArray(array_or_element)) {
        this.push.apply(this, array_or_element);
    }
    else {
        this.push(array_or_element);
    }
    return this;
};
midi.note_on = 144;
midi.note_off = 128;
function make_note(note, moment, length = null, strike_velocity = null, off_velocity = null) {
    length = length || 0.2;
    strike_velocity = strike_velocity || 127;
    off_velocity = off_velocity || 127;
    return [
        { moment: moment, type: midi.note_on, note: note, velocity: strike_velocity }
        , { moment: moment + length, type: midi.note_off, note: note, velocity: off_velocity }
    ];
}
