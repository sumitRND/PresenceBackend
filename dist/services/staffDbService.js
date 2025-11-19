import { PrismaClient as StaffDb1PrismaClient } from "../../generated/staff_db1/index.js";
import { PrismaClient as StaffDb2PrismaClient } from "../../generated/staff_db2/index.js";
const staffDb1Prisma = new StaffDb1PrismaClient();
const staffDb2Prisma = new StaffDb2PrismaClient();
async function findStaffByUsernameOrId(identifier) {
    const [db1Staff, db2Staff] = await Promise.all([
        staffDb1Prisma.staffWithPi.findMany({
            where: {
                OR: [{ staffUsername: identifier }, { staffEmpId: identifier }],
            },
        }),
        staffDb2Prisma.staffWithPi.findMany({
            where: {
                OR: [{ staffUsername: identifier }, { staffEmpId: identifier }],
            },
        }),
    ]);
    const combinedStaff = [];
    const staffIds = new Set();
    for (const staff of db1Staff) {
        if (!staffIds.has(staff.staffEmpId)) {
            combinedStaff.push({ ...staff, sourceDatabase: "db1" });
            staffIds.add(staff.staffEmpId);
        }
    }
    for (const staff of db2Staff) {
        if (!staffIds.has(staff.staffEmpId)) {
            combinedStaff.push({ ...staff, sourceDatabase: "db2" });
            staffIds.add(staff.staffEmpId);
        }
    }
    return combinedStaff;
}
async function getAllPIs() {
    const [db1PIs, db2PIs] = await Promise.all([
        staffDb1Prisma.staffWithPi.findMany({
            distinct: ["piUsername"],
            select: {
                piUsername: true,
                piFullName: true,
                piEmpId: true,
            },
        }),
        staffDb2Prisma.staffWithPi.findMany({
            distinct: ["piUsername"],
            select: {
                piUsername: true,
                piFullName: true,
                piEmpId: true,
            },
        }),
    ]);
    const piMap = new Map();
    db1PIs.forEach((pi) => {
        if (pi.piUsername && pi.piFullName && pi.piEmpId) {
            if (!piMap.has(pi.piUsername)) {
                piMap.set(pi.piUsername, {
                    piUsername: pi.piUsername,
                    piFullName: pi.piFullName,
                    piEmpId: pi.piEmpId,
                    databases: ["db1"],
                });
            }
        }
    });
    db2PIs.forEach((pi) => {
        if (pi.piUsername && pi.piFullName && pi.piEmpId) {
            if (piMap.has(pi.piUsername)) {
                piMap.get(pi.piUsername).databases.push("db2");
            }
            else {
                piMap.set(pi.piUsername, {
                    piUsername: pi.piUsername,
                    piFullName: pi.piFullName,
                    piEmpId: pi.piEmpId,
                    databases: ["db2"],
                });
            }
        }
    });
    return Array.from(piMap.values());
}
async function getStaffUnderPI(piUsername) {
    const [db1Staff, db2Staff] = await Promise.all([
        staffDb1Prisma.staffWithPi.findMany({
            where: { piUsername },
        }),
        staffDb2Prisma.staffWithPi.findMany({
            where: { piUsername },
        }),
    ]);
    const combinedStaff = [
        ...db1Staff.map((s) => ({ ...s, sourceDatabase: "db1" })),
        ...db2Staff.map((s) => ({ ...s, sourceDatabase: "db2" })),
    ];
    return combinedStaff;
}
async function findStaffByEmployeeIds(employeeIds) {
    if (employeeIds.length === 0) {
        return [];
    }
    const [db1Staff, db2Staff] = await Promise.all([
        staffDb1Prisma.staffWithPi.findMany({
            where: { staffEmpId: { in: employeeIds } },
        }),
        staffDb2Prisma.staffWithPi.findMany({
            where: { staffEmpId: { in: employeeIds } },
        }),
    ]);
    const combinedStaff = [];
    const staffIds = new Set();
    for (const staff of db1Staff) {
        if (!staffIds.has(staff.staffEmpId)) {
            combinedStaff.push({ ...staff, sourceDatabase: "db1" });
            staffIds.add(staff.staffEmpId);
        }
    }
    for (const staff of db2Staff) {
        if (!staffIds.has(staff.staffEmpId)) {
            combinedStaff.push({ ...staff, sourceDatabase: "db2" });
            staffIds.add(staff.staffEmpId);
        }
    }
    return combinedStaff;
}
export const staffDbService = {
    findStaffByUsernameOrId,
    getAllPIs,
    getStaffUnderPI,
    findStaffByEmployeeIds,
    staffDb1Prisma,
    staffDb2Prisma,
};
//# sourceMappingURL=staffDbService.js.map