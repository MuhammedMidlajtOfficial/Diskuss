// Analytic Router
const { Router } = require('express');
const controller = require('../../Controller/analyticController')


const router = Router();

router.get('/', controller.getAnalytics)
router.get('/all', controller.getAllAnalytics)
router.post('/share', controller.logShare)
router.post('/view', controller.logView)
router.post('/click', controller.logClick)

router.get('/meeting/enterprise/:enterpriseId', controller.getEnterpriseMeetings)
router.get('/meeting/individual/:individualId', controller.getIndividualMeetings)
router.get('/card/:enterpriseId', controller.getCards)
router.get('/employee/:enterpriseId', controller.getEmployees)
router.get('/count/:enterpriseId', controller.getCounts);

module.exports = router;


// Card Routes
const express = require("express");
const cardController = require("../../Controller/Card/cardController");

const router = express.Router();

router.get("/:id", cardController.getCards);
router.post("/", cardController.createCard);
router.patch("/", cardController.updateCard);
router.delete("/", cardController.deleteCard);

module.exports = router;

// Card Enterprise Routes
const express = require("express");
const cardController = require("../../Controller/Card/cardEnterpriseController");

const router = express.Router();

router.get("/:id", cardController.getCards);
router.post("/", cardController.createCard);
router.patch("/", cardController.updateCard);
router.delete("/", cardController.deleteCard);

module.exports = router;

// Contact Enterprise Router
const { Router } = require('express');
const controller = require('../../Controller/Individual/contactIndividualController')


const router = Router();

router.get('/', controller.getAllContacts);
router.post('/',controller.createContact)
router.patch('/:contact_id', controller.updateContact);
router.delete('/:contact_id',controller.deleteContact)
router.get('/user/:user_id',controller.getContactsByOwnerUserId)
router.get('/search', controller.getSearchedContact);

module.exports = router;

// Contact Individual Router
const { Router } = require('express');
const controller = require('../../Controller/Individual/contactIndividualController')


const router = Router();

router.get('/', controller.getAllContacts);
router.post('/',controller.createContact)
router.patch('/:contact_id', controller.updateContact);
router.delete('/:contact_id',controller.deleteContact)
router.get('/user/:user_id',controller.getContactsByOwnerUserId)
router.get('/search', controller.getSearchedContact);

module.exports = router;

// Count Routes
const express = require('express');
const router = express.Router();
const CountController = require('../../Controller/CountController/CountController');


router.get('/:enterpriseId/counts', CountController.getCounts);

module.exports = router;// Individual Count Route
const express = require('express');
const router = express.Router();
const IndividualCountController = require('../../Controller/CountController/IndividualCountController');


router.get('/:userId/counts', IndividualCountController.getCounts);

module.exports = router;

// Auth Entreprise Router
const express = require('express')
const authEnterpriseController = require('../../Controller/Enterprise/authEnterpriseController')
const authEnterpriseRouter = express.Router()


authEnterpriseRouter.post('/sendotp', authEnterpriseController.sendOTP)
authEnterpriseRouter.post('/sendForgotPasswordOtp', authEnterpriseController.sendForgotPasswordOTP)
authEnterpriseRouter.post('/validateotp',authEnterpriseController.OtpValidate)
authEnterpriseRouter.post('/login', authEnterpriseController.postEnterpriseLogin)
authEnterpriseRouter.post('/signup', authEnterpriseController.postEnterpriseSignup)
authEnterpriseRouter.post('/forgotpassword',authEnterpriseController.postforgotPassword)
authEnterpriseRouter.get('/getProfile/:id',authEnterpriseController.getProfile)
authEnterpriseRouter.patch('/updateProfile',authEnterpriseController.updateProfile)
authEnterpriseRouter.post('/resetpassword',authEnterpriseController.resetPassword)


module.exports = authEnterpriseRouter


// Enterprise Employee Router
const express = require('express')
const enterpriseEmployeeController = require('../../Controller/EnterpriseEmployee/enterpriseEmployeeController')
const enterpriseEmployeeRouter = express.Router()

