const { Transaction } = require('./Transaction');
const { logger } = require('~/config');
const Balance = require('./Balance');

/**
 * Ensures all Balance documents have the required cost tracking fields
 * This is a migration function that can be called periodically
 */
const ensureTotalCostField = async () => {
  try {
    const now = new Date();

    // Update all Balance documents that don't have a totalCost field
    const totalCostResult = await Balance.updateMany(
      { totalCost: { $exists: false } },
      { $set: { totalCost: 0 } },
    );

    // Update all Balance documents that don't have a monthlyTotalCost field
    const monthlyResult = await Balance.updateMany(
      { monthlyTotalCost: { $exists: false } },
      { $set: { monthlyTotalCost: 0 } },
    );

    // Update all Balance documents that don't have a lastMonthReset field
    const resetResult = await Balance.updateMany(
      { lastMonthReset: { $exists: false } },
      { $set: { lastMonthReset: now } },
    );

    if (
      totalCostResult.modifiedCount > 0 ||
      monthlyResult.modifiedCount > 0 ||
      resetResult.modifiedCount > 0
    ) {
      logger.info(
        `[ensureTotalCostField] Added cost tracking fields to Balance documents: totalCost: ${totalCostResult.modifiedCount}, monthlyTotalCost: ${monthlyResult.modifiedCount}, lastMonthReset: ${resetResult.modifiedCount}`,
      );
    }

    // Check for existing documents that need monthly cost reset
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const docsNeedingReset = await Balance.find({
      lastMonthReset: { $lt: startOfMonth },
    });

    for (const doc of docsNeedingReset) {
      await Balance.updateOne(
        { _id: doc._id },
        {
          $set: {
            monthlyTotalCost: 0,
            lastMonthReset: now,
          },
        },
      );
    }

    if (docsNeedingReset.length > 0) {
      logger.info(
        `[ensureTotalCostField] Reset monthly costs for ${docsNeedingReset.length} documents for the new month`,
      );
    }
  } catch (err) {
    logger.error('[ensureTotalCostField] Error ensuring cost tracking fields:', err);
  }
};

/**
 * Checks if the monthly cost needs to be reset (start of new month)
 * @param {Date} lastReset - The date of the last reset
 * @returns {boolean} - Whether the monthly cost needs to be reset
 */
const shouldResetMonthlyCost = (lastReset) => {
  if (!lastReset) return true;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastResetMonth = lastReset.getMonth();
  const lastResetYear = lastReset.getFullYear();

  // Reset if we're in a new month or year
  return currentMonth !== lastResetMonth || currentYear !== lastResetYear;
};

/**
 * Updates the user's total cost in the Balance collection
 * @param {String} userId - The user ID
 * @param {Number} cost - The cost to add
 */
const updateUserCost = async (userId, cost) => {
  if (!cost || cost <= 0) return;

  try {
    // First check if the user already has a balance document
    const existingBalance = await Balance.findOne({ user: userId });

    if (existingBalance) {
      // Check if we need to reset the monthly cost (new month started)
      const needsReset = shouldResetMonthlyCost(existingBalance.lastMonthReset);

      const updateOps = { $inc: { totalCost: cost } };

      if (needsReset) {
        // If new month, reset monthly cost and set the reset date
        updateOps.$set = {
          monthlyTotalCost: cost,
          lastMonthReset: new Date(),
        };
        logger.debug(`[updateUserCost] Reset monthly cost for user ${userId}, new month started`);
      } else {
        // Otherwise just increment the monthly cost
        updateOps.$inc.monthlyTotalCost = cost;
      }

      // Update the balance document
      const updatedBalance = await Balance.findOneAndUpdate({ user: userId }, updateOps, {
        new: true,
      });

      logger.debug(
        `[updateUserCost] Updated cost for user ${userId}, added $${cost.toFixed(6)}, monthly: $${updatedBalance.monthlyTotalCost?.toFixed(6) || 0}, total: $${updatedBalance.totalCost?.toFixed(6) || 0}`,
      );
    } else {
      // If no document exists, create one with costs initialized to the current cost
      const newBalance = await Balance.findOneAndUpdate(
        { user: userId },
        {
          $set: {
            totalCost: cost,
            monthlyTotalCost: cost,
            lastMonthReset: new Date(),
          },
        },
        { upsert: true, new: true },
      );

      logger.debug(
        `[updateUserCost] Created cost tracking for user ${userId}, initial cost: $${newBalance.totalCost?.toFixed(6) || 0}`,
      );
    }
  } catch (err) {
    logger.error(`[updateUserCost] Error updating cost for user ${userId}:`, err);
  }
};

// Run the migration on module load
ensureTotalCostField().catch((err) => {
  logger.error('[spendTokens] Error running totalCost migration:', err);
});

