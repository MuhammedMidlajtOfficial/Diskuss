const Analytic = require("../models/analytics/analytic.model")

const Profile = require("../models/profile")
const individualUser = require("../models/individualUser")
const enterprise = require("../models/enterpriseUser")
const MeetingBase = require("../models/EnterpriseMeetingModel")
const individualMeeting = require("../models/MeetingModel")
const Card = require('../models/card')
const Employee = require("../models/enterpriseEmploye.model")
const Team = require("../models/team.model")
const Contact = require("../models/contact.enterprise.model")
const filterByDate = require("../util/filterByDate")

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
        const newView = new Analytic.View({ cardId, userId, viewedAt: now, isUnique });
        await newView.save();
        const newVisitor = new Analytic.Visitor({ cardId, visitorId, firstVisit: now, lastVisit: now });
        await newVisitor.save();
    } else {
        const newView = new Analytic.View({ cardId, visitorId, viewedAt: now });
        await newView.save();
        existingVisitor.lastVisit = now;
        await existingVisitor.save();
    }

    const view = new Analytic.View({ cardId, visitorId, viewedAt: now, isUnique });
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

exports.getAllAnalytics = async (userId, period) => {
    console.log("userId ", userId,"Period :", period)

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

    // Initialize sums
    let totalViews = 0;
    let totalUniqueVisitors = 0;
    let totalShares = 0;
    let totalViewedShares = 0;
    let totalClicks = 0;

    const cardIds = await Card.find({userId : userId}).select("_id")

    console.log("cardIds :", cardIds)
    
    for(const card of cardIds){
        // console.log("Card : ", card)
        // console.log("Cardid : ", card['_id'])
        const cardId = card['_id']
        const viewsCount = await Analytic.View.countDocuments({ cardId, viewedAt: { $gte: startDate } });
        const uniqueVisitorsCount = await Analytic.Visitor.countDocuments({ cardId, firstVisit: { $gte: startDate } });
        const sharesCount = await Analytic.Share.countDocuments({ cardId, sharedAt: { $gte: startDate } });
        const viewedSharesCount = await Analytic.Share.countDocuments({ cardId, sharedAt: { $gte: startDate }, isViewed: true });
        const clicksCount = await Analytic.Click.countDocuments({ cardId, clickedAt: { $gte: startDate } });
        
        // Accumulate the counts
        totalViews += viewsCount;
        totalUniqueVisitors += uniqueVisitorsCount;
        totalShares += sharesCount;
        totalViewedShares += viewedSharesCount;
        totalClicks += clicksCount;

        // console.log("viewsCount ", viewsCount)
        // console.log("uniqueVisitorsCount ",  uniqueVisitorsCoun
        
    }
 

     // Calculate unviewed shares
     const totalUnviewedShares = totalShares - totalViewedShares;

     // Calculate click-through rate
     const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
 
       // console.log({
    //     views: totalViews,
    //     uniqueVisitors: totalUniqueVisitors,
    //     shares: { total: totalShares, viewed: totalViewedShares, unviewed: totalUnviewedShares },
    //     clicks: totalClicks,
    //     clickThroughRate: clickThroughRate.toFixed(2),
    // })

    return {
        views: totalViews,
        uniqueVisitors: totalUniqueVisitors,
        shares: { total: totalShares, viewed: totalViewedShares, unviewed: totalUnviewedShares },
        clicks: totalClicks,
        clickThroughRate: clickThroughRate.toFixed(2),
    };
   
};


exports.getMonthlyAnalytics = async (cardId) => {
    const now = new Date();
    const startDate = new Date(now.setFullYear(now.getFullYear() - 1)); // Get data for the last year

    const pipeline = [
        {
            $match: {
                cardId,
                sharedAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: "$sharedAt" },
                    month: { $month: "$sharedAt" },
                },
                viewsCount: { $sum: { $cond: [{ $eq: ["$isViewed", true] }, 1, 0] } },
                uniqueVisitorsCount: { $addToSet: "$userId" }, // Assuming userId represents unique visitors
                totalShares: { $sum: 1 },
                clicksCount: { $sum: { $cond: [{ $ne: ["$link", null] }, 1, 0] } }, // Assuming link indicates a click
            },
        },
        {
            $project: {
                _id: 0,
                year: "$_id.year",
                month: "$_id.month",
                viewsCount: "$viewsCount",
                uniqueVisitorsCount: { $size: "$uniqueVisitorsCount" }, // Count unique visitors
                totalShares: "$totalShares",
                clicksCount: "$clicksCount",
            },
        },
        {
            $sort: { year: 1, month: 1 }, // Sort by year and month
        },
    ];

    const results = await Analytic.Share.aggregate(pipeline);

    return results.map(item => ({
        year: item.year,
        month: item.month,
        viewsCount: item.viewsCount,
        uniqueVisitorsCount: item.uniqueVisitorsCount,
        totalShares: item.totalShares,
        clicksCount: item.clicksCount,
    }));
};

