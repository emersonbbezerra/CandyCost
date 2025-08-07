
import dotenv from "dotenv";
dotenv.config();

import { prisma } from "./db";
import { userService } from "./services/userService";

async function seed() {
  try {
    // Sample ingredients
    const sampleIngredients = [
      { name: "Farinha de Trigo", category: "Farinhas", quantity: "5", unit: "kg", price: "12.50", brand: "Marca Premium" },
      { name: "Leite Condensado", category: "Laticínios", quantity: "0.395", unit: "kg", price: "4.50", brand: "Marca Top" },
      { name: "Chocolate 70%", category: "Chocolates", quantity: "1", unit: "kg", price: "45.00", brand: "Premium" },
      { name: "Açúcar Cristal", category: "Açúcares", quantity: "5", unit: "kg", price: "18.90", brand: "União" },
      { name: "Manteiga sem Sal", category: "Laticínios", quantity: "0.5", unit: "kg", price: "15.20", brand: "Elegê" },
      { name: "Ovos", category: "Outros", quantity: "30", unit: "unidade", price: "18.00", brand: "Caipira" },
      { name: "Creme de Leite", category: "Laticínios", quantity: "0.2", unit: "kg", price: "3.50", brand: "Nestlé" },
      { name: "Açúcar de Confeiteiro", category: "Açúcares", quantity: "1", unit: "kg", price: "8.90", brand: "União" },
      { name: "Essência de Baunilha", category: "Essências", quantity: "0.03", unit: "kg", price: "12.00", brand: "Mix" },
      { name: "Fermento em Pó", category: "Fermentos", quantity: "0.1", unit: "kg", price: "4.20", brand: "Royal" },
      { name: "Leite Integral", category: "Laticínios", quantity: "1", unit: "litro", price: "5.50", brand: "Itambé" },
      { name: "Morango Fresco", category: "Frutas", quantity: "0.5", unit: "kg", price: "8.00", brand: "Local" },
      { name: "Chocolate Branco", category: "Chocolates", quantity: "1", unit: "kg", price: "38.00", brand: "Harald" },
      { name: "Nozes Picadas", category: "Oleaginosas", quantity: "0.2", unit: "kg", price: "25.00", brand: "Premium" },
      { name: "Açaí Polpa", category: "Frutas", quantity: "1", unit: "kg", price: "15.00", brand: "Amazônia" },
      { name: "Granola", category: "Cereais", quantity: "0.5", unit: "kg", price: "12.00", brand: "Mãe Terra" },
    ];

    // Inserir ingredientes
    const insertedIngredients = [];
    for (const ingredient of sampleIngredients) {
      const inserted = await prisma.ingredient.create({
        data: {
          name: ingredient.name,
          category: ingredient.category,
          quantity: parseFloat(ingredient.quantity),
          unit: ingredient.unit,
          price: parseFloat(ingredient.price),
          brand: ingredient.brand,
        }
      });
      insertedIngredients.push(inserted);
    }

    // Sample products
    const sampleProducts = [
      { name: "Brigadeiro Gourmet", category: "Doces", description: "Brigadeiro cremoso de chocolate", isAlsoIngredient: true, marginPercentage: "70", preparationTimeMinutes: 30 },
      { name: "Cupcake de Baunilha", category: "Cupcakes", description: "Cupcake com cobertura de baunilha", isAlsoIngredient: false, marginPercentage: "60", preparationTimeMinutes: 45 },
      { name: "Trufa de Chocolate Branco", category: "Doces", description: "Trufa artesanal de chocolate branco", isAlsoIngredient: false, marginPercentage: "65", preparationTimeMinutes: 60 },
      { name: "Torta de Chocolate", category: "Tortas", description: "Torta de chocolate com cobertura", isAlsoIngredient: false, marginPercentage: "35", preparationTimeMinutes: 120 },
      { name: "Bolo de Morango", category: "Bolos", description: "Bolo com recheio de morango e chantilly", isAlsoIngredient: false, marginPercentage: "40", preparationTimeMinutes: 90 },
      { name: "Cheesecake de Frutas Vermelhas", category: "Tortas", description: "Cheesecake cremoso com frutas", isAlsoIngredient: false, marginPercentage: "45", preparationTimeMinutes: 180 },
      { name: "Açaí na Tigela Premium", category: "Gelados", description: "Açaí com granola, frutas e mel", isAlsoIngredient: false, marginPercentage: "25", preparationTimeMinutes: 10 },
      { name: "Brownie com Nozes", category: "Doces", description: "Brownie denso com nozes caramelizadas", isAlsoIngredient: false, marginPercentage: "20", preparationTimeMinutes: 50 },
      { name: "Torta Holandesa", category: "Tortas", description: "Torta com creme e chocolate premium", isAlsoIngredient: false, marginPercentage: "15", preparationTimeMinutes: 150 },
      { name: "Beijinho Gourmet", category: "Doces", description: "Beijinho artesanal com coco premium", isAlsoIngredient: false, marginPercentage: "200", preparationTimeMinutes: 25 },
    ];

    // Inserir produtos
    const insertedProducts = [];
    for (const product of sampleProducts) {
      const inserted = await prisma.product.create({
        data: {
          name: product.name,
          category: product.category,
          description: product.description,
          isAlsoIngredient: product.isAlsoIngredient,
          marginPercentage: parseFloat(product.marginPercentage),
          preparationTimeMinutes: product.preparationTimeMinutes,
        }
      });
      insertedProducts.push(inserted);
    }

    // Sample recipes
    const sampleRecipes = [
      { productIndex: 0, ingredientIndex: 1, productIngredientIndex: null, quantity: "0.395", unit: "kg" },
      { productIndex: 0, ingredientIndex: 2, productIngredientIndex: null, quantity: "0.2", unit: "kg" },
      { productIndex: 0, ingredientIndex: 4, productIngredientIndex: null, quantity: "0.05", unit: "kg" },
      { productIndex: 1, ingredientIndex: 0, productIngredientIndex: null, quantity: "0.15", unit: "kg" },
      { productIndex: 1, ingredientIndex: 3, productIngredientIndex: null, quantity: "0.1", unit: "kg" },
      { productIndex: 1, ingredientIndex: 5, productIngredientIndex: null, quantity: "2", unit: "unidade" },
      { productIndex: 1, ingredientIndex: 8, productIngredientIndex: null, quantity: "0.005", unit: "kg" },
      { productIndex: 2, ingredientIndex: 12, productIngredientIndex: null, quantity: "0.3", unit: "kg" },
      { productIndex: 2, ingredientIndex: 6, productIngredientIndex: null, quantity: "0.1", unit: "kg" },
      { productIndex: 2, ingredientIndex: 4, productIngredientIndex: null, quantity: "0.02", unit: "kg" },
      { productIndex: 3, ingredientIndex: 0, productIngredientIndex: null, quantity: "0.3", unit: "kg" },
      { productIndex: 3, ingredientIndex: 2, productIngredientIndex: null, quantity: "0.25", unit: "kg" },
      { productIndex: 3, ingredientIndex: 3, productIngredientIndex: null, quantity: "0.2", unit: "kg" },
      { productIndex: 3, productIngredientIndex: 0, ingredientIndex: null, quantity: "0.2", unit: "kg" },
      { productIndex: 4, ingredientIndex: 0, productIngredientIndex: null, quantity: "0.4", unit: "kg" },
      { productIndex: 4, ingredientIndex: 3, productIngredientIndex: null, quantity: "0.25", unit: "kg" },
      { productIndex: 4, ingredientIndex: 5, productIngredientIndex: null, quantity: "6", unit: "unidade" },
      { productIndex: 4, ingredientIndex: 10, productIngredientIndex: null, quantity: "0.3", unit: "litro" },
      { productIndex: 4, ingredientIndex: 11, productIngredientIndex: null, quantity: "0.5", unit: "kg" },
      { productIndex: 5, ingredientIndex: 6, productIngredientIndex: null, quantity: "0.4", unit: "kg" },
      { productIndex: 5, ingredientIndex: 7, productIngredientIndex: null, quantity: "0.2", unit: "kg" },
      { productIndex: 5, ingredientIndex: 5, productIngredientIndex: null, quantity: "4", unit: "unidade" },
      { productIndex: 5, ingredientIndex: 11, productIngredientIndex: null, quantity: "0.3", unit: "kg" },
      { productIndex: 6, ingredientIndex: 14, productIngredientIndex: null, quantity: "0.3", unit: "kg" },
      { productIndex: 6, ingredientIndex: 15, productIngredientIndex: null, quantity: "0.1", unit: "kg" },
      { productIndex: 6, ingredientIndex: 11, productIngredientIndex: null, quantity: "0.1", unit: "kg" },
      { productIndex: 7, ingredientIndex: 2, productIngredientIndex: null, quantity: "0.4", unit: "kg" },
      { productIndex: 7, ingredientIndex: 0, productIngredientIndex: null, quantity: "0.2", unit: "kg" },
      { productIndex: 7, ingredientIndex: 13, productIngredientIndex: null, quantity: "0.15", unit: "kg" },
      { productIndex: 7, ingredientIndex: 4, productIngredientIndex: null, quantity: "0.15", unit: "kg" },
      { productIndex: 7, ingredientIndex: 5, productIngredientIndex: null, quantity: "4", unit: "unidade" },
      { productIndex: 8, ingredientIndex: 12, productIngredientIndex: null, quantity: "0.5", unit: "kg" },
      { productIndex: 8, ingredientIndex: 2, productIngredientIndex: null, quantity: "0.3", unit: "kg" },
      { productIndex: 8, ingredientIndex: 6, productIngredientIndex: null, quantity: "0.3", unit: "kg" },
      { productIndex: 8, ingredientIndex: 13, productIngredientIndex: null, quantity: "0.2", unit: "kg" },
      { productIndex: 8, ingredientIndex: 5, productIngredientIndex: null, quantity: "6", unit: "unidade" },
      { productIndex: 9, ingredientIndex: 1, productIngredientIndex: null, quantity: "0.1", unit: "kg" },
      { productIndex: 9, ingredientIndex: 4, productIngredientIndex: null, quantity: "0.02", unit: "kg" },
      { productIndex: 9, ingredientIndex: 3, productIngredientIndex: null, quantity: "0.03", unit: "kg" },
    ];

    // Inserir receitas
    for (const recipe of sampleRecipes) {
      await prisma.recipe.create({
        data: {
          productId: insertedProducts[recipe.productIndex].id,
          ingredientId: recipe.ingredientIndex !== null ? insertedIngredients[recipe.ingredientIndex].id : null,
          productIngredientId: recipe.productIngredientIndex !== null ? insertedProducts[recipe.productIngredientIndex].id : null,
          quantity: parseFloat(recipe.quantity),
          unit: recipe.unit,
        }
      });
    }

    // Inserir custos fixos
    const sampleFixedCosts = [
      { name: "Aluguel da Cozinha", category: "Imóvel", value: "1500.00", recurrence: "monthly", description: "Aluguel mensal do espaço de produção", isActive: true },
      { name: "Energia Elétrica", category: "Utilidades", value: "300.00", recurrence: "monthly", description: "Conta de luz mensal", isActive: true },
      { name: "Gás de Cozinha", category: "Utilidades", value: "150.00", recurrence: "monthly", description: "Gás para fogão e forno", isActive: true },
      { name: "Seguro Empresarial", category: "Seguros", value: "800.00", recurrence: "yearly", description: "Seguro anual da empresa", isActive: true },
      { name: "Contador", category: "Serviços", value: "400.00", recurrence: "monthly", description: "Serviços contábeis mensais", isActive: true },
    ];

    for (const fixedCost of sampleFixedCosts) {
      await prisma.fixedCost.create({
        data: {
          name: fixedCost.name,
          category: fixedCost.category,
          value: parseFloat(fixedCost.value),
          recurrence: fixedCost.recurrence,
          description: fixedCost.description,
          isActive: fixedCost.isActive,
        }
      });
    }

    // Criar usuário admin padrão
    await userService.createAdminUser();

    console.log("Banco de dados populado com sucesso!");
  } catch (error) {
    console.error("Erro ao popular o banco de dados:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed().then(() => {
  console.log("Seed finalizado.");
  process.exit(0);
}).catch((error) => {
  console.error("Erro no seed:", error);
  process.exit(1);
});
