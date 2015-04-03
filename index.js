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

io.on('connection', function(socket){
  socket.on('buzz',function(buzz){
	if(canbuzz){
		socket.broadcast.emit('locked',buzz);
		canbuzz = false
	}
  })
  
});

io.on('connection', function(socket){
 socket.on('clear',function(buzz){
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
		socket.emit('bad name',"");
	}
  })
  
});

http.listen(4802, function(){
  console.log('listening on *:4802');
});