const Team = require("../../models/team.model");
const Contact = require("../../models/contact.enterprise.model");
const EnterpriseUser = require("../../models/enterpriseUser");
const Card = require("../../models/card");

const filterByDate = (date, period) => {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  if (period === "today") return { $gte: startOfDay, $lte: endOfDay };
  if (period === "yesterday") {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      $gte: yesterday.setHours(0, 0, 0, 0),
      $lte: yesterday.setHours(23, 59, 59, 999),
    };
  }
  if (period === "month") {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { $gte: startOfMonth, $lte: endOfMonth };
  }
  if (period === "year") {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const endOfYear = new Date(date.getFullYear(), 11, 31);
    return { $gte: startOfYear, $lte: endOfYear };
  }
};

exports.getCounts = async (req, res) => {
  const { period } = req.query;
  const dateFilter = filterByDate(new Date(), period);

  try {
    const enterpriseId = req.params.enterpriseId;

    // Count enterprise cards
    const enterpriseCardsCount = await Card.countDocuments({
      userId: enterpriseId,
      createdAt: dateFilter,
    });

    // Count teams
    const teamsCount = await Team.countDocuments({
      teamOwnerId: enterpriseId,
      createdAt: dateFilter,
    });

    // Count employee cards
    const enterprise = await EnterpriseUser.findById(enterpriseId);
    const empCardsCount = enterprise ? enterprise.empCards.length : 0;

    // Count contacts
    const contactsCount = await Contact.countDocuments({
      contactOwnerId: enterpriseId,
      createdAt: dateFilter,
    });

    res.status(200).json({
      enterpriseCardsCount,
      teamsCount,
      empCardsCount,
      contactsCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};