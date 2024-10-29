const express = require('express')
const app = express()
const {v4 : uuidv4} = require('uuid');
const session = require('express-session');
const nocache = require('nocache');
const routes = require('./Routes/index.js')
const http = require('http');
const { Server } = require('socket.io');
const { setSocketIO } = require('./Controller/Message/Message.js');
// const authIndividualRouter = require('./Routes/Individual/authIndividualRouter.js')
// const authEnterpriseRouter = require('./Routes/Enterprise/authEnterpriseRouter.js')
// const profileRoutes = require('./Routes/Profile/profileRoutes.js')

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });


require('dotenv').config();

app.use(session({
  secret: uuidv4(),
  resave : false,
  saveUninitialized : true
}))
app.use(nocache());
app.use(express.json());

app.use(express.json({ limit: "10mb" }));

// Set the Socket.IO instance in the controller
setSocketIO(io);

// Middleware
app.use(express.json()); // Parse JSON requests
app.use('/api/v1', routes); // Use your routes

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('User connected', socket.id);

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

app.use('/api/v1', routes);

// app.use('/individual/',authIndividualRouter)
// app.use('/enterprise/',authEnterpriseRouter)
// app.use("/api/profile", profileRoutes);

app.get('/api/',(req,res)=>{
  res.send({
    message : "Welcome to the API"
  })
})

const port = process.env.PORT | "3000"
app.listen(port ,()=>{
  console.log(`Server Connected port : http://localhost:${port}`);
})




