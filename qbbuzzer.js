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
var emptyname = false;
var lastbuzz = 0;
var timeoutID;
var clearTimer;

function entername(){
	if(document.getElementById("usernameinput").value.length > 0) {
		name = document.getElementById("usernameinput").value;
	}
	else{
		emptyname = true;
		name = genRandomName()
	}
	checkname();
}
function checkname(){
	if(name == "null") {
		socket.emit("check name", "");
	}
	else{
		socket.emit("check name", name);
	}
	return false;
}
function enterroom(){
	if(document.getElementById("roomnameinput").value.length > 0) {
		room = document.getElementById("roomnameinput").value;
	}
	else{
		room = "default";
	}
	$("#roomname").remove();
	$("#username").show();
	$("#usernameinput").focus();
	getroom();
}
function getroom(){
	if(room == null) {
		socket.emit("send room", "");
	}
	else{
		socket.emit("send room", room);
	}
	return false;
}

$(document).ready(function(){
	$('#roomnameinput').keypress(
		function(e){
			if(!e) {
				e = window.event;
			}
			var keyCode = e.keyCode || e.which;
			if(keyCode == '13') {
				enterroom();
				return false;
			}
		});
	$('#usernameinput').keypress(
		function(e){
			if(!e) {
				e = window.event;
			}
			var keyCode = e.keyCode || e.which;
			if(keyCode == '13') {
				entername();
				return false;
			}
		}
	);
	$('.clear').css('visibility', 'hidden');
});

function newEle(ele, text){
	ele = document.createElement(ele);
	$(ele).text(text);
	return ele;
}

window.addEventListener("keydown", function(a){
	if(a.which == 32) {
		a.preventDefault();
		if(!buzzed) {
			buzz();
		} else if(Date.now() - lastbuzz >= 500) {
			clearbuzzer();
		}
	}
});

function buzz(){
	socket.emit("buzz", name);
	buzzed = true;
	return false;
}

function clearbuzzer(){
	if(Date.now() - lastbuzz >= 500) {
		clearTimeout(timeoutID);
		clearInterval(clearTimer);
		socket.emit("clear", "");
		buzzed = false;
		return false;
	}
}

function togglesound(){
	playsound = !playsound;
	if(playsound) {
		$("#togglesound").text("Sound: On");
		$("#changesound").show();
	}
	else{
		$("#togglesound").text("Sound: Off");
		$("#changesound").hide();
	}
}

function playSound(){
	if(playsound) {
		audio.play();
	}
}

function changesound(){
	if(sound == "pop") {
		sound = "buzz";
		audio = document.getElementById("sound2");
		$("#changesound").text("Sound: Buzz");
	}
	else if(sound == "buzz") {
		sound = "pop";
		audio = document.getElementById("sound");
		$("#changesound").text("Sound: Pop");
	}
}

function toggleinfo(){
	if(dispinfo) {
		dispinfo = false;
		$("#infobox").hide();
		$("#infobutton").text("Show Info");
	}
	else{
		dispinfo = true;
		$("#infobox").show();
		$("#infobutton").text("Hide Info");
	}
}

function togglesettings(){
	if(dispsettings) {
		dispsettings = false;
		$("#togglesound").hide();
		$("#changesound").hide();
		$("#infobutton").hide();
		$("#togglehist").hide();
		$("#togglesettings").text("Show Settings");
	}
	else{
		dispsettings = true;
		$("#togglesound").show();
		$("#changesound").show();
		$("#infobutton").show();
		$("#togglehist").show();
		$("#togglesettings").text("Hide Settings");
	}
}

function togglehistory(){
	if(disphist) {
		disphist = false;
		$("#historywrapper").hide();
		$("#clearhist").hide();
		$("#togglehist").text("Show History");
	}
	else{
		disphist = true;
		$("#historywrapper").show();
		$("#clearhist").show();
		$("#togglehist").text("Hide History");
	}
}

function decodeDate(d){
	return (new Date(d) + "").substring(16, 24);
}

