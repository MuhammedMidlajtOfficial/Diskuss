const withdrawalService = require('../../../services/Referral/withdrawal.service');
const referralService = require('../../../services/Referral/referral.service');

const createWithdrawalRequest = async (req, res) => {
    try {
        const { userId, amount, upiId } = req.body;
         // Check if the user has an existing withdrawal request
         const existingRequest = await withdrawalService.checkRequestPending(userId);
         console.log("existingRequest : ", existingRequest)
         if (existingRequest && existingRequest.length > 0) {
             return res.status(400).json({ message: 'You already have a pending withdrawal request.' });
         }

        // const withdrawal = await referralService.createWithdrawal(userId, amount);
        const withdrawalData = await referralService.validateWithdrawal(userId, amount, upiId);
        // console.log("withdrawal : ", withdrawalData)
    
        // Create a new withdrawal request
        await withdrawalService.createWithdrawalRequest(userId, amount, upiId);

        return res.status(201).json({ message: 'Withdrawal request created successfully.', data : withdrawalData });
    }
    catch (e) {
        // console.error('Error creating withdrawal request:', e);
         // handle errors here
         if (e.message === "Insufficient coins for withdrawal") {
            return res.status(400).json({ error: e.message });
        } else if (e.message === "User not found") {
            return res.status(404).json({ error: e.message });
        } else if (e.message === "Invalid withdrawal amount") {
            return res.status(400).json({ error: e.message });
        }
        else {
            return res.status(500).json({ error: e.message });
        }
    }
}

const getAllWithdrawalDetails = async (req, res) => {
    try {
        const withdrawalRequests = await withdrawalService.getAllWithdrawalRequests();
        return res.status(200).json({ withdrawalRequests });
    }
    catch (error) {
        console.error('Error fetching withdrawal requests:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

const getWithdrawalRequestByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch withdrawal request by user ID
        const withdrawalRequest = await withdrawalService.getWithdrawalRequestByUserId(userId);
        // console.log("withdrawalRequest : ", withdrawalRequest)
        if (!withdrawalRequest) {
            return res.status(404).json({ message: 'No withdrawal request found for this user.' });
        }

        return res.status(200).json({ withdrawalRequest });
    }
    catch (error) {
        console.error('Error fetching withdrawal request:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

const validateWithdrawal = async (req, res) => {
    try {
        // console.log("req.body : ", req.body)
        const { userId, amount } = req.body;
        // const withdrawal = await referralService.createWithdrawal(userId, amount);
        const withdrawalData = await referralService.validateWithdrawal(userId, amount);
        // console.log("withdrawal : ", withdrawalData)
        return res.status(201).json({ message: "Withdrawal request created", withdrawalData });
    } catch (e) {
        // handle errors here
        if (e.message === "Insufficient coins for withdrawal") {
            return res.status(400).json({ error: e.message });
        } else if (e.message === "User not found") {
            return res.status(404).json({ error: e.message });
        } else if (e.message === "Invalid withdrawal amount") {
            return res.status(400).json({ error: e.message });
        }
        else{
            return res.status(400).json({ error: e.message });
        }
    }
};

const updateWithdrawalRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, transactionId } = req.body;

        // Update withdrawal request status
        await referralService.updateWithdrawalRequest(id, status, transactionId);

        return res.status(200).json({ message: 'Withdrawal request updated successfully.' });
    }
    catch (error) {
        console.error('Error updating withdrawal request:', error);
        if (error.message === "Withdrawal request not found") {
            return res.status(404).json({ error: error.message });
        }
        else if (error.message === "Same status"){
            return res.status(500).json({ error: "Withdrawl status is already updated" });
        } else if (error.message === "Invalid status") {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

const checkPendingRequest = async (req, res) => {
    try {
        const { userId } = req.params;
        const pendingRequest = await withdrawalService.checkRequestPending(userId);
        if (pendingRequest && pendingRequest.length > 0) {
            return res.status(200).json( {pendingRequest} );
        }
        return res.status(404).json({ message: 'No pending withdrawal request found for this user.' });
    } catch (error) {
        console.error('Error fetching pending withdrawal request:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
}

module.exports = {
    createWithdrawalRequest,
    getAllWithdrawalDetails,
    getWithdrawalRequestByUserId,
    updateWithdrawalRequest,
    checkPendingRequest
};