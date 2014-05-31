(function extend_primitives() {
    Array.prototype.merge = function(array_or_element) {
        if(Array.isArray(array_or_element)) {
            this.push.apply(this, array_or_element);
        }
        else {
            this.push(array_or_element);
        }
        return this;
    };
    Array.MergeData = function(data) {
        this.data = data;
    };
    Array.prototype.map = function(fn) {
        var result = [];
        this.forEach (
            function(element, index) {
                var mapped_element = fn(element, index);
                if(mapped_element.constructor === Array.MergeData) {
                    result.merge(mapped_element.data);
                }
                else {
                    result.push(mapped_element);
                }
            }
        );
        return result;
    };
})();
midi.note_on = 144;
midi.note_off = 128;
midi.bpm = 120;
midi.quarter_length = 60 / midi.bpm;
function make_note(note, moment = null, length = null) {
    moment = moment || 0;
    length = length || midi.quarter_length;
    return [
        { moment: moment, type: midi.note_on, note: note, velocity: 127 }
        , { moment: moment + length, type: midi.note_off, note: note, velocity: 127 }
    ];
}
function make_melody() {
    var melody = [].slice.call(arguments, 0);
    return melody.map (
        function(note, index) {
            var length;
            var length_divisor = 1;
            if(Array.isArray(note)) {
                length = note[1] || length;
                if(!note[0]) {
                    note = note[0];
                }
                else {
                    throw new Error("Invalid note: " + JSON.stringify(note));
                }
                note = note[0];
            }
            return make_note(note, midi.quarter_length / length_divisor);
        }
    );
}
(function test_stuff() {
    midi.play([].merge(make_note(51, 0)).merge(make_note(53, 0.2)).merge(make_note(54, 0)).merge(make_note(58, 0.4)))
})();
