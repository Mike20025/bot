const http = require('http');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const queriesFile = path.join(DATA_DIR, 'queries.json');
const ratingsFile = path.join(DATA_DIR, 'ratings.json');
const uqFile = path.join(DATA_DIR, 'user-queries.json');
const urFile = path.join(DATA_DIR, 'user-ratings.json');
const configFile  = path.join(DATA_DIR, 'chat-config.json');

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
  } catch (e) {
    return [];
  }
}

function appendJSON(file, obj) {
  const arr = readJSON(file);
  arr.push(obj);
  fs.writeFileSync(file, JSON.stringify(arr, null, 2));
}

const clients = new Set();

function send(ws, data) {
  ws.write(encodeFrame(JSON.stringify(data)));
}

function broadcast(data) {
  const msg = encodeFrame(JSON.stringify(data));
  clients.forEach(ws => ws.write(msg));
}

function encodeFrame(data) {
  const payload = Buffer.from(data);
  const frame = [0x81];
  if (payload.length < 126) {
    frame.push(payload.length);
  } else if (payload.length < 65536) {
    frame.push(126, payload.length >> 8, payload.length & 255);
  }
  return Buffer.concat([Buffer.from(frame), payload]);
}

function decodeFrame(buf) {
  const len = buf[1] & 127;
  let offset = 2;
  if (len === 126) {
    offset = 4;
  }
  const mask = buf.slice(offset, offset + 4);
  offset += 4;
  const data = buf.slice(offset, offset + len);
  for (let i = 0; i < data.length; i++) {
    data[i] ^= mask[i % 4];
  }
  return data.toString('utf8');
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/query') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      appendJSON(queriesFile, data);
      appendJSON(uqFile, data);
      res.end('ok');
    });
    return;
  }
  if (req.method === 'POST' && req.url === '/rating') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      appendJSON(ratingsFile, data);
      appendJSON(urFile, data);
      res.end('ok');
    });
    return;
  }
  if (req.method === 'GET' && req.url === '/chat-config.json') {
    fs.readFile(configFile, (err, data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
    });
    return;
  }
  if (req.method === 'GET' && req.url === '/user-queries.json') {
    fs.readFile(uqFile, (e,d)=>{res.setHeader('Content-Type','application/json');res.end(d);});
    return;
  }
  if (req.method === 'GET' && req.url === '/user-ratings.json') {
    fs.readFile(urFile, (e,d)=>{res.setHeader('Content-Type','application/json');res.end(d);});
    return;
  }
  if (req.method === 'POST' && req.url === '/chat-config') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      fs.writeFileSync(configFile, body);
      res.end('ok');
    });
    return;
  }
  const filePath = path.join(__dirname, req.url === '/' ? '/chat/bot.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
    } else {
      res.end(data);
    }
  });
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) return socket.destroy();
  const accept = generateAcceptValue(key);
  socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: websocket\r\n' +
               'Connection: Upgrade\r\n' +
               'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  clients.add(socket);
  socket.on('data', buf => {
    const msg = decodeFrame(buf);
    broadcast({ from:'client', text: msg });
  });
  socket.on('close', () => clients.delete(socket));
});

function generateAcceptValue(key) {
  return require('crypto')
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary')
    .digest('base64');
}

server.listen(3000, () => console.log('Server on 3000'));