// get meeting by ids  //
exports.getEnterpriseMeetings = async (enterpriseId) => {
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

//get individual Meetinbg By Id
exports.getIndividualMeetings = async (individualId) => {

    const userInfo = await individualUser.individualUserCollection.findById(individualId).exec()
    console.log("userInfo : ", userInfo)


    // If user profile not found, return an error
    if (!userInfo) {
        return { status: 404, message: "User profile not found." };
    }

    // Extract meeting IDs from the user's profile
    const meetingIds = userInfo?.meetings;
    // console.log("meetingIds :", meetingIds)

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
    const meetingsToday = await individualMeeting.countDocuments({
        _id: { $in: meetingIds },
        selectedDate: { $gte: today }
    });

    const meetingsThisMonth = await individualMeeting.countDocuments({
        _id: { $in: meetingIds },
        selectedDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const meetingsThisYear = await individualMeeting.countDocuments({
        _id: { $in: meetingIds },
        selectedDate: { $gte: startOfYear, $lte: endOfYear }
    });

    // Count upcoming and expired meetings
    const upcomingMeetingsCount = await individualMeeting.countDocuments({
        _id: { $in: meetingIds },
        selectedDate: { $gt: today } // Meetings scheduled after today
    });

    const expiredMeetingsCount = await individualMeeting.countDocuments({
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


    // console.log("Meetings:", responseMeetings);

    
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

    // console.log("card id: ", cardIds)

    // Get current date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate start and end dates for this month and year
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear() + 1, 0, 0);

    // Count meetings based on different criteria
    const cardsToday = await Card.countDocuments({
        _id: { $in: cardIds },
        createdAt: { $gte: today }
    });

    // console.log("Card today : ", cardsToday)
    
    const cardsThisMonth = await Card.countDocuments({
        _id: { $in: cardIds },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    // console.log("Card month : ", cardsThisMonth)
    
    const cardsThisYear = await Card.countDocuments({
        _id: { $in: cardIds },
        createdAt: { $gte: startOfYear, $lte: endOfYear }
    });
    
    // console.log("Card year : ", cardsThisYear)

    // Combine all counts into one response object
    const responseCardss = {
        today: cardsToday,
        thisMonth: cardsThisMonth,
        thisYear: cardsThisYear,
    };

    // Send back the enriched meetings as the response
    // console.log("Cards:", responseCardss);
    
    return { meetings: responseCardss };

}

// get card by ids  //
exports.getEmployeesByIds = async (enterpriseId) => {
    // Find the user's profile by userId and populate meetings if referenced in schema
    let userInfo = await Profile.findById(enterpriseId);
    
    // If not found in Profile collection, check in the enterprise collection
    if (!userInfo) {
        userInfo = await enterprise.findById(enterpriseId);
    }
    
    // console.log(userInfo)

    // If user profile not found, return an error
    if (!userInfo) {
        return { status: 404, message: "User profile not found." };
    }

    // Extract meeting IDs from the user's profile
    // const empIds = userInfo?.empCards?.map(card => card._id);
    const empIds = userInfo?.empId;

    console.log("card id: ", empIds)

    // Get current date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate start and end dates for this month and year
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear() + 1, 0, 0);

    // Count meetings based on different criteria
    const employeesToday = await Employee.countDocuments({
        _id: { $in: empIds },
        createdAt: { $gte: today }
    });

    console.log("employees today : ", employeesToday)
    
    const employeesThisMonth = await Employee.countDocuments({
        _id: { $in: empIds },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    console.log("employees month : ", employeesThisMonth)
    
    const employeesThisYear = await Employee.countDocuments({
        _id: { $in: empIds },
        createdAt: { $gte: startOfYear, $lte: endOfYear }
    });
    
    console.log("employees year : ", employeesThisYear)

    // Combine all counts into one response object
    const responseEmployees = {
        today: employeesToday,
        thisMonth: employeesThisMonth,
        thisYear: employeesThisYear,
    };

    // Send back the enriched employees as the response
    console.log("employees:", responseEmployees);
    
    return { employees: responseEmployees };
}

exports.getCounts = async (enterpriseId, period) => {
    try {
      const dateFilter = filterByDate(new Date(), period);

  
      // Count enterprise cards
      const enterpriseCardsCount = await Card.countDocuments({
        userId: enterpriseId,
        createdAt: dateFilter,
      });
  
      // Count teams
      const teamsCount = await Team.countDocuments({
        teamOwnerId: enterpriseId,
        createdAt: dateFilter,
      });
  
      // Count employee cards
      const enterpriseUsers = await enterprise.findById(enterpriseId);
      const empCardsCount = enterpriseUsers ? enterpriseUsers.empCards.length : 0;
  
      // Count contacts
      const contactsCount = await Contact.countDocuments({
        contactOwnerId: enterpriseId,
        createdAt: dateFilter,
      });
  
      return ({
        enterpriseCardsCount,
        teamsCount,
        empCardsCount,
        contactsCount,
      });
    } catch (err) {
      return ({ error: err.message });
    }
  };
