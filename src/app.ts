import { Router } from "express";
import { adminRouter } from "./routers/admin.router.js";
import { authRouter } from "./routers/auth.router.js";

const appRouter: Router = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/admin", adminRouter);

export { appRouter };
