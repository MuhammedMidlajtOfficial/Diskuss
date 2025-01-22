const {WithdrawalRequest} = require('../../models/referral/referral.model');

const createWithdrawalRequest = async (userId, amount, upiId) => {
    const withdrawalRequest = new WithdrawalRequest({ userId, amount, upiId });
    await withdrawalRequest.save();
}

const getWithdrawalRequestByUserId = async (userId) => {
    console.log("userId : ", userId);
    return await WithdrawalRequest.findOne({ userId });
}

const getAllWithdrawalRequests = async () => {
    return await WithdrawalRequest.find();
}

const checkRequestPending = async (userId) => {
    return await WithdrawalRequest.find({ userId, status: 'pending' });
};

module.exports = {
    createWithdrawalRequest,
    getWithdrawalRequestByUserId,
    getAllWithdrawalRequests,
    checkRequestPending
};