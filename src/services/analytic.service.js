const Analytic = require("../models/analytics/analytic.model")
const moment = require('moment');
const Profile = require("../models/profile/profile")
const enterprise = require("../models/users/enterpriseUser")
const MeetingBase = require("../models/meeting/EnterpriseMeetingModel")
const individualMeeting = require("../models/meeting/EnterpriseMeetingModel")
const Card = require('../models/cards/card')
const empCard = require('../models/cards/enterpriseEmployeCard.model')
const Employee = require("../models/users/enterpriseEmploye.model")
const Team = require("../models/team/team.model")
const Contact = require("../models/contacts/contact.enterprise.model")
const individualContact = require("../models/contacts/contact.individual.model")
const filterByDate = require("../util/filterByDate")
const { individualUserCollection } = require("../DBConfig");
const { getMeetingsAnalytics } = require("../Controller/analyticController");
const { checkUserType } = require("../util/HelperFunctions")
const { ObjectId } = require("mongodb");


exports.logShare = async (cardId, userId, sharedAt = new Date()) => {
    const share = new Analytic.Share({ cardId, userId, sharedAt });
    await share.save();
};

exports.logView = async (cardId, visitorId, viewedAt = new Date()) => {
    // const now = new Date();
    // let isUnique = false;

    // const existingVisitor = await Analytic.Visitor.findOne({ cardId, visitorId });
    // if (!existingVisitor) {
    //     isUnique = true;
    //     const newVisitor = new Analytic.Visitor({ cardId, visitorId, firstVisit: now, lastVisit: now });
    //     await newVisitor.save();
    // } else {
    //     existingVisitor.lastVisit = now;
    //     await existingVisitor.save();
    // }

    const view = new Analytic.View({ cardId, visitorId,viewedAt });
    await view.save();

    await Analytic.Share.updateOne({ cardId, isViewed: false }, { isViewed: true });
};

