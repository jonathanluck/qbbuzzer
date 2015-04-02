var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var canbuzz = true;
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/style.css', function(req, res){
  res.sendFile(__dirname + '/style.css');
});

io.on('connection', function(socket){
  socket.on('buzz',function(buzz){
	socket.broadcast.emit('locked');
  })
  
});

io.on('connection', function(socket){
 socket.on('clear',function(buzz){
	socket.broadcast.emit('clear');
  })
  
});

http.listen(4802, function(){
  console.log('listening on *:4802');
});