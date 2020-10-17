import { User, UserDocument } from "../models/User";
import { ID, Badge } from "../tools/types";



export const Badges: {[key: string]: Badge} = Object.freeze({
    FriendWithAdmin: {
        name: 'FriendWithAdmin',
        maxValue: 1
    }
})

/**
 * Increment the value of a badge for a user
 * @param userId id of the user to update
 * @param badge badge to increment
 */
export async function incrementBadge(userId: ID, badge: Badge): Promise<UserDocument> {
    const user = await User.findOne({_id: userId});

    const userBadges = user.badges;

    const badgeIndex = userBadges.findIndex(b => b.name === badge.name);

    if (badgeIndex === -1) {
        const badgeToSet = {
            name: badge.name,
            value: 1
        };
    } else {
        const badgeToSet = userBadges[badgeIndex];
        badgeToSet.value++;
    }

    return await user.save();
}

/**
 * Get a badge value for a user
 * @param userId the user we want to check the badge
 * @param badge the badge to check
 * @param callback 
 */
export async function getBadgeValue(userId: ID, badge: Badge, callback: ((value: number) => any)): Promise<number> {
    const user = await User.findOne({_id: userId});

    const userBadges = user.badges;

    const badgeIndex = userBadges.findIndex(b => b.name === badge.name);

    const returnValue = badgeIndex === -1 ? 0 : userBadges[badgeIndex].value;

    callback(returnValue);
    return returnValue;
}

/**
 * get all the active badges for a user
 * @param userId the user we want to check the badges
 * @param callback 
 */
export async function getActiveBadges(userId: ID, callback: (activeBadges: Badge[]) => any ) {
    const user = await User.findOne({_id: userId});

    const userBadges = user.badges;

    const returnBadges =  userBadges.filter(badge => {
        return Badges[badge.name].maxValue <= badge.value;
    });

    callback(returnBadges);
    return returnBadges;
}