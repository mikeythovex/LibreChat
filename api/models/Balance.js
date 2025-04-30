const mongoose = require('mongoose');
const { balanceSchema } = require('@librechat/data-schemas');

// Add totalCost and monthlyTotalCost fields to the schema if they don't exist
if (!balanceSchema.path('totalCost')) {
  balanceSchema.add({
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyTotalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMonthReset: {
      type: Date,
      default: new Date(),
    },
  });
}

module.exports = mongoose.model('Balance', balanceSchema);
