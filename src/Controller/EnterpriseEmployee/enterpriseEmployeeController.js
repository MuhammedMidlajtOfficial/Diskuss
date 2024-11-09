const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");


module.exports.createCard = async (req, res) => {
    const {
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
        cardType,
        website
    } = req.body;
    const passwordRaw = req.body.password

    try {
        // Check for missing fields
        if (!email || !password || !businessName || !empName || !designation || !mobile || !location || !services || !image || !position || !color || !cardType || !website) {
            return res.status(400).json({ message :"All fields are required"}); // Correct response handling
        }
        // Check if email exists
        const isEmailExist = await enterpriseEmployeModel.findOne({ email }).exec();
        if (isEmailExist) {
            return res.status(409).json({ message :"A user with this email address already exists. Please login instead"}); // Correct response handling
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
    
        console.log(newUser);
    
        // let imageUrl = image; // Default to provided image URL if no new image upload is needed
    
        // // Upload image to S3 if a new image is provided
        // if (image) {
        //   const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        //   const fileName = `${userId}-businessCard.jpg`; // Unique file name based on user ID and card purpose
        //   try {
        //     const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        //     imageUrl = uploadResult.Location; // S3 URL of the uploaded image
        //   } catch (uploadError) {
        //     console.log("Error uploading image to S3:", uploadError);
        //     return res.status(500).json({ message: "Failed to upload image", error: uploadError });
        //   }
        // }
        if (!newUser) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const newCard = new Card({
            userId:newUser._id,
            businessName,
            empName,
            designation,
            mobile,
            location,
            services,
            image, // use S3 url
            position,
            color,
            cardType,
            website
        });
        
        const result = await newCard.save();
        if (result) {
            await individualUserCollection.updateOne({ _id: userId }, { $inc: { cardNo: 1 } });
        }
        res.status(201).json({ message: "Card added successfully", entryId: result._id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to add card", error });
    }
  };