enterpriseEmployeeRouter.get('/getCardForUser/:id', enterpriseEmployeeController.getCardForUser)
enterpriseEmployeeRouter.get('/getContactOfEmployee/:id', enterpriseEmployeeController.getContactOfEmployee)
enterpriseEmployeeRouter.get('/getProfile/:id', enterpriseEmployeeController.getProfile)
enterpriseEmployeeRouter.post('/createProfile', enterpriseEmployeeController.createCard)
enterpriseEmployeeRouter.post('/resetpassword',enterpriseEmployeeController.resetPassword)
enterpriseEmployeeRouter.delete('/removeEmployee', enterpriseEmployeeController.removeEmployee);

enterpriseEmployeeRouter.patch('/updateProfile', enterpriseEmployeeController.updateProfile)

module.exports = enterpriseEmployeeRouter

// Enterprise Meeting Routes
const express = require("express");
const router = express.Router();
const {CreateMeeting, getUpcomingMeetings,deleteMeeting,getMeetingsByIds,UpdateMeeting,updateMeetingStatus} = require("../../Controller/Meeting/Meeting");

// Route for creating a meeting
router.post("/Create-Meeting", CreateMeeting); // This should handle POST requests
 // http://localhost:3000/api/v1/meeting/Create-Meeting

 // Route for geeting a meeting
router.get('/upcoming/:userId', getUpcomingMeetings);
 // http://localhost:3000/api/v1/meeting/upcoming/603d2c0d5f1b2b3f8c4b7e1b

// Route for deleting a meeting
router.delete('/:meetingId', deleteMeeting); 
 // http://localhost:3000/api/v1/meeting/6721d27a974599b7535c33fa

 // Route for get meeting info by id a meeting
router.get('/get-meeting/:userId', getMeetingsByIds);  
 // http://localhost:3000/api/v1/meeting/get-meeting/6721d27a974599b7535c33fa

 // Route for Update  a meeting
router.put('/update-meeting/:meetingId', UpdateMeeting);  
 // http://localhost:3000/api/v1/meeting/update-meeting/6721d27a974599b7535c33fa

 router.patch('/update-meeting-status', updateMeetingStatus);  
 // http://localhost:3000/api/v1/meeting/update-meeting/6721d27a974599b7535c33fa



module.exports = router;


// Auth Individual Router
const express = require('express')
const authIndividualController = require('../../Controller/Individual/authIndividualController')
const authIndividualRouter = express.Router()

authIndividualRouter.post('/login',authIndividualController.postIndividualLogin)
authIndividualRouter.post('/signup',authIndividualController.postIndividualSignup)
authIndividualRouter.post('/sendotp',authIndividualController.sendOTP)
authIndividualRouter.post('/sendForgotPasswordOtp',authIndividualController.sendForgotPasswordOTP)
authIndividualRouter.post('/validateotp',authIndividualController.OtpValidate)
authIndividualRouter.post('/forgotpassword',authIndividualController.postforgotPassword)
authIndividualRouter.post('/resetpassword',authIndividualController.resetPassword)
authIndividualRouter.get('/getProfile/:id',authIndividualController.getProfile)
authIndividualRouter.patch('/updateProfile',authIndividualController.updateProfile)

module.exports = authIndividualRouter


// Meeting Router
const express = require("express");
const router = express.Router();
const {CreateMeeting, getUpcomingMeetings,deleteMeeting,getMeetingsByIds,UpdateMeeting,updateMeetingStatus} = require("../../Controller/Meeting/Meeting");

// Route for creating a meeting
router.post("/Create-Meeting", CreateMeeting); // This should handle POST requests
 // http://localhost:3000/api/v1/meeting/Create-Meeting

 // Route for geeting a meeting
router.get('/upcoming/:userId', getUpcomingMeetings);
 // http://localhost:3000/api/v1/meeting/upcoming/603d2c0d5f1b2b3f8c4b7e1b

// Route for deleting a meeting
router.delete('/:meetingId', deleteMeeting); 
 // http://localhost:3000/api/v1/meeting/6721d27a974599b7535c33fa

 // Route for get meeting info by id a meeting
router.get('/get-meeting/:userId', getMeetingsByIds);  
 // http://localhost:3000/api/v1/meeting/get-meeting/6721d27a974599b7535c33fa

 // Route for Update  a meeting
