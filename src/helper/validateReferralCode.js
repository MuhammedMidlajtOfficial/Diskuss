const enterpriseUser = require('../models/users/enterpriseUser');
const { individualUserCollection } = require('../DBConfig');
const EnterpriseEmployee = require('../models/users/enterpriseEmploye.model');

const checkReferralCodeValid = async (referralCode) => {
// First, fetch the results from all collections
 const results = await Promise.all([
    individualUserCollection.findOne({ referralCode }).lean(),
    enterpriseUser.findOne({ referralCode }).lean(),
    EnterpriseEmployee.findOne({ referralCode }).lean()
  ]);

  // Then destructure the results after they're fetched
  const [individualUserResult, enterpriseUserResult, enterpriseEmployeeResult] = results;

if (!individualUserResult && !enterpriseUserResult && !enterpriseEmployeeResult) {
  return false;
}
return true;

}

const checkReferralCode = async (referralCode) => {
    const individualUser = await IndividualUser.findOne({ referralCode }).exec();
    const enterpriseUser = await EnterpriseUser.findOne({ referralCode }).exec();
    const enterpriseEmployeeUser = await EnterpriseEmployeeUser.findOne({ referralCode }).exec();
    if (!individualUser && !enterpriseUser && !enterpriseEmployeeUser) {
        return { valid: false };
    }
    return { valid: true };
};


module.exports = {
  checkReferralCodeValid
}