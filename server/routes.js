const authenticationController = require('./controllers/AuthenticationController');
const bookController = require('./controllers/BookController');
const pageController = require('./controllers/PageController');
const imagesController = require('./controllers/ImagesController');
const usersController = require('./controllers/UserController');
const AuthenticationMiddleware = require("./middlewares/AuthenticationMiddleware");
const ImageMiddleware = require("./middlewares/ImageMiddleware");
const {upload} = require("./middlewares/UploadMiddleware");
const geocodingControlller = require("./controllers/GeocodingController");
const friendsController = require('./controllers/FriendsController');


module.exports = app => {
  // test Route
  app.get('/api', (req, res) => res.json({"Hello": "World !"}));

  // Authentication
  app.post('/api/auth/login', authenticationController.login);
  app.post('/api/auth/register', authenticationController.register);

  // Books
  app.use('/api/book', AuthenticationMiddleware); // Middleware for books and pages
  app.post('/api/book', bookController.createBook);
  app.patch('/api/book/:id', bookController.updateBook);
  app.delete('/api/book/:id', bookController.deleteBook);
  app.post('/api/book/access/add', bookController.addAccessBook);
  app.post('/api/book/access/remove', bookController.removeAccessBook);
  app.get('/api/book', bookController.getBooks);
  app.get('/api/book/:id', bookController.getBookById);

  // Pages
  app.post('/api/book/:book/page', pageController.addPage);
  app.patch('/api/book/:book/page/:page', pageController.updatePage);
  app.delete('/api/book/:book/page/:page', pageController.deletePage);
  app.get('/api/book/:book/page', pageController.getPages);
  app.get('/api/book/:book/page/:page', pageController.getPageById);

  // Images
  //app.use('/api/images', AuthenticationMiddleware);
  app.post('/api/images/upload', upload.single('file'), imagesController.uploadImage);
  app.get('/api/images/:image', ImageMiddleware, imagesController.getImage);

  // Users
  app.use('/api/users', AuthenticationMiddleware);
  app.get('/api/users', usersController.getUsersByName);

  // Geocoding
  app.use('/api/geocoding', AuthenticationMiddleware);
  app.get('/api/geocoding', geocodingControlller.getLocationFromAddress);

  // Countries
  app.use('/api/countries', AuthenticationMiddleware);
  app.get('/api/book/:book/countries', pageController.getCountriesWithLocations);
  app.get('/api/book/:book/countries/:country/page', pageController.getPagesFromCountry);

  app.use('/api/group', AuthenticationMiddleware);
  app.post('/api/group', friendsController.createRoom);
  app.get('/api/group', friendsController.getRooms);
  app.get('/api/group/:room', friendsController.getRoom);


}
