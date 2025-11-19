import mysql from "mysql2/promise";
import { AttendanceType } from "../../generated/presence/index.js";
import { localPrisma } from "../config/db.js";
import { hrRequests, submittedData } from "../shared/state.js";
const createStaffDbConnection = async () => {
    const connection = await mysql.createConnection({
        host: "172.16.134.51",
        user: "sumit31",
        password: "sumit123",
        database: "rndautomation",
    });
    return connection;
};
const groupStaffDataFromView = (staffEntries) => {
    const staffMap = new Map();
    staffEntries.forEach((entry) => {
        if (!staffMap.has(entry.staffEmpId)) {
            staffMap.set(entry.staffEmpId, {
                employeeNumber: entry.staffEmpId,
                username: entry.staffUsername,
                empClass: entry.empClass,
                projects: [],
            });
        }
        staffMap.get(entry.staffEmpId).projects.push({
            projectCode: entry.projectId,
            department: entry.deptName,
        });
    });
    return Array.from(staffMap.values());
};
export const getPIUsersAttendance = async (req, res) => {
    let connection;
    try {
        const { month, year } = req.query;
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, error: "Authentication required" });
        }
        const { username: piUsername } = req.user;
        const queryMonth = month
            ? parseInt(month)
            : new Date().getMonth() + 1;
        const queryYear = year
            ? parseInt(year)
            : new Date().getFullYear();
        const startDate = new Date(queryYear, queryMonth - 1, 1);
        const endDate = new Date(queryYear, queryMonth, 0);
        connection = await createStaffDbConnection();
        const [rows] = await connection.execute("SELECT * FROM staff_with_pi WHERE piUsername = ? ORDER BY staffUsername ASC", [piUsername]);
        const staffEntriesForPI = rows;
        if (staffEntriesForPI.length === 0) {
            return res.status(200).json({
                success: true,
                month: queryMonth,
                year: queryYear,
                totalUsers: 0,
                data: [],
            });
        }
        const staffIds = [...new Set(staffEntriesForPI.map((s) => s.staffEmpId))];
        const [attendances, fieldTrips, modifiedAttendances] = await Promise.all([
            localPrisma.attendance.findMany({
                where: {
                    employeeNumber: { in: staffIds },
                    date: { gte: startDate, lte: endDate },
                },
                orderBy: { date: "desc" },
            }),
            localPrisma.fieldTrip.findMany({
                where: { employeeNumber: { in: staffIds }, isActive: true },
            }),
            localPrisma.modifiedAttendance.findMany({
                where: {
                    employeeNumber: { in: staffIds },
                    date: { gte: startDate, lte: endDate },
                },
            }),
        ]);
        const attendancesMap = new Map();
        attendances.forEach((att) => {
            if (!attendancesMap.has(att.employeeNumber))
                attendancesMap.set(att.employeeNumber, []);
            attendancesMap.get(att.employeeNumber).push(att);
        });
        const fieldTripsMap = new Map();
        fieldTrips.forEach((ft) => {
            if (!fieldTripsMap.has(ft.employeeNumber))
                fieldTripsMap.set(ft.employeeNumber, []);
            fieldTripsMap.get(ft.employeeNumber).push(ft);
        });
        const modifiedAttendancesMap = new Map();
        modifiedAttendances.forEach((modAtt) => {
            if (!modifiedAttendancesMap.has(modAtt.employeeNumber))
                modifiedAttendancesMap.set(modAtt.employeeNumber, []);
            modifiedAttendancesMap.get(modAtt.employeeNumber).push(modAtt);
        });
        const groupedStaff = groupStaffDataFromView(staffEntriesForPI);
        const formattedUsers = groupedStaff.map((user) => {
            const userAttendances = attendancesMap.get(user.employeeNumber) || [];
            const userFieldTrips = fieldTripsMap.get(user.employeeNumber) || [];
            const userModifiedAttendances = modifiedAttendancesMap.get(user.employeeNumber) || [];
            const fullDays = userAttendances.filter((a) => a.attendanceType === AttendanceType.FULL_DAY).length;
            const halfDays = userAttendances.filter((a) => a.attendanceType === AttendanceType.HALF_DAY).length;
            const notCheckedOut = userAttendances.filter((a) => !a.checkoutTime).length;
            const addedDays = userModifiedAttendances.filter((a) => a.status === "ADDED").length;
            const removedDays = userModifiedAttendances.filter((a) => a.status === "REMOVED").length;
            const totalDays = fullDays +
                halfDays * 1 +
                notCheckedOut * 1 +
                addedDays -
                removedDays;
            return {
                employeeNumber: user.employeeNumber,
                username: user.username,
                empClass: user.empClass,
                projects: user.projects,
                hasActiveFieldTrip: userFieldTrips.length > 0,
                monthlyStatistics: {
                    totalDays,
                    fullDays,
                    halfDays,
                    notCheckedOut,
                    addedDays,
                    removedDays,
                },
                attendances: userAttendances.map((att) => ({
                    date: att.date,
                    checkinTime: att.checkinTime,
                    checkoutTime: att.checkoutTime,
                    sessionType: att.sessionType,
                    attendanceType: att.attendanceType,
                    isFullDay: att.attendanceType === AttendanceType.FULL_DAY,
                    isHalfDay: att.attendanceType === AttendanceType.HALF_DAY,
                    isCheckedOut: !!att.checkoutTime,
                    takenLocation: att.takenLocation,
                    location: {
                        takenLocation: att.takenLocation,
                        latitude: att.latitude,
                        longitude: att.longitude,
                        county: att.county,
                        state: att.state,
                        postcode: att.postcode,
                        address: att.locationAddress ||
                            (att.county || att.state || att.postcode
                                ? `${att.county || ""}, ${att.state || ""}, ${att.postcode || ""}`
                                    .replace(/^, |, , |, $/g, "")
                                    .trim()
                                : null),
                    },
                    photo: att.photoUrl ? { url: att.photoUrl } : null,
                    audio: att.audioUrl
                        ? { url: att.audioUrl, duration: att.audioDuration }
                        : null,
                })),
                modifiedAttendances: userModifiedAttendances,
            };
        });
        res.status(200).json({
            success: true,
            month: queryMonth,
            year: queryYear,
            totalUsers: formattedUsers.length,
            data: formattedUsers,
        });
    }
    catch (error) {
        console.error("Get PI users attendance error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
    finally {
        if (connection)
            await connection.end();
    }
};
export const getModifiedAttendance = async (req, res) => {
    try {
        const { employeeNumber } = req.params;
        if (!employeeNumber) {
            return res
                .status(400)
                .json({ success: false, error: "Missing employee number" });
        }
        const modifiedAttendances = await localPrisma.modifiedAttendance.findMany({
            where: {
                employeeNumber: employeeNumber,
            },
            orderBy: {
                date: "desc",
            },
        });
        res.status(200).json({ success: true, data: modifiedAttendances });
    }
    catch (error) {
        console.error("Get modified attendance error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
export const deleteModifiedAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res
                .status(400)
                .json({ success: false, error: "Missing modified attendance id" });
        }
        await localPrisma.modifiedAttendance.delete({
            where: {
                id: parseInt(id),
            },
        });
        res.status(200).json({ success: true, message: "Modified attendance deleted successfully" });
    }
    catch (error) {
        console.error("Delete modified attendance error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
export const getPiNotifications = async (req, res) => {
    const piUsername = req.user?.username;
    if (!piUsername) {
        return res.status(401).json({ success: false, error: "Unauthorized PI" });
    }
    const notifications = hrRequests[piUsername]
        ? Object.keys(hrRequests[piUsername]).map((key) => {
            const [month, year] = key.split("-");
            return { month, year };
        })
        : [];
    return res.json({ success: true, data: notifications });
};
export const submitDataToHR = async (req, res) => {
    let connection;
    try {
        const piUsername = req.user?.username;
        if (!piUsername) {
            return res.status(401).json({ success: false, error: "Unauthorized PI" });
        }
        const { month, year, selectedEmployees, sendAll } = req.body;
        const requestKey = `${month}-${year}`;
        if (!hrRequests[piUsername]?.[requestKey]) {
            return res.status(404).json({
                success: false,
                error: "No active data request found from HR for this period.",
            });
        }
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        connection = await createStaffDbConnection();
        const [rows] = await connection.execute("SELECT * FROM staff_with_pi WHERE piUsername = ?", [piUsername]);
        const staffEntriesForPI = rows;
        if (staffEntriesForPI.length === 0) {
            if (!submittedData[piUsername])
                submittedData[piUsername] = {};
            submittedData[piUsername][requestKey] = {
                users: [],
                submittedEmployeeIds: [],
                totalEmployeeCount: 0,
                isPartial: !sendAll,
            };
            delete hrRequests[piUsername][requestKey];
            return res.json({
                success: true,
                message: `Attendance data for ${month}/${year} submitted to HR successfully.`,
            });
        }
        let staffIdsToProcess;
        if (sendAll) {
            staffIdsToProcess = [
                ...new Set(staffEntriesForPI.map((s) => s.staffEmpId)),
            ];
        }
        else {
            if (!Array.isArray(selectedEmployees) || selectedEmployees.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: "No employees selected for submission.",
                });
            }
            staffIdsToProcess = selectedEmployees;
        }
        const [attendances, modifiedAttendances] = await Promise.all([
            localPrisma.attendance.findMany({
                where: {
                    employeeNumber: { in: staffIdsToProcess },
                    date: { gte: startDate, lte: endDate },
                },
            }),
            localPrisma.modifiedAttendance.findMany({
                where: {
                    employeeNumber: { in: staffIdsToProcess },
                    date: { gte: startDate, lte: endDate },
                },
            }),
        ]);
        const attendancesMap = new Map();
        attendances.forEach((att) => {
            if (!attendancesMap.has(att.employeeNumber))
                attendancesMap.set(att.employeeNumber, []);
            attendancesMap.get(att.employeeNumber).push(att);
        });
        const modifiedAttendancesMap = new Map();
        modifiedAttendances.forEach((modAtt) => {
            if (!modifiedAttendancesMap.has(modAtt.employeeNumber))
                modifiedAttendancesMap.set(modAtt.employeeNumber, []);
            modifiedAttendancesMap.get(modAtt.employeeNumber).push(modAtt);
        });
        const formattedUsers = staffIdsToProcess.map((staffId) => {
            const userAttendances = attendancesMap.get(staffId) || [];
            const userModifiedAttendances = modifiedAttendancesMap.get(staffId) || [];
            const userDetails = staffEntriesForPI.find((s) => s.staffEmpId === staffId);
            const fullDays = userAttendances.filter((a) => a.attendanceType === AttendanceType.FULL_DAY).length;
            const halfDays = userAttendances.filter((a) => a.attendanceType === AttendanceType.HALF_DAY).length;
            const notCheckedOut = userAttendances.filter((a) => !a.checkoutTime).length;
            const addedDays = userModifiedAttendances.filter((a) => a.status === "ADDED").length;
            const removedDays = userModifiedAttendances.filter((a) => a.status === "REMOVED").length;
            const totalDays = fullDays +
                halfDays * 1 +
                notCheckedOut * 1 +
                addedDays -
                removedDays;
            return {
                employeeId: userDetails?.staffEmpId || staffId,
                username: userDetails?.staffUsername || "Unknown",
                monthlyStatistics: {
                    totalDays,
                    addedDays,
                    removedDays,
                },
            };
        });
        if (!submittedData[piUsername])
            submittedData[piUsername] = {};
        submittedData[piUsername][requestKey] = {
            users: formattedUsers,
            submittedEmployeeIds: staffIdsToProcess,
            totalEmployeeCount: staffEntriesForPI.length,
            isPartial: !sendAll,
        };
        delete hrRequests[piUsername][requestKey];
        const message = sendAll
            ? `All employee attendance data (${formattedUsers.length} employees) for ${month}/${year} submitted to HR successfully.`
            : `${formattedUsers.length} selected employee(s) attendance data for ${month}/${year} submitted to HR successfully.`;
        console.log(`Data submitted by PI: ${piUsername} for ${requestKey} - ${sendAll ? "All" : "Selected"} (${formattedUsers.length} employees)`);
        return res.json({
            success: true,
            message,
            submittedCount: formattedUsers.length,
            totalCount: staffEntriesForPI.length,
        });
    }
    catch (error) {
        console.error("Submit data to HR error:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
    finally {
        if (connection)
            await connection.end();
    }
};
export const modifyPIUsersAttendance = async (req, res) => {
    let connection;
    try {
        if (!req.user) {
            return res
                .status(401)
                .json({ success: false, error: "Authentication required" });
        }
        const { employeeNumber, date, status, comment } = req.body;
        const { username: piUsername } = req.user;
        if (!employeeNumber || !date || !status || !comment) {
            return res
                .status(400)
                .json({ success: false, error: "Missing required fields" });
        }
        // Fetch the PI's employee number from the database
        connection = await createStaffDbConnection();
        const [piRows] = await connection.execute("SELECT DISTINCT piEmpId FROM staff_with_pi WHERE piUsername = ? LIMIT 1", [piUsername]);
        const piData = piRows;
        if (piData.length === 0) {
            return res.status(404).json({
                success: false,
                error: "PI employee number not found"
            });
        }
        const piEmployeeNumber = piData[0].piEmpId;
        const modifiedAttendance = await localPrisma.modifiedAttendance.create({
            data: {
                employeeNumber,
                date: new Date(date),
                status,
                comment,
                piEmployeeNumber, // Now we have the correct PI employee number
            },
        });
        res.status(201).json({ success: true, data: modifiedAttendance });
    }
    catch (error) {
        console.error("Modify PI users attendance error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
    finally {
        if (connection)
            await connection.end();
    }
};
//# sourceMappingURL=pi.controller.js.map