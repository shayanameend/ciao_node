import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import {
	createProfile,
	login,
	logout,
	register,
	resendOTP,
	verifyOTP,
} from "../controllers/auth.controller.js";

const authRouter: Router = Router();

authRouter.post("/register", register);
authRouter.post("/resend", authenticate("user"), resendOTP);
authRouter.post("/verify", authenticate("user"), verifyOTP);
authRouter.post("/create-profile", authenticate("user"), createProfile);
authRouter.post("/login", login);
authRouter.post("/logout", authenticate("user"), logout);

export { authRouter };
