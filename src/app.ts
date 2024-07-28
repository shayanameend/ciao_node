import { Router } from "express";
import { authRouter } from "./routers/auth.router.js";

const appRouter: Router = Router();

appRouter.use("/auth", authRouter);

export { appRouter };
