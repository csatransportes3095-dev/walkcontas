import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createServiceCard,
  createCardModel,
  listAllCardModels,
  deleteCardModel,
  deleteServiceCard,
} from "./db";

describe("Independent Models - Each model is completely independent", () => {
  let card1Id: number;
  let card2Id: number;

  beforeAll(async () => {
    // Create two test cards
    const card1 = await createServiceCard({
      name: "Test Card 1 - Independent",
      imageUrl: "test1.jpg",
      borderColor: "primary/30",
      buttonText: "SOLICITAR",
      sortOrder: 998,
    });
    card1Id = card1.id;

    const card2 = await createServiceCard({
      name: "Test Card 2 - Independent",
      imageUrl: "test2.jpg",
      borderColor: "secondary/30",
      buttonText: "SOLICITAR",
      sortOrder: 999,
    });
    card2Id = card2.id;
  });

  afterAll(async () => {
    // Clean up all models for these cards
    const allModels = await listAllCardModels();
    const modelsToDelete = allModels.filter(
      m => m.cardId === card1Id || m.cardId === card2Id
    );
    for (const model of modelsToDelete) {
      await deleteCardModel(model.id);
    }

    // Clean up cards
    if (card1Id) await deleteServiceCard(card1Id);
    if (card2Id) await deleteServiceCard(card2Id);
  });

  it("should create independent models with unique prices per card", async () => {
    // Create two models for Card 1
    const model1 = await createCardModel({
      cardId: card1Id,
      optionType: "custom",
      optionLabel: "Aleatório",
      price: 10000, // R$ 100
      sortOrder: 1,
    });

    const model2 = await createCardModel({
      cardId: card1Id,
      optionType: "custom",
      optionLabel: "Primeiro Nome",
      price: 20000, // R$ 200
      sortOrder: 2,
    });

    // Create model for Card 2 with same name as model1 but different price
    const model3 = await createCardModel({
      cardId: card2Id,
      optionType: "custom",
      optionLabel: "Aleatório", // Same name as model1
      price: 50000, // R$ 500 - different price
      sortOrder: 1,
    });

    // Verify each model has its own price
    expect(model1.price).toBe(10000);
    expect(model2.price).toBe(20000);
    expect(model3.price).toBe(50000);

    // Verify they have different IDs
    expect(model1.id).not.toBe(model3.id);
  });

  it("should not confuse models from different cards even with same label", async () => {
    // Create models for testing
    const model1 = await createCardModel({
      cardId: card1Id,
      optionType: "custom",
      optionLabel: "Test Model",
      price: 15000,
      sortOrder: 1,
    });

    const model2 = await createCardModel({
      cardId: card2Id,
      optionType: "custom",
      optionLabel: "Test Model", // Same label
      price: 45000, // Different price
      sortOrder: 1,
    });

    // Get all models
    const allModels = await listAllCardModels();

    // Filter models for each card
    const card1Models = allModels.filter(m => m.cardId === card1Id);
    const card2Models = allModels.filter(m => m.cardId === card2Id);

    // Find our test models
    const card1TestModel = card1Models.find(m => m.id === model1.id);
    const card2TestModel = card2Models.find(m => m.id === model2.id);

    // They should have different prices
    expect(card1TestModel?.price).toBe(15000);
    expect(card2TestModel?.price).toBe(45000);
    expect(card1TestModel?.price).not.toBe(card2TestModel?.price);

    // Clean up
    await deleteCardModel(model1.id);
    await deleteCardModel(model2.id);
  });

  it("should allow creating multiple models with custom names in same card", async () => {
    // Create 3 models with custom names
    const models = [];
    for (let i = 0; i < 3; i++) {
      const model = await createCardModel({
        cardId: card1Id,
        optionType: "custom",
        optionLabel: `Custom Model ${i + 1}`,
        price: (i + 1) * 10000,
        sortOrder: i + 1,
      });
      models.push(model);
    }

    // Verify models were created
    const allModels = await listAllCardModels();
    const card1Models = allModels.filter(m => m.cardId === card1Id);

    // Find our created models
    const createdModels = card1Models.filter(m =>
      models.some(created => created.id === m.id)
    );

    expect(createdModels).toHaveLength(3);

    // Verify each model has correct price
    for (let i = 0; i < 3; i++) {
      const model = createdModels.find(
        m => m.optionLabel === `Custom Model ${i + 1}`
      );
      expect(model?.price).toBe((i + 1) * 10000);
    }

    // Clean up
    for (const model of models) {
      await deleteCardModel(model.id);
    }
  });

  it("should retrieve models by ID and get correct independent price", async () => {
    // Create two models with same name but different prices
    const model1 = await createCardModel({
      cardId: card1Id,
      optionType: "custom",
      optionLabel: "Shared Name",
      price: 25000,
      sortOrder: 1,
    });

    const model2 = await createCardModel({
      cardId: card2Id,
      optionType: "custom",
      optionLabel: "Shared Name", // Same name
      price: 55000, // Different price
      sortOrder: 1,
    });

    // Get all models
    const allModels = await listAllCardModels();

    // Find models by ID
    const foundModel1 = allModels.find(m => m.id === model1.id);
    const foundModel2 = allModels.find(m => m.id === model2.id);

    // They should have different prices
    expect(foundModel1?.price).toBe(25000);
    expect(foundModel2?.price).toBe(55000);

    // Even though they have the same name
    expect(foundModel1?.optionLabel).toBe("Shared Name");
    expect(foundModel2?.optionLabel).toBe("Shared Name");

    // Their prices should be completely independent
    expect(foundModel1?.price).not.toBe(foundModel2?.price);

    // Clean up
    await deleteCardModel(model1.id);
    await deleteCardModel(model2.id);
  });
});
