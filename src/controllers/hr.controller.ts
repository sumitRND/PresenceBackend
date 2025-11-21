import type { Request, Response } from "express";
import { createObjectCsvStringifier } from "csv-writer";
import { localPrisma, staffDb1Prisma, staffDb2Prisma } from "../config/db.js";
import { generateToken } from "../utils/jwt.js";

const HR_USER = { username: "HRUser", password: "password" };

// Helper function to get staff info from both databases
async function getStaffInfo(employeeIds: string[]) {
  const [staffDb1Results, staffDb2Results] = await Promise.all([
    staffDb1Prisma.staffWithPi.findMany({
      where: {
        staffEmpId: { in: employeeIds },
      },
      select: {
        staffEmpId: true,
        staffFullName: true,
        staffUsername: true,
      },
    }),
    staffDb2Prisma.staffWithPi.findMany({
      where: {
        staffEmpId: { in: employeeIds },
      },
      select: {
        staffEmpId: true,
        staffFullName: true,
        staffUsername: true,
      },
    }),
  ]);

  // Combine results and remove duplicates
  const staffMap = new Map<string, { fullName: string; username: string }>();
  
  [...staffDb1Results, ...staffDb2Results].forEach((staff) => {
    if (!staffMap.has(staff.staffEmpId)) {
      staffMap.set(staff.staffEmpId, {
        fullName: staff.staffFullName || staff.staffEmpId,
        username: staff.staffUsername || staff.staffEmpId,
      });
    }
  });

  return staffMap;
}

// Helper function to get all PIs from both databases
async function getAllPIsFromBothDatabases() {
  const [piListDb1, piListDb2] = await Promise.all([
    staffDb1Prisma.staffWithPi.findMany({
      where: {
        piUsername: { not: null },
      },
      distinct: ['piUsername'],
      select: {
        piUsername: true,
        piFullName: true,
      },
      orderBy: {
        piUsername: 'asc',
      },
    }),
    staffDb2Prisma.staffWithPi.findMany({
      where: {
        piUsername: { not: null },
      },
      distinct: ['piUsername'],
      select: {
        piUsername: true,
        piFullName: true,
      },
      orderBy: {
        piUsername: 'asc',
      },
    }),
  ]);

  // Combine and deduplicate PIs
  const piMap = new Map<string, string>();
  [...piListDb1, ...piListDb2].forEach((pi) => {
    if (pi.piUsername && !piMap.has(pi.piUsername)) {
      piMap.set(pi.piUsername, pi.piFullName || pi.piUsername);
    }
  });

  return Array.from(piMap.entries())
    .map(([username, fullName]) => ({ username, fullName }))
    .sort((a, b) => a.username.localeCompare(b.username));
}

async function calculateWorkingDaysUpToToday(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const effectiveEndDate = endDate > today ? today : endDate;
  if (today < startDate) return 0;

  const totalDays = effectiveEndDate.getDate();
  const holidaysAndWeekends = await localPrisma.calendar.count({
    where: {
      date: { gte: startDate, lte: effectiveEndDate },
      OR: [{ isHoliday: true }, { isWeekend: true }],
    },
  });
  return totalDays - holidaysAndWeekends;
}

export const hrLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (username === HR_USER.username && password === HR_USER.password) {
    const token = generateToken({
      employeeNumber: "HR01",
      username: "HRUser",
      empClass: "HR",
    });
    return res.json({ success: true, message: "HR Login Successful", token });
  }
  return res.status(401).json({ success: false, error: "Invalid credentials" });
};

export const getAllPIs = async (req: Request, res: Response) => {
  try {
    const piList = await getAllPIsFromBothDatabases();
    return res.json({ success: true, data: piList });
  } catch (error) {
    console.error("Error fetching PIs:", error);
    return res
      .status(500)
      .json({ success: false, error: "Could not retrieve PI list." });
  }
};

export const requestDataFromPIs = async (req: Request, res: Response) => {
  const { piUsernames, month, year, message } = req.body;

  if (!piUsernames || !Array.isArray(piUsernames) || !month || !year) {
    return res.status(400).json({
      success: false,
      error: "PI usernames array, month, and year are required.",
    });
  }

  try {
    const requestMessage = message || "Request for attendance data for";

    const createPromises = piUsernames.map((piUsername: string) =>
      localPrisma.hRPIDataRequest.upsert({
        where: {
          piUsername_month_year: {
            piUsername,
            month,
            year,
          },
        },
        update: {
          requestedAt: new Date(),
          requestMessage,
          status: "PENDING",
        },
        create: {
          piUsername,
          month,
          year,
          requestMessage,
          status: "PENDING",
        },
      }),
    );

    await Promise.all(createPromises);

    return res.json({
      success: true,
      message: `Request sent to ${piUsernames.length} PIs for ${month}/${year}`,
    });
  } catch (error) {
    console.error("Error creating requests:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to send requests",
    });
  }
};

