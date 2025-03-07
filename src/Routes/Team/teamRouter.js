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