import express from "express";
import morgan from "morgan";
import appRouter from "./src/routes/index.js";
import history from 'connect-history-api-fallback';
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { config } from "dotenv";
config();
const app = express();

//middlewares
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

//remove it in production
app.use(morgan("dev"));

//prevent 404 in urls as a result of refreshing spa
app.use(history({
    // verbose: true,
}));

// serve static files from the "public" folder
app.use(express.static(path.join(process.cwd(), "public")));


app.use("/api/v1", appRouter);

export default app;