export const getSubmissionStatus = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res
        .status(400)
        .json({ success: false, error: "Month and year are required." });
    }

    const queryMonth = parseInt(month as string);
    const queryYear = parseInt(year as string);

    const piList = await getAllPIsFromBothDatabases();

    const requests = await localPrisma.hRPIDataRequest.findMany({
      where: {
        month: queryMonth,
        year: queryYear,
      },
    });

    const requestMap = new Map(requests.map((req) => [req.piUsername, req]));

    const statuses: Record<string, any> = {};

    piList.forEach((pi) => {
      const request = requestMap.get(pi.username);

      let status: string;
      let statusInfo: any = {
        fullName: pi.fullName,
      };

      if (request) {
        if (request.status === "SUBMITTED" || request.status === "DOWNLOADED") {
          status = "complete";
          if (request.isPartial) {
            statusInfo.isPartial = true;
            statusInfo.submittedCount = request.submittedCount;
            statusInfo.totalCount = request.totalCount;
          }
        } else {
          status = "requested";
        }
      } else {
        status = "none";
      }

      statuses[pi.username] = {
        status,
        ...statusInfo,
      };
    });

    return res.json({ success: true, data: statuses });
  } catch (error) {
    console.error("Error retrieving submission statuses:", error);
    return res.status(500).json({
      success: false,
      error: "Could not retrieve submission statuses.",
    });
  }
};

