window.domready = require('domready');
window.shoe = require('shoe');
window.dnode = require('dnode');
window.midi = {};
domready (
	function() {
		var stream = shoe('/dnode');
		var d = dnode();
		d.on (
			'remote', function(r) {
				window.midi.play = r.play;
				window.midi.stop = r.stop;
				console.log("MIDI ready.");
			}
		);
		d.pipe(stream).pipe(d);
	}
);
