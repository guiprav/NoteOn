var midi = require('midi');
var out = new midi.output();

out.openPort(1);

function sndmsg (status, note, velocity)
{
	out.sendMessage([status, note, velocity]);
}

var note_on_status = 144;
var note_off_status = 128;

var note_on = sndmsg.bind(null, note_on_status);
var note_off = sndmsg.bind(null, note_off_status);

var ktn = {}; // C8  == 108
var ntk = {}; // 108 ==  C8
(function () {
	var A0 = 0x15; // first note
	var C8 = 0x6C; // last note
	var number2key = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
	for (var n = A0; n <= C8; n++) {
		var octave = (n - 12) / 12 >> 0;
		var name = number2key[n % 12] + octave;
		ktn[name] = n;
		ntk[n] = name;
	}
})();

console.log(ktn);

function play (key, velocity, in_, duration)
{
	var key_on = note_on.bind(null, ktn[key], velocity);
	var key_off = note_off.bind(null, ktn[key], velocity);

	if (in_ === 0)
	{
		key_on();
	}
	else
	{
		setTimeout(key_on, in_);
	}

	setTimeout(key_off, in_ + duration);
}

function play_sequence (sequence)
{
	sequence.forEach
	(
		function (element)
		{
			var key = element.key;
			var velocity = element.velocity || 100;
			var timing = element.timing;

			play(key, velocity, timing[0], timing[1]);
		}
	);
}

var d = 200;

var sequence =
[
	{ key: 'C5', timing: [d * 0, d] },
	{ key: 'D5', timing: [d * 1, d] },
	{ key: 'E5', timing: [d * 2, d] },
	{ key: 'F5', timing: [d * 3, d] },
	{ key: 'G5', timing: [d * 4, d] },
	{ key: 'A5', timing: [d * 5, d] },
	{ key: 'B5', timing: [d * 6, d] }
];

function zip_slot (sequence, slot, array)
{
	array.forEach
	(
		function (data, index)
		{
			sequence[index][slot] = data;
		}
	);

	return sequence;
}

play_sequence(zip_slot(sequence, 'velocity', [100, 90, 80, 70, 60, 40, 30]));

