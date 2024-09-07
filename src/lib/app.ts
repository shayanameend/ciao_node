import { Router } from "express";
import { default as routes } from "../constants/routes.js";
import { authRouter as appAuthRouter } from "../routers/auth.router.js";

const appRouter: Router = Router();

appRouter.use(routes.express.app, appAuthRouter);

export { appRouter };
