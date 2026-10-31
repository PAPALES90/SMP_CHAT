const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const ALLOWED_USERS = [
  "PAPALES90",
  "fearlessgofret",
  "capybara5454",
  "Voxtare",
  "Rayil54",
  "Eymn54",
  "Merve"
];

let onlineUsers = {}; // socket.id -> username

io.on('connection', (socket) => {
  console.log('Bir bağlantı denemesi oldu:', socket.id);

  socket.on('login', (username) => {
    if (!ALLOWED_USERS.includes(username)) {
      socket.emit('login_error', "kral zaten bikez gircen onuda yanlışmı yazdın alkfnakfjsafjkl");
      return;
    }

    onlineUsers[socket.id] = username;
    socket.emit('login_success', { username, users: Object.values(onlineUsers) });
    io.emit('update_user_list', Object.values(onlineUsers));
  });

  socket.on('send_message', (data) => {
    const sender = onlineUsers[socket.id];
    if (!sender) return;

    // Merve Kuralı (Sunucu Güvencesi)
    if (sender === "Merve" && data.recipient !== "PAPALES90") {
      return; // Merve sadece PAPALES90 ile konuşabilir
    }

    if (data.recipient) {
      // Özel Mesaj (DM)
      let recipientSocketId = null;
      for (let [sId, uName] of Object.entries(onlineUsers)) {
        if (uName === data.recipient) {
          recipientSocketId = sId;
          break;
        }
      }

      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_message', data);
        socket.emit('receive_message', data); // Gönderene de yansısın
      }
    } else {
      // Genel Grup Mesajı (Merve genel gruba atamaz)
      if (sender === "Merve") return;
      io.emit('receive_message', data);
    }
  });

  socket.on('disconnect', () => {
    delete onlineUsers[socket.id];
    io.emit('update_user_list', Object.values(onlineUsers));
    console.log('Bir kullanıcı ayrıldı.');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda ayakta!`);
});