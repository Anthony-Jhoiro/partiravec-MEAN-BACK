const express = require('express');
const bodyParser = require("body-parser");
const {PORT, FRONT_URL} = require('./server/tools/environment');
const routes = require('./server/routes');
const {db} = require ('./server/tools/databaseConnection');
const socketManager = require('./server/socketManager');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

// Add routes
routes(app);

app.use(cors());

// Add headers
// // app.use(function (req, res, next) {

//   // Website you wish to allow to connect
//   res.setHeader('Access-Control-Allow-Origin', FRONT_URL);

//   // Request methods you wish to allow
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

//   // Request headers you wish to allow
//   res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

//   // Set to true if you need the website to include cookies in the requests sent
//   // to the API (e.g. in case you use sessions)
//   res.setHeader('Access-Control-Allow-Credentials', true);

//   // Pass to next layer of middleware
//   next();
// });



db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', () => {
  const server = app.listen(PORT, () => {
    const port = server.address().port;
    console.log("App running on port", port);
  });

  // Add socket io && websocket
  socketManager(server);
});


