var http = require('http');
var shoe = require('shoe');
var ecstatic = require('ecstatic')(__dirname + '/static');
var dnode = require('dnode');
var midi = require('midi');
var out = new midi.output();
var sequence = [];
var server;
var socket;
out.openPort(1);
function silence_all() {
	var A0 = 0x15;
	var C8 = 0x6C;
	for (var i = A0; i < C8; ++i) {
		out.sendMessage([128, i, 127]);
	}
}
function stop() {
	sequence = [];
	silence_all();
}
function play(new_sequence) {
	stop();
	sequence = new_sequence;
	delete send_messages.start_timestamp;
}
server = http.createServer(ecstatic);
server.listen(9999);
socket = shoe (
	function (stream) {
		var d = dnode ({
			play: play,
			stop: stop
		});
		d.pipe(stream).pipe(d);
	}
);
socket.install(server, '/dnode');
function timestamp() {
	return Date.now() / 1000;
}
function send_messages() {
	setImmediate(send_messages);
	var now = timestamp();
	var elapsed = (function() {
		var elapsed;
		if(!send_messages.start_timestamp) {
			elapsed = 0;
			send_messages.start_timestamp = now;
		}
		else {
			elapsed = now - send_messages.start_timestamp;
		}
		return elapsed;
	})();
	sequence.forEach (
		function(message) {
			if(message.sent || elapsed < message.moment) {
				return;
			}
			console.log("Sent", message);
			out.sendMessage([message.type, message.note, message.velocity]);
			message.sent = true;
		}
	);
}
send_messages();
