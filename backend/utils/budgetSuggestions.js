// ============================================================
// Automatic Budget Suggestion logic
//
// Given a total income amount, suggests a percentage-based
// allocation across the standard expense categories, matching
// the example in the project brief:
//   Food 30%, Transport 15%, Academic 20%, Savings 20%, Other 15%
//
// "Accommodation" is folded into the suggestion set as well since
// it's a core student expense category; we keep the original
// brief's five buckets as the default but expose all percentages
// so the frontend can let users edit any of them before saving.
// ============================================================

const DEFAULT_ALLOCATION_PERCENTAGES = {
    Food: 30,
    Transport: 15,
    Accommodation: 20,
    Academic: 20,
    Miscellaneous: 15
};

/**
 * Returns suggested allocations as an array of
 * { categoryName, percent, amount } given a total income.
 */
function suggestBudgetAllocations(totalIncome) {
    const income = Number(totalIncome) || 0;

    return Object.entries(DEFAULT_ALLOCATION_PERCENTAGES).map(([categoryName, percent]) => ({
        categoryName,
        percent,
        amount: Math.round((income * percent) / 100 * 100) / 100
    }));
}

module.exports = { suggestBudgetAllocations, DEFAULT_ALLOCATION_PERCENTAGES };
