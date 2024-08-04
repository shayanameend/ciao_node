import { Router } from "express";
import { login, logout, register } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const authRouter: Router = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", authenticate("user"), logout);

export { authRouter };
