var socket = io.connect('http://localhost:3000');
socket.on('welcome', function (data) {
  var username = prompt('Enter Your User Name');
  p = P2P(username, socket);
});
