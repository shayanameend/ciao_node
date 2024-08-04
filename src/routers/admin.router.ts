import { Router } from "express";
import { getAllUsers } from "../controllers/admin.controller.js";

const adminRouter: Router = Router();

adminRouter.get("/get-all-users", getAllUsers);

export { adminRouter };
