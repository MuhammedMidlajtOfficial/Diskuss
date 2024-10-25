const express = require('express')
const app = express()
const {v4 : uuidv4} = require('uuid');
const session = require('express-session');
const nocache = require('nocache');
const authIndividualRouter = require('./src/Routes/Individual/authIndividualRouter.js')
const authEnterpriseRouter = require('./src/Routes/Enterprise/authEnterpriseRouter.js')
const profileRoutes = require('./src/Routes/Profile/profileRoutes.js')

require('dotenv').config();

app.use(session({
  secret: uuidv4(),
  resave : false,
  saveUninitialized : true
}))
app.use(nocache());
app.use(express.json())

app.use(express.json({ limit: "10mb" }));

app.use('/individual/',authIndividualRouter)
app.use('/enterprise/',authEnterpriseRouter)

app.use("/api/profile", profileRoutes);

const port = process.env.PORT | "3000"
app.listen(port ,()=>{
  console.log(`Server Connected port : ${port}`);
})