/**
 * Creates up to two transactions to record the spending of tokens.
 *
 * @function
 * @async
 * @param {Object} txData - Transaction data.
 * @param {mongoose.Schema.Types.ObjectId} txData.user - The user ID.
 * @param {String} txData.conversationId - The ID of the conversation.
 * @param {String} txData.model - The model name.
 * @param {String} txData.context - The context in which the transaction is made.
 * @param {EndpointTokenConfig} [txData.endpointTokenConfig] - The current endpoint token config.
 * @param {String} [txData.valueKey] - The value key (optional).
 * @param {Object} tokenUsage - The number of tokens used.
 * @param {Number} tokenUsage.promptTokens - The number of prompt tokens used.
 * @param {Number} tokenUsage.completionTokens - The number of completion tokens used.
 * @param {Number} [tokenUsage.totalCost] - The total cost of the operation.
 * @returns {Promise<void>} - Returns nothing.
 * @throws {Error} - Throws an error if there's an issue creating the transactions.
 */
const spendTokens = async (txData, tokenUsage) => {
  const { promptTokens, completionTokens, totalCost } = tokenUsage;
  logger.debug(
    `[spendTokens] conversationId: ${txData.conversationId}${
      txData?.context ? ` | Context: ${txData?.context}` : ''
    } | Token usage: `,
    {
      promptTokens,
      completionTokens,
      totalCost,
    },
  );
  let prompt, completion;
  try {
    if (promptTokens !== undefined) {
      prompt = await Transaction.create({
        ...txData,
        tokenType: 'prompt',
        rawAmount: promptTokens === 0 ? 0 : -Math.max(promptTokens, 0),
      });
    }

    if (completionTokens !== undefined) {
      completion = await Transaction.create({
        ...txData,
        tokenType: 'completion',
        rawAmount: completionTokens === 0 ? 0 : -Math.max(completionTokens, 0),
      });
    }

    // Update the user's total cost if provided
    if (totalCost > 0 && txData.user) {
      await updateUserCost(txData.user, totalCost);
    }

    if (prompt || completion) {
      logger.debug('[spendTokens] Transaction data record against balance:', {
        user: txData.user,
        prompt: prompt?.prompt,
        completion: completion?.completion,
        totalCost,
        balance: completion?.balance ?? prompt?.balance,
      });
    } else {
      logger.debug('[spendTokens] No transactions incurred against balance');
    }
  } catch (err) {
    logger.error('[spendTokens]', err);
  }
};

/**
 * Creates transactions to record the spending of structured tokens.
 *
 * @function
 * @async
 * @param {Object} txData - Transaction data.
 * @param {mongoose.Schema.Types.ObjectId} txData.user - The user ID.
 * @param {String} txData.conversationId - The ID of the conversation.
 * @param {String} txData.model - The model name.
 * @param {String} txData.context - The context in which the transaction is made.
 * @param {EndpointTokenConfig} [txData.endpointTokenConfig] - The current endpoint token config.
 * @param {String} [txData.valueKey] - The value key (optional).
 * @param {Object} tokenUsage - The number of tokens used.
 * @param {Object} tokenUsage.promptTokens - The number of prompt tokens used.
 * @param {Number} tokenUsage.promptTokens.input - The number of input tokens.
 * @param {Number} tokenUsage.promptTokens.write - The number of write tokens.
 * @param {Number} tokenUsage.promptTokens.read - The number of read tokens.
 * @param {Number} tokenUsage.completionTokens - The number of completion tokens used.
 * @returns {Promise<void>} - Returns nothing.
 * @throws {Error} - Throws an error if there's an issue creating the transactions.
 */
const spendStructuredTokens = async (txData, tokenUsage) => {
  const { promptTokens, completionTokens } = tokenUsage;
  logger.debug(
    `[spendStructuredTokens] conversationId: ${txData.conversationId}${
      txData?.context ? ` | Context: ${txData?.context}` : ''
    } | Token usage: `,
    {
      promptTokens,
      completionTokens,
    },
  );
  let prompt, completion;
  let totalCost = 0;

  try {
    if (promptTokens) {
      const { input = 0, write = 0, read = 0 } = promptTokens;
      prompt = await Transaction.createStructured({
        ...txData,
        tokenType: 'prompt',
        inputTokens: -input,
        writeTokens: -write,
        readTokens: -read,
      });

      if (prompt?.cost) {
        totalCost += prompt.cost;
      }
    }

    if (completionTokens) {
      completion = await Transaction.create({
        ...txData,
        tokenType: 'completion',
        rawAmount: -completionTokens,
      });

      if (completion?.cost) {
        totalCost += completion.cost;
      }
    }

    // Update the user's total cost
    if (totalCost > 0 && txData.user) {
      await updateUserCost(txData.user, totalCost);
    }

    if (prompt || completion) {
      logger.debug('[spendStructuredTokens] Transaction data record against balance:', {
        user: txData.user,
        prompt: prompt?.prompt,
        promptRate: prompt?.rate,
        promptCost: prompt?.cost,
        completion: completion?.completion,
        completionRate: completion?.rate,
        completionCost: completion?.cost,
        totalCost,
        balance: completion?.balance ?? prompt?.balance,
      });
    } else {
      logger.debug('[spendStructuredTokens] No transactions incurred against balance');
    }
  } catch (err) {
    logger.error('[spendStructuredTokens]', err);
  }

  return { prompt, completion };
};

module.exports = { spendTokens, spendStructuredTokens, ensureTotalCostField };
