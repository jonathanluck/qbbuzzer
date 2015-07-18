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
var finished = false;
var canSpace = true;
var lastbuzz = 0;
var timeoutID;
var clearTimer;

function entername(){
	if(document.getElementById("usernameinput").value.trim().length > 0) {
		name = document.getElementById("usernameinput").value;
	}
	else{
		emptyname = true;
		name = genRandomName()
	}
	checkname(name);
}
function checkname(str){
	if(typeof str == "undefined") {
		socket.emit("check name", "");
	}
	else{
		socket.emit("check name", str);
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
	getroom(room);
}
function getroom(str){
	if(typeof str == "undefined") {
		socket.emit("send room", "");
	}
	else{
		socket.emit("send room", str);
	}
	return false;
}
function getroomlist(){
	$("#roomlistbutton").text("Refresh List");
	socket.emit("get roomlist");

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
	circle();
});

function newEle(ele, text){
	ele = document.createElement(ele);
	$(ele).text(text);
	return ele;
}

window.addEventListener("keydown", function(a){
	if(a.which == 32){
		if (finished){
			a.preventDefault();
			if(canSpace) {
				if(!buzzed) {
					buzz();
				} 
				else if(Date.now() - lastbuzz >= 500) {
					clearbuzzer();
				}
				canSpace = false;
			}
		}
	}
});


window.addEventListener("keyup", function(a){
	if(a.which == 32 && finished && !canSpace) {
		canSpace = true;
		
	}
});

window.addEventListener("resize", circle);


function circle(){
	if(window.matchMedia("(max-width: 600px)").matches){
		width = $("#buzzbutton").width();
		$("#buzzbutton").css("height", width);
		$("#buzzbutton").css("border-radius",width/2);
	}
	else{
		$("#buzzbutton").css("border-radius", "5px");
		$("#buzzbutton").css("height", "");

	}
}
function buzz(){
	if(!buzzed){
		socket.emit("buzz", name);
	}
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
	colors = ['Aqua','Azure','Beige','Bisque','Black','Blue','Brown','Coral','Cornsilk','Crimson','Cyan','Dark Blue','Dark Cyan','Dark Gray','Dark Red','Deep Pink','Dim Gray','Fuchsia','Gold','Gray','Green','Honey Dew','Hot Pink','Indigo','Ivory','Khaki','Lavender','Lime','Linen','Magenta','Maroon','Moccasin','Navy','Old Lace','Olive','Orange','Orchid','Peru','Pink','Plum','Purple','Red','Salmon','Sea Green','Sea Shell','Sienna','Silver','Sky Blue','Snow','Tan','Teal','Thistle','Tomato','Violet','Wheat','White','Yellow'];
	return colors[Math.floor(Math.random() * colors.length)]+ " " + animals[Math.floor(Math.random() * animals.length)]
}
socket.on('locked', function(msg, time){
	$('#buzzbutton').addClass('locked').removeClass('default').text('Locked');
	$('#container').text(msg + " has buzzed");
	$('#container').show(250);
	$('.clear').css('visibility', 'hidden');
	playSound();
	var ele = newEle("div", decodeDate(time) + " - " + msg + " buzzed");
	$(ele).addClass("history");
	$("#history").prepend(ele);
	$("link[rel*='shortcut icon'").attr("href","faviconred.png");
});

socket.on('your buzz', function(msg, time){
	buzzed = true;
	$('#buzzbutton').addClass('buzzed').removeClass('default').text('Your Buzz').prop("disabled", true);
	var t = 5;
	playSound();
	var div = document.createElement("div");
	$(div).text(decodeDate(time)+" - ");
	var span = document.createElement("span");
	$(span).text(msg+ " buzzed");
	$(div).addClass('history').append(span);
	$("#history").prepend(div);
	lastbuzz = Date.now();
	$('.clear').css('visibility', 'visible').text("Clear 5");
	clearTimer = setInterval(function(){
		$('.clear').text("Clear " + (--t))
	}, 1000);
	timeoutID = setTimeout(clearbuzzer, 5000);
});

socket.on('clear', function(){
	$('#buzzbutton').addClass('default').removeClass('buzzed').removeClass('locked').text('Buzz').prop("disabled", false);
	$('#container').text("").hide(350);
	$('.clear').css('visibility', 'hidden');
	$("link[rel*='shortcut icon'").attr("href","favicon.png");
});

socket.on('good name', function(msg){
	name = msg;
	var p = document.createElement("p");
	$(p).text("Username: ");
	var span = document.createElement("span");
	$(span).text(msg);
	$(p).append(document.createElement("br")).append(span);
	$("#info").append(p);
	$(document).attr("title", "QBBuzzer - " + msg + " - " + room);
	var div = document.createElement("div");
	$(div).append(newEle("span",msg));
	$("#users").prepend(div);
	$("#username").remove();
	$("#popup").remove();
	finished = true;
	$("link[rel*='shortcut icon'").attr("href","favicon.png");
});

socket.on('bad name', function(){
	if(emptyname){
		name = genRandomName();
		checkname(name);
	}
	$("#popup").show();
	$("#username").show();
	alert("Invalid name or username already taken");
});

socket.on('get room', function(msg){
	$("#roomname").remove();
	$("#username").show();
	$("#usernameinput").focus();
	room = msg;
	$("#info").text("Room: ").append(document.createElement("br")).append(newEle("span",msg));
});

socket.on('room full', function(msg){
	alert(msg + " is currently full. Try again later or choose another room.");
	
});

socket.on('send roomlist', function(msg){
	var roomlist = JSON.parse(msg);
	if(Object.keys(roomlist).length==0){
		$("#roomname p").text("No active rooms");
		$("#roomname p").show();
		$("#roomlist").hide();
	}
	else{
		$("#roomlist").empty();
		var keys = Object.keys(roomlist);
		keys.forEach(function(e){
			var num = roomlist[e]
			var roomname = e;
			if(e.length>23){
				e = e.substring(0,23)+"...";
			}
			var ele = newEle("div",e+": "+num+" users");
			ele.addEventListener("click", function(){
				getroom(roomname);
			});
			$("#roomlist").append(ele);
		});
		$("#roomname p").text("Active rooms:");
		$("#roomname p").show();
		$("#roomlist").show();
	}
});

socket.on('add names', function(msg, id, isNew, time){
	id = JSON.parse(id);
	JSON.parse(msg).forEach(function(name, index){
		$("#users").append("<div id='" + id[index] + "'></div>");
		$("#" + id[index]).text(name);
	});
	if(isNew) {
		var ele = newEle("div", decodeDate(time) + " - " + JSON.parse(msg)[0] + " has joined");
		$(ele).addClass('history');
		$("#history").prepend(ele);
	}
});

socket.on('remove name', function(msg, time, id){
	var ele = newEle("div", decodeDate(time) + " - " + msg + " has left");
	$(ele).addClass('history');
	$("#history").prepend(ele);
	$("#" + id).remove();
});
$("#container").hide();
$("#usernameinput").hide();