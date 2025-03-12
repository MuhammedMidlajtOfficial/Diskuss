const { individualUserCollection } = require('../../DBConfig');
const {WithdrawalRequest} = require('../../models/referral/referral.model');
const enterpriseEmployeModel = require('../../models/users/enterpriseEmploye.model');
const enterpriseUser = require('../../models/users/enterpriseUser');

const createWithdrawalRequest = async (userId, amount, upiId) => {
    const withdrawalRequest = new WithdrawalRequest({ userId, amount, upiId });
    await withdrawalRequest.save();
}

const getWithdrawalRequestByUserId = async (userId) => {
    console.log("userId : ", userId);
    return await WithdrawalRequest.findOne({ userId });
}

const getAllWithdrawalRequests = async () => {
    const withdrawals = await WithdrawalRequest.find().sort({ updatedDate: -1 }).lean();

    for (let withdrawal of withdrawals) {
        let user = null;

        // Check in Individual Users
        let isIndividualExist = await individualUserCollection
            .findOne({ _id: withdrawal.userId }, { username: 1, email: 1 })
            .lean();
        if (isIndividualExist) {
            user = { type: "Individual", ...isIndividualExist };
        }

        // Check in Enterprise Users
        if (!user) {
            let isEnterpriseExist = await enterpriseUser
                .findOne({ _id: withdrawal.userId }, { username: 1, email: 1 })
                .lean();
            if (isEnterpriseExist) {
                user = { type: "Enterprise", ...isEnterpriseExist };
            }
        }

        // Check in Enterprise Employees
        if (!user) {
            let isEnterpriseEmployeeExist = await enterpriseEmployeModel
                .findOne({ _id: withdrawal.userId }, { username: 1, email: 1 })
                .lean();
            if (isEnterpriseEmployeeExist) {
                user = { type: "EnterpriseEmployee", ...isEnterpriseEmployeeExist };
            }
        }

        // Attach user details to withdrawal
        withdrawal.user = user;
    }

    console.log(withdrawals);
    return withdrawals;
};

const checkRequestPending = async (userId) => {
    return await WithdrawalRequest.find({ userId, status: 'pending' });
};

module.exports = {
    createWithdrawalRequest,
    getWithdrawalRequestByUserId,
    getAllWithdrawalRequests,
    checkRequestPending
};