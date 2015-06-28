var socket = io();
var name = "";
var room = "";
var playsound = true;
var dispinfo = true;
var disphist = true;
var sound = "pop";
var audio = document.getElementById("sound");
var buzzed = false;
var timeoutID;
var clearTimer;

window.addEventListener("keydown", function(a){
	if (a.which == 32)
		if (!buzzed)
			buzz()
		else
			clearbuzzer();
});
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
function entername(){
	if (document.getElementById("usernameinput").value.length > 0) {
		name = document.getElementById("usernameinput").value;
	}
	else {
		name = ""
	}
	$("#username").remove();
	$("#popup").remove();
	checkname();
}
function checkname(){

	if (name == "null") {
		socket.emit("check name", "");
	}
	else {
		socket.emit("check name", name);
	}
	return false;
}
function enterroom(){
	if (document.getElementById("roomnameinput").value.length > 0) {
		room = document.getElementById("roomnameinput").value;
	}
	else {
		room = "default"
	}
	$("#roomname").remove();
	$("#username").show();
	$("#usernameinput").focus();
	getroom();
}
function getroom(){
	if (room == null) {
		socket.emit("send room", "");
	}
	else {
		socket.emit("send room", room);
	}
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
	if (playsound) {
		audio.play();
	}
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
	$('.clear').hide();
	playSound();
	$("#history").prepend("<div class='history'>" + time + " - " + msg + "</div>")
});

socket.on('your buzz', function(msg, time){
	$('#buzzbutton').addClass('buzzed').removeClass('default').text('Your Buzz').prop("disabled", true);
	$('.clear').show();
	timeoutID = setTimeout(clearbuzzer, 5000);
	var t = 5;
	$('.clear').text("Clear 5")
	clearTimer = setInterval(function(){
		$('.clear').text("Clear " + (--t))
	}, 1000)
	playSound();
	$("#history").prepend("<div class='history'><b>" + time + " - " + msg + "</b></div>")
});

socket.on('clear', function(msg){
	$('#buzzbutton').addClass('default').removeClass('buzzed').removeClass('locked').text('Buzz').prop("disabled", false);
	$('#container').text("").hide(350);
	$('.clear').hide();
});

socket.on('good name', function(msg){
	name = msg;
	$("#info").append("<p> Your username is: " + msg + "</p>");
	$(document).attr("title", "QBBuzzer - " + msg + " - " + room)
});

socket.on('bad name', function(msg){
	alert("Invalid name or username already taken");
	checkname();
});

socket.on('get room', function(msg){
	room = msg;
	$("#info").append("<p> Your room is: " + msg + "</p>");
});

socket.on('add names', function(msg){
	JSON.parse(msg).forEach(function(name){
		$("#users").append("<div id='" + name + "'>" + name + "</div>");
	})
});

socket.on('remove name', function(msg, time){
	$("#" + msg).remove();
	$("#history").prepend("<div class='history'>" + time + " - " + msg + " has left</div>");
});
$("#container").hide();
$('.clear').hide();
$("#usernameinput").hide()

