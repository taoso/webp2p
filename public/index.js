var socket = io.connect(document.URL);
socket.on('welcome', function (data) {
  var username = prompt('Enter Your User Name');
  p = P2P(username, socket);
});
