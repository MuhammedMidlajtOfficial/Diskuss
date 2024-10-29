const express = require('express');

const authIndividualRouter = require('./Individual/authIndividualRouter.js')
const authEnterpriseRouter = require('./Enterprise/authEnterpriseRouter.js')
const profileRoutes = require('./Profile/profileRoutes.js')
const subscriptionRouter = require('./Subscription/SubscriptionRouter.js')
const MessageRouter = require("./Message/messageRoute.js")


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
      path: '/subscription',
      route: subscriptionRouter,
  },
  {
    path: '/message',
    route: MessageRouter,
},
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
