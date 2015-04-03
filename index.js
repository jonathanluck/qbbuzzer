var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var canbuzz = true;
var names = [""];
var currentbuzzer = "";
function checkname(testname){
	testname = testname.trim().replace(/</g,"");
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
app.get('/buzzsound.mp3', function(req, res){
  res.sendFile(__dirname + '/buzzsound.mp3');
});


io.on('connection', function(socket){
  socket.on('buzz',function(buzz){
	if(canbuzz){
		socket.broadcast.emit('locked',buzz);
		io.sockets.connected[socket.id].emit('your buzz', buzz)
		currentbuzzer= buzz;
		canbuzz = false
	}
  })
});

io.on('connection', function(socket){
 socket.on('clear',function(buzz){
	io.sockets.connected[socket.id].emit('clear',buzz);
	socket.broadcast.emit('clear',buzz);
	currentbuzzer="";
	canbuzz = true
  })
  
});

io.on('connection', function(socket){
 socket.on('check name',function(name){

	if(checkname(name)){
		name = name.trim().replace(/</g,"");
		names[names.length] = name;
		io.sockets.connected[socket.id].emit('good name', name);
		if (!canbuzz){
			io.sockets.connected[socket.id].emit('locked', currentbuzzer);
		}
	}
	else{
		 io.sockets.connected[socket.id].emit('bad name', '');
	}
  })
  
});
io.on('connection', function(socket){
socket.on('disconnect', function(){
    socket.broadcast.emit('clear');
	canbuzz=true;
});
});


http.listen(8080, function(){
  console.log('listening on *:8080');
});