const socketIo = require('socket.io');
const friendsController = require('./controllers/FriendsController');


module.exports = server => {
  // set-user-infos
  const io = socketIo(server, {  });
  io.on('connection', (socket) => {

    const user = friendsController.onConnection(socket, {});

    socket.on('set-user-infos', (data, next) => {
      user.identify(data, next);
    });

    socket.on('disconnected', data => {
      friendsController.clientDisconnected(user);
    });

  });
}
