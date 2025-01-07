const Settings = require('../models/settings/settingModel');

exports.updateSettings = async (registrationReward, cardCreationReward, minWithdrawalAmount) => {
    const settings = await Settings.findOne({});

    if (!settings) {
        const newSettings = new Settings({ registrationReward, cardCreationReward, minWithdrawalAmount });
        await newSettings.save();
        return { success: true, message: "Rewards set successfully." };
    } else {
        settings.registrationReward = registrationReward;
        settings.cardCreationReward = cardCreationReward;
        settings.minWithdrawalAmount = minWithdrawalAmount
        settings.updatedAt = Date.now();
        await settings.save();
        return { success: true, message: "Rewards updated successfully." };
    }
};

exports.getSettings = async () => {
    const settings = await Settings.findOne({});
    return settings;
};