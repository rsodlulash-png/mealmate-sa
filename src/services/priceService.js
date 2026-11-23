/**
 * MealMate SA - Grocery Price Service
 *
 * Handles grocery price information.
 *
 * IMPORTANT:
 * No live supermarket price provider is connected yet.
 * This service returns unavailable prices rather than
 * presenting invented prices as real shopping prices.
 */

const CURRENCY = "ZAR";

/**
 * Cleans and validates a grocery item name.
 */
function normaliseItemName(item) {
    if (typeof item !== "string") {
        return "";
    }

    return item.trim().replace(/\s+/g, " ");
}

/**
 * Creates a standard response for an unavailable price.
 */
function createUnavailablePrice(item) {
    return {
        item: item,
        currency: CURRENCY,
        unitPrice: null,
        retailer: null,
        source: null,
        available: false,
        message: "A verified price is not currently available."
    };
}

/**
 * Retrieves prices for a list of grocery items.
 *
 * @param {Object} requestData - Validated grocery request.
 * @returns {Promise<Array>} Grocery price information.
 */
export async function getGroceryPrices(requestData) {
    if (!requestData || !Array.isArray(requestData.items)) {
        throw new TypeError(
            "A valid list of grocery items is required."
        );
    }

    const items = requestData.items
        .map(normaliseItemName)
        .filter(Boolean);

    if (items.length === 0) {
        return [];
    }

    // Remove duplicate items without changing their order.
    const uniqueItems = [...new Set(items)];

    // No verified supermarket price provider is connected yet.
    return uniqueItems.map(createUnavailablePrice);
}