export const downloadReport = async (req: Request, res: Response) => {
  const { piUsernames, month, year } = req.query;

  if (!piUsernames || !month || !year) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required parameters." });
  }

  const piList = (piUsernames as string).split(",");
  const queryYear = parseInt(year as string);
  const queryMonth = parseInt(month as string);

  try {
    const startDate = new Date(queryYear, queryMonth - 1, 1);
    const endDate = new Date(queryYear, queryMonth, 0);
    const totalWorkingDays = await calculateWorkingDaysUpToToday(
      startDate,
      endDate,
    );

    const submissions = await localPrisma.hRPIDataRequest.findMany({
      where: {
        piUsername: { in: piList },
        month: queryMonth,
        year: queryYear,
        status: { in: ["SUBMITTED", "DOWNLOADED"] },
      },
    });

    if (submissions.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No data has been submitted for the selected criteria.",
      });
    }

    let allUsersData: any[] = [];
    let partialSubmissions: string[] = [];
    const allEmployeeIds: string[] = [];

    submissions.forEach((s) => {
      if (s.submittedEmployeeIds) {
        allEmployeeIds.push(...JSON.parse(s.submittedEmployeeIds));
      }
    });

    // Use the new helper function
    const staffInfoMap = await getStaffInfo(allEmployeeIds);

    for (const submission of submissions) {
      if (!submission.submittedEmployeeIds) continue;

      const employeeIds = JSON.parse(submission.submittedEmployeeIds);

      const attendances = await localPrisma.attendance.findMany({
        where: {
          employeeNumber: { in: employeeIds },
          date: { gte: startDate, lte: endDate },
        },
      });

      const modifiedAttendances = await localPrisma.modifiedAttendance.findMany(
        {
          where: {
            employeeNumber: { in: employeeIds },
            date: { gte: startDate, lte: endDate },
          },
        },
      );

      const employeeAttendanceMap = new Map<string, any[]>();
      attendances.forEach((att) => {
        if (!employeeAttendanceMap.has(att.employeeNumber)) {
          employeeAttendanceMap.set(att.employeeNumber, []);
        }
        employeeAttendanceMap.get(att.employeeNumber)!.push(att);
      });

      const employeeModifiedMap = new Map<string, any[]>();
      modifiedAttendances.forEach((mod) => {
        if (!employeeModifiedMap.has(mod.employeeNumber)) {
          employeeModifiedMap.set(mod.employeeNumber, []);
        }
        employeeModifiedMap.get(mod.employeeNumber)!.push(mod);
      });

      employeeIds.forEach((empId: string) => {
        const empAttendances = employeeAttendanceMap.get(empId) || [];
        const empModified = employeeModifiedMap.get(empId) || [];

        const fullDays = empAttendances.filter(
          (a: any) => a.attendanceType === "FULL_DAY",
        ).length;
        const halfDays =
          empAttendances.filter((a: any) => a.attendanceType === "HALF_DAY")
            .length * 0.5;
        const addedDays = empModified.filter(
          (m: any) => m.status === "ADDED",
        ).length;
        const removedDays = empModified.filter(
          (m: any) => m.status === "REMOVED",
        ).length;

        const totalDays = fullDays + halfDays + addedDays - removedDays;

        const staffInfo = staffInfoMap.get(empId);

        allUsersData.push({
          username: staffInfo?.fullName || empId,
          monthlyStatistics: {
            totalDays,
            addedDays,
            removedDays,
          },
        });
      });

      if (submission.isPartial) {
        partialSubmissions.push(
          `${submission.piUsername} (${submission.submittedCount}/${submission.totalCount} employees)`,
        );
      }
    }

    const records = allUsersData.map((user) => {
      const presentDays = user.monthlyStatistics.totalDays;
      const absentDays = Math.max(0, totalWorkingDays - presentDays);

      return {
        Project_Staff_Name: user.username,
        "Total Working Days": totalWorkingDays,
        "Present Days": presentDays.toFixed(1),
        "Absent Days": absentDays.toFixed(1),
        "Added Days": user.monthlyStatistics.addedDays || 0,
        "Removed Days": user.monthlyStatistics.removedDays || 0,
        "Final Total": presentDays.toFixed(1),
      };
    });

    let csvData = "";
    if (partialSubmissions.length > 0) {
      csvData = `# Note: The following PIs submitted partial data:\n`;
      partialSubmissions.forEach((ps) => {
        csvData += `# ${ps}\n`;
      });
      csvData += "\n";
    }

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: "Project_Staff_Name", title: "Project_Staff_Name" },
        { id: "Total Working Days", title: "Total Working Days" },
        { id: "Present Days", title: "Present Days" },
        { id: "Absent Days", title: "Absent Days" },
        { id: "Added Days", title: "Added Days" },
        { id: "Removed Days", title: "Removed Days" },
        { id: "Final Total", title: "Final Total" },
      ],
    });

    csvData +=
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(records);

    await localPrisma.hRPIDataRequest.updateMany({
      where: {
        piUsername: { in: piList },
        month: queryMonth,
        year: queryYear,
      },
      data: {
        status: "DOWNLOADED",
        downloadedAt: new Date(),
        downloadedBy: (req as any).user?.username || "HR",
      },
    });

    const fileName =
      piList.length > 1
        ? `Combined_Report_${queryMonth}_${queryYear}.csv`
        : `${piList[0]}_Report_${queryMonth}_${queryYear}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(csvData);
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate report",
    });
  }
};

export const getPIUsersWithAttendance = async (req: Request, res: Response) => {
  try {
    const { username: piUsername } = req.params;
    const { month, year } = req.query;

    if (!piUsername) {
      return res
        .status(400)
        .json({ success: false, error: "PI username is required." });
    }

    const queryMonth = month
      ? parseInt(month as string)
      : new Date().getMonth() + 1;
    const queryYear = year
      ? parseInt(year as string)
      : new Date().getFullYear();

    const submission = await localPrisma.hRPIDataRequest.findUnique({
      where: {
        piUsername_month_year: {
          piUsername,
          month: queryMonth,
          year: queryYear,
        },
      },
    });

    if (
      !submission ||
      !submission.submittedEmployeeIds ||
      submission.status === "PENDING"
    ) {
      return res.status(404).json({
        success: false,
        error: "No data has been submitted by this PI for the selected period.",
      });
    }

    const startDate = new Date(queryYear, queryMonth - 1, 1);
    const endDate = new Date(queryYear, queryMonth, 0);

    const staffIds = JSON.parse(submission.submittedEmployeeIds);

    if (staffIds.length === 0) {
      return res.json({
        success: true,
        data: { piUsername, users: [] },
      });
    }

    const [attendances, modifiedAttendances, totalWorkingDays, staffInfoMap] =
      await Promise.all([
        localPrisma.attendance.findMany({
          where: {
            employeeNumber: { in: staffIds },
            date: { gte: startDate, lte: endDate },
          },
          orderBy: { date: "asc" },
        }),
        localPrisma.modifiedAttendance.findMany({
          where: {
            employeeNumber: { in: staffIds },
            date: { gte: startDate, lte: endDate },
          },
          orderBy: { date: "asc" },
        }),
        calculateWorkingDaysUpToToday(startDate, endDate),
        getStaffInfo(staffIds),
      ]);

    const attendancesMap = new Map<string, any[]>();
    attendances.forEach((att) => {
      if (!attendancesMap.has(att.employeeNumber))
        attendancesMap.set(att.employeeNumber, []);
      attendancesMap.get(att.employeeNumber)!.push(att);
    });

    const modifiedAttendancesMap = new Map<string, any[]>();
    modifiedAttendances.forEach((mod) => {
      if (!modifiedAttendancesMap.has(mod.employeeNumber))
        modifiedAttendancesMap.set(mod.employeeNumber, []);
      modifiedAttendancesMap.get(mod.employeeNumber)!.push(mod);
    });

    const formattedUsers = staffIds
      .map((empId: string) => {
        const userAttendances = attendancesMap.get(empId) || [];
        const userModifiedAttendances = modifiedAttendancesMap.get(empId) || [];

        const fullDays = userAttendances.filter(
          (a) => a.attendanceType === "FULL_DAY",
        ).length;
        const halfDays =
          userAttendances.filter((a) => a.attendanceType === "HALF_DAY").length *
          0.5;
        const addedDays = userModifiedAttendances.filter(
          (m) => m.status === "ADDED",
        ).length;
        const removedDays = userModifiedAttendances.filter(
          (m) => m.status === "REMOVED",
        ).length;

        const presentDays = fullDays + halfDays + addedDays - removedDays;
        const absentDays = Math.max(0, totalWorkingDays - presentDays);

        const staffInfo = staffInfoMap.get(empId);

        return {
          username: staffInfo?.fullName || empId,
          employeeId: empId,
          workingDays: totalWorkingDays,
          presentDays: parseFloat(presentDays.toFixed(1)),
          absentDays: parseFloat(absentDays.toFixed(1)),
          attendances: userAttendances,
          modifiedAttendances: userModifiedAttendances,
        };
      })
      .sort((a: { username: string }, b: { username: string }) =>
        a.username.localeCompare(b.username)
      );

    res.json({
      success: true,
      data: {
        piUsername,
        month: queryMonth,
        year: queryYear,
        totalWorkingDays,
        users: formattedUsers,
      },
    });
  } catch (error: any) {
    console.error("Get PI users attendance error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const downloadPIReport = async (req: Request, res: Response) => {
  try {
    const { username: piUsername } = req.params;
    const { month, year } = req.query;

    if (!piUsername || !month || !year) {
      return res.status(400).json({
        success: false,
        error: "PI username, month, and year are required.",
      });
    }

    const queryMonth = parseInt(month as string);
    const queryYear = parseInt(year as string);

    const submission = await localPrisma.hRPIDataRequest.findUnique({
      where: {
        piUsername_month_year: {
          piUsername,
          month: queryMonth,
          year: queryYear,
        },
      },
    });

    if (
      !submission ||
      !submission.submittedEmployeeIds ||
      submission.status === "PENDING"
    ) {
      return res.status(404).json({
        success: false,
        error: "No data has been submitted by this PI for the selected period.",
      });
    }

    const startDate = new Date(queryYear, queryMonth - 1, 1);
    const endDate = new Date(queryYear, queryMonth, 0);
    const totalWorkingDays = await calculateWorkingDaysUpToToday(
      startDate,
      endDate,
    );

    const employeeIds = JSON.parse(submission.submittedEmployeeIds);
    if (employeeIds.length === 0) {
      return res.status(404).send("No employees submitted for this PI.");
    }

    const [attendances, modifiedAttendances, staffInfoMap] = await Promise.all([
      localPrisma.attendance.findMany({
        where: {
          employeeNumber: { in: employeeIds },
          date: { gte: startDate, lte: endDate },
        },
      }),
      localPrisma.modifiedAttendance.findMany({
        where: {
          employeeNumber: { in: employeeIds },
          date: { gte: startDate, lte: endDate },
        },
      }),
      getStaffInfo(employeeIds),
    ]);

    const records = employeeIds.map((empId: string) => {
      const empAttendances = attendances.filter(
        (a) => a.employeeNumber === empId,
      );
      const empModified = modifiedAttendances.filter(
        (m) => m.employeeNumber === empId,
      );

      const fullDays = empAttendances.filter(
        (a) => a.attendanceType === "FULL_DAY",
      ).length;
      const halfDays =
        empAttendances.filter((a) => a.attendanceType === "HALF_DAY").length *
        0.5;
      const addedDays = empModified.filter((m) => m.status === "ADDED").length;
      const removedDays = empModified.filter(
        (m) => m.status === "REMOVED",
      ).length;

      const presentDays = fullDays + halfDays + addedDays - removedDays;
      const absentDays = Math.max(0, totalWorkingDays - presentDays);

      const staffInfo = staffInfoMap.get(empId);

      return {
        Username: staffInfo?.fullName || empId,
        "Working Days": totalWorkingDays,
        "Present Days": presentDays.toFixed(1),
        "Absent Days": absentDays.toFixed(1),
        "Added Days": addedDays,
        "Removed Days": removedDays,
        "Final Total": presentDays.toFixed(1),
      };
    });

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: "Username", title: "Username" },
        { id: "Working Days", title: "Working Days" },
        { id: "Present Days", title: "Present Days" },
        { id: "Absent Days", title: "Absent Days" },
        { id: "Added Days", title: "Added Days" },
        { id: "Removed Days", title: "Removed Days" },
        { id: "Final Total", title: "Final Total" },
      ],
    });

    const csvData =
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(records);
    const fileName = `PI_${piUsername}_Report_${month}_${year}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(csvData);
  } catch (error: any) {
    console.error("Download PI report error:", error);
    res.status(500).send("Failed to generate report");
  }
};