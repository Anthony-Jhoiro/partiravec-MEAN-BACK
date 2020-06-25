const jwtVerify = require('../tools/jwtVerify');
const User = require('../models/User');
const Inbox = require('../models/Inbox');
const Group = require('../models/Group');

class ConnectedUser {
  userInfos;
  socket;

  constructor(socket) {
    this.socket = socket;
    this.userInfos = {socketId: socket.id, userId: null};
  }

  identify(data, next) {
    const token = data.token;
    jwtVerify(token,
      decoded => {
        this.userInfos.userId = decoded.id;
        Group.find({contributors: this.userInfos.userId})
          .then(groups => {
            groups.forEach(g => {
              this.socket.join(g._id);
            });
            this.socket.on('message', (data, next) => this.onMessage(data, next));
            next();
          });

      },
      () => this.socket.emit('error', 'La connexion a échoué'));
  }

  onMessage(data, next) {
    // user has access to room
    Group.findOne({_id: data.room})
      .then(group => {

        if (! group)
          return this.socket.emit('error', "La room n'existe pas.");
        if (! group.hasAccess(this.userInfos.userId))
          return this.socket.emit('error', "Vous n'êtes pas authorisé à écrire ici");

        const message = new Inbox({
          from: this.userInfos.userId,
          to: group.id,
          body: data.message
        });

        message.save((err, message) => {
          if (err) return this.socket.emit('error', "Impossible d'envoyer le message");
          this.socket.broadcast.to(data.room).emit('message', message);
          next(message);
        })
      });
  }
}

module.exports = ConnectedUser;
