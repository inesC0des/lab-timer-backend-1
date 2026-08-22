// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Single global state for your hidden webpage
let timerState = { duration: 0, endTime: null, isRunning: false };

io.on('connection', (socket) => {
  // 1. Send the current timer and user count to the new person
  socket.emit('timer_state', timerState);
  io.emit('user_count', io.engine.clientsCount);

  // 2. Someone clicks a timer button
  socket.on('start_timer', (minutes) => {
    const durationMs = minutes * 60 * 1000;
    timerState = {
      duration: durationMs,
      endTime: Date.now() + durationMs,
      isRunning: true
    };
    io.emit('timer_state', timerState); // Update everyone
  });

  // 3. Someone clicks reset
  socket.on('stop_timer', () => {
    timerState = { duration: 0, endTime: null, isRunning: false };
    io.emit('timer_state', timerState);
  });

  // 4. Someone closes the tab (update user count)
  socket.on('disconnect', () => {
    io.emit('user_count', io.engine.clientsCount);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
