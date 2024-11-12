const express = require("express");
const TeamController = require("../../Controller/Team/teamController");
const router = express.Router();

router.post('/createTeam',TeamController.createTeam)
router.patch('/editTeam',TeamController.editTeam)

module.exports = router;