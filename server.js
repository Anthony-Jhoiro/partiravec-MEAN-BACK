const express = require('express');
const bodyParser = require("body-parser");
const {PORT, FRONT_URL} = require('./server/tools/environment');
const routes = require('./server/routes');
const {db} = require ('./server/tools/databaseConnection');
const socketManager = require('./server/socketManager');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());


app.use(cors({
  origin: FRONT_URL,
  optionsSuccessStatus: 200,
  exposedHeaders: '_token'
}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  return res.status(500).json({error: "Une erreur est survenue sur le serveur", stack: err.stack});
})

// Add routes
routes(app);



db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', () => {
  const server = app.listen(PORT, () => {
    const port = server.address().port;
    console.log("App running on port", port);
  });

  // Add socket io && websocket
  socketManager(server);
});


