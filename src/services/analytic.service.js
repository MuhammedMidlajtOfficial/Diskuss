const Analytic = require("../models/analytics/analytic.model")

const Profile = require("../models/profile")
const enterprise = require("../models/enterpriseUser")
const MeetingBase = require("../models/EnterpriseMeetingModel")
const Card = require('../models/card')


exports.logShare = async (cardId, userId) => {
    const share = new Analytic.Share({ cardId, userId, sharedAt: new Date() });
    await share.save();
};

exports.logView = async (cardId, visitorId) => {
    const now = new Date();
    let isUnique = false;

    const existingVisitor = await Analytic.Visitor.findOne({ cardId, visitorId });
    if (!existingVisitor) {
        isUnique = true;
        const newVisitor = new Analytic.Visitor({ cardId, visitorId, firstVisit: now, lastVisit: now });
        await newVisitor.save();
    } else {
        existingVisitor.lastVisit = now;
        await existingVisitor.save();
    }

    const view = new Analytic.View({ cardId, viewedAt: now, isUnique });
    await view.save();

    await Analytic.Share.updateOne({ cardId, isViewed: false }, { isViewed: true });
};

exports.logClick = async (cardId, userId, link) => {
    const click = new Analytic.Click({ cardId, userId, link, clickedAt: new Date() });
    await click.save();
};

exports.getAnalytics = async (cardId, period) => {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        default:
            startDate = new Date(0);
    }

    const viewsCount = await Analytic.View.countDocuments({ cardId, viewedAt: { $gte: startDate } });
    const uniqueVisitorsCount = await Analytic.Visitor.countDocuments({ cardId, firstVisit: { $gte: startDate } });
    const totalShares = await Analytic.Share.countDocuments({ cardId, sharedAt: { $gte: startDate } });
    const viewedShares = await Analytic.Share.countDocuments({ cardId, sharedAt: { $gte: startDate }, isViewed: true });
    const unviewedShares = totalShares - viewedShares;
    const clicksCount = await Analytic.Click.countDocuments({ cardId, clickedAt: { $gte: startDate } });
    const clickThroughRate = viewsCount > 0 ? (clicksCount / viewsCount) * 100 : 0;

    return {
        views: viewsCount,
        uniqueVisitors: uniqueVisitorsCount,
        shares: { total: totalShares, viewed: viewedShares, unviewed: unviewedShares },
        clicks: clicksCount,
        clickThroughRate: clickThroughRate.toFixed(2),
    };
};


// get meeting by ids  //
exports.getMeetingsByIds = async (enterpriseId) => {
    // Find the user's profile by userId and populate meetings if referenced in schema
    let userInfo = await Profile.findById(enterpriseId).populate({
        path: 'meetings',
        strictPopulate: false,
    });
    // If not found in Profile collection, check in the enterprise collection
    if (!userInfo) {
        userInfo = await enterprise.findById(enterpriseId).populate({
            path: 'meetings',
            strictPopulate: false,
        });
    }
    
    // If user profile not found, return an error
    if (!userInfo) {
        return { status: 404, message: "User profile not found." };

    }

    // Extract meeting IDs from the user's profile
    const meetingIds = userInfo?.meetings?.map(meeting => meeting._id);

    // Get current date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate start and end dates for this month and year
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear() + 1, 0, 0);

    // Count meetings based on different criteria
    // Find meetings in MeetingBase collection that match the extracted meeting IDs
    const meetingsToday = await MeetingBase.countDocuments({
        _id: { $in: meetingIds },
        selectedDate: { $gte: today }
    });

    const meetingsThisMonth = await MeetingBase.countDocuments({
        _id: { $in: meetingIds },
        selectedDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const meetingsThisYear = await MeetingBase.countDocuments({
        _id: { $in: meetingIds },
        selectedDate: { $gte: startOfYear, $lte: endOfYear }
    });

    // Count upcoming and expired meetings
    const upcomingMeetingsCount = await MeetingBase.countDocuments({
        _id: { $in: meetingIds },
        selectedDate: { $gt: today } // Meetings scheduled after today
    });

    const expiredMeetingsCount = await MeetingBase.countDocuments({
        _id: { $in: meetingIds },
        selectedDate: { $lt: today } // Meetings scheduled before today
    });

    // Combine all counts into one response object
    const responseMeetings = {
        today: meetingsToday,
        thisMonth: meetingsThisMonth,
        thisYear: meetingsThisYear,
        upcomingCount: upcomingMeetingsCount,
        expiredCount: expiredMeetingsCount,
    };

    // Send back the enriched meetings as the response
    console.log("Meetings:", responseMeetings);
    
    return { meetings: responseMeetings };
}
// get card by ids  //
exports.getCardsByIds = async (enterpriseId) => {
    // Find the user's profile by userId and populate meetings if referenced in schema
    let userInfo = await Profile.findById(enterpriseId);
    
    // If not found in Profile collection, check in the enterprise collection
    if (!userInfo) {
        userInfo = await enterprise.findById(enterpriseId);
    }
    
    console.log(userInfo)

    // If user profile not found, return an error
    if (!userInfo) {
        return { status: 404, message: "User profile not found." };
    }

    // Extract meeting IDs from the user's profile
    // const cardIds = userInfo?.empCards?.map(card => card._id);
    const cardIds = userInfo?.empCards;

    console.log("card id: ", cardIds)

    // Get current date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate start and end dates for this month and year
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear() + 1, 0, 0);

    // Count meetings based on different criteria
    const meetingsToday = await Card.countDocuments({
        _id: { $in: cardIds },
        createdAt: { $gte: today }
    });

    console.log("meering today : ", meetingsToday)
    
    const meetingsThisMonth = await Card.countDocuments({
        _id: { $in: cardIds },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    console.log("meeting month : ", meetingsThisMonth)
    
    const meetingsThisYear = await Card.countDocuments({
        _id: { $in: cardIds },
        createdAt: { $gte: startOfYear, $lte: endOfYear }
    });
    
    console.log("meeting year : ", meetingsThisYear)

    // Combine all counts into one response object
    const responseMeetings = {
        today: meetingsToday,
        thisMonth: meetingsThisMonth,
        thisYear: meetingsThisYear,
    };

    // Send back the enriched meetings as the response
    console.log("Cards:", responseMeetings);
    
    return { meetings: responseMeetings };

}

