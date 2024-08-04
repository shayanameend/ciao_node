import { Router } from "express";
import { getAllUsers } from "../controllers/admin.controller.js";

const adminRouter: Router = Router();

adminRouter.get("/users", getAllUsers);

export { adminRouter };
