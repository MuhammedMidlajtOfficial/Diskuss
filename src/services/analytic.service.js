const Analytic = require("../models/analytics/analytic.model")
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
