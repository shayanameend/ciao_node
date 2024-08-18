import { Router } from "express";
import { authenticateHttp } from "../../middlewares/authenticate.js";
import { default as routes } from "../../routes.js";
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

authRouter.post(routes.auth.register, register);
authRouter.post(routes.auth.resend, authenticateHttp("user"), resendOTP);
authRouter.post(routes.auth.verify, authenticateHttp("user"), verifyOTP);
authRouter.post(routes.auth.forgetPasswordRequest, requestForgetPassword);
authRouter.post(
	routes.auth.resetPassword,
	authenticateHttp("user"),
	resetPassword,
);
authRouter.post(
	routes.auth.createProfile,
	authenticateHttp("user"),
	createProfile,
);
authRouter.post(routes.auth.login, login);
authRouter.post(routes.auth.logout, authenticateHttp("user"), logout);
authRouter.post(
	routes.auth.changePassword,
	authenticateHttp("user"),
	changePassword,
);

export { authRouter };
