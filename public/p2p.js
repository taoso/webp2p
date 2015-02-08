var P2P = function (username, socket) {
  var PeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
  var IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;

  var pc;
  var channels = {};
  var server = {
    iceServers: [
      {url: "stun:23.21.150.121"},
      {url: "stun:stun.l.google.com:19302"},
      {url: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}
    ]
  };

  var options = {
    optional: [
      {DtlsSrtpKeyAgreement: true},
    ]
  };

  socket.emit('join', {username: username});

  var startP2p = function (isInitiator, to) {
    if (to === username) return;

    pc = new PeerConnection(server, options);
    pc.onicecandidate = function (e) {
      if (!e.candidate) return;

      socket.emit('message', { to: to, data: { 'candidate': e.candidate } });
    };

    pc.onnegotiationneeded = function () {
      pc.createOffer(function (offer) {
        pc.setLocalDescription(offer, function () {
          socket.emit('message', {
            to: to, data: { 'sdp': pc.localDescription, }
          });
        });
      }, function (err) { console.log('offer', err); });
    };

    if (isInitiator) {
      var channel = pc.createDataChannel('chat');
      channel.onopen = function () {
        channel.onmessage = function (e) {
          console.log(e);
        };
      };
      channels[channel.label] = channel;
    } else {
      pc.ondatachannel = function (e) {
        channel = e.channel;
        channel.onopen = function () {
          channel.onmessage = function (e) {
            console.log(e);
          };
        };
        channels[channel.label] = channel;
      };
    }
  };

  socket.on('message', function (data) {
    if (!pc) startP2p(false, data.from);
    if (data.data.sdp) {
      pc.setRemoteDescription(new SessionDescription(data.data.sdp), function () {
        if (pc.remoteDescription.type === 'offer')
          pc.createAnswer(function (answer) {
            pc.setLocalDescription(answer , function () {
              socket.emit('message', {
                to: data.from, data: { 'sdp': pc.localDescription, }
              });
            });
          }, function (err) { console.log('answer', err); });
      });
    } else {
      pc.addIceCandidate(new IceCandidate(data.data.candidate));
    }
  });

  return {
    startP2p: startP2p,
    pc: pc,
    channels: channels,
  };
};