router.put('/update-meeting/:meetingId', UpdateMeeting);  
 // http://localhost:3000/api/v1/meeting/update-meeting/6721d27a974599b7535c33fa

 router.patch('/update-meeting-status', updateMeetingStatus);  
 // http://localhost:3000/api/v1/meeting/update-meeting/6721d27a974599b7535c33fa


module.exports = router;


// messageRouter 
const express = require("express");
const router = express.Router();
const messageController = require("../../Controller/Message/messageController");

router.post("/sendMessage", messageController.sendMessage); // This should handle POST requests
router.post("/markMessagesAsRead",messageController.markMessagesAsRead );
router.get("/", messageController.getMessages); // For getting messages

module.exports = router;


// Notification Router
const express = require("express");
const router = express.Router();

const {getNotification,deleteNotification,MarkedAsRead} = require("../../Controller/Notification/NotificationController")

router.get('/get-Notifiy/:userId',getNotification)

router.delete('/delete-Notifiy/:notifyId',deleteNotification)

router.put('/update-Notifiy/:notifyId',MarkedAsRead)

module.exports = router;

// Permission routes
const express = require('express');
const router = express.Router();
const { getNotificationPreferences, updateNotificationPreferences ,createNotificationPreferences} = require('../../Controller/Permissions/PermissionController');

// Route to get notification preferences for a user
router.get('/:userId', getNotificationPreferences);

router.post('/',createNotificationPreferences)

// Route to update notification preferences for a user
router.put('/:userId', updateNotificationPreferences);

module.exports = router;


// Action Router
const express = require('express');
const router = express.Router();
const ActionController = require('../../Controller/Referral/actionController');

// Action Routes
router.post('/', ActionController.createAction);
router.get('/', ActionController.getAllActions);
router.get('/:id', ActionController.getActionById);
router.put('/:id', ActionController.updateAction);
router.delete('/:id', ActionController.deleteAction);

// routes for finding actions by referral ID and user ID
router.get('/referral/:referralId', ActionController.getActionsByReferralId); // Get actions by referral ID

module.exports = router;


// Referral Level Router
const express = require('express');
const router = express.Router();
const RefLevelController = require('../../Controller/Referral/referralLevelController');

// Define routes for referrals
router.get('/', RefLevelController.getRefLevels); // Get all referrals
router.get('/:id', RefLevelController.getRefLevelById); // Get referral by ID
router.post('/', RefLevelController.createRefLevel); // Create a new referral
router.patch('/:id', RefLevelController.updateRefLevel); // Update a referral by ID
router.delete('/:id', RefLevelController.deleteRefLevel); // Delete a referral by ID

module.exports = router;


// Referral Level Router
const express = require('express');
const router = express.Router();
const ReferralController = require('../../Controller/Referral/referralController');
const WithdrawalController = require('../../Controller/Referral/Withdrawal/withdrawalController');

// New Referral Router
router.post('/invite', ReferralController.sendInvite);
router.post('/register', ReferralController.registerInvitee);
router.post('/card', ReferralController.createCardByInvitee);
router.get('/details/:userId', ReferralController.getReferralDetails);
router.get('/code-check/:referralCode', ReferralController.checkReferralCode);

// Incentive Routes
router.get('/withdraw', WithdrawalController.getAllWithdrawalDetails);
router.get('/withdraw/:id', WithdrawalController.getWithdrawalRequestByUserId);
router.post('/withdraw', WithdrawalController.createWithdrawalRequest);

// Dashboard Routes
router.get('/admin', ReferralController.getAllReferrals);
router.get('/admin/monthly', ReferralController.getMonthlyReferralsCounts);


// Old Referral Routes
// router.post('/', ReferralController.createReferral);
// router.get('/', ReferralController.getAllReferrals);
// router.get('/user/:userId', ReferralController.getReferralsByUserId); // Get referrals by user ID
// router.get('/:id', ReferralController.getReferralById);
// router.put('/:id', ReferralController.updateReferral);
// router.delete('/:id', ReferralController.deleteReferral);

// router.get('/invited/:userId', ReferralController.getInvitedUsers);

module.exports = router;


// Subscription Plan Router
const { Router } = require('express');
const controller = require('../../Controller/Subscription/SubscriptionPlanController');


const router = Router();

