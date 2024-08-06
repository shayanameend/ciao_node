import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import {
	login,
	logout,
	register,
	resendOTP,
	verifyOTP,
} from "../controllers/auth.controller.js";

const authRouter: Router = Router();

authRouter.post("/register", register);
authRouter.post("/verify", authenticate("admin"), verifyOTP);
authRouter.post("/resend", authenticate("admin"), resendOTP);
authRouter.post("/login", login);
authRouter.post("/logout", authenticate("admin"), logout);

export { authRouter };
