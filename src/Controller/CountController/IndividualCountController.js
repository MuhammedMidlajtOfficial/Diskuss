const individualUserCollection = require("../../models/users/individualUser");
const Contact = require("../../models/contacts/contact.individual.model");


exports.getCounts = async (req, res) => {

  try {
    const userId = req.params.userId;
    const user = await individualUserCollection.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const contactsCount = await Contact.countDocuments({
          contactOwnerId: userId,
        });
        console.log("Contacts Count:", contactsCount);


    const CardCount = user.cardNo || 0
    const coins = user.coins || 0;

    res.status(200).json({
      contactsCount,
      CardCount,
      coins,
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
