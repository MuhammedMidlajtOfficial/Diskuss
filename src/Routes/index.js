const express = require('express');

const authIndividualRouter = require('./Individual/authIndividualRouter.js')
const authEnterpriseRouter = require('./Enterprise/authEnterpriseRouter.js')
const cardRouter = require('./Card/cardRoutes.js')
const subscriptionPlanRouter = require('./Subscription/SubscriptionPlanRouter.js')
const serviceRoutes = require('./serviceRouter.js')
const userSubscriptionRouter = require('./Subscription/UserSubscriptionRouter.js')
const referralRouter = require('./Referral/ReferralRouter.js');
const actionRouter = require('./Referral/ActionRotuer.js');
const referralLevelRouter = require('./Referral/ReferralLevelRouter.js');
const messageRoute = require("./Message/messageRoute.js")

const router = express.Router();

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
  // {
  //   path: '/message',
  //   route: messageRoute
  // }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
