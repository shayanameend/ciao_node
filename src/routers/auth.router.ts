import { Router } from "express";
import {
  login,
  logout,
  register,
  resendOTP,
  verifyOTP,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const authRouter: Router = Router();

authRouter.post("/register", register);
authRouter.post("/verify", authenticate("user"), verifyOTP);
authRouter.post("/resend", authenticate("user"), resendOTP);
authRouter.post("/login", login);
authRouter.post("/logout", authenticate("user"), logout);

export { authRouter };
