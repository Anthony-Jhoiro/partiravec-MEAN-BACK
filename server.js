const express = require('express');
const bodyParser = require("body-parser");
const {PORT} = require('./server/tools/environment');
const routes = require('./server/routes');
const {db} = require ('./server/tools/databaseConnection');
const socketManager = require('./server/socketManager');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

// Link Angular App
const distDir = __dirname + "/dist/";
app.use(express.static(distDir));

// Add routes
routes(app);

app.use(cors());



db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', () => {
  const server = app.listen(PORT, () => {
    const port = server.address().port;
    console.log("App running on port", port);
  });

  // Add socket io && websocket
  socketManager(server);
});


