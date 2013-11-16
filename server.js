var http = require('http');
var shoe = require('shoe');
var ecstatic = require('ecstatic')(__dirname + '/static');
var dnode = require('dnode');

var midi = require('midi');
var out = new midi.output();

out.openPort(1);

function send_midi (status, note, velocity)
{
        out.sendMessage([status, note, velocity]);
}

var server = http.createServer(ecstatic);
server.listen(9999);

var sock = shoe
(
	function (stream) {
		var d = dnode
		({
			send_midi: send_midi
		});

		d.pipe(stream).pipe(d);
	}
);

sock.install(server, '/dnode');

