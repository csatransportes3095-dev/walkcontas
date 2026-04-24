import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createServiceCard,
  createCardDocument,
  listAllCardDocuments,
  deleteCardDocument,
  deleteServiceCard,
} from "./db";

describe("Independent Documents - Each document is completely independent", () => {
  let card1Id: number;
  let card2Id: number;

  beforeAll(async () => {
    // Create two test cards
    const card1 = await createServiceCard({
      name: "Test Card 1 - Independent Docs",
      imageUrl: "test1.jpg",
      borderColor: "primary/30",
      buttonText: "SOLICITAR",
      sortOrder: 997,
    });
    card1Id = card1.id;

    const card2 = await createServiceCard({
      name: "Test Card 2 - Independent Docs",
      imageUrl: "test2.jpg",
      borderColor: "secondary/30",
      buttonText: "SOLICITAR",
      sortOrder: 998,
    });
    card2Id = card2.id;
  });

  afterAll(async () => {
    // Clean up all documents for these cards
    const allDocs = await listAllCardDocuments();
    const docsToDelete = allDocs.filter(
      d => d.cardId === card1Id || d.cardId === card2Id
    );
    for (const doc of docsToDelete) {
      await deleteCardDocument(doc.id);
    }

    // Clean up cards
    if (card1Id) await deleteServiceCard(card1Id);
    if (card2Id) await deleteServiceCard(card2Id);
  });

  it("should create independent documents with unique properties per card", async () => {
    // Create two documents for Card 1
    const doc1 = await createCardDocument({
      cardId: card1Id,
      docType: "custom",
      docLabel: "Foto de Perfil",
      required: 1,
      sortOrder: 1,
    });

    const doc2 = await createCardDocument({
      cardId: card1Id,
      docType: "custom",
      docLabel: "Documento do Carro",
      required: 1,
      sortOrder: 2,
    });

    // Create document for Card 2 with same name as doc1 but different required status
    const doc3 = await createCardDocument({
      cardId: card2Id,
      docType: "custom",
      docLabel: "Foto de Perfil", // Same name as doc1
      required: 0, // Different required status
      sortOrder: 1,
    });

    // Verify each document has its own properties
    expect(doc1.docLabel).toBe("Foto de Perfil");
    expect(doc1.required).toBe(1);
    expect(doc2.docLabel).toBe("Documento do Carro");
    expect(doc2.required).toBe(1);
    expect(doc3.docLabel).toBe("Foto de Perfil");
    expect(doc3.required).toBe(0);

    // Verify they have different IDs
    expect(doc1.id).not.toBe(doc3.id);
  });

  it("should not confuse documents from different cards even with same label", async () => {
    // Create documents for testing
    const doc1 = await createCardDocument({
      cardId: card1Id,
      docType: "custom",
      docLabel: "Test Document",
      required: 1,
      sortOrder: 1,
    });

    const doc2 = await createCardDocument({
      cardId: card2Id,
      docType: "custom",
      docLabel: "Test Document", // Same label
      required: 0, // Different required status
      sortOrder: 1,
    });

    // Get all documents
    const allDocs = await listAllCardDocuments();

    // Filter documents for each card
    const card1Docs = allDocs.filter(d => d.cardId === card1Id);
    const card2Docs = allDocs.filter(d => d.cardId === card2Id);

    // Find our test documents
    const card1TestDoc = card1Docs.find(d => d.id === doc1.id);
    const card2TestDoc = card2Docs.find(d => d.id === doc2.id);

    // They should have different required status
    expect(card1TestDoc?.required).toBe(1);
    expect(card2TestDoc?.required).toBe(0);
    expect(card1TestDoc?.required).not.toBe(card2TestDoc?.required);

    // Clean up
    await deleteCardDocument(doc1.id);
    await deleteCardDocument(doc2.id);
  });

  it("should allow creating multiple documents with custom names in same card", async () => {
    // Create 3 documents with custom names
    const docs = [];
    for (let i = 0; i < 3; i++) {
      const doc = await createCardDocument({
        cardId: card1Id,
        docType: "custom",
        docLabel: `Custom Document ${i + 1}`,
        required: i % 2 === 0 ? 1 : 0,
        sortOrder: i + 1,
      });
      docs.push(doc);
    }

    // Verify documents were created
    const allDocs = await listAllCardDocuments();
    const card1Docs = allDocs.filter(d => d.cardId === card1Id);

    // Find our created documents
    const createdDocs = card1Docs.filter(d =>
      docs.some(created => created.id === d.id)
    );

    expect(createdDocs).toHaveLength(3);

    // Verify each document has correct properties
    for (let i = 0; i < 3; i++) {
      const doc = createdDocs.find(
        d => d.docLabel === `Custom Document ${i + 1}`
      );
      expect(doc?.required).toBe(i % 2 === 0 ? 1 : 0);
    }

    // Clean up
    for (const doc of docs) {
      await deleteCardDocument(doc.id);
    }
  });

  it("should retrieve documents by ID and get correct independent properties", async () => {
    // Create two documents with same name but different required status
    const doc1 = await createCardDocument({
      cardId: card1Id,
      docType: "custom",
      docLabel: "Shared Document Name",
      required: 1,
      sortOrder: 1,
    });

    const doc2 = await createCardDocument({
      cardId: card2Id,
      docType: "custom",
      docLabel: "Shared Document Name", // Same name
      required: 0, // Different required status
      sortOrder: 1,
    });

    // Get all documents
    const allDocs = await listAllCardDocuments();

    // Find documents by ID
    const foundDoc1 = allDocs.find(d => d.id === doc1.id);
    const foundDoc2 = allDocs.find(d => d.id === doc2.id);

    // They should have different required status
    expect(foundDoc1?.required).toBe(1);
    expect(foundDoc2?.required).toBe(0);

    // Even though they have the same name
    expect(foundDoc1?.docLabel).toBe("Shared Document Name");
    expect(foundDoc2?.docLabel).toBe("Shared Document Name");

    // Their properties should be completely independent
    expect(foundDoc1?.required).not.toBe(foundDoc2?.required);

    // Clean up
    await deleteCardDocument(doc1.id);
    await deleteCardDocument(doc2.id);
  });
});
