import express from "express";

import {
    validateGroceryPriceRequest
} from "../utils/validators.js";

import {
    asyncHandler,
    BadRequestError
} from "../utils/errorHandler.js";

import {
    getGroceryPrices
} from "../services/priceService.js";

const router = express.Router();

/**
 * GET /api/prices
 *
 * Retrieves grocery prices for requested products.
 *
 * Example:
 * /api/prices?items=rice,maize meal,eggs
 */
router.get(
    "/",
    asyncHandler(async function (req, res) {
        const rawItems = req.query.items;

        if (!rawItems || typeof rawItems !== "string") {
            throw new BadRequestError(
                "Please provide grocery items to search for."
            );
        }

        const items = rawItems
            .split(",")
            .map(function (item) {
                return item.trim();
            })
            .filter(Boolean);

        if (items.length === 0) {
            throw new BadRequestError(
                "Please provide at least one valid grocery item."
            );
        }

        const requestData = validateGroceryPriceRequest({
            items: items
        });

        const prices = await getGroceryPrices(requestData);

        return res.status(200).json({
            success: true,
            count: prices.length,
            currency: "ZAR",
            prices: prices
        });
    })
);

export default router;
