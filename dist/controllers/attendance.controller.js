import { AttendanceSession, AttendanceType, LocationType, } from "../../generated/presence/index.js";
import path from "path";
import axios from "axios";
import { localPrisma, staffDb1Prisma, staffDb2Prisma } from "../config/db.js";
const staffViewPrisma = {
    staffWithPi: {
        async findFirst(args) {
            const [user1, user2] = await Promise.all([
                staffDb1Prisma.staffWithPi.findFirst(args),
                staffDb2Prisma.staffWithPi.findFirst(args),
            ]);
            return user1 || user2;
        },
        async findMany(args) {
            const [users1, users2] = await Promise.all([
                staffDb1Prisma.staffWithPi.findMany(args),
                staffDb2Prisma.staffWithPi.findMany(args),
            ]);
            return [...users1, ...users2];
        },
    },
};
async function getLocationDetails(lat, lng) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "MyAPP/1.0",
            },
        });
        const data = response.data;
        return {
            locationAddress: data.display_name || null,
            county: data.address?.county ||
                data.address?.city ||
                data.address?.village ||
                null,
            state: data.address?.state || null,
            postcode: data.address?.postcode || null,
        };
    }
    catch (error) {
        console.error("Error fetching location details:", error);
        return { locationAddress: null, county: null, state: null, postcode: null };
    }
}
function getSessionType(time) {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    if (timeInMinutes >= 570 && timeInMinutes < 780) {
        return AttendanceSession.FN;
    }
    else if (timeInMinutes >= 780 && timeInMinutes <= 1050) {
        return AttendanceSession.AF;
    }
    if (timeInMinutes < 570) {
        return AttendanceSession.FN;
    }
    return AttendanceSession.AF;
}
function determineAttendanceType(checkinTime, checkoutTime, sessionType) {
    if (!checkoutTime) {
        return null;
    }
    const hoursWorked = (checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60 * 60);
    if (sessionType === AttendanceSession.FN && hoursWorked >= 6) {
        return AttendanceType.FULL_DAY;
    }
    return AttendanceType.HALF_DAY;
}
function getTodayDate() {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
}
export const createAttendance = async (req, res) => {
    try {
        console.log("Received request body:", req.body);
        console.log("Received files:", req.files);
        const { username, location, audioDuration, latitude, longitude, locationType = LocationType.CAMPUS, } = req.body;
        if (!username || username === "undefined") {
            return res.status(400).json({ error: "Username is required" });
        }
        const userFromView = await staffViewPrisma.staffWithPi.findFirst({
            where: { staffUsername: username },
        });
        if (!userFromView) {
            return res.status(404).json({ error: "User not found" });
        }
        const employeeNumber = userFromView.staffEmpId;
        const fieldTrips = await localPrisma.fieldTrip.findMany({
            where: {
                employeeNumber: employeeNumber,
                isActive: true,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() },
            },
        });
        const isOnFieldTrip = fieldTrips.length > 0;
        const finalLocationType = isOnFieldTrip
            ? LocationType.FIELDTRIP
            : locationType;
        const currentTime = new Date();
        const sessionType = getSessionType(currentTime);
        const todayDate = getTodayDate();
        const existingAttendance = await localPrisma.attendance.findUnique({
            where: {
                employeeNumber_date: {
                    employeeNumber: employeeNumber,
                    date: todayDate,
                },
            },
        });
        if (existingAttendance && existingAttendance.checkoutTime) {
            return res.status(409).json({
                error: "You have already completed your attendance for today.",
                existingAttendance,
            });
        }
        const files = req.files || [];
        const audioFile = files.find((f) => f.mimetype.startsWith("audio/"));
        const photoFile = files.find((f) => f.mimetype.startsWith("image/"));
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const photoUrl = photoFile
            ? `${baseUrl}/${path.relative(process.cwd(), photoFile.path).replace(/\\/g, "/")}`
            : null;
        const audioUrl = audioFile
            ? `${baseUrl}/${path.relative(process.cwd(), audioFile.path).replace(/\\/g, "/")}`
            : null;
        const parsedAudioDuration = audioDuration ? parseInt(audioDuration) : null;
        const lat = latitude ? parseFloat(latitude) : null;
        const lng = longitude ? parseFloat(longitude) : null;
        let locationDetails = {
            locationAddress: null,
            county: null,
            state: null,
            postcode: null,
        };
        if (lat && lng) {
            locationDetails = await getLocationDetails(lat, lng);
        }
        let takenLocation = location || null;
        if (isOnFieldTrip) {
            takenLocation = "Outside IIT (Field Trip)";
        }
        if (existingAttendance && !existingAttendance.checkoutTime) {
            const updatedAttendance = await localPrisma.attendance.update({
                where: {
                    employeeNumber_date: {
                        employeeNumber: employeeNumber,
                        date: todayDate,
                    },
                },
                data: {
                    checkinTime: currentTime,
                    sessionType,
                    locationType: finalLocationType,
                    takenLocation,
                    photoUrl,
                    audioUrl,
                    audioDuration: parsedAudioDuration,
                    latitude: lat,
                    longitude: lng,
                    locationAddress: locationDetails.locationAddress,
                    county: locationDetails.county,
                    state: locationDetails.state,
                    postcode: locationDetails.postcode,
                },
            });
            return res.status(200).json({
                success: true,
                data: updatedAttendance,
                message: `Re-checkin updated for ${sessionType} session.`,
            });
        }
        const newAttendance = await localPrisma.attendance.create({
            data: {
                employeeNumber: employeeNumber,
                date: todayDate,
                checkinTime: currentTime,
                sessionType,
                locationType: finalLocationType,
                takenLocation,
                photoUrl,
                audioUrl,
                audioDuration: parsedAudioDuration,
                latitude: lat,
                longitude: lng,
                locationAddress: locationDetails.locationAddress,
                county: locationDetails.county,
                state: locationDetails.state,
                postcode: locationDetails.postcode,
            },
        });
        res.status(201).json({
            success: true,
            data: newAttendance,
            message: `Check-in successful for ${sessionType} session. Remember to checkout.`,
        });
    }
    catch (error) {
        console.error("Create attendance error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
export const checkoutAttendance = async (req, res) => {
    try {
        const { employeeNumber } = req.body;
        const tokenEmployeeNumber = req.user?.employeeNumber;
        const finalEmployeeNumber = employeeNumber || tokenEmployeeNumber;
        if (!finalEmployeeNumber) {
            return res.status(400).json({ error: "Employee number is required" });
        }
        const todayDate = getTodayDate();
        const attendance = await localPrisma.attendance.findUnique({
            where: {
                employeeNumber_date: {
                    employeeNumber: finalEmployeeNumber,
                    date: todayDate,
                },
            },
        });
        if (!attendance) {
            return res.status(404).json({
                error: "No check-in found for today. Please check-in first.",
            });
        }
        if (attendance.checkoutTime) {
            return res.status(409).json({
                error: "You have already checked out for today.",
                checkOutTime: attendance.checkoutTime,
            });
        }
        const checkOutTime = new Date();
        const checkInTime = attendance.checkinTime || new Date();
        const sessionType = attendance.sessionType || AttendanceSession.FN;
        const attendanceType = determineAttendanceType(checkInTime, checkOutTime, sessionType);
        const updatedAttendance = await localPrisma.attendance.update({
            where: {
                employeeNumber_date: {
                    employeeNumber: finalEmployeeNumber,
                    date: todayDate,
                },
            },
            data: {
                checkoutTime: checkOutTime,
                attendanceType: attendanceType || AttendanceType.HALF_DAY,
            },
        });
        const finalType = attendanceType || AttendanceType.HALF_DAY;
        res.status(200).json({
            success: true,
            data: updatedAttendance,
            message: `Checkout successful. Attendance marked as ${finalType}.`,
        });
    }
    catch (error) {
        console.error("Checkout error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
export const getTodayAttendance = async (req, res) => {
    try {
        const { employeeNumber } = req.params;
        if (!employeeNumber) {
            return res.status(400).json({ error: "Employee number is required" });
        }
        const todayDate = getTodayDate();
        const attendance = await localPrisma.attendance.findUnique({
            where: {
                employeeNumber_date: {
                    employeeNumber,
                    date: todayDate,
                },
            },
        });
        if (!attendance) {
            return res.status(404).json({
                success: false,
                error: "No attendance found for today",
            });
        }
        const now = new Date();
        const currentHour = now.getHours();
        let processedAttendance = { ...attendance };
        // Logic Fix: Apply similar logic for the single day fetch
        if ((currentHour >= 23 && !attendance.checkoutTime && attendance.checkinTime) ||
            (attendance.attendanceType === AttendanceType.FULL_DAY && !attendance.checkoutTime)) {
            processedAttendance = {
                ...attendance,
                attendanceType: AttendanceType.FULL_DAY,
                autoCompleted: true,
            };
        }
        res.status(200).json({
            success: true,
            data: processedAttendance,
        });
    }
    catch (error) {
        console.error("Get today attendance error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
export const getUserAttendanceCalendar = async (req, res) => {
    try {
        const { employeeNumber } = req.params;
        const { year, month } = req.query;
        if (!employeeNumber) {
            return res.status(400).json({ error: "Employee Number is required" });
        }
        const queryYear = year
            ? parseInt(year)
            : new Date().getFullYear();
        const queryMonth = month ? parseInt(month) : null;
        let whereCondition = {
            employeeNumber: employeeNumber,
        };
        if (queryMonth) {
            const startDate = new Date(queryYear, queryMonth - 1, 1);
            const endDate = new Date(queryYear, queryMonth, 0);
            whereCondition.date = {
                gte: startDate,
                lte: endDate,
            };
        }
        else {
            const startDate = new Date(queryYear, 0, 1);
            const endDate = new Date(queryYear, 11, 31);
            whereCondition.date = {
                gte: startDate,
                lte: endDate,
            };
        }
        const attendances = await localPrisma.attendance.findMany({
            where: whereCondition,
            orderBy: {
                date: "asc",
            },
        });
        const now = new Date();
        const currentHour = now.getHours();
        const today = now.toISOString().split("T")[0];
        const processedAttendances = attendances.map((attendance) => {
            const attendanceDate = attendance.date.toISOString().split("T")[0];
            // Logic Fix: Check if it is EITHER the active 11PM window OR if the DB already says FULL_DAY with no checkout
            const isAutoCompletedLogic = 
            // Case 1: Live logic for today after 11 PM
            (attendanceDate === today &&
                currentHour >= 23 &&
                !attendance.checkoutTime &&
                attendance.checkinTime) ||
                // Case 2: Past records where cron job ran (Type is FULL_DAY but checkout is NULL)
                (attendance.attendanceType === AttendanceType.FULL_DAY &&
                    !attendance.checkoutTime);
            if (isAutoCompletedLogic) {
                return {
                    ...attendance,
                    attendanceType: AttendanceType.FULL_DAY, // Ensure this is set
                    autoCompleted: true, // Send this flag to UI
                };
            }
            return attendance;
        });
        const totalFullDays = processedAttendances.filter((a) => a.attendanceType === AttendanceType.FULL_DAY ||
            a.autoCompleted === true).length;
        const totalHalfDays = processedAttendances.filter((a) => a.attendanceType === AttendanceType.HALF_DAY && !a.autoCompleted).length;
        const notCheckedOut = processedAttendances.filter((a) => !a.checkoutTime && !a.autoCompleted && a.checkinTime).length;
        const totalDays = totalFullDays + totalHalfDays + notCheckedOut;
        res.status(200).json({
            success: true,
            data: {
                attendances: processedAttendances,
                statistics: {
                    totalDays,
                    totalFullDays,
                    totalHalfDays,
                    notCheckedOut,
                    year: queryYear,
                    month: queryMonth,
                },
            },
        });
    }
    catch (error) {
        console.error("Get user attendance calendar error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
//# sourceMappingURL=attendance.controller.js.map