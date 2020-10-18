import { Badge, ID } from "../tools/types";
import { User, UserDocument } from '../models/User';
import * as mongoose from "mongoose";
import { BookDocument } from "../models/Book";

export interface UserInterface {
    _id: ID;
    username: string;
    displayedName: string;
    profilePicture: string;
    password?: string;
    salt?: string;
    badges?: Array<Badge>;
    friends?: Array<UserInterface>;
    favorites?: Array<BookDocument>;
    devices?: Array<string>;
}


export async function getUserById(uid: ID, options: { password: boolean, badges: boolean, friends: boolean, fovoriteBooks: boolean, devices: boolean, email: boolean }) {

    if (!mongoose.Types.ObjectId.isValid(uid)) 
        throw new Error("Invalid user Id");

    const user = await User.findById(uid);

    if (options.friends) {
        user.populate('friends')
    }

    if (options.fovoriteBooks) {
        user.populate('favorites')
    }

    const populatedUser = await user.execPopulate();
    

    // TODO : type response
    const response: UserInterface = {
        _id: populatedUser._id,
        username: populatedUser.username,
        displayedName: populatedUser.displayedName ?? populatedUser.username,
        profilePicture: populatedUser.profilePicture
    }

    if (options.password) {
        response.password = populatedUser.password;
        response.salt = populatedUser.salt;
    }

    if (options.badges) {
        response.badges = populatedUser.badges;
    }

    if (options.friends) {
        response.friends = user.friends.map((f: UserDocument) => ({
            _id: f._id,
            username: f.username,
            displayedName: f.displayedName ?? f.username,
            profilePicture: f.profilePicture
        }));
    }

    if (options.fovoriteBooks) {
        // TODO : Detail the books
        response.favorites = populatedUser.favorites;
    }

    if (options.devices) {
        response.devices = populatedUser.devices;
    }

    return response;

    

}