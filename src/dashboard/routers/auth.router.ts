import { Router } from "express";
import { getAllUsers } from "../controllers/auth.controller.js";

const adminRouter: Router = Router();

adminRouter.get("/get-all-users", getAllUsers);

export { adminRouter };
