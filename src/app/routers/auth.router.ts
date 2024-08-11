import { Router } from "express";
import { authenticateHttp } from "../../middlewares/authenticate.js";
import {
	changePassword,
	createProfile,
	login,
	logout,
	register,
	requestForgetPassword,
	resendOTP,
	resetPassword,
	verifyOTP,
} from "../controllers/auth.controller.js";

const authRouter: Router = Router();

authRouter.post("/register", register);
authRouter.post("/resend", authenticateHttp("user"), resendOTP);
authRouter.post("/verify", authenticateHttp("user"), verifyOTP);
authRouter.post("/forgert-password-request", requestForgetPassword);
authRouter.post("/reset-password", authenticateHttp("user"), resetPassword);
authRouter.post("/create-profile", authenticateHttp("user"), createProfile);
authRouter.post("/login", login);
authRouter.post("/logout", authenticateHttp("user"), logout);
authRouter.post("/change-password", authenticateHttp("user"), changePassword);

export { authRouter };
