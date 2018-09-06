var app = require('express')();
var compression = require('compression');
var zlib = require('zlib');
var md5 = require(__dirname+'/md5.js');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var users = {};
var rooms = {};
var ips = {"": ""};
var roomreq = {};
//allows compression of sent resources to reduce bandwith used
app.use(compression(zlib.Z_BEST_COMPRESSION)); 
if(typeof __dirname == "undefined") {
	__dirname = "C:\\Program Files\\nodejs\\qbbuzzer";
}
//list of files the user is allowed to access
files = [
	'',
	'index.html',
	'style.css', 
	'pop.mp3', 
	'socketio.js', 
	'qbbuzzer.js', 
	'buzzsound.mp3', 
	'buzzzzz.mp3', 
	'watch.html', 
	'watch.js'
];
//allows the server to send files to the client in response to a HTTP GET request
files.forEach(function(a){
	app.get('/' + a, function(req, res){
		res.sendFile(__dirname + '/' + a);
	});
});

//sends a 404 error if the requested resource is not found
app.use(function(req, res){
	res.status(404).send('<title>404</title><h1>404: Oh noes! Page not Found</h1><br>Here is a placekitten to make you feel better:<br><br><img src="http://placekitten.com/g/400/500">');
});

//sends a 500 error for internal server errors
app.use(function(req, res){
	res.status(500).send('<title>500</title><h1>500: Oh noes! Internal server error</h1><br>If this error persists, please contact us at contact@qbbuzzer.com<br>Here is a placekitten to make you feel better:<br><br><img src="http://placekitten.com/g/400/500">');
});

//sanitizes the name then checks if it is already being used for a specific room
function checkname(testname, room){
	testname = sanitize(testname);
	room = sanitize(room);
	if(room.length == 0) {
		room = "default";
	}
	if(typeof rooms[room] == "undefined") {
		return false;
	}
	return !(rooms[room].users.map(function(a){
		return a.name
	}).indexOf(testname) > -1);
}

