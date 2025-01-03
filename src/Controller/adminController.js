const AdminService = require('../services/admin.service');

exports.getSettings = async (req, res) => {
    try {
        const settings = await AdminService.getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.setSettings = async (req, res) => {
    const { registrationReward, cardCreationReward, minWithdrawalAmount } = req.body;

    try {
        const result = await AdminService.updateSettings(registrationReward, cardCreationReward, minWithdrawalAmount);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
