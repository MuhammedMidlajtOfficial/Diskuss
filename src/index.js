const express = require('express')
const app = express()
const {v4 : uuidv4} = require('uuid');
const session = require('express-session');
const nocache = require('nocache');
const cors = require('cors');
const routes = require('./Routes/index.js')
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const socketController = require('./Controller/Socketio/socketController.js');
const messageController = require('./Controller/Message/messageController');
// const groupmessageController = require('./Controller/Message/groupmessageController.js');
// const enterpriseMessageController = require('./Controller/EnterpriseMessage/enterpriseMessageController.js');
const socketControllers = require('./Controller/Socket.io/NotificationSocketIo.js');
const notificationSocketController = require('./Controller/Socket.io/NotificationSocketIo');
require('./services/Cron/cron.service.js');
const logger = require('./config/logger.js');
const morgan = require('./config/morgan.js');
const expressListRoutes = require('express-list-routes');
// const { parseLogs } = require('./crons/testCron.js');
const { parseLogs } = require('../testlogs.js');


// const authIndividualRouter = require('./Routes/Individual/authIndividualRouter.js')
// const authEnterpriseRouter = require('./Routes/Enterprise/authEnterpriseRouter.js')
// const profileRoutes = require('./Routes/Profile/profileRoutes.js')

require('dotenv').config();

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}


app.use(session({
  secret: uuidv4(),
  resave : false,
  saveUninitialized : true
}))
app.use(nocache());
app.use(express.json());
app.use(cors());

const io = socketIo(server, {
  transports: ['websocket'],
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },

});

notificationSocketController.setSocketIO(io);
socketController.setSocketIO(io);
messageController.setSocketIO(io);
// groupmessageController.setSocketIO(io);
// enterpriseMessageController.setSocketIO(io);
// Initialize SocketController with Socket.io instance
socketControllers.setSocketIO(io);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/v1', routes);



app.get('/api/v1',(req,res)=>{
  res.send({
    message : "Welcome to the Diskuss API v1"
  })
})

app.get('/logs',async (req,res)=>{
  try{
    const logs = await parseLogs();
    console.log('logs1: ', logs);
    res.status(200).json({logs})
  }
  catch(err){
    console.log(err);
    res.status(500).json({error : 'Error reading log file'})
  }
});

// // List all routes
// expressListRoutes(app);

// console.log(list);
// Function to list all routes
const listRoutes = () => {
  app._router.stack.forEach((middleware) => {
      if (middleware.route) { // If it's a route
          console.log(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
      }
  });
};

// Call the function to list routes
listRoutes();


const port = process.env.PORT || "3000"

server.listen(port, () => {
  console.log(`Server connected on http://localhost:${port}`);
  logger.info(`Server connected on http://localhost:${port}`);
});

module.exports = {app};