import { DataSource } from "typeorm";
import { config } from "dotenv";

config(); // load variables from .env file

export const AppDataSource = new DataSource({
   type: "postgres",
   host: process.env.DB_HOST,
   port: Number(process.env.DB_PORT),
   username: process.env.DB_USER,
   password: process.env.DB_PASS,
   database: process.env.DB_NAME,
   synchronize: true,
   logging: false,
   entities: [
      "src/model/*.ts"
   ]
});