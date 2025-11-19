import { Router } from "express";
import { getPIUsersAttendance, getPiNotifications, submitDataToHR, modifyPIUsersAttendance, getModifiedAttendance, deleteModifiedAttendance } from "../controllers/pi.controller.js";
import { flexibleAuth } from "../middleware/auth.js";
const router = Router();
router.get("/pi/users-attendance", flexibleAuth, getPIUsersAttendance);
router.get("/pi/notifications", flexibleAuth, getPiNotifications);
router.post("/pi/submit-data", flexibleAuth, submitDataToHR);
router.post("/pi/modify-attendance", flexibleAuth, modifyPIUsersAttendance);
router.get("/pi/modified-attendance/:employeeNumber", flexibleAuth, getModifiedAttendance);
router.delete("/pi/modified-attendance/:id", flexibleAuth, deleteModifiedAttendance);
export default router;
//# sourceMappingURL=pi.routes.js.map