

module.exports.createCard = async (req, res) => {
    const {
        email,
        password,
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
  
    // Check for missing fields
    if (!email || !password || !businessName || !empName || !designation || !mobile || !location || !services || !image || !position || !color || !cardType || !website) {
        return res.status(400).json({ message :"All fields are required"}); // Correct response handling
      }
  
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
  
    const newCard = new Card({
        email,
        password,
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
  
    try {
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