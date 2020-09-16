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

import {authenticationController} from './controllers/CRUD/AuthenticationController';
import {bookController} from './controllers/CRUD/BookController';
import {bookContributorsController} from './controllers/CRUD/BookContributorsController';
import {pageController} from './controllers/CRUD/PageController';
import {imagesController} from './controllers/CRUD/ImagesController';
import {userController} from './controllers/CRUD/UserController';
import {AuthenticationMiddleware} from "./middlewares/AuthenticationMiddleware";
import {ImageMiddleware} from "./middlewares/ImageMiddleware";
import UploadMiddleware from "./middlewares/UploadMiddleware";
import {geocodingController} from "./controllers/CRUD/GeocodingController";
import {friendsController} from './controllers/CRUD/FriendsController';
import {mailController} from './controllers/MailController';
import {travelController} from './controllers/CRUD/TravelController';
import {adminController} from './controllers/CRUD/AdminController';


export const loadRoutes = app => {
    app.use('/api', AuthenticationMiddleware);
    // test Route
    app.get('/api',  adminController.defaultRoute);
    app.post('/api',  adminController.defaultRoute);

    // Authentication
    app.post('/api/auth/login', authenticationController.login);
    app.post('/api/auth/register', authenticationController.register);

    // Books
    app.post('/api/book', bookController.createBook);
    app.patch('/api/book/:id', bookController.updateBook);
    app.delete('/api/book/:id', bookController.deleteBook);
    app.post('/api/book/access/add', bookContributorsController.addAccessBook);
    app.post('/api/book/access/remove', bookContributorsController.removeAccessBook);
    app.get('/api/book', bookController.getBooksWhereUserIsAContributor);
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
    app.post('/api/images/upload', UploadMiddleware.upload.single('file'), imagesController.uploadImage);
    app.get('/api/images/:image', ImageMiddleware, imagesController.getImage);

    // Users
    app.get('/api/users', userController.getUsersByName);
    app.post('/api/users/deviceId', userController.addDeviceId);
    app.get('/api/user/map', userController.getUserMap);

    // Geocoding
    app.get('/api/geocoding', geocodingController.getLocationFromAddress);

    // Countries
    app.get('/api/book/:book/countries', pageController.getCountriesWithLocations);
    app.get('/api/book/:book/countries/:country/page', pageController.getPagesFromCountry);

    app.post('/api/group', friendsController.createRoom);
    app.get('/api/group', friendsController.getRooms);
    app.get('/api/group/friend', friendsController.getRoomFromFriend);
    app.get('/api/group/:room', friendsController.getRoom);

    // Friends
    app.get('/api/friends', friendsController.getFriends);
    app.post('/api/friends', friendsController.addFriend);
    app.delete('/api/friends/:friend', friendsController.removeFriend);
    app.post('/api/friends/request', friendsController.createFriendRequest);
    app.get('/api/friends/request', friendsController.getFriendRequests);
    app.post('/api/friends/request/accept', friendsController.acceptFriendRequest);

    app.post('/api/password/forgot', mailController.passwordMail);
    app.get('/api/password/checkLink/:token', authenticationController.checkPasswordReceiveLink);
    app.post('/api/password/renew', authenticationController.renewPassword);

    app.post('/api/admin/set/images', adminController.setImageOwning);


    app.post('/api/admin/notif', adminController.testNotifications);


}
