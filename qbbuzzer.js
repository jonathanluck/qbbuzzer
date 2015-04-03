var socket = io();
var name = ""
$("#container").hide();
$('.clear').hide();
function buzz(){
socket.emit("buzz",name);
return false;

}
function clearbuzzer(){
socket.emit("clear","asdf");
return false;

}
function checkname(){
name = prompt('What is your username');
name = name.trim().replace(/</g,"");
socket.emit("check name", name);
return false;

}

socket.on('locked', function(msg){
$('#buzzbutton').addClass('locked').removeClass('default').text('Locked').prop("disabled",true);
$('#container').show(250).text(msg+ " has buzzed");
$('.clear').hide();
});

socket.on('your buzz', function(msg){
$('#buzzbutton').addClass('buzzed').removeClass('default').text('Your Buzz').prop("disabled",true);
$('.clear').show();
document.getElementById("sound").play();
});

socket.on('clear', function(msg){
$('#buzzbutton').addClass('default').removeClass('buzzed').removeClass('locked').text('Buzz').prop("disabled",false);
$('#container').hide(250).text("");
$('.clear').hide();
});

socket.on('good name', function(msg){
$("#wrapper").append("<p> Your username is: "+msg+"</p>");
});
socket.on('bad name', function(msg){
alert("Username already taken");
checkname();
});
checkname();