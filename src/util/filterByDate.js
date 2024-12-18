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

  module.exports = filterByDate