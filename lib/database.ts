import { Sequelize } from "sequelize";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://dev:dev@localhost:5432/cracouchat";

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
});

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
}

export async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Unable to sync database:", error);
    throw error;
  }
}

