const {WithdrawalRequest} = require('../../models/referral.model');

const createWithdrawalRequest = async (userId, amount) => {
    const withdrawalRequest = new WithdrawalRequest({ userId, amount });
    await withdrawalRequest.save();
}

const getWithdrawalRequestByUserId = async (userId) => {
    return await WithdrawalRequest.findOne({ userId });
}

const getAllWithdrawalRequests = async () => {
    return await WithdrawalRequest.find();
}

module.exports = {
    createWithdrawalRequest,
    getWithdrawalRequestByUserId,
    getAllWithdrawalRequests
};