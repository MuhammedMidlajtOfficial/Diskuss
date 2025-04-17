const EnterpriseUser = require('../models/users/enterpriseUser');
const { individualUserCollection: IndividualUser } = require('../DBConfig');
const EnterpriseEmployeeUser = require('../models/users/enterpriseEmploye.model');
const { ObjectId } = require('mongodb');

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
    const [individualUser, enterpriseUser, enterpriseEmployeeUser] = await Promise.all([
        IndividualUser.findById(userId).exec(),
        EnterpriseUser.findById(userId).exec(),
        EnterpriseEmployeeUser.findById(userId).exec()
    ]);
    // const individualUser = await IndividualUser.findById(userId).exec();
    // const enterpriseUser = await EnterpriseUser.findById(userId).exec();
    // const enterpriseEmployeeUser = await EnterpriseEmployeeUser.findById(userId).exec();

    if (!individualUser && !enterpriseUser && !enterpriseEmployeeUser) {
        throw new Error('Invalid user');
    }
    else if (individualUser) {
        return { userType : 'individual', data : individualUser};
    }
    else if (enterpriseUser) {
        return {userType : 'enterprise', data : enterpriseUser};
    }
    else if (enterpriseEmployeeUser) {
        return {userType : 'enterpriseEmployee', data : enterpriseEmployeeUser};
    }else {
        throw new Error('Invalid user');
    }
}

const findUsernameById = async (id) => {
    try {
        if (!ObjectId.isValid(id)) {
            throw new Error('Invalid ID format');
        }

        const objectId = new ObjectId(id);

        // Query all collections simultaneously and resolve the first match
        const user = await Promise.any([
            IndividualUser.findOne({ _id: objectId }, { username: 1 }).lean(),
            EnterpriseUser.findOne({ _id: objectId }, { username: 1 }).lean(),
            EnterpriseEmployeeUser.findOne({ _id: objectId }, { username: 1 }).lean()
        ]);

        if (!user) {
            return { error: 'No user found with the given ID' };
        }

        return { username: user.username };
    } catch (error) {
        if (error instanceof AggregateError) {
            return { error: 'No user found with the given ID' };
        }
        console.error('Error finding user:', error.message);
        return { error: error.message };
    }
};


module.exports = {
    convertToMonthlyCounts,
    checkUserType,
    findUsernameById
};