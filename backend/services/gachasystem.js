// Gacha system for question cards
import { esClient } from "./elasticsearchClient";

export function rollRarity(isBoosted) {
    const r = Math.random;
    if (isBoosted) r += 0.1;

    if (r < 0.6) {
        return "easy";
    } else if (r < 0.85) {
        return "medium";
    } else {
        return "hard";
    }
}

/**
 *
 * @param {*} number number of rolls done
 * @param {*} isBoosted if boosted chances of rare cards
 * @return a list of cards
 */
export async function openPack(userId, isBoosted) {
    const results = [];

    for (let i = 0; i < 7; i++) {
        r = rollRarity()

        const question = await esClient.asyncSearch.submit({
            index: "questions",
            size: 1,
            query: {
                term: { difficulty: rarity }
            },
            random_score: {}
        })
    }
}