const express = require('express');

const authIndividualRouter = require('./Individual/authIndividualRouter.js')
const authEnterpriseRouter = require('./Enterprise/authEnterpriseRouter.js')
const profileRoutes = require('./Profile/profileRoutes.js')
const subscriptionPlanRouter = require('./Subscription/SubscriptionPlanRouter.js')
const serviceRoutes = require('./serviceRouter.js')
const userSubscriptionRouter = require('./Subscription/UserSubscriptionRouter.js')
<<<<<<< HEAD
const messageRoute = require("./Message/messageRoute.js")

const router = express.Router();

const defaultRoutes = [
  {
    path: '/individual',
    route: authIndividualRouter,
  },
  {
    path: '/enterprise',
    route: authEnterpriseRouter,
  },
  {
    path: '/profile',
    route: profileRoutes,
  },
  {
    path: '/subscription-plan',
    route: subscriptionPlanRouter,
<<<<<<< HEAD
=======
  },
  {
    path: '/service',
    route: serviceRoutes,
  },
  {
  path : '/subscription',
  route: userSubscriptionRouter
>>>>>>> Naren
  },
  {
    path: '/service',
    route: serviceRoutes,
  },
  {
  path : '/subscription',
  route: userSubscriptionRouter
  },
  {
    path : '/message',
    route: messageRoute
    },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
