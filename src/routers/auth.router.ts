import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";

const authRouter: Router = Router();

authRouter.post("/login", login);
authRouter.post("/register", register);

export { authRouter };
