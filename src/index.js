const express = require('express')
const app = express()
const {v4 : uuidv4} = require('uuid');
const session = require('express-session');
const nocache = require('nocache');
const routes = require('./Routes/index.js')
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

app.use(express.json({ limit: "10mb" }));

app.use('/api/v1', routes);

// app.use('/individual/',authIndividualRouter)
// app.use('/enterprise/',authEnterpriseRouter)
// app.use("/api/profile", profileRoutes);

app.get('/api/v1',(req,res)=>{
  res.send({
    message : "Welcome to the Diskuss API v1"
  })
})

const port = process.env.PORT | "3000"
app.listen(port ,()=>{
  console.log(`Server Connected port : http://localhost:${port}`);
})




