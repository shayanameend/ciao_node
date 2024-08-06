import { Router } from "express";
import { authRouter as appAuthRouter } from "./app/routers/auth.router.js";
import { adminRouter as dashboardAuthRouter } from "./dashboard/routers/auth.router.js";

const appRouter: Router = Router();

appRouter.use("/app", appAuthRouter);
appRouter.use("/dashboard", dashboardAuthRouter);

export { appRouter };
