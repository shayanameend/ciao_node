import { Router } from "express";
import { authRouter as appAuthRouter } from "./app/routers/auth.router.js";
import { adminRouter as dashboardAuthRouter } from "./dashboard/routers/auth.router.js";
import { default as routes } from "./routes.js";

const appRouter: Router = Router();

appRouter.use(routes.express.app, appAuthRouter);
appRouter.use(routes.express.dashboard, dashboardAuthRouter);

export { appRouter };
