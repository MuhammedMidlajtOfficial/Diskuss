const EnterpriseUser = require('../models/users/enterpriseUser');
const { individualUserCollection: IndividualUser } = require('../DBConfig');

const  convertToMonthlyCounts = (year, data) => {
    year = parseInt(year);
    const months = [];
    console.log("data : ",data);

    // Loop through each month from 1 to 12
    for (let month = 1; month <= 12; month++) {
        // Create an object for each month
        const monthData = {
            year: year,
            month: month,
            count: 0 // Default count is zero
        };

        // If the current month matches the input data, update the count
        data.find((m) => {
            // console.log("m : ",m.month," mon ", month);
            if (m.month === month) {
                monthData.count = m.count;
            }
        });

        // if (month === data.month) {
        //     monthData.count = data.count;
        // }

        // Push the month data into the array
        months.push(monthData);
    }

    return months;
}

const checkUserType = async (userId) => {
    const individualUser = await IndividualUser.findById(userId).exec();
    const enterpriseUser = await EnterpriseUser.findById(userId).exec();
    if (!individualUser && !enterpriseUser) {
        throw new Error('Invalid user');
    }
    if (individualUser) {
        return { userType : 'individual', data : individualUser};
    }
    return {userType : 'enterprise', data : enterpriseUser};
}

module.exports = {
    convertToMonthlyCounts,
    checkUserType
};