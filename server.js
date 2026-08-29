const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let timerState = { duration: 0, endTime: null, isRunning: false, timeLeft: 0 };

io.on('connection', (socket) => {
  socket.emit('timer_state', timerState);
  io.emit('user_count', io.engine.clientsCount);

  socket.on('start_timer', (minutes) => {
    const durationMs = minutes * 60 * 1000;
    timerState = { 
      duration: durationMs, 
      endTime: Date.now() + durationMs, 
      isRunning: true,
      timeLeft: durationMs
    };
    io.emit('timer_state', timerState);
  });

  socket.on('stop_timer', () => {
    timerState = { duration: 0, endTime: null, isRunning: false, timeLeft: 0 };
    io.emit('timer_state', timerState);
  });

  socket.on('disconnect', () => {
    io.emit('user_count', io.engine.clientsCount);
  });
});

// --- NEW: THE CUCKOO HEARTBEAT ENGINE ---
// The server dictates the time to everyone, once a second.
setInterval(() => {
  if (timerState.isRunning) {
    timerState.timeLeft = Math.max(0, timerState.endTime - Date.now());
    io.emit('tick', timerState.timeLeft); // Pushes the exact remaining time to all laptops
    
    if (timerState.timeLeft === 0) {
      timerState.isRunning = false;
      io.emit('timer_state', timerState);
    }
  }
}, 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
