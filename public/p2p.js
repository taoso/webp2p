var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var pc;
var channel;
var startP2p;
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
    {RtpDataChannels: true} //required for Firefox
  ]
};

var username = prompt('User Name');
var socket = io.connect('http://localhost:3000');
socket.on('welcome', function (data) {
  socket.emit('join', {username: username});

  startP2p = function (isInitiator, to) {
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
      channel = pc.createDataChannel('chat');
      channel.onopen = function () {
        channel.onmessage = function (e) {
          console.log(e);
        };
      };
    } else {
      pc.ondatachannel = function (e) {
        channel = e.channel;
        channel.onopen = function () {
          channel.onmessage = function (e) {
            console.log(e);
          };
        };
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
});
