const Balance = require('~/models/Balance');

async function balanceController(req, res) {
  try {
    const balanceData =
      (await Balance.findOne(
        { user: req.user.id },
        'tokenCredits totalCost monthlyTotalCost',
      ).lean()) || {};
    const { tokenCredits: balance = '', totalCost = 0, monthlyTotalCost = 0 } = balanceData;

    res.status(200).json({
      balance: '' + balance,
      totalCost,
      monthlyTotalCost,
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Failed to retrieve balance information' });
  }
}

module.exports = balanceController;
