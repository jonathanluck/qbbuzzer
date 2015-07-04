var socket = io();
var name = "";
var room = "";
var playsound = true;
var dispinfo = true;
var disphist = true;
var dispsettings = false;
var sound = "pop";
var audio = document.getElementById("sound");
var buzzed = false;
var timeoutID;
var clearTimer;

function entername(){
	if (document.getElementById("usernameinput").value.length > 0) {
		name = document.getElementById("usernameinput").value;
	}
	else {
		name = ""
	}

	checkname();
}
function checkname(){
	if (name == "null"){
		socket.emit("check name", "");
	}
	else{
		console.log(name);
		socket.emit("check name", name);
	}
	return false;
}
function enterroom(){
	if (document.getElementById("roomnameinput").value.length > 0)
		room = document.getElementById("roomnameinput").value;
	else
		room = "default"
	$("#roomname").remove();
	$("#username").show();
	$("#usernameinput").focus();
	getroom();
}
function getroom(){
	if (room == null)
		socket.emit("send room", "");
	else
		socket.emit("send room", room);
	return false;
}

$(document).ready(function(){
	$('#roomnameinput').keypress(
		function(e){
			if (!e) e = window.event;
			var keyCode = e.keyCode || e.which;
			if (keyCode == '13') {
				enterroom()
				return false;
			}
		});

	$('#usernameinput').keypress(
		function(e){
			if (!e) e = window.event;
			var keyCode = e.keyCode || e.which;
			if (keyCode == '13') {
				entername();
				return false;
			}
		}
	);
	$('.clear').css('visibility','hidden');

});

function newEle(ele, text){
	ele = document.createElement(ele);
	$(ele).text(text);
	return ele;
}

window.addEventListener("keydown", function(a){
	if (a.which == 32) {
		a.preventDefault();
		if (!buzzed)
			buzz()
		else
			clearbuzzer();
	}
});

function buzz(){
	socket.emit("buzz", name);
	buzzed = true;
	return false;
}

function clearbuzzer(){
	clearTimeout(timeoutID);
	clearInterval(clearTimer)
	socket.emit("clear", "");
	buzzed = false;
	return false;
}


function togglesound(){
	playsound = !playsound;
	if (playsound) {
		$("#togglesound").text("Sound: On")
		$("#changesound").show();
	}
	else {
		$("#togglesound").text("Sound: Off")
		$("#changesound").hide();
	}
}

function playSound(){
	if (playsound)
		audio.play();
}

function changesound(){
	if (sound == "pop") {
		sound = "buzz";
		audio = document.getElementById("sound2");
		$("#changesound").text("Sound: Buzz");
	}
	else if (sound == "buzz") {
		sound = "pop";
		audio = document.getElementById("sound");
		$("#changesound").text("Sound: Pop");
	}
}

function toggleinfo(){
	if (dispinfo) {
		dispinfo = false;
		$("#infobox").hide();
		$("#infobutton").text("Show Info");
	}
	else {
		dispinfo = true;
		$("#infobox").show();
		$("#infobutton").text("Hide Info");
	}
}

function togglesettings(){
	if (dispsettings) {
		dispsettings = false;
		$("#togglesound").hide();
		$("#changesound").hide();
		$("#infobutton").hide();
		$("#togglehist").hide();
		
		
		$("#togglesettings").text("Show Settings");
	}
	else {
		dispsettings = true;
		$("#togglesound").show();
		$("#changesound").show();
		$("#infobutton").show();
		$("#togglehist").show();
		$("#togglesettings").text("Hide Settings");
	}
}

function togglehistory(){
	if (disphist) {
		disphist = false;
		$("#historywrapper").hide();
		$("#clearhist").hide();
		$("#togglehist").text("Show History");
	}
	else {
		disphist = true;
		$("#historywrapper").show();
		$("#clearhist").show();
		$("#togglehist").text("Hide History");
	}
}

socket.on('locked', function(msg, time){
	$('#buzzbutton').addClass('locked').removeClass('default').text('Locked').prop("disabled", true);
	$('#container').text(msg + " has buzzed").show(250);
	$('.clear').css('visibility','hidden');
	playSound();
	var ele = newEle("div", time + " - " + msg +" buzzed");
	ele.class = "history"
	$("#history").prepend(ele);
});

socket.on('your buzz', function(msg, time){
	$('#buzzbutton').addClass('buzzed').removeClass('default').text('Your Buzz').prop("disabled", true);
	$('.clear').css('visibility','visible');
	timeoutID = setTimeout(clearbuzzer, 5000);
	var t = 5;
	$('.clear').text("Clear 5")
	clearTimer = setInterval(function(){
		$('.clear').text("Clear " + (--t))
	}, 1000)
	playSound();
	$("#history").prepend("<div class='history'><b>" + time + " - " + msg + " buzzed</b></div>")
});

socket.on('clear', function(msg){
	$('#buzzbutton').addClass('default').removeClass('buzzed').removeClass('locked').text('Buzz').prop("disabled", false);
	$('#container').text("").hide(350);
	$('.clear').css('visibility','hidden');
});

socket.on('good name', function(msg){
	name = msg;
	$("#info").append(newEle("p", "Your username is: " + msg));
	$(document).attr("title", "QBBuzzer - " + msg + " - " + room)
	$("#users").prepend(newEle("div", msg));
	$("#username").hide();
	$("#popup").hide();
});

socket.on('bad name', function(msg){
	$("#popup").show();
	$("#username").show();
	alert("Invalid name or username already taken");
});

socket.on('get room', function(msg){
	room = msg;
	$("#info").append(newEle("p", "Your room is: " + msg));
});

socket.on('add names', function(msg, id, isNew, time){
	id = JSON.parse(id);
	JSON.parse(msg).forEach(function(name, index){
		$("#users").append("<div id='" + id[index] + "'></div>");
		$("#" + id[index]).text(name);
	})
	if (isNew) {
		var ele = newEle("div", time + " - " + JSON.parse(msg)[0] + " has joined");
		ele.class = 'history';
		$("#history").prepend(ele);
	}
});

socket.on('remove name', function(msg, time, id){
	var ele = newEle("div", time + " - " + msg + " has left");
	ele.class = 'history';
	$("#history").prepend(ele);
	$("#" + id).remove();
});
$("#container").hide();
$("#usernameinput").hide()