exports.logClick = async (cardId, userId, link, clickedAt = new Date()) => {
    const click = new Analytic.Click({ cardId, userId, link, clickedAt });
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

exports.getCardAnalytics = async (cardId, period = "") => {
    // console.log( "cardId : ", cardId, "period : ", period)
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

    // console.log("startDate : ", startDate);    
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
    // console.log("userId ", userId,"Period :", period)

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

    // console.log("cardIds :", cardIds)
    
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

// Function to aggregate analytics data by day
exports.getAllAnalyticsByDateFrame =  async (cardId, startDate, endDate) => {

    // console.log("startDateObj : ", startDate, "endDateObj : ", endDate)
    try {
        const dateSeries = getDateSeries(startDate, endDate);
        
        // Aggregate shares
        const shares = await Analytic.Share.aggregate([
            {
                $match: {
                    cardId,
                    sharedAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$sharedAt" } },
                    totalShares: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // Sort by date
        ]);

        // Aggregate views
        const views = await Analytic.View.aggregate([
            {
                $match: {
                    cardId,
                    viewedAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" } },
                    totalViews: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$visitorId" }
                }
            },
            {
                $project: {
                    _id: 1,
                    totalViews: 1,
                    uniqueViewsCount: { $size: "$uniqueUsers" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // // Aggregate visitors
        // const visitors = await Analytic.Visitor.aggregate([
        //     {
        //         $match: {
        //             cardId,
        //             firstVisit: { $gte: startDate, $lte: endDate }
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: { $dateToString: { format: "%Y-%m-%d", date: "$firstVisit" } },
        //             totalVisitors: { $sum: 1 },
        //         }
        //     },
        //     {
        //         $project: {
        //             _id: 1,
        //             totalVisitors: 1,
        //         }
        //     },
        //     { $sort: { _id: 1 } }
        // ]);

        // Aggregate clicks
        const clicks = await Analytic.Click.aggregate([
            {
                $match: {
                    cardId,
                    clickedAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$clickedAt" } },
                    totalClicks: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // console.log("shares : ", shares)
        // 3. Merge and Fill Gaps
        const sharesFilled = fillGaps(dateSeries, shares, 'totalShares');
        const viewsFilled = fillGapsForViews(dateSeries, views); //using different fillGaps function for views, as views have uniqueViewsCount field as well
        const clicksFilled = fillGaps(dateSeries, clicks, 'totalClicks');


        // Combine results into a single object
        return {
            // shares,
            // views,
            // // visitors,
            // clicks,
            shares: sharesFilled,
            views: viewsFilled,
            clicks: clicksFilled

        };
    } catch (error) {
        console.error("Error aggregating analytics data:", error);
    }
}


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
    // console.log("Meetings:", responseMeetings);
    
    return { meetings: responseMeetings };
}

//get individual Meetinbg By Id
exports.getIndividualMeetings = async (individualId) => {

    const userInfo = await individualUserCollection.findOne({_id:individualId}).exec()
    // console.log("userInfo : ", userInfo)


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
    
    // console.log(userInfo)

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

    // console.log("card id: ", empIds)

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

    // console.log("employees today : ", employeesToday)
    
    const employeesThisMonth = await Employee.countDocuments({
        _id: { $in: empIds },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    // console.log("employees month : ", employeesThisMonth)
    
    const employeesThisYear = await Employee.countDocuments({
        _id: { $in: empIds },
        createdAt: { $gte: startOfYear, $lte: endOfYear }
    });
    
    // console.log("employees year : ", employeesThisYear)

    // Combine all counts into one response object
    const responseEmployees = {
        today: employeesToday,
        thisMonth: employeesThisMonth,
        thisYear: employeesThisYear,
    };

    // Send back the enriched employees as the response
    // console.log("employees:", responseEmployees);
    
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

exports.getMeetingsAnalytics = async (userId) => {
    try {
        // Count meetings

        const [meetingsCreatedCount,
                meetingInvitedCount,
                todaySections,
                thisMonthMeetings,
                thisYearMeetings,
                thisYearExpiredMeeting,
                upcomingMeetings
            ] = await Promise.all([
            MeetingBase.countDocuments({ meetingOwner: userId }),
            MeetingBase.countDocuments({ 'invitedPeople.user': userId }),
            countMeetingsTodayInSections(userId),
            countMeetingsThisMonth(userId),
            countMeetingsThisYearInQuarters(userId),
            countExpiredMeetingsEveryMonthOfThisYear(userId),
            countUpcomingMeetingNextFourWeek(userId)
        ]);

            
        // const meetingsCreatedCount = await MeetingBase.countDocuments({
        //     meetingOwner: userId,
        // });

        // const meetingInvitedCount = await MeetingBase.countDocuments({
        //     'invitedPeople.user': userId,
        // });

        // const todaySections = await countMeetingsTodayInSections(userId);

        // const thisMonthMeetings = await countMeetingsThisMonth(userId);

        // const thisYearMeetings = await countMeetingsThisYearInQuarters(userId);

        // const thisYearExpiredMeeting = await countMeetingsEveryMonthOfThisYear(userId);

        // const upcomingMeetings = await countUpcomingMeetingNextFourWeek(userId);

        

        // console.log("meetingsCreatedCount : ", meetingsCreatedCount);
        // console.log("meetingInvitedCount : ", meetingInvitedCount);
        const response = {
            meetingsCreatedCount,
            meetingInvitedCount,
            todaySections,
            thisMonthMeetings,
            thisYearMeetings,
            thisYearExpiredMeeting,
            upcomingMeetings
        }

        return response;
    } catch (err) {
        return ({ error: err.message });
    }
    };

// exports.getOverview = async (userId) => {
//     try {
        
//         const [cards, employees, contacts, meetings] = await Promise.all([
//             countAllCards(userId),
//             countAllEmployees(userId),
//             countAllContacts(userId),
//             countAllMeetings(userId)
//         ]);

//         const response = {
//             cards,
//             employees,
//             contacts,
//             meetings
//         }

//         return response;


//     } catch (err) {
//         return ({ error: err.message });
//     }

// };

  // Helper function to generate a series of dates
function getDateSeries(startDate, endDate) {
    const dateSeries = [];
    let currentDate = new Date(startDate); //clone startDate to avoid modifying it
    while (currentDate <= endDate) {
        dateSeries.push(formatDate(new Date(currentDate))); // Clone again to avoid modifying the date in the array
        currentDate.setDate(currentDate.getDate() + 1);
    }
    // console.log("dateSeries : ", dateSeries)
    return dateSeries;
};

// Helper function to format a date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

  // Helper function to merge the date series with the aggregated data and fill in any gaps
function fillGaps(dateSeries, data, totalFieldName) {
    const dataMap = new Map(data.map(item => [item._id, item]));
    return dateSeries.map(date => {
        if (dataMap.has(date)) {
            return dataMap.get(date);
        } else {
            return { _id: date, [totalFieldName]: 0 };
        }
    });
};

// Helper function to merge the date series with the aggregated data and fill in any gaps for views (since views have uniqueViewsCount field as well)
function fillGapsForViews(dateSeries, data) {
    const dataMap = new Map(data.map(item => [item._id, item]));
    return dateSeries.map(date => {
        if (dataMap.has(date)) {
            return dataMap.get(date);
        } else {
            return { _id: date, totalViews: 0, uniqueViewsCount: 0 };
        }
    });
};

// Function to count meetings in a given date range
const countMeetings = async (userId, start, end) => {
    return await MeetingBase.countDocuments({
        $or: [
            { 'meetingOwner': userId },
            { 'invitedPeople.user': userId }
        ],
        selectedDate: {
            $gte: start.toDate(),
            $lt: end.toDate()
        }
    });
};

// Helper function to count meetings in sections of 4 hours each
async function countMeetingsTodayInSections(userId) {
    const now = moment();
    const startOfDay = now.clone().startOf('day');
    const sections = [];
    let totalMeetingToday = 0;
  
    for (let i = 0; i < 6; i++) {
      const sectionStart = startOfDay.clone().add(i * 4, 'hours');
      const sectionEnd = sectionStart.clone().add(4, 'hours');
  
      const count = await countMeetings(userId, sectionStart, sectionEnd);

        totalMeetingToday += count;
  
      sections.push({
        section: i + 1,
        start: sectionStart.format('HH:mm'),
        end: sectionEnd.format('HH:mm'),
        count: count
      });
    }
  
    return { totalMeetingToday, sections };
  }

// Helper function to count meetings in weeks and remaining days of the month
async function countMeetingsThisMonth(userId) {
    const now = moment();
    const startOfMonth = now.clone().startOf('month');
    const endOfMonth = now.clone().endOf('month');
    const weeks = [];
    let totalMeetingThisMonth = 0;
  
    for (let i = 0; i < 4; i++) {
      const weekStart = startOfMonth.clone().add(i, 'weeks');
      const weekEnd = weekStart.clone().add(1, 'week');
  
      const count = await countMeetings(userId, weekStart, weekEnd);
      totalMeetingThisMonth += count;
  
      weeks.push({
        week: i + 1,
        start: weekStart.format('YYYY-MM-DD'),
        end: weekEnd.format('YYYY-MM-DD'),
        count: count
      });
    }
  
    // Remaining Days
    const remainingStart = startOfMonth.clone().add(4, 'weeks');
    const remainingCount = await countMeetings(userId, remainingStart, endOfMonth);

    totalMeetingThisMonth += remainingCount;

  
    return {
    totalMeetingThisMonth: totalMeetingThisMonth,
      weeks: weeks,
      remainingDays: {
        start: remainingStart.format('YYYY-MM-DD'),
        end: endOfMonth.format('YYYY-MM-DD'),
        count: remainingCount
      }
    };
  }

  // Helper function to count meetings in quarters of the year
  async function countMeetingsThisYearInQuarters(userId) {
    const now = moment();
    const startOfYear = now.clone().startOf('year');
    const quarters = [];
    let totalMeetingThisYear = 0;
  
    for (let i = 0; i < 4; i++) {
      const quarterStart = startOfYear.clone().add(i * 3, 'months');
      const quarterEnd = quarterStart.clone().add(3, 'months');
  
      const count = await countMeetings(userId, quarterStart, quarterEnd);
        totalMeetingThisYear += count
  
      quarters.push({
        quarter: i + 1,
        start: quarterStart.format('YYYY-MM-DD'),
        end: quarterEnd.format('YYYY-MM-DD'),
        count: count
      });
    }
  
    return { totalMeetingThisYear, quarters };
  }
  
// Helper function to count meetings in every month of the year
  async function countExpiredMeetingsEveryMonthOfThisYear(userId) {
    const now = moment();
    const startOfYear = now.clone().startOf('year');
    const monthsData = [];
    const currentMonth = now.month();
    let totalMeetingThisYear = 0;

    for (let i = 0; i < 12; i++) {
        const monthStart = startOfYear.clone().add(i, 'months');
        let monthEnd = monthStart.clone().add(1, 'month');
        let count;

        if (i === currentMonth) {
            monthEnd = moment()
            count = await countMeetings(userId, monthStart, monthEnd);
        monthsData.push({
            month: monthStart.format('MMMM'), // Month name
            year: monthStart.format('YYYY'),
            count: count
        });
        totalMeetingThisYear += count;
        break;
        } 
        
        count = await countMeetings(userId, monthStart, monthEnd);


        totalMeetingThisYear += count;

        monthsData.push({
            month: monthStart.format('MMMM'), // Month name
            year: monthStart.format('YYYY'),
            count: count
        });
    }

    return { totalMeetingThisYear, monthsData };
}


async function countUpcomingMeetingNextFourWeek(userId) {
    try {
        const now = moment();
        const startOfDay = now.clone().startOf('day');
        const startOfWeek = now.clone().startOf('week');
        const endOfWeek = now.clone().endOf('week');

        // console.log("startOfDay : ", startOfDay, " endOfWeek : ", endOfWeek);

        const sections = [];
        let totalMeetingNextFourWeek = 0;

        // Initial section (current day to end of current week)
        const initialCount = await countMeetings(userId, startOfDay, endOfWeek);
        totalMeetingNextFourWeek += initialCount;
        sections.push({
            section: 1,
            start: startOfDay.format('YYYY-MM-DD'),
            end: endOfWeek.format('YYYY-MM-DD'),
            count: initialCount
        });

        // Subsequent sections (next 4 weeks)
        for (let i = 1; i < 4; i++) {
            const sectionStart = startOfWeek.clone().add(i, 'weeks');
            const sectionEnd = sectionStart.clone().add(1, 'week');

            const count = await countMeetings(userId, sectionStart, sectionEnd);
            totalMeetingNextFourWeek += count;

            sections.push({
                section: i + 1,
                start: sectionStart.format('YYYY-MM-DD'),
                end: sectionEnd.format('YYYY-MM-DD'),
                count: count
            });
        }

        return { totalMeetingNextFourWeek, sections };
    } catch (error) {
        console.error("Error in countUpcomingMeetingNextFourWeek: ", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

// Helper function to count meetings in every month of the year
async function countMeetingsEveryMonthOfThisYear(userId) {
    const now = moment();
    const startOfYear = now.clone().startOf('year');
    const monthsData = [];
    const currentMonth = now.month();
    let totalMeetingThisYear = 0;

    for (let i = 0; i < 12; i++) {
        const monthStart = startOfYear.clone().add(i, 'months');
        const monthEnd = monthStart.clone().add(1, 'month');
        let count;

        if (i === currentMonth) {
            count = await countMeetings(userId, monthStart, monthEnd);
        monthsData.push({
            month: monthStart.format('MMMM'), // Month name
            year: monthStart.format('YYYY'),
            count: count
        });
        totalMeetingThisYear += count;
        break;
        } 
        
        count = await countMeetings(userId, monthStart, monthEnd);


        totalMeetingThisYear += count;

        monthsData.push({
            month: monthStart.format('MMMM'), // Month name
            year: monthStart.format('YYYY'),
            count: count
        });
    }

    return { totalMeetingThisYear, monthsData };
}


async function countAllMeetings(userId  ) {
    const now = moment();
    const startOfYear = now.clone().startOf('year');
    const monthsData = [];
    let [totalMeeting, totalMeetingThisYear] = await Promise.all([
        MeetingBase.countDocuments({
            $or: [
                { 'meetingOwner': userId },
                { 'invitedPeople.user': userId }
            ]
        }),
        MeetingBase.countDocuments({
            $or: [
                { 'meetingOwner': userId },
                { 'invitedPeople.user': userId }
            ],
            selectedDate: {
                $gte: startOfYear.toDate()
            }
        })
    ]);

    let count;

    for (let i = 0; i < 12; i++) {
        const monthStart = startOfYear.clone().add(i, 'months');
        const monthEnd = monthStart.clone().add(1, 'month');

        
        count = await MeetingBase.countDocuments({
            $or: [
                { 'meetingOwner': userId },
                { 'invitedPeople.user': userId }
            ],
            selectedDate: {
                $lt: monthEnd.toDate()
            }});

        monthsData.push({
            month: monthStart.format('MMMM'), // Month name
            year: monthStart.format('YYYY'),
            count: count
        });
    }

    return { totalMeeting, totalMeetingThisYear, monthsData };
    
}

async function countAllCards(userId) {
    const now = moment();
    const startOfYear = now.clone().startOf('year');
    const monthsData = [];
    let [totalCards, totalCardThisYear] = await Promise.all([
        Card.countDocuments({ userId: userId }),
        Card.countDocuments({
            userId: userId,
            createdAt: {
                $gte: startOfYear.toDate()
            }})
    ]);

    let count;

    for (let i = 0; i < 12; i++) {
        const monthStart = startOfYear.clone().add(i, 'months');
        const monthEnd = monthStart.clone().add(1, 'month');

        count = await Card.countDocuments({
            'userId': userId,
            createdAt : {
                $lt: monthEnd.toDate()
            }});

        monthsData.push({
            month: monthStart.format('MMMM'), // Month name
            year: monthStart.format('YYYY'),
            count: count
        });
    }

    return { totalCards, totalCardThisYear, monthsData };
}

async function countAllContacts(userId) {
    const now = moment();
    const startOfYear = now.clone().startOf('year');
    const monthsData = [];

    const response = async (model, userId) => {
    let [totalContacts, totalContactThisYear] = await Promise.all([
        model.countDocuments({ contactOwnerId: userId }),
        model.countDocuments({
            contactOwnerId: userId,
            createdAt: {
                $gte: startOfYear.toDate()
            }})
    ]);

    let count;
    
    for (let i = 0; i < 12; i++) {
        const monthStart = startOfYear.clone().add(i, 'months');
        const monthEnd = monthStart.clone().add(1, 'month');

        count = await model.countDocuments({
            contactOwnerId: userId,
            createdAt : {
                $lt: monthEnd.toDate()
            }});

        monthsData.push({
            month: monthStart.format('MMMM'), // Month name
            year: monthStart.format('YYYY'),
            count: count
        });
    }

    return { totalContacts, totalContactThisYear, monthsData };
    }
    
    const userType = await checkUserType(userId);
    if (userType === 'enterprise') {
        return await response(Contact, userId);
        // return await Contact.countDocuments({ contactOwnerId: userId });
    } else {
        return await response(individualContact, userId);
        // return await individualContact.countDocuments({ contactOwnerId: userId });
    }


};

async function countAllEmployees(userId) {
    const userType = await checkUserType(userId);
    // console.log("User Type : ", userType.userType)
    if (userType.userType === 'enterprise') {
        const count = await enterprise.findById(userId).select('empCards').exec();
        // console.log((count.empCards.length).toString(), " : ", typeOf((count.empCards.length).toString()))
        return (count.empCards.length).toString() ;
    } else {
        return "NA";
    }
}

exports.getOverview = async (userId) => {
    try {
        const now = moment();
        const startOfYear = now.clone().startOf('year').toDate();
        const userType = await checkUserType(userId);

        // Helper function to create the monthly aggregation pipeline
        const createMonthlyPipeline = (dateField) => {
            return Array.from({ length: 12 }, (_, i) => {
                const monthStart = now.clone().startOf('year').add(i, 'months').toDate();
                const monthEnd = now.clone().startOf('year').add(i + 1, 'months').toDate();

                return {
                    $cond: {
                        if: {
                            $and: [
                                // { $gte: [dateField, monthStart] },
                                { $lt: [dateField, monthEnd] }
                            ]
                        },
                        then: 1,
                        else: 0
                    }
                };
            });
        };

        // Constructing aggregation pipeline for meetings
        const meetingPipeline = [
            {
                $match: {
                    $or: [
                        { 'meetingOwner': new ObjectId(userId) },
                        { 'invitedPeople.user': userId }
                    ]
                }
            },
            {
                $facet: {
                    totalMeeting: [{ $count: 'count' }],
                    totalMeetingThisYear: [
                        {
                            $match: {
                                selectedDate: { $gte: startOfYear }
                            }
                        },
                        { $count: 'count' }
                    ],
                    monthsData: [
                        {
                            $project: {
                                monthData: createMonthlyPipeline('$selectedDate')
                            }
                        },
                        {
                            $unwind: {
                                path: '$monthData',
                                includeArrayIndex: 'monthIndex'
                            }
                        },
                        {
                            $group: {
                                _id: '$monthIndex',
                                count: { $sum: '$monthData' }
                            }
                        },
                        {
                            $sort: { _id: 1 }
                        },
                        {
                            $group: {
                                _id: null,
                                monthsData: { $push: { count: '$count' } }
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    totalMeeting: { $arrayElemAt: ['$totalMeeting.count', 0] },
                    totalMeetingThisYear: { $arrayElemAt: ['$totalMeetingThisYear.count', 0] },
                    monthsData: { $arrayElemAt: ['$monthsData.monthsData', 0] }
                }
            }
        ];

        // Constructing aggregation pipeline for cards
        const cardPipeline = [
            {
                $match: {
                    userId: userId
                }
            },
            {
                $facet: {
                    totalCards: [{ $count: 'count' }],
                    totalCardThisYear: [
                        {
                            $match: {
                                createdAt: { $gte: startOfYear }
                            }
                        },
                        { $count: 'count' }
                    ],
                    monthsData: [
                        {
                            $project: {
                                monthData: createMonthlyPipeline('$createdAt')
                            }
                        },
                        {
                            $unwind: {
                                path: '$monthData',
                                includeArrayIndex: 'monthIndex'
                            }
                        },
                        {
                            $group: {
                                _id: '$monthIndex',
                                count: { $sum: '$monthData' }
                            }
                        },
                        {
                            $sort: { _id: 1 }
                        },
                        {
                            $group: {
                                _id: null,
                                monthsData: { $push: { count: '$count' } }
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    totalCards: { $arrayElemAt: ['$totalCards.count', 0] },
                    totalCardThisYear: { $arrayElemAt: ['$totalCardThisYear.count', 0] },
                    monthsData: { $arrayElemAt: ['$monthsData.monthsData', 0] }
                }
            }
        ];

        // Function to execute aggregation and format month data
        const executeAggregation = async (model, pipeline) => {
            const result = await model.aggregate(pipeline).exec();
            const data = result[0] || {};
            const monthsData = data.monthsData ? data.monthsData.map((count, index) => {
                const monthStart = now.clone().startOf('year').add(index, 'months');
                return {
                    month: monthStart.format('MMMM'),
                    year: monthStart.format('YYYY'),
                    count: count.count
                };
            }) : Array(12).fill(0).map((_, index) => {
                const monthStart = now.clone().startOf('year').add(index, 'months');
                return {
                    month: monthStart.format('MMMM'),
                    year: monthStart.format('YYYY'),
                    count: 0
                };
            });

            return {
                total: data.totalCards || data.totalMeeting || 0,
                totalThisYear: data.totalCardThisYear || data.totalMeetingThisYear || 0,
                monthsData: monthsData
            };
        };

        // Refactor countAllContacts to use aggregation
        const countAllContacts = async (userId) => {
            const startOfYear = now.clone().startOf('year').toDate();
            const createMonthlyPipeline = (dateField) => {
                return Array.from({ length: 12 }, (_, i) => {
                    const monthStart = now.clone().startOf('year').add(i, 'months').toDate();
                    const monthEnd = now.clone().startOf('year').add(i + 1, 'months').toDate();

                    return {
                        $cond: {
                            if: {
                                $and: [
                                    // { $gte: [dateField, monthStart] },
                                    { $lt: [dateField, monthEnd] }
                                ]
                            },
                            then: 1,
                            else: 0
                        }
                    };
                });
            };

            const response = async (model, userId) => {
                const pipeline = [
                    {
                        $match: {
                            contactOwnerId: userId
                        }
                    },
                    {
                        $facet: {
                            totalContacts: [{ $count: 'count' }],
                            totalContactThisYear: [
                                {
                                    $match: {
                                        createdAt: { $gte: startOfYear }
                                    }
                                },
                                { $count: 'count' }
                            ],
                            monthsData: [
                                {
                                    $project: {
                                        monthData: createMonthlyPipeline('$createdAt')
                                    }
                                },
                                {
                                    $unwind: {
                                        path: '$monthData',
                                        includeArrayIndex: 'monthIndex'
                                    }
                                },
                                {
                                    $group: {
                                        _id: '$monthIndex',
                                        count: { $sum: '$monthData' }
                                    }
                                },
                                {
                                    $sort: { _id: 1 }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        monthsData: { $push: { count: '$count' } }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            totalContacts: { $arrayElemAt: ['$totalContacts.count', 0] },
                            totalContactThisYear: { $arrayElemAt: ['$totalContactThisYear.count', 0] },
                            monthsData: { $arrayElemAt: ['$monthsData.monthsData', 0] }
                        }
                    }
                ];

                const result = await model.aggregate(pipeline).exec();
                const data = result[0] || {};
                const monthsData = data.monthsData ? data.monthsData.map((count, index) => {
                    const monthStart = now.clone().startOf('year').add(index, 'months');
                    return {
                        month: monthStart.format('MMMM'),
                        year: monthStart.format('YYYY'),
                        count: count.count
                    };
                }) : Array(12).fill(0).map((_, index) => {
                    const monthStart = now.clone().startOf('year').add(index, 'months');
                    return {
                        month: monthStart.format('MMMM'),
                        year: monthStart.format('YYYY'),
                        count: 0
                    };
                });

                return {
                    totalContacts: data.totalContacts || 0,
                    totalContactThisYear: data.totalContactThisYear || 0,
                    monthsData: monthsData
                };
            };
            const userType = await checkUserType(userId);
            if (userType === 'enterprise') {
                return await response(Contact, userId);
            } else {
                return await response(individualContact, userId);
            }
        };
        console.log("userType : ", userType.userType)
        // Execute all operations in parallel
        const [cardsData, employees, contactsData, meetingsData] = await Promise.all([
            userType.userType === 'enterpriseEmployee' 
            ? executeAggregation(empCard, cardPipeline) 
            : executeAggregation(Card, cardPipeline),
            countAllEmployees(userId),
            countAllContacts(userId),
            executeAggregation(MeetingBase, meetingPipeline)
        ]);

        const response = {
            cards: cardsData,
            employees: employees,
            contacts: contactsData,
            meetings: meetingsData
        };

        return response;
    } catch (err) {
        console.error("Error in getOverview:", err);
        return { error: err.message };
    }
};

async function countAllEmployees(userId) {
    const userType = await checkUserType(userId);
    if (userType.userType === 'enterprise') {
        const enterpriseData = await enterprise.findById(userId).select('empCards').exec();
        // console.log((enterpriseData.empCards.length).toString(), " : ", typeof((enterpriseData.empCards.length).toString()))
        return (enterpriseData.empCards.length).toString() ;
        // return enterpriseData.empCards.length;
    } else {
        return "NA";
    }
}


// async function countUpcomingMeetingNextFourWeek(userId) {
//     const now = moment();
//     const startOfDay = now.clone().startOf('day');
//     const endOfWeek = now.clone().endOf('week');

//     console.log("startOfDay : ", startOfDay, " endOfWeek : ", endOfWeek);

//     const sections = [];
//     let totalMeetingNextFourWeek = 0;
    
//         const sectionStart = startOfDay.clone();
//         const sectionEnd = endOfWeek.clone();

//         const count = await MeetingBase.countDocuments({
//             $or: [
//                 { 'meetingOwner': userId },
//                 { 'invitedPeople.user': userId }
//                 ],
//             selectedDate: {
//                 $gte: sectionStart.toDate(),
//                 $lt: sectionEnd.toDate()
//             }
//         });

//         totalMeetingNextFourWeek += count;
    
//         sections.push({
//             section: 1,
//             start: sectionStart.format('YYYY-MM-DD'),
//             end: sectionEnd.format('YYYY-MM-DD'),
//             count: count
//         });


//     for (let i = 1; i < 5; i++) {
//         const sectionStart = startOfDay.clone().add(i, 'weeks');
//         const sectionEnd = sectionStart.clone().add(1, 'week');

//         const count = await MeetingBase.countDocuments({
//             $or: [
//                 { 'meetingOwner': userId },
//                 { 'invitedPeople.user': userId }
//                 ],
//             selectedDate: {
//                 $gte: sectionStart.toDate(),
//                 $lt: sectionEnd.toDate()
//             }
//         });

//         totalMeetingNextFourWeek += count;
    
//         sections.push({
//             section: i + 1,
//             start: sectionStart.format('YYYY-MM-DD'),
//             end: sectionEnd.format('YYYY-MM-DD'),
//             count: count
//         });
//     }


//     return { totalMeetingNextFourWeek, sections };
// }
