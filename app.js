var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

app.use(express.static(__dirname + '/public'));

server.listen(3000);

var peers = {};

io.sockets.on('connection', function (socket) {
  socket.emit('welcome', { hello: 'world' });

  socket.on('join', function (data) {
    var username = data.username;
    peers[username] = socket;
    socket.on('message', function (data) {
      console.log('from: ', username, ' to: ', data.to, ' data: ', data.data);
      var peer = peers[data.to];
      if (!peer) return;

      peer.emit('message', {
        from: username,
        data: data.data,
      });

    }); // end of on message
  }); // end of on join
});
