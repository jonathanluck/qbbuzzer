var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var canbuzz = true;
var names = [""];
function checkname(testname){
	for (i =0;i<names.length;i++){
		if(names[i]== testname){
			return false;
		}
	}
	return true;

}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/style.css', function(req, res){
  res.sendFile(__dirname + '/style.css');
});
app.get('/pop.mp3', function(req, res){
  res.sendFile(__dirname + '/pop.mp3');
});

app.get('/qbbuzzer.js', function(req, res){
  res.sendFile(__dirname + '/qbbuzzer.js');
});
io.on('connection', function(socket){
  socket.on('buzz',function(buzz){
	if(canbuzz){
		socket.broadcast.emit('locked',buzz);
		io.sockets.connected[socket.id].emit('your buzz', buzz)
		
		canbuzz = false
	}
  })
  
});

io.on('connection', function(socket){
 socket.on('clear',function(buzz){
	io.sockets.connected[socket.id].emit('clear',buzz);
	socket.broadcast.emit('clear',buzz);
	canbuzz = true
  })
  
});

io.on('connection', function(socket){
 socket.on('check name',function(name){
	if(checkname(name)){
		names[names.length] = name;
	}
	else{
		 io.sockets.connected[socket.id].emit('bad name', '');
	}
  })
  
});

http.listen(4802, function(){
  console.log('listening on *:4802');
});