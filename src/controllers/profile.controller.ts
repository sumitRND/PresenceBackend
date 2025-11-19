import type { Request, Response } from "express";
import { staffDb1Prisma, staffDb2Prisma } from "../config/db.js";

const staffViewPrisma = {
  staffWithPi: {
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
      return [...users1, ...users2];
    },
  },
};

export const getUserProfileByEmployeeNumber = async (
  req: Request,
  res: Response,
) => {
  try {
    const { employeeNumber } = req.params;

    if (!employeeNumber) {
      return res.status(400).json({
        success: false,
        error: "Employee number is required",
      });
    }

    const userEntry = await staffViewPrisma.staffWithPi.findFirst({
      where: { staffEmpId: employeeNumber },
    });

    if (!userEntry) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        employeeNumber: userEntry.staffEmpId,
        username: userEntry.staffUsername,
        empClass: userEntry.empClass,
      },
    });
  } catch (error: any) {
    console.error("Get user profile by employee number error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  return res.status(405).json({
    success: false,
    error:
      "User profiles are read-only and cannot be updated from this system.",
  });
};
