import assert from "node:assert/strict";
import test from "node:test";
import { classifyEpic, currentGame } from "../scripts/fetch-public-data.mjs";

test("reads the current game from the Steam profile message", () => {
  assert.equal(currentGame("In-Game<br/>The Outlast Trials"), "The Outlast Trials");
  assert.equal(currentGame("Online"), null);
});

test("does not label a normal discount as free", () => {
  const item = {
    id: "sale",
    title: "Discounted",
    offerType: "BASE_GAME",
    seller: { name: "Studio" },
    keyImages: [],
    offerMappings: [{ pageSlug: "discounted" }],
    price: { totalPrice: { originalPrice: 1999, discountPrice: 999, fmtPrice: { originalPrice: "$19.99" } } },
    promotions: {
      promotionalOffers: [
        {
          promotionalOffers: [
            {
              startDate: "2026-10-01T00:00:00.000Z",
              endDate: "2026-10-20T00:00:00.000Z",
              discountSetting: { discountPercentage: 50 }
            }
          ]
        }
      ]
    }
  };
  assert.equal(classifyEpic(item, Date.parse("2026-10-17T00:00:00Z")), null);
});

test("keeps a current 100 percent promotion", () => {
  const item = {
    id: "free",
    title: "Free Now",
    offerType: "BASE_GAME",
    seller: { name: "Studio" },
    keyImages: [{ type: "Thumbnail", url: "https://example.test/img.png" }],
    offerMappings: [{ pageSlug: "free-now" }],
    price: { totalPrice: { originalPrice: 1999, discountPrice: 0, fmtPrice: { originalPrice: "$19.99" } } },
    promotions: {
      promotionalOffers: [
        {
          promotionalOffers: [
            {
              startDate: "2026-10-15T00:00:00.000Z",
              endDate: "2026-10-22T00:00:00.000Z",
              discountSetting: { discountPercentage: 0 }
            }
          ]
        }
      ]
    }
  };
  const result = classifyEpic(item, Date.parse("2026-10-17T00:00:00Z"));
  assert.equal(result.kind, "promotion");
  assert.equal(result.end, "2026-10-22T00:00:00.000Z");
});

test("keeps a future 100 percent offer upcoming", () => {
  const item = {
    id: "next",
    title: "Free Later",
    offerType: "BASE_GAME",
    seller: { name: "Studio" },
    keyImages: [],
    offerMappings: [{ pageSlug: "free-later" }],
    price: { totalPrice: { originalPrice: 999, discountPrice: 999, fmtPrice: { originalPrice: "$9.99" } } },
    promotions: {
      upcomingPromotionalOffers: [
        {
          promotionalOffers: [
            {
              startDate: "2026-10-22T00:00:00.000Z",
              endDate: "2026-10-29T00:00:00.000Z",
              discountSetting: { discountPercentage: 0 }
            }
          ]
        }
      ]
    }
  };
  assert.equal(classifyEpic(item, Date.parse("2026-10-17T00:00:00Z")).kind, "upcoming");
});

test("separates a permanently free listing from a claim window", () => {
  const item = {
    id: "f2p",
    title: "Always Free",
    offerType: "BASE_GAME",
    seller: { name: "Studio" },
    keyImages: [],
    offerMappings: [{ pageSlug: "always-free" }],
    price: { totalPrice: { originalPrice: 0, discountPrice: 0, fmtPrice: { originalPrice: "0" } } },
    promotions: null
  };
  assert.equal(classifyEpic(item, Date.parse("2026-10-17T00:00:00Z")).kind, "free_to_play");
});