function genRandomName(){
	animals  = ['Aardvark','Alligator','Ant','Antelope','Armadillo','Baboon','Barracuda','Bear','Bee','Boar','Butterfly','Caribou','Caterpillar','Cheetah','Chimpanzee','Cobra','Cormorant','Crab','Crocodile','Deer','Dog','Donkey','Dragonfly','Eagle','Eel','Elephant','Emu','Ferret','Fish','Fly','Frog','Gerbil','Giraffe','Goose','Gorilla','Guinea pig','Hare','Hedgehog','Hornet','Hummingbird','Jackal','Jay','Kangaroo','Komodo dragon','Lemur','Lion','Lobster','Meerkat','Mole','Moose','Mosquito','Narwhal','Octopus','Opossum','Otter','Ox','Panther','Pelican','Pig','Pony','Quail','Raccoon','Rat','Deer','Rhinoceros','Salmon','Sea lion','Seal','Sheep','Skunk','Snake','Squid','Starling','Stork','Swan','Toad','Turkey','Viper','Wallaby','Weasel','Wolf','Wombat','Worm','Yak'];
	colors = ['Aqua','Azure','Beige','Bisque','Black','Blue','Brown','Coral','Cornsilk','Crimson','Cyan','Dark Blue','Dark Cyan','Dark Gray','Dark Red','Deep Pink','Dim Gray','Fuchsia','Gold','Gray','Green','Honey Dew','Hot Pink','Indigo','Ivory','Khaki','Lavender','Lime','Linen','Magenta','Maroon','Moccasin','Navy','Old Lace','Olive','Orange','Orchid','Peru','Pink','Plum','Purple','Red','Salmon','SeaGreen','SeaShell','Sienna','Silver','Sky Blue','Snow','Tan','Teal','Thistle','Tomato','Violet','Wheat','White','Yellow'];
	return colors[Math.floor(Math.random() * colors.length)]+ " " + animals[Math.floor(Math.random() * animals.length)]
	
}
socket.on('locked', function(msg, time){
	$('#buzzbutton').addClass('locked').removeClass('default').text('Locked').prop("disabled", true);
	$('#container').text(msg + " has buzzed").show(250);
	$('.clear').css('visibility', 'hidden');
	playSound();
	var ele = newEle("div", decodeDate(time) + " - " + msg + " buzzed");
	ele.class = "history";
	$("#history").prepend(ele);
});

socket.on('your buzz', function(msg, time){
	$('#buzzbutton').addClass('buzzed').removeClass('default').text('Your Buzz').prop("disabled", true);
	var t = 5;
	$('.clear').css('visibility', 'visible').text("Locked").css('background-color','#C7C7C7');
	playSound();
	$("#history").prepend("<div class='history'><b>" + decodeDate(time) + " - " + msg + " buzzed</b></div>");
	lastbuzz = Date.now();
	setTimeout(function(){
		$('.clear').text("Clear 5").css('background-color','#9E9E9E');
		clearTimer = setInterval(function(){
			$('.clear').text("Clear " + (--t))
		}, 1000);
		timeoutID = setTimeout(clearbuzzer, 5000);
	}, 490);
});

socket.on('clear', function(){
	$('#buzzbutton').addClass('default').removeClass('buzzed').removeClass('locked').text('Buzz').prop("disabled", false);
	$('#container').text("").hide(350);
	$('.clear').css('visibility', 'hidden');
});

socket.on('good name', function(msg){
	name = msg;
	$("#info").append(newEle("p", "Your username is: " + msg));
	$(document).attr("title", "QBBuzzer - " + msg + " - " + room);
	$("#users").prepend(newEle("div", msg));
	$("#username").hide();
	$("#popup").hide();
});

socket.on('bad name', function(){
	if(emptyname){
		name = genRandomName();
		checkname();
	}
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
	});
	if(isNew) {
		var ele = newEle("div", decodeDate(time) + " - " + JSON.parse(msg)[0] + " has joined");
		ele.class = 'history';
		$("#history").prepend(ele);
	}
});

socket.on('remove name', function(msg, time, id){
	var ele = newEle("div", decodeDate(time) + " - " + msg + " has left");
	ele.class = 'history';
	$("#history").prepend(ele);
	$("#" + id).remove();
});
$("#container").hide();
$("#usernameinput").hide();

