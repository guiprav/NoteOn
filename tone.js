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

play('C5', 100, 0, 1000);
play('D5', 100, 1000, 1000);
play('Eb5', 100, 2000, 1000);
play('F5', 100, 3000, 1000);
play('G5', 100, 4000, 1000);
play('Ab5', 100, 5000, 1000);
play('Bb5', 100, 6000, 1000);