//generates a random username if an empty string is send to the server
function genrandomname(){
	var string = "";
	var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890";
	for (var i = 0; i < Math.round(Math.random() * 7) + 6; i++) {
		string += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return string;
}

//sanitization of user input to remove whitespace and clip length (input validation)
function sanitize(string){
	string = (string + "").trim();
	if(string.length > 50) {
		return string.substring(0, 50);
	}
	return string;
}

//adds new room object to rooms map
function addRoom(room){
	if(room.constructor == Room) {
		rooms[room.name.toLowerCase()] = room;
	}
}

//room object. Contains: name, list of active users, user who has buzzed, user who last buzzed, timestamp of last buzz, timestamp of current buzz
function Room(name){
	this.name = name;
	this.users = [];
	this.buzzer = "";
	this.lastbuzzer = "";
	this.laststamp = "";
	this.stamp = 0;

	//When the server recieves a buzz, sends a lock signal to everyone but the buzzer, who gets a signal indicating it is their buzz. Includes rate limitation to prevent spamming from single user
	this.buzz = function(name){
		if(this.buzzer == "") {
			if(this.lastbuzzer != name || Date.now() - this.laststamp > 500) {
				this.buzzer = name;
				this.users.forEach(function(u){
					if(u.name == name) {
						u.socket.emit('your buzz', name, Date.now());
					}
					else{
						u.socket.emit('locked', name, Date.now());
					}
				});
				this.stamp = Date.now();
				this.laststamp = Date.now();
				this.lastbuzzer = name;
			}
		}
	};
	//clears the buzzer for the room. Includes rate limitation to prevent spam
	this.clear = function(){
		if(Date.now() - this.laststamp > 100) {
			this.buzzer = "";
			this.users.forEach(function(u){
				u.socket.emit('clear', "")
			});
			this.stamp = 0;
		}
	};
	//adds a new user to the room. Sends new user a list of current users in the room. Sends all other users the new user
	this.addUser = function(user){
		
		user.socket.emit("add names", JSON.stringify(this.users.map(function(u){
			return u.name;
		})), JSON.stringify(this.users.map(function(u){
			return md5.CryptoJS.MD5(u.socket.id).toString();
		})), false, Date.now());
		this.users.forEach(function(u){
			u.socket.emit('add names', '["' + user.name + '"]', '["' + md5.CryptoJS.MD5(user.socket.id).toString() + '"]', true, Date.now());
		});
		if(this.buzzer.length>0){
			user.socket.emit("locked",this.buzzer,Date.now())
		}
		this.users.push(user);
	};
	//removes a user from the room. Tells other users to remove the disconnected user
	this.removeUser = function(user){
		for (var i = 0; i < this.users.length; i++) {
			if(this.users[i] == user) {
				this.users.splice(i, 1);
			}
		}
		if(this.buzzer == user.name) {
			this.clear();
		}
		this.users.forEach(function(u){
			u.socket.emit('remove name', user.name, Date.now(), md5.CryptoJS.MD5(user.socket.id).toString());
		})
	}
}

//takes a room name as input and checks if the room has been locked for at least 5 seconds, if so it clears the room (server-side backup if client-side autoclear is tampered with/fails)
function autoclear(room){
	if(rooms[room].stamp > 0 && Date.now() - rooms[room].stamp >= 5000) {
		rooms[room].clear();
	}
}

//user obeject. Contains: username, room name, and socketID
function User(name, socketID, roomName){
	users[socketID] = this;
	if(typeof rooms[roomName] == "undefined") {
		addRoom(new Room(roomName));
	}
	this.room = rooms[roomName];
	this.name = name;
	this.socket = io.sockets.connected[socketID];
}

//socket connection stuff
io.on('connection', function(socket){
	//ip logging. Writes IP address to a file when a client connects to the server.
	ips[socket.id] = socket.request.connection.remoteAddress;
	fs.appendFile('iplog.log',  new Date(Date.now()) + "\t" + socket.request.connection.remoteAddress  + "\r\n", function(e){
	});

	//recieves a buzz signal from the clients. Calls room's buzz method
	socket.on('buzz', function(){
		if(typeof users[socket.id] != "undefined") {
			users[socket.id].room.buzz(users[socket.id].name);
		}
	});

	//recieves a clear signal from the the clients. Calls the room's clear method
	socket.on('clear', function(){
		if(typeof users[socket.id] != "undefined") {
			if(users[socket.id].name == users[socket.id].room.buzzer) {
				users[socket.id].room.clear();
			}
		}
	});
	
	//sends a list of rooms to clients that request it. Has rate limitations to prevent spam
	socket.on('get roomlist', function(){
		if(typeof roomreq[socket.id] == "undefined") {
			roomreq[socket.id] = Date.now();
			var names = Object.keys(rooms);
			var sendMap = {}
			names.forEach(function(i){
				sendMap[rooms[i].name] = rooms[i].users.length;
			});
			io.sockets.connected[socket.id].emit('send roomlist', JSON.stringify(sendMap));
		}
		else if(Date.now()-roomreq[socket.id]>5000){
			roomreq[socket.id] = Date.now();
			var names = Object.keys(rooms);
			var sendMap = {}
			names.forEach(function(i){
				sendMap[rooms[i].name] = rooms[i].users.length;
			});
			io.sockets.connected[socket.id].emit('send roomlist', JSON.stringify(sendMap));
		}
	});

	//checks if a name is useable (available and valid). locks the buzzer if someone has already buzzed.
	//if the name is already used or is invalid, then rejects the name
	socket.on('check name', function(name){
		name = sanitize(name);
		if(name.length == 0) {
			name = genrandomname();
		}
		if(checkname(name, socket.room)) {
			io.sockets.connected[socket.id].emit('good name', name);
			var user = new User(name, socket.id, socket.room);
			user.room.addUser(user);
		}
		else{
			io.sockets.connected[socket.id].emit('bad name', '');
		}
	});

	//receives a room from the clients. checks to see if the room exists. if it does then connects them to existing room. if it doesn't, creates a new room
	socket.on('send room', function(room){
		room = sanitize(room);
		var cleanroom = room.toLowerCase();
		if(cleanroom.length == 0) {
			cleanroom = "default";
			room = "default";
		}
		if(typeof rooms[cleanroom] == "undefined") {
			addRoom(new Room(room));
			socket.room = cleanroom;
			socket.join(cleanroom);
			io.sockets.connected[socket.id].emit('get room', rooms[cleanroom].name);
			delete roomreq[socket.id];
		}
		else if(rooms[cleanroom].users.length>=25){
			io.sockets.connected[socket.id].emit('room full',room)
		}
		else{
			socket.room = cleanroom;
			socket.join(cleanroom);
			io.sockets.connected[socket.id].emit('get room', rooms[cleanroom].name);
			delete roomreq[socket.id];
		}
	});
	
	//responds to pings from the client
	socket.on('ping',function(){
		socket.emit('pong');
	});

	//clears the buzzer when a user that has buzzed disconnects
	//sends a message to all clients telling them to remove disconnected client from their lists
	//frees up the username from the list of names, deletes the user from other maps that contain references to the socketid
	socket.on('disconnect', function(){
		var user = users[socket.id];
		if(typeof user !== 'undefined') {
			var room = users[socket.id].room;
			if(typeof room != 'undefined') {
				room.removeUser(users[socket.id]);
				//prevents race condition
				if(typeof rooms[room.name.toLowerCase()] != 'undefined' && rooms[room.name.toLowerCase()].users.length == 0) {
					delete rooms[room.name.toLowerCase()];
				}
			}
		}
		delete users[socket.id];
		delete ips[socket.id];
		delete roomreq[socket.id];
	});
});

//prints out the number of connected clients and their ips every 5 minutes
setInterval(function(){
	console.log(new Date(Date.now()));
	console.log("Active users: " + Object.keys(users).length);
	for (var i = 0; i < Object.keys(ips).length; i++) {
		if(Object.keys(ips)[i].length > 0) {
			console.log(Object.keys(ips)[i] + "\t" + ips[Object.keys(ips)[i]]);
		}
	}
	console.log("");
}, 300000);

//loops through the map of rooms to perform server-side autoclearing functions every second
setInterval(function(){
	Object.keys(rooms).forEach(function(e){
		autoclear(e);
	})
}, 1000);

//has the server start and listen on port 8080
http.listen(8080, function(){
	console.log('listening on *:8080');
});