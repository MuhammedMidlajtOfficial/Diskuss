const bcrypt = require('bcrypt');
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const enterpriseUser = require("../../models/enterpriseUser");
const enterpriseEmployeCardModel = require('../../models/enterpriseEmployeCard.model');


module.exports.getCardForUser = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const user = await enterpriseEmployeModel.findOne({ _id : userId });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get card", error });
    }
};

module.exports.getCardForEnterprise = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const user = await enterpriseUser.findOne({ _id : userId }).populate('empCards');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(user.empCards);
        return res.status(200).json({ cards:user.empCards })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch employee cards", error });
    }
};

module.exports.getUserOfEnterprise = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const user = await enterpriseUser.findOne({ _id : userId }).populate({
            path: 'empId',
            strictPopulate: false, 
        } )
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(user);
        return res.status(200).json({ employee:user.empId })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch employee", error });
    }
}

module.exports.getContactOfEmployee = async (req, res) => {
    try {
        const { id: empId } = req.params;
        const user = await enterpriseEmployeModel.findOne({ _id : empId }).populate({
            path: 'Contact',
            strictPopulate: false, 
        } )
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(user);
        return res.status(200).json({ contacts:user })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch employee", error });
    }
}

module.exports.createCard = async (req, res) => {
    const {
        enterpriseId,
        email,
        businessName,
        empName,
        designation,
        mobile,
        location,
        services,
        image,
        position,
        color,
        website,
        username,
    } = req.body;
    const passwordRaw = req.body.password;

    try {
        // Check for missing fields
        if (!email || !passwordRaw || !enterpriseId || !businessName || !empName || !designation || !mobile || !location || !services || !image || !position || !color || !website) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user email exists
        const isEmailExist = await enterpriseEmployeModel.findOne({ email }).exec();
        const isEmailExistInEnterpriseUser = await enterpriseUser.findOne({ email }).exec();
        if (isEmailExist || isEmailExistInEnterpriseUser) {
            return res.status(409).json({ message: "A user with this email address already exists. Please use another email" });
        }

        // Check if Enterprise ID exists
        const isEnterpriseIDExist = await enterpriseUser.findOne({ _id: enterpriseId }).exec();
        if (!isEnterpriseIDExist) {
            return res.status(409).json({ message: "Enterprise user not found" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(passwordRaw, 10);

        // Create a new user
        const newUser = await enterpriseEmployeModel.create({
            username,
            email,
            password: hashedPassword,
            cardNo: 0,
        });

        if (!newUser) {
            return res.status(404).json({ message: "User creation failed" });
        }

        // Image URL handling
        let imageUrl = image;

        // Uncomment and complete S3 upload functionality if needed
        // if (image) {
        //     const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        //     const fileName = `${newUser._id}-businessCard.jpg`;
        //     try {
        //         const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        //         imageUrl = uploadResult.Location;
        //     } catch (uploadError) {
        //         console.log("Error uploading image to S3:", uploadError);
        //         return res.status(500).json({ message: "Failed to upload image", error: uploadError });
        //     }
        // }

        // Create new card
        const newCard = new enterpriseEmployeCardModel({
            userId: newUser._id,
            businessName,
            empName,
            designation,
            mobile,
            location,
            services,
            image: imageUrl,
            position,
            color,
            website,
            enterpriseId
        });

        const result = await newCard.save();
        if (result) {
            await enterpriseUser.updateOne(
                { _id: enterpriseId },
                { $push: { 
                    empCards: result._id,
                    empId: newUser._id
                } }
            );

            return res.status(201).json({ message: "Card added successfully", entryId: result._id });
        } else {
            return res.status(500).json({ message: "Failed to save card" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to add card", error });
    }
};
