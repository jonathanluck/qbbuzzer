var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var canbuzz = true;
var names = [""];
var currentbuzzer = "";
var currentusers = new Array();


// allows server to send all files needed for the website
files=['','index.html','style.css','pop.mp3','socketio.js','qbbuzzer.js','buzzsound.mp3'];
files.forEach(function(a){
	app.get('/'+a, function(req, res){
		res.sendFile(__dirname + '/'+a);
	});
});


// has the server start and listen on port 8080
http.listen(8080, function(){
  console.log('listening on *:8080');
});


// sanitizes the name then checks if it is already being used
function checkname(testname){
	testname = testname.trim().replace(/[<'"]/g,"")
	for (i =0;i<names.length;i++){
		if(names[i]== testname){
			return false;
		}
	}
	return true;
}

files=['','style.css','pop.mp3','qbbuzzer.js'];
files.forEach(function(a){
	app.get('/'+a, function(req, res){
		res.sendFile(__dirname + '/'+a);
	});
});


io.on('connection', function(socket){
	// recieves a buzz
	// sends a lock signal to everyone but the buzzer, who gets a signal indicating it is their buzz
	socket.on('buzz',function(buzz){
		if(canbuzz){
			socket.broadcast.emit('locked',buzz);
			io.sockets.connected[socket.id].emit('your buzz', buzz)
			currentbuzzer= buzz;
			canbuzz = false
		}
	});
	
	// sends a clear signal to all clients and allows anyone to buzz again
	socket.on('clear',function(buzz){
		io.sockets.connected[socket.id].emit('clear',buzz);
		socket.broadcast.emit('clear',buzz);
		currentbuzzer="";
		canbuzz = true
	});

	// checks if a name is useable. locks the buzzer if someone has already buzzed. 
	// broadcasts to all clients to add the new name
	// adds all current names to new client
	// if the name is already used, then rejects the name
	socket.on('check name',function(name){
		if(checkname(name)){
			name = name.trim().replace(/[<'"]/g,"")
			io.sockets.connected[socket.id].emit('good name', name);
			if (!canbuzz){
				io.sockets.connected[socket.id].emit('locked', currentbuzzer);
			}
			socket.broadcast.emit('add name',name);
			names.forEach(function(a){
				io.sockets.connected[socket.id].emit('add name', a);
			});
			names[names.length] = name;
			currentusers[socket.id] = name;
		}
		else{
			 io.sockets.connected[socket.id].emit('bad name', '');
		}
	});
	socket.on('disconnect', function(){
		socket.broadcast.emit('clear');
		canbuzz=true;
	});
	
	// clears the buzzer when a user that has buzzed disconnects
	// sends a message to all clients telling them to remove disconnected client from their lists
	// frees up the username from the list of names
	socket.on('disconnect', function(){
		var name = currentusers[socket.id];
		if(name == currentbuzzer){
			socket.broadcast.emit('clear');
			canbuzz=true;
		}
		socket.broadcast.emit('remove name',name);
		delete names[names.indexOf(name)];
		delete currentusers[socket.id];
	});
});
