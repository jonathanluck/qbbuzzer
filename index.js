var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var users = {};
var rooms = {};
var ips = {"": ""};
if (typeof __dirname == "undefined")
	__dirname = "C:\\Program Files\\nodejs\\qbbuzzer";

// allows server to send all files needed for the website
files = ['', 'index.html', 'style.css', 'pop.mp3', 'socketio.js', 'qbbuzzer.js', 'buzzsound.mp3'];
files.forEach(function(a){
	app.get('/' + a, function(req, res){
		res.sendFile(__dirname + '/' + a);
	});
});

// has the server start and listen on port 8080
http.listen(8080, function(){
	console.log('listening on *:8080');
});

// sanitizes the name then checks if it is already being used for a specific room
function checkname(testname, room){
	testname = sanitize(testname);
	room = sanitize(room);
	if (room.length == 0)
		room = "default";
	room[room]
	return true;
}
function genrandomname(){
	string = ""
	chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890";
	for (var i = 0; i < Math.round(Math.random() * 7) + 6; i++) {
		string += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return string;

}

// sanitization to prevent XSS attacks
function sanitize(string){
	string = (string + "").trim();
	if (string.length > 60)
		return string.substring(0, 60);
	return string;
}

function addRoom(room){
	if (room.constructor == Room)
		rooms[room.name] = room;
}

function Room(name){
	this.name = name;
	this.users = [];
	this.buzzer = "";
	this.buzz = function(name){
		if (this.buzzer == "") {
			this.buzzer = name;
			this.users.forEach(function(u){
				if (u.name == name)
					u.socket.emit('your buzz', name, (new Date(Date.now()) + "").substring(16, 24));
				else
					u.socket.emit('locked', name, (new Date(Date.now()) + "").substring(16, 24));
			});
		}
	}
	this.clear = function(){
		this.buzzer = "";
		this.users.forEach(function(u){
			u.socket.emit('clear', "")
		});
	}
	this.addUser = function(user){
		user.socket.emit("add names", JSON.stringify(this.users.map(function(u){
			return u.name;
		})),JSON.stringify(this.users.map(function(u){
			return u.socket.id;
		})),false,(new Date(Date.now()) + "").substring(16, 24));
		this.users.forEach(function(u){
			u.socket.emit('add names', '["' + user.name + '"]', '["' + user.socket.id + '"]',true,(new Date(Date.now()) + "").substring(16, 24));
		})
		this.users.push(user);
	}
	this.removeUser = function(user){
		if (this.buzzer == user.name)
			this.clear();
		for (var i = 0; i < this.users.length; i++)
			if (this.users[i] == user)
				this.users.splice(i, 1);
		this.users.forEach(function(u){
			u.socket.emit('remove name', user.name, (new Date(Date.now()) + "").substring(16, 24),user.socket.id);
		})
	}
}

function User(name, socketID, roomName){
	users[socketID] = this;
	if (typeof rooms[roomName] == "undefined")
		addRoom(new Room(roomName));
	this.room = rooms[roomName];
	this.name = name;
	this.socket = io.sockets.connected[socketID];
}

io.on('connection', function(socket){
	ips[socket.id] = socket.request.connection.remoteAddress;
	fs.appendFile('iplog.txt', socket.request.connection.remoteAddress + "\t" + new Date(Date.now()) + "\n");
	// recieves a buzz
	// sends a lock signal to everyone but the buzzer, who gets a signal indicating it is their buzz
	socket.on('buzz', function(buzz){
		users[socket.id].room.buzz(users[socket.id].name);
	});

	// sends a clear signal to all clients and allows anyone to buzz again
	socket.on('clear', function(buzz){
		users[socket.id].room.clear();
	});

	// checks if a name is useable. locks the buzzer if someone has already buzzed.
	// broadcasts to all clients to add the new name
	// adds all current names to new client
	// if the name is already used, then rejects the name
	socket.on('check name', function(name){
		name = sanitize(name);
		if (name.length == 0) {
			name = genrandomname();
		}
		if (checkname(name, socket.room)) {
			io.sockets.connected[socket.id].emit('good name', name);
			
			var user = new User(name, socket.id, socket.room);
			user.room.addUser(user);
		}
		else {
			io.sockets.connected[socket.id].emit('bad name', '');
		}
	});

	socket.on('send room', function(room){
		room = sanitize(room);
		if (room.length > 0) {
			socket.room = room;
			socket.join(room);
			io.sockets.connected[socket.id].emit('get room', room);
		}
		else {
			socket.room = "default";
			socket.join("default");
			io.sockets.connected[socket.id].emit('get room', "default");
		}
	});

	// clears the buzzer when a user that has buzzed disconnects
	// sends a message to all clients telling them to remove disconnected client from their lists
	// frees up the username from the list of names
	socket.on('disconnect', function(){
		var user = users[socket.id];
		if (typeof user !== 'undefined') {
			var room = users[socket.id].room;
			if (typeof room !== 'undefined')
				room.removeUser(users[socket.id]);
		}
		delete users[socket.id];
	});
});

setInterval(function(){
	console.log(new Date(Date.now()));
	console.log("Active users: " + users.length);
	for (var i = 0; i < Object.keys(ips).length; i++) {
		if (Object.keys(ips)[i].length > 0) {
			console.log(Object.keys(ips)[i] + "\t" + ips[Object.keys(ips)[i]]);
		}
	}
	console.log("");
}, 120000);