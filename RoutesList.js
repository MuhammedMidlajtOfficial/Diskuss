const BASE_URL = 'http://localhost:3000/api';
const API_VERSION = 'v1';
const API_URL = `${API_URL}/${API_VERSION}`;

const routes = [
    // Analytic Routes
    `${API_URL}/analytic`,
    `${API_URL}/analytic/all`,
    `${API_URL}/analytic/share`,
    `${API_URL}/analytic/view`,
    `${API_URL}/analytic/click`,
    `${API_URL}/analytic/meeting/enterprise/:enterpriseId`,
    `${API_URL}/analytic/meeting/individual/:individualId`,
    `${API_URL}/analytic/card/:enterpriseId`,
    `${API_URL}/analytic/employee/:enterpriseId`,
    `${API_URL}/analytic/count/:enterpriseId`,

    // Card Routes
    `${API_URL}/card/:id`,
    `${API_URL}/card/`,
    
    // Contact Enterprise Routes
    `${API_URL}/contact/`,
    `${API_URL}/contact/user/:user_id`,
    `${API_URL}/contact/search`,

    // Count Routes
    `${API_URL}/count/:enterpriseId/counts`,

    // Auth Enterprise Routes
    `${API_URL}/auth/sendotp`,
    `${API_URL}/auth/sendForgotPasswordOtp`,
    `${API_URL}/auth/validateotp`,
    `${API_URL}/auth/login`,
    `${API_URL}/auth/signup`,
    `${API_URL}/auth/forgotpassword`,
    `${API_URL}/auth/getProfile/:id`,
    `${API_URL}/auth/updateProfile`,
    `${API_URL}/auth/resetpassword`,

    // Enterprise Employee Routes
    `${API_URL}/enterpriseEmployee/getCardForUser/:id`,
    `${API_URL}/enterpriseEmployee/getContactOfEmployee/:id`,
    
    // Meeting Routes
    `${API_URL}/meeting/Create-Meeting`,
    `${API_URL}/meeting/upcoming/:userId`,
    
    // Message Routes
    `${API_URL}/message/sendMessage`,
    
    // Notification Routes
    `${API_URL}/notification/get-Notifiy/:userId`,

    // Permission Routes
    `${API_URL}/permission/:userId`,

    // Action Routes
    `${API_URL}/action/`,
    
    // Referral Level Routes
    `${API_URL}/referralLevel/`,
    
    // Subscription Plan Routes
    `${API_URL}/subscriptionPlan/`,
    
   // User Subscription Routes
   `${API_URL}/userSubscription/`,
   
   // Team Routes
   `${API_URL}/team/createTea`,
];


// Add your routes to test here
const routesList =  [
    // Analytic Routes
    { path: '/api/v1/analytics', method: 'GET' },
    { path: '/api/v1/analytics/all', method: 'GET' },
    { path: '/api/v1/analytics/share', method: 'POST' },
    { path: '/api/v1/analytics/view', method: 'POST' },
    { path: '/api/v1/analytics/click', method: 'POST' },
    { path: '/api/v1/analytics/meeting/enterprise/:enterpriseId', method: 'GET' },
    { path: '/api/v1/analytics/meeting/individual/:individualId', method: 'GET' },
    { path: '/api/v1/analytics/card/:enterpriseId', method: 'GET' },
    { path: '/api/v1/analytics/employee/:enterpriseId', method: 'GET' },
    { path: '/api/v1/analytics/count/:enterpriseId', method: 'GET' },

    // Card Routes
    { path: '/api/v1/card/:id', method: 'GET' },
    { path: '/api/v1/card/', method: 'POST' },
    { path: '/api/v1/card/', method: 'PATCH' },
    { path: '/api/v1/card/', method: 'DELETE' },

    // Contact Enterprise Routes
    { path: '/api/v1/contact/', method: 'GET' },
    { path: '/api/v1/contact/', method: 'POST' },
    { path: '/api/v1/contact/:contact_id', method: 'PATCH' },
    { path: '/api/v1/contact/:contact_id', method: 'DELETE' },
    { path: '/api/v1/contact/user/:user_id', method: 'GET' },
    { path: '/api/v1/contact/search', method: 'GET' },

    // Count Routes
    { path: '/api/v1/count/:enterpriseId/counts', method: 'GET' },

    // Individual Count Route
    { path: '/api/v1/count/:userId/counts', method: 'GET' },

    // Auth Enterprise Routes
    { path: '/api/v1/auth/sendotp', method: 'POST' },
    { path: '/api/v1/auth/sendForgotPasswordOtp', method: 'POST' },
    { path: '/api/v1/auth/validateotp', method: 'POST' },
    { path: '/api/v1/auth/login', method: 'POST' },
    { path: '/api/v1/auth/signup', method: 'POST' },
    { path: '/api/v1/auth/forgotpassword', method: 'POST' },
    { path: '/api/v1/auth/getProfile/:id', method: 'GET' },
    { path: '/api/v1/auth/updateProfile', method: 'PATCH' },
    { path: '/api/v1/auth/resetpassword', method: 'POST' },

    // Enterprise Employee Routes
    { path:'/api/v1/enterpriseEmployee/getCardForUser/:id',method:'GET'},
    { path:'/api/v1/enterpriseEmployee/getContactOfEmployee/:id',method:'GET'},
    
   // Meeting Routes
   {path:'/api/v1/meeting/Create-Meeting',method:'POST'},
   {path:'/api/v1/meeting/upcoming/:userId',method:'GET'},
   {path:'/api/v1/meeting/:meetingId',method:'DELETE'},
   {path:'/api/v1/meeting/get-meeting/:userId',method:'GET'},
   {path:'/api/v1/meeting/update-meeting/:meetingId',method:'PUT'},
   {path:'/api/v1/meeting/update-meeting-status',method:'PATCH'},
   
   // Message Routes
   {path:'/api/v1/message/sendMessage',method:'POST'},
   {path:'/api/v1/message/markMessagesAsRead',method:'POST'},
   {path:'/api/v1/message/',method:'GET'},
   
   // Notification Routes
   {path:'/api/v1/notification/get-Notifiy/:userId',method:'GET'},
   {path:'/api/v1/notification/delete-Notifiy/:notifyId',method:'DELETE'},
   {path:'/api/v1/notification/update-Notifiy/:notifyId',method:'PUT'},
   
   // Permission Routes
   {path:'/api/v1/permission/:userId',method:'GET'},
   {path:'/api/v1/permission/',method:'POST'},
   {path:'/api/v1/permission/:userId',method:'PUT'},
   
   // Action Routes
   {path:'/api/v1/action/',method:'POST'},
   {path:'/api/v1/action/',method:'GET'},
   {path:'/api/v1/action/:id',method:'GET'},
   {path:'/api/v1/action/:id',method:'PUT'},
   {path:'/api/v1/action/:id',method:'DELETE'},
   {path:'/api/v1/action/referral/:referralId',method:'GET'},
   
   // Referral Level Routes
   {path:'/api/v1/referralLevel/',method:'GET'},
   {path:'/api/v1/referralLevel/:id',method:'GET'},
   {path:'/api/v1/referralLevel/',method:'POST'},
   {path:'/api/v1/referralLevel/:id',method:'PATCH'},
   {path:'/api/v1/referralLevel/:id',method:'DELETE'},
   
   // Referral Routes
   {path:'/api/v1/referral/invite',method:'POST'},
   {path:'/api/v1/referral/register',method:'POST'},
   {path:'/api/v1/referral/card',method:'POST'},
   {path:'/api/v1/referral/details/:userId',method:'GET'},
   {path:'/api/v1/referral/code-check/:referralCode',method:'GET'},
   
   // Withdrawal Routes
   {path:'/api/v1/referral/withdraw/',method:'GET'},
   {path:'/api/v1/referral/withdraw/:id',method:'GET'},
   {path:'/api/v1/referral/withdraw/',method:'POST'}, 
   
   // Subscription Plan Routes
   {path:'/api/v1/subscriptionPlan/',method:'GET'}, 
   {path:'/api/v1/subscriptionPlan/:id',method:'GET'}, 
   {path:'/api/v1/subscriptionPlan/plan/',method:'POST'}, 
   {path:'/api/v1/subscriptionPlan/plan/:plan_id',method:'PATCH'}, 
   {path:'/api/v1/subscriptionPlan/plan/:plan_id',method:'DELETE'}, 
   
  // User Subscription Router
  {path:'/api/v1/userSubscription/',method:'GET'},
  {path:'/api/v1/userSubscription/',method:'POST'},
  {path:'/api/v1/userSubscription/:id',method:'PATCH'},
  {path:'/api/v1/userSubscription/:id',method:'DELETE'},
  
  {
      path :'/ api / v  ersion /  v  ersion / userSubscription/',
      methods : ['get','post','patch','delete']
  }
  
  // Team Router
  {
      paths : ['/createTeam',' /editTeam',' /deleteTeam / id',' /getAllTeam / id',' /getAllTeamByTeamLead / id',' /getMembersOfTeam / id',' /getCardForEnterprise / id',' /getUserOfEnterprise / id'],
      methods : ['post','patch','delete','get']
  }

  // Ticket Category Router
  {
      paths : ['/ticketCategory'],
      methods : ['get','post','patch']
  }

  // Ticket Reply Router (Add routes as needed)
];
