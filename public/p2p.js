var P2P = function (username, socket) {
  // 标准化 RTC 对象名称
  var RTCPeerConnection = window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;
  var RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;

  // RTCPeerConnection 实例
  var pc;
  var channels = {};
  // stun 服务器列表
  var server = {
    iceServers: [
      {url: "stun:23.21.150.121"},
      {url: "stun:stun.l.google.com:19302"},
      {url: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com"}
    ]
  };

  // RTCPeerConnection 选项
  var options = {
    optional: [
      {DtlsSrtpKeyAgreement: true},
    ]
  };

  // 注册用户名到 Node.js
  socket.emit('join', {username: username});

  /**
   * 发起p2p连接
   */
  var startP2p = function (isInitiator, to) {
    if (to === username) return;

    pc = new RTCPeerConnection(server, options);
    // 收到 ICE 则发给连接『接收方』
    pc.onicecandidate = function (e) {
      if (!e.candidate) return;

      socket.emit('message', { to: to, data: { 'candidate': e.candidate } });
    };

    /**
     * 连接主动发起方在发起建立连接的时候会触发次事件，
     * 向 stun 服务器查询 ICE 信息。
     */
    pc.onnegotiationneeded = function () {
      pc.createOffer(function (offer) {
        // 本地描述设置完成后发给连接『接受方』
        pc.setLocalDescription(offer, function () {
          socket.emit('message', {
            to: to, data: { 'sdp': pc.localDescription, }
          });
        });
      }, function (err) { console.log('offer', err); });
    };

    if (isInitiator) {
      // 主动创建点对点连接
      var channel = pc.createDataChannel('chat');
      channel.onopen = function () {
        channel.onmessage = function (e) {
          console.log(e);
        };
      };
      channels[channel.label] = channel;
    } else {
      pc.ondatachannel = function (e) {
        var channel = e.channel;
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
      pc.setRemoteDescription(new RTCSessionDescription(data.data.sdp), function () {
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
      pc.addIceCandidate(new RTCIceCandidate(data.data.candidate));
    }
  });

  return {
    start: start,
    pc: pc,
    channels: channels,
  };
};
