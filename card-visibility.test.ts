import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createServiceCard,
  updateServiceCard,
  listServiceCards,
  deleteServiceCard,
} from "./db";

describe("Card Visibility Control - Active/Inactive Cards", () => {
  let activeCardId: number;
  let inactiveCardId: number;

  beforeAll(async () => {
    // Create an active card
    const activeCard = await createServiceCard({
      name: `Test Active Card ${Date.now()}`,
      imageUrl: "active.jpg",
      borderColor: "primary/30",
      buttonText: "SOLICITAR",
      sortOrder: 999,
      active: 1,
    });
    activeCardId = activeCard.id;

    // Create an inactive card
    const inactiveCard = await createServiceCard({
      name: `Test Inactive Card ${Date.now()}`,
      imageUrl: "inactive.jpg",
      borderColor: "secondary/30",
      buttonText: "SOLICITAR",
      sortOrder: 1000,
      active: 0,
    });
    inactiveCardId = inactiveCard.id;
  });

  afterAll(async () => {
    // Clean up
    if (activeCardId) await deleteServiceCard(activeCardId);
    if (inactiveCardId) await deleteServiceCard(inactiveCardId);
  });

  it("should create cards with active status", async () => {
    const allCards = await listServiceCards();

    const activeCard = allCards.find(c => c.id === activeCardId);
    const inactiveCard = allCards.find(c => c.id === inactiveCardId);

    expect(activeCard?.active).toBe(1);
    expect(inactiveCard?.active).toBe(0);
  });

  it("should filter active cards correctly", async () => {
    // Get all cards
    const allCards = await listServiceCards();

    // Filter active cards (simulating what Home.tsx does)
    const activeCards = allCards.filter(card => card.active === 1);
    const inactiveCards = allCards.filter(card => card.active === 0);

    // Verify active card is in active list
    const foundActiveCard = activeCards.find(c => c.id === activeCardId);
    expect(foundActiveCard).toBeDefined();
    expect(foundActiveCard?.active).toBe(1);

    // Verify inactive card is NOT in active list
    const foundInactiveInActiveList = activeCards.find(
      c => c.id === inactiveCardId
    );
    expect(foundInactiveInActiveList).toBeUndefined();

    // Verify inactive card is in inactive list
    const foundInactiveCard = inactiveCards.find(c => c.id === inactiveCardId);
    expect(foundInactiveCard).toBeDefined();
    expect(foundInactiveCard?.active).toBe(0);
  });

  it("should allow toggling card active status", async () => {
    // Deactivate the active card
    await updateServiceCard(activeCardId, { active: 0 });

    // Verify it's now inactive
    let allCards = await listServiceCards();
    let card = allCards.find(c => c.id === activeCardId);
    expect(card?.active).toBe(0);

    // Reactivate the card
    await updateServiceCard(activeCardId, { active: 1 });

    // Verify it's active again
    allCards = await listServiceCards();
    card = allCards.find(c => c.id === activeCardId);
    expect(card?.active).toBe(1);
  });

  it("should show only active cards to customers", async () => {
    // Get all cards
    const allCards = await listServiceCards();

    // Simulate what customers see (only active cards)
    const visibleCards = allCards.filter(card => card.active === 1);

    // Our active card should be visible
    const isActiveCardVisible = visibleCards.some(c => c.id === activeCardId);
    expect(isActiveCardVisible).toBe(true);

    // Our inactive card should NOT be visible
    const isInactiveCardVisible = visibleCards.some(c => c.id === inactiveCardId);
    expect(isInactiveCardVisible).toBe(false);
  });

  it("should allow editing card while maintaining active status", async () => {
    // Ensure card is active
    await updateServiceCard(activeCardId, { active: 1 });

    // Update card name while keeping it active
    await updateServiceCard(activeCardId, {
      buttonText: "UPDATED BUTTON",
    });

    // Verify button text changed and active status maintained
    const allCards = await listServiceCards();
    const updatedCard = allCards.find(c => c.id === activeCardId);

    expect(updatedCard?.buttonText).toBe("UPDATED BUTTON");
    expect(updatedCard?.active).toBe(1);
  });
});
