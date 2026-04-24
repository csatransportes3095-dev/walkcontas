import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createServiceCard,
  createCardModel,
  listAllCardModels,
  deleteCardModel,
  deleteServiceCard,
} from "./db";

describe("Card Models - Duplicate Price Bug Fix", () => {
  let cardId: number;
  let model1Id: number;
  let model2Id: number;
  let model3Id: number;

  beforeAll(async () => {
    // Create a test card
    const card = await createServiceCard({
      name: "Test Card for Model Prices",
      imageUrl: "test-image.jpg",
      borderColor: "primary/30",
      buttonText: "SOLICITAR SUPORTE",
      sortOrder: 999,
    });
    cardId = card.id;
  });

  afterAll(async () => {
    // Clean up
    if (model1Id) await deleteCardModel(model1Id);
    if (model2Id) await deleteCardModel(model2Id);
    if (model3Id) await deleteCardModel(model3Id);
    if (cardId) await deleteServiceCard(cardId);
  });

  it("should create models with unique prices and return correct prices", async () => {
    // Create first model with price 35000 (R$ 350,00)
    const model1 = await createCardModel({
      cardId,
      optionType: "random",
      optionLabel: "Nome Aleatório",
      price: 35000,
      sortOrder: 1,
    });
    model1Id = model1.id;

    expect(model1.price).toBe(35000);
    expect(model1.optionLabel).toBe("Nome Aleatório");

    // Create second model with price 50000 (R$ 500,00)
    const model2 = await createCardModel({
      cardId,
      optionType: "first",
      optionLabel: "Primeiro Nome",
      price: 50000,
      sortOrder: 2,
    });
    model2Id = model2.id;

    expect(model2.price).toBe(50000);
    expect(model2.optionLabel).toBe("Primeiro Nome");

    // Create third model with price 75000 (R$ 750,00)
    const model3 = await createCardModel({
      cardId,
      optionType: "custom",
      optionLabel: "Nome Completo",
      price: 75000,
      sortOrder: 3,
    });
    model3Id = model3.id;

    expect(model3.price).toBe(75000);
    expect(model3.optionLabel).toBe("Nome Completo");
  });

  it("should retrieve all models with correct prices", async () => {
    const allModels = await listAllCardModels();

    // Find the specific models we created by ID
    const model1 = allModels.find((m) => m.id === model1Id);
    const model2 = allModels.find((m) => m.id === model2Id);
    const model3 = allModels.find((m) => m.id === model3Id);

    expect(model1?.price).toBe(35000);
    expect(model2?.price).toBe(50000);
    expect(model3?.price).toBe(75000);
  });

  it("should not mix prices between models", async () => {
    const allModels = await listAllCardModels();
    const testModels = allModels.filter((m) => m.cardId === cardId);

    // Verify each model has the correct price for the ones we created
    const priceMap = {
      random: 35000,
      first: 50000,
      custom: 75000,
    };

    // Filter to only the models we created
    const ourModels = testModels.filter((m) => m.id === model1Id || m.id === model2Id || m.id === model3Id);
    expect(ourModels).toHaveLength(3);

    // Verify each model has the correct price
    for (const model of ourModels) {
      const expectedPrice =
        priceMap[model.optionType as keyof typeof priceMap];
      expect(model.price).toBe(expectedPrice);
    }
  });
});
