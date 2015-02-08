WebP2P
------

使用WebRTC建立点对点通信连接。

体验方法：

```
npm install
node app.js
```

然后访问 http://localhost:3000，输入用户名（假设为a）；再开一个窗口，
输入用户名（假设为b）。

在a的控制台中执行`p.start(1, 'b')`，然后既可以通过`p.channels.chat.send`给b发送 数据了。
