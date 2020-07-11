/*
 *
 *
 * Copyright 2020 ANTHONY QUÉRÉ
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

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
const mailController = require('./controllers/MailController');
const travelController = require('./controllers/TravelController');


module.exports = app => {
    // test Route
    app.get('/api', (req, res) =>
        res.json({"Hello": "World !"})
    );

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
    app.get('/api/book/public', bookController.getPublicBooks);
    app.get('/api/book/:id', bookController.getBookById);

    // Pages
    app.post('/api/book/:book/page', pageController.addPage);
    app.patch('/api/book/:book/page/:page', pageController.updatePage);
    app.delete('/api/book/:book/page/:page', pageController.deletePage);
    app.get('/api/book/:book/page', pageController.getPages);
    app.get('/api/book/:book/page/:page', pageController.getPageById);

    // Travels
    app.get('/api/book/:book/travel', travelController.getTravelsFromBook);
    app.post('/api/book/:book/travel', travelController.createTravel);
    app.patch('/api/book/:book/travel', travelController.updateTravel);

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
    app.get('/api/group/friend', friendsController.getRoomFromFriend);
    app.get('/api/group/:room', friendsController.getRoom);

    // Friends
    app.use('/api/friends', AuthenticationMiddleware);
    app.get('/api/friends', friendsController.getFriends);
    app.post('/api/friends', friendsController.addFriend);
    app.delete('/api/friends/:friend', friendsController.removeFriend);
    app.post('/api/friends/request', friendsController.createFriendRequest);
    app.get('/api/friends/request', friendsController.getFriendRequests);
    app.post('/api/friends/request/accept', friendsController.acceptFriendRequest);

    app.post('/api/password/forgot', mailController.passwordMail);
    app.get('/api/password/checkLink/:token', authenticationController.checkPasswordReceiveLink);
    app.post('/api/password/renew', authenticationController.renewPassword);


}
