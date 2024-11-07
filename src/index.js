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
const io = socketIo(server);
const messageController = require('./Controller/Message/messageController');
const groupmessageController = require('./Controller/Message/groupmessageController.js');
// const authIndividualRouter = require('./Routes/Individual/authIndividualRouter.js')
// const authEnterpriseRouter = require('./Routes/Enterprise/authEnterpriseRouter.js')
// const profileRoutes = require('./Routes/Profile/profileRoutes.js')

require('dotenv').config();

app.use(session({
  secret: uuidv4(),
  resave : false,
  saveUninitialized : true
}))
app.use(nocache());
app.use(express.json());
app.use(cors());

messageController.setSocketIO(io);
groupmessageController.setSocketIO(io);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api/v1', routes);


app.get('/api/v1',(req,res)=>{
  res.send({
    message : "Welcome to the Diskuss API v1"
  })
})

const port = process.env.PORT | "3000"
app.listen(port ,()=>{
  console.log(`Server Connected port : http://localhost:${port}`);
})