const express = require('express');

const authIndividualRouter = require('./Individual/authIndividualRouter.js')
const authEnterpriseRouter = require('./Enterprise/authEnterpriseRouter.js')
const cardRouter = require('./Card/cardRoutes.js')
const cardEnterpriseRouter = require('./cardEnterprise/cardEnterpriseRoute.js')
const subscriptionPlanRouter = require('./Subscription/SubscriptionPlanRouter.js')
const serviceRoutes = require('./serviceRouter.js')
const messageRoute = require("./Message/messageRoute.js");
const groupMessage = require('./Message/groupMessageRoute.js');
const userSubscriptionRouter = require('./Subscription/UserSubscriptionRouter.js');
const referralRouter = require('./Referral/ReferralRouter.js');
const actionRouter = require('./Referral/ActionRotuer.js');
const referralLevelRouter = require('./Referral/ReferralLevelRouter.js');
const MeetingRoute = require("./Meeting/MeetingRouter.js");
const individualContactRouter = require("./Contact/contactIndividualRouter.js");
const enterpriseContactRouter = require("./Contact/contactEnterpriseRouter.js");
const enterpriseEmployee = require('./EnterpriseEmployee/enterpriseEmployeeRouter.js');
// const enterpriseMessage = require("./EnterpriseMessage/enterpriseMessageRoute.js");
const teamRouter = require('./Team/teamRouter.js');
const notification = require('./Notification/NotificationRouter.js')
const enterpriseMeeting = require('./EnterPriseMeeting/EnterPriseMeeting.js')
const count = require('./Count/Count.js')
const individualcount = require('./Count/individualCount.js')
const Preferences = require('./Permission/PermissionModel.js')
const analyticRouter = require("./Analytic/analyticRouter.js")
const ticketRouter = require('./Ticket/ticketRouter.js')
const ticketCategoryRouter = require('./Ticket/ticketCategoryRouter.js')
const ticketReplyRouter = require('./Ticket/ticketReplyRouter.js')
const logController = require('./logRouter.js')
// const contactRouter = require("./contactRouter.js")
const uploadVCard = require("./VCard/VCardRoute.js")
const settingsRouter = require('./settingsRoutes.js'); 
const urlShortnerRouter = require('./urlShortner/urlShortnerRouter.js');
const { validateJwtToken } = require('../Middleware/validateJwtToken.js');


const router = express.Router();

// Apply validateJwtToken to all routes except login routes
// router.use((req, res, next) => {
//   console.log("originalUrl from validateJwtToken - ",req.originalUrl);
  // if (
  //   req.originalUrl.startsWith("/api/v1/individual") ||
  //   req.originalUrl.startsWith("/api/v1/enterprise") 
  // ) {
  //   return next(); // Skip validation for /individual and /enterprise
  // }

//   if (req.originalUrl.startsWith("/api/v1/card")) {
//     return validateJwtToken()(req, res, next); // Apply validation for /card route
//   }
//   return next()
//   // validateJwtToken()(req, res, next); // Apply validation for other routes
// });

const defaultRoutes = [
  {
    path: "/individual",
    route: authIndividualRouter,
  },
  {
    path: "/enterprise",
    route: authEnterpriseRouter,
  },
  {
    path: '/card',
    route: cardRouter,
  },
  {
    path: '/cardEnterprise',
    route: cardEnterpriseRouter,
  },
  {
    path: "/subscription-plan",
    route: subscriptionPlanRouter,
  },
  {
    path: "/service",
    route: serviceRoutes,
  },
  {
    path : '/subscription',
    route: userSubscriptionRouter
  },
  {
    path : '/referral',
    route: referralRouter
  },
  {
    path : '/action',
    route: actionRouter
  },
  {
    path: '/referral-level',
    route: referralLevelRouter
  },
  {
    path: '/individualContact',
    route: individualContactRouter
  },
  {
    path: '/enterpriseContact',
    route: enterpriseContactRouter
  },
  {
    path: '/meeting',
    route: MeetingRoute,
  },
  {
    path: '/message',
    route: messageRoute,
  },
  // {
  //   path: '/groupMessage',
  //   route: groupMessage,
  // },
  {
    path: '/enterpriseEmployee',
    route: enterpriseEmployee,
  },
  // {
  //   path: '/enterpriseMessage',
  //   route: enterpriseMessage,
  // },
  {
    path: '/team',
    route: teamRouter,
  },
  {
    path: '/enterpriseMeeting',
    route: enterpriseMeeting,
  },
  {
    path: '/notification',
    route: notification,
  },
  {
    path: '/individualcount',
    route: individualcount,
  },
  {
    path: '/count',
    route: count,
  },
  {
    path: '/analytic',
    route: analyticRouter
  },
  {
    path: '/Preferences',
    route: Preferences
  },
  {
    path: '/ticket',
    route: ticketRouter,
  },
  {
    path: '/ticket-category',
    route: ticketCategoryRouter,
  },
  {
    path: '/ticket-reply',
    route: ticketReplyRouter,
  },
  {
    path: '/vcard',
    route: uploadVCard,
  },
  {
    path : '/settings',
    route : settingsRouter
  },
  {
    path: '/logs',
    route: logController
  },
  {
    path: '/urlShortner',
    route: urlShortnerRouter,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
