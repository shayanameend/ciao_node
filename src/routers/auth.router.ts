import { Router } from "express";
import { default as routes } from "../constants/routes.js";
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
import { authenticateHttp } from "../middlewares/authenticate.js";
import { asyncCatch } from "../utils/async-catch.js";

const authRouter: Router = Router();

authRouter.post(routes.auth.register, asyncCatch(register));
authRouter.post(
	routes.auth.resend,
	authenticateHttp("user"),
	asyncCatch(resendOTP),
);
authRouter.post(
	routes.auth.verify,
	authenticateHttp("user"),
	asyncCatch(verifyOTP),
);
authRouter.post(
	routes.auth.forgetPasswordRequest,
	asyncCatch(requestForgetPassword),
);
authRouter.post(
	routes.auth.resetPassword,
	authenticateHttp("user"),
	asyncCatch(resetPassword),
);
authRouter.post(
	routes.auth.createProfile,
	authenticateHttp("user"),
	asyncCatch(createProfile),
);
authRouter.post(routes.auth.login, login);
authRouter.post(routes.auth.logout, authenticateHttp("user"), logout);
authRouter.post(
	routes.auth.changePassword,
	authenticateHttp("user"),
	asyncCatch(changePassword),
);

export { authRouter };
