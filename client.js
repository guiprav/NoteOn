window.domready = require('domready');
window.shoe = require('shoe');
window.dnode = require('dnode');
window.event_emitter = require('event-emitter');

window.midi = {};

var emitter = event_emitter(midi);

domready
(
	function ()
	{
		var stream = shoe('/dnode');
		var d = dnode();

		d.on
		(
			'remote', function (r)
			{
				window.midi.send = r.send_midi;
				midi.emit('ready');
			}
		);

		d.pipe(stream).pipe(d);
	}
);

midi.on
(
        'ready', function ()
        {
                console.log('MIDI ready.');
        }
);

midi.silence_all = function (velocity)
{
	var A0 = 0x15; // first note
	var C8 = 0x6C; // last note

	for (var i = A0; i <= C8; ++i)
	{
		midi.send(128, i, velocity);
	}
};

