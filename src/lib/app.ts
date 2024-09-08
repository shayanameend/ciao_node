import { Router } from "express";
import { routes } from "../constants/routes.js";
import { authRouter } from "../routers/auth.router.js";

const appRouter: Router = Router();

appRouter.use(routes.root, authRouter);

export { appRouter };
