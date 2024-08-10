import {Router} from "express";
import {authenticate} from "../../middlewares/authenticate.js";
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
authRouter.post("/resend", authenticate("user"), resendOTP);
authRouter.post("/verify", authenticate("user"), verifyOTP);
authRouter.post("/forgert-password-request", requestForgetPassword);
authRouter.post("/reset-password", authenticate("user"), resetPassword);
authRouter.post("/create-profile", authenticate("user"), createProfile);
authRouter.post("/login", login);
authRouter.post("/logout", authenticate("user"), logout);
authRouter.post("/change-password", authenticate("user"), changePassword);

export {authRouter};
