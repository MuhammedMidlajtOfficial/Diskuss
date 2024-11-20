const analyticsService = require('../services/analytic.service');

exports.logShare = async (req, res) => {
    const { cardId, userId } = req.body;
    try {
        await analyticsService.logShare(cardId, userId);
        res.json({ message: 'Share logged successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error logging share' });
    }
};

exports.logView = async (req, res) => {
    const { cardId, visitorId } = req.body;
    try {
        await analyticsService.logView(cardId, visitorId);
        res.json({ message: 'View logged successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error logging view' });
    }
};

exports.logClick = async (req, res) => {
    const { cardId, userId, link } = req.body;
    try {
        await analyticsService.logClick(cardId, userId, link);
        res.json({ message: 'Click logged successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error logging click' });
    }
};

exports.getAnalytics = async (req, res) => {
    const { cardId, period } = req.query;
    try {
        const data = await analyticsService.getAnalytics(cardId, period);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching analytics data' });
    }
};


exports.getEnterpriseMeetings = async (req, res) => {
    const { enterpriseId } = req.params;
    try {
        console.log(enterpriseId)
        const data = await analyticsService.getEnterpriseMeetings(enterpriseId );
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching analytics data' });
    }
};

exports.getIndividualMeetings = async (req, res) => {
    const { individualId } = req.params;
    try {
        console.log(individualId)
        const data = await analyticsService.getIndividualMeetings(individualId );
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching analytics data' });
    }
};

exports.getCards = async (req, res) => {
    const { enterpriseId } = req.params;
    try {
        console.log(enterpriseId)
        const data = await analyticsService.getCardsByIds(enterpriseId );
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching analytics data' });
    }
};

exports.getCards = async (req, res) => {
    const { enterpriseId } = req.params;
    try {
        console.log(enterpriseId)
        const data = await analyticsService.getCardsByIds(enterpriseId );
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching analytics data' });
    }
};

exports.getEmployees = async (req, res) => {
    const { enterpriseId } = req.params;
    try {
        console.log(enterpriseId)
        const data = await analyticsService.getEmployeesByIds(enterpriseId );
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching analytics data' });
    }
};

exports.getCounts = async (req, res) => {
    const { period } = req.query;
    const {enterpriseId} = req.params;

    console.log("period :", period)
    console.log("enterpriseId :", enterpriseId)
  
    try {
        const data = await analyticsService.getCounts(enterpriseId, period);
        res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  


// const analyticService = require("../services/analytic.service")
// const Analytic  = require('../models/analytics/analytic.model');


// /**
//  * Get all Contacts
//  * @param {Request} req
//  * @param {Response} res
//  * @returns {Promise<Response>}
//  */
// const createShare = async (req, res) => {
//     try {
//     const { cardId, userId } = req.body;
//     const newShares = await analyticService.createShare({ cardId, userId, sharedAt: new Date() });
    
//     // Check if required fields are provided
//     if (!newShares) {
//         return res.status(400).json({ message: "All fields are required." });
//     }

//     return res.status(201).json({ message: 'Share logged successfully', Share : newShares });
//     } catch (e) {
//         return res.status(500).json({ error: e.message, });
//     }
// };

// /**
//  * Get all Contacts
//  * @param {Request} req
//  * @param {Response} res
//  * @returns {Promise<Response>}
//  */
// const createView = async (req, res) => {
//     try {
//     const { cardId, visitorId } = req.body;
//     const now = new Date();

//     // Check if visitor is unique
//     let isUnique = false;
//     const existingVisitor = await analyticService.findVisitor({ cardId, visitorId });
//     if (!existingVisitor) {
//         isUnique = true;
//         const newVisitor = new Analytic.Visitor({ cardId, visitorId, firstVisit: now, lastVisit: now });
//         await newVisitor.save();
//     } else {
//         existingVisitor.lastVisit = now;
//         await existingVisitor.save();
//     }

//     // const newView = await analyticService.createVIew(req.body);
//     const view = new Analytic.View({ cardId, viewedAt: now, isUnique });
//     await view.save();

//     // Update the share to 'viewed' if it was from a share link
//     await Share.updateOne({ cardId, isViewed: false }, { isViewed: true });

    
//     return res.status(201).json({ message: 'Share logged successfully', Share : newShares });
//     } catch (e) {
//         return res.status(500).json({ error: e.message, });
//     }
// };

// const createClick = async(req, res) => {
//     try{
//         const { cardId, userId, link } = req.body;
//         const newClick = new Analytic.Click({ cardId, userId, link, clickedAt: new Date() });
//         await click.save();
//         return res.status(201).json({ message: 'Click logged successfully', Share : newClick });

//     } catch(e){
//         return res.status(500).json({ error: e.message, });
//     }
// }

// const getAnalytic = async(req, res) => {
//     try{
//         const { cardId, period } = req.query;
//         const now = new Date();
//         let startDate;
    
//         // Filter by period
//         switch (period) {
//             case 'today':
//                 startDate = new Date(now.setHours(0, 0, 0, 0));
//                 break;
//             case 'week':
//                 startDate = new Date(now.setDate(now.getDate() - 7));
//                 break;
//             case 'month':
//                 startDate = new Date(now.setMonth(now.getMonth() - 1));
//                 break;
//             default:
//                 startDate = new Date(0);
//         }
    
//         // Count total views
//         const viewsCount = await Analytic.View.countDocuments({ cardId, viewedAt: { $gte: startDate } });
    
//         // Count unique visitors
//         const uniqueVisitorsCount = await Analytic.Visitor.countDocuments({ cardId, firstVisit: { $gte: startDate } });
    
//         // Count shares and separate viewed/unviewed
//         const totalShares = await Analytic.Share.countDocuments({ cardId, sharedAt: { $gte: startDate } });
//         const viewedShares = await Analytic.Share.countDocuments({ cardId, sharedAt: { $gte: startDate }, isViewed: true });
//         const unviewedShares = totalShares - viewedShares;
    
//         // Count clicks and calculate CTR
//         const clicksCount = await Analytic.Click.countDocuments({ cardId, clickedAt: { $gte: startDate } });
//         const clickThroughRate = viewsCount > 0 ? (clicksCount / viewsCount) * 100 : 0;
    
//         res.res.status(201).json({
//             views: viewsCount,
//             uniqueVisitors: uniqueVisitorsCount,
//             shares: { total: totalShares, viewed: viewedShares, unviewed: unviewedShares },
//             clicks: clicksCount,
//             clickThroughRate: clickThroughRate.toFixed(2),
//         });
//     } catch(e){
//         return res.status(500).json({ error: e.message, });
//     }
// }

// module.exports = {
//     createShare,
//     createView,
//     createClick,
//     getAnalytic

// }

