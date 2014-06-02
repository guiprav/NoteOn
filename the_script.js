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
    Array.Flatten = function(data) {
        this.data = data;
    };
    Array.prototype.map = function(fn) {
        var result = [];
        this.forEach (
            function(element, index) {
                var mapped_element = fn(element, index);
                if(mapped_element.constructor === Array.Flatten) {
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
midi.bpm = 200;
midi.quarter_length = 60 / midi.bpm;
function make_midi_note(note, moment = null, length = null) {
    moment = moment || 0;
    length = length || midi.quarter_length;
    return [
        { moment: moment, type: midi.note_on, note: note, velocity: 127 }
        , { moment: moment + length, type: midi.note_off, note: note, velocity: 127 }
    ];
}
function make_note(note, moment = null, length = null) {
    return {
        note: note
        , moment: moment || 0
        , length: length || midi.quarter_length
    };
}
function to_midi(note) {
    return new Array.Flatten(make_midi_note(note.note, note.moment, note.length));
}
function make_melody(type) {
    var melody = [].slice.call(arguments, 1);
    var moment = 0;
    function throw_invalid_element_error(element) {
        throw new Error("Invalid '" + type + "' melody element: " + JSON.stringify(element));
    }
    return melody.map (
        function(element, index) {
            var result = {
                moment: moment
                , length: midi.quarter_length
            };
            if(!Array.isArray(element)) {
                result[type] = element;
            }
            else {
                if(element[0] === undefined) {
                    throw_invalid_element_error(element);
                }
                if(element[1]) {
                    result.length /= element[1];
                }
                result[type] = element[0];
            }
            if(typeof(result[type]) !== 'number') {
                throw_invalid_element_error(element);
            }
            moment += result.length;
            return result;
        }
    );
}
function add_base_note(note) {
    return function(element) {
        element.note += note - 1;
        return element;
    };
}
function cycle(array) {
    return new Proxy (
        array, {
            get: function (target, name) {
                if (!name.match(/^[+\-]?[1-9][0-9]*$/)) {
                    return array[name];
                }
                var index = parseInt(name);
                if (index >= 0) {
                    return array[index % array.length];
                }
                else {
                    return array[(array.length - 1) + ((index + 1) % array.length)];
                }
            }
        }
    );
}
//var major_scale = cycle([0, 2, 4, 5, 7, 9, 11, 12]);
//var natural_minor_scale = cycle([0, 2, 3, 5, 7, 8, 10, 12]);
var major_scale = cycle([2, 2, 1, 2, 2, 2, 1]);
var natural_minor_scale = cycle([2, 1, 2, 2, 1, 2, 2]);
function to_scale(scale) {
    return function(element) {
        var i;
        var result_note = 0;
        if(element.interval > 0) {
            for(i = 0; i < element.interval; ++i) {
                result_note += scale[i];
            }
        }
        else
        if(element.interval < 0) {
            for(i = 0; i <= Math.abs(element.interval); ++i) {
                result_note -= scale[-i];
            }
        }
        element.note = result_note;
        return element;
    };
}
(function test_stuff() {
    /*
    midi.play (
        make_melody (
            'interval',
            2, 2, 1, 3, 4, 4, [3, 0.5],
            [2, 0.5], 2, 1, [2, 0.5], 2
        )
        .map(to_scale(major_scale))
        .map(add_base_note(54))
        .map(to_midi)
    );
    */
    console.log(make_melody('interval', 1, 2, 3, 4).map(to_scale(major_scale)))
    //midi.play(make_melody('interval', 1, 2, 3, 4, 5, 6, 7).map(to_scale(major_scale)).map(add_base_note(51)).map(to_midi))
    //midi.play(make_melody('note', 49, 50, 51, 52, 55, 52, 55, 52, 52, 51, 50, 57, 50, 50).map(to_midi))
})();