router.get('/', controller.getSubscriptionPlans);
router.get('/:id', controller.getSubscriptionPlanById);
router.post('/plan',controller.createSubscriptionPlan)
router.patch('/plan/:plan_id', controller.updateSubscriptionPlan);
router.delete('/plan/:plan_id',controller.deleteSubscriptionPlan)
router.get('/plan/:plan_id', controller.getSubscriptionPlanByPlanId);

module.exports = router; 


// Subscriptions Router
const { Router } = require('express');
const controller = require('../../Controller/Subscription/SubscriptionController');

const router = Router();

router.get('/', controller.getSubscriptions);

module.exports = router;


// User Subscription Router
const { Router } = require('express');
const controller = require('../../Controller/Subscription/UserSubscriptionController');
const authMiddleware = require('../../Middleware/authMiddleware');


const router = Router();

router.get('/', authMiddleware.authenticateToken2, controller.getUserSubscriptions);
router.get('/user/:user_id', authMiddleware.authenticateToken2, controller.getUserSubscriptionByUserId);
router.post('/',authMiddleware.authenticateToken2, controller.createUserSubscription);
router.patch('/:userSubscription_id', authMiddleware.authenticateToken2, controller.updateUserSubscription);
router.delete('/:userSubscription_id',authMiddleware.authenticateToken2, controller.deleteUserSubscription);

router.post('/verifyPayment', authMiddleware.authenticateToken2, controller.verifyPayment)
router.post('/deactivate-expired-subscriptions', controller.deactivateSubscriptions)

module.exports = router;


// team Router
const express = require("express");
const teamController = require("../../Controller/Team/teamController");
const router = express.Router();

router.post('/createTeam',teamController.createTeam)
router.patch('/editTeam',teamController.editTeam)
router.delete('/deleteTeam/:id',teamController.deleteTeam)

router.get('/getAllTeam/:id',teamController.getAllTeamById)
router.get('/getAllTeamByTeamLead/:id',teamController.getAllTeamByTeamLead)
router.get('/getMembersOfTeam/:id',teamController.getMembersOfTeam)

router.get('/getCardForEnterprise/:id', teamController.getCardForEnterprise)
router.get('/getUserOfEnterprise/:id', teamController.getUserOfEnterprise)

module.exports = router;


// ticket category routes
const express = require('express');
const router = express.Router();
const ticketCategoryController = require('../../Controller/Ticket/ticketCategoryController');

// Routes for ticket categories
router.get('/', ticketCategoryController.getAllCategories);
router.get('/:id', ticketCategoryController.getCategoryById);

router.post('/', ticketCategoryController.createCategory);
router.patch('/', ticketCategoryController.updateCategory);

router.delete('/:id', ticketCategoryController.deleteCategory);


module.exports = router;


// ticket reply routes
const express = require('express');
const router = express.Router();
const ticketReplyController = require('../../Controller/Ticket/ticketReplyController');

// Routes for ticket replies
router.post('/', ticketReplyController.createReply);
router.get('/:ticketId', ticketReplyController.getRepliesByTicketId);

module.exports = router;


// ticket Router
const express = require('express');
const router = express.Router();
const ticketController = require('../../Controller/Ticket/ticketController');

// Routes for tickets
router.get('/', ticketController.getAllTickets);
router.get('/stats', ticketController.getAllStats)
router.get('/getOpenTicket', ticketController.getOpenTicket);
router.get('/:id', ticketController.getTicketById);

router.post('/', ticketController.createTicket);

router.put('/:id', ticketController.updateTicket);

router.patch('/assignUser', ticketController.assignUser);
router.patch('/replay', ticketController.replay);

router.delete('/:id', ticketController.deleteTicket);


module.exports = router;


// log Router
const { Router } = require('express');
const controller = require('../Controller/Logs/logController');

const router = Router();

router.get('/', controller.getAllLogs);

module.exports = router;


// Service Router
const { Router } = require('express');
const controller = require('../Controller/ServiceController');


const router = Router();

router.get('/', controller.getServices);
router.post('/',controller.createService)
router.patch('/:service_id', controller.updateService);
router.delete('/:service_id',controller.deleteService)

module.exports = router;


// Setting Routes
const { Router } = require('express');
const controller = require('../Controller/adminController');


const router = Router();

router.get('/', controller.getSettings);
router.put('/', controller.setSettings);

module.exports = router;


//index.js
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
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
