import type { Request, Response } from "express";
import { AttendanceType } from "../../generated/presence/index.js";
import { generateToken } from "../utils/jwt.js";
import { getADAuthService } from "../services/adAuthService.js"; // Changed from iitAuthService
import { localPrisma, staffDb1Prisma, staffDb2Prisma } from "../config/db.js";
import type { StaffWithPi as StaffWithPi1 } from "../../generated/staff_db1/index.js";
import type { StaffWithPi as StaffWithPi2 } from "../../generated/staff_db2/index.js";
type StaffWithPi = StaffWithPi1 | StaffWithPi2;

const findValidUser = async (args: any): Promise<StaffWithPi | null> => {
  const [user1, user2] = await Promise.all([
    staffDb1Prisma.staffWithPi.findFirst(args),
    staffDb2Prisma.staffWithPi.findFirst(args),
  ]);

  if (user1 && user2) {
    // Both users exist, determine which one is "more" valid
    const user1Values = Object.values(user1);
    const user2Values = Object.values(user2);

    const user1NullCount = user1Values.filter((v) => v === null).length;
    const user2NullCount = user2Values.filter((v) => v === null).length;

    return user1NullCount <= user2NullCount ? user1 : user2;
  }

  return user1 || user2;
};

const staffViewPrisma = {
  staffWithPi: {
    findValidUser,
    async findFirst(args: any) {
      const [user1, user2] = await Promise.all([
        staffDb1Prisma.staffWithPi.findFirst(args),
        staffDb2Prisma.staffWithPi.findFirst(args),
      ]);
      return user1 || user2;
    },
    async findMany(args: any) {
      const [users1, users2] = await Promise.all([
        staffDb1Prisma.staffWithPi.findMany(args),
        staffDb2Prisma.staffWithPi.findMany(args),
      ]);
      const staffUsernames1 = new Set(users1.map((user) => user.staffUsername));
      const users2Filtered = users2.filter(
        (user) => !staffUsernames1.has(user.staffUsername),
      );
      return [...users1, ...users2Filtered];
    },
  },
};

const aggregateProjectsFromView = (userEntries: StaffWithPi[]) => {
  if (!userEntries || userEntries.length === 0) return [];

  const projectsMap = new Map();
  userEntries.forEach((entry) => {
    if (!projectsMap.has(entry.projectId)) {
      projectsMap.set(entry.projectId, {
        projectCode: entry.projectId,
        department: entry.deptName,
      });
    }
  });

  return Array.from(projectsMap.values());
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }
    try {
      console.log(
        `[AD-Login] Verifying credentials with AD server for: ${username}`,
      );
      const adAuth = getADAuthService();
      const authResult = await adAuth.authenticateUser({ username, password });

      if (!authResult.success || !authResult.valid) {
        console.log(`[AD-Login] AD authentication failed for: ${username}`);
        return res.status(401).json({
          success: false,
          error: "Invalid username or password",
        });
      }
      console.log(`[AD-Login] AD authentication successful for: ${username}`);
    } catch (error: any) {
      console.error("[AD-Login] AD authentication error:", error.message);
      return res.status(503).json({
        success: false,
        error: "Authentication service unavailable. Please try again later.",
      });
    }

    // After successful AD authentication, get user from database
    const user = await staffViewPrisma.staffWithPi.findValidUser({
      where: { staffUsername: username },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found in database. Please contact administrator.",
      });
    }

    const token = generateToken({
      employeeNumber: user.staffEmpId!,
      username: user.staffUsername!,
      empClass: user.empClass,
    });

    res.status(200).json({
      success: true,
      employeeNumber: user.staffEmpId,
      username: user.staffUsername,
      empClass: user.empClass,
      projects: aggregateProjectsFromView([user]),
      token,
      message: "Login successful",
    });
  } catch (error: any) {
    console.error("Login user error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { employeeNumber } = req.params;

    if (!employeeNumber) {
      return res.status(400).json({
        success: false,
        error: "Employee Number is required",
      });
    }

    const userEntries = await staffViewPrisma.staffWithPi.findMany({
      where: { staffEmpId: employeeNumber },
    });

    if (userEntries.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = userEntries[0];

    const attendances = await localPrisma.attendance.findMany({
      where: { employeeNumber: employeeNumber },
      take: 10,
      orderBy: {
        date: "desc",
      },
    });

    const formattedUser = {
      employeeNumber: user!.staffEmpId,
      username: user!.staffUsername,
      empClass: user!.empClass,
      userProjects: aggregateProjectsFromView(userEntries).map((p) => ({
        projectCode: p.projectCode,
        project: { department: p.department },
      })),
      attendances: attendances.map((att) => ({
        date: att.date,
        checkinTime: att.checkinTime,
        checkoutTime: att.checkoutTime,
        sessionType: att.sessionType,
        attendanceType: att.attendanceType,
        locationType: att.locationType,
        isFullDay: att.attendanceType === AttendanceType.FULL_DAY,
        isHalfDay: att.attendanceType === AttendanceType.HALF_DAY,
        isCheckedOut: !!att.checkoutTime,
        location: {
          takenLocation: att.takenLocation,
          latitude: att.latitude,
          longitude: att.longitude,
          locationAddress: att.locationAddress,
          county: att.county,
          state: att.state,
          postcode: att.postcode,
        },
      })),
    };

    res.status(200).json({
      success: true,
      data: formattedUser,
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
