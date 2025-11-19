import { PrismaClient as StaffDb1PrismaClient } from "../../generated/staff_db1/index.js";
import { PrismaClient as StaffDb2PrismaClient } from "../../generated/staff_db2/index.js";
type PIInfo = {
    piUsername: string;
    piFullName: string;
    piEmpId: string;
};
declare function findStaffByUsernameOrId(identifier: string): Promise<({
    empClass: string;
    staffEmpId: string;
    staffUsername: string;
    projectId: string;
    deptName: string;
    piEmpId: string;
    piUsername: string;
    piFullName: string;
} & {
    sourceDatabase: string;
})[]>;
declare function getAllPIs(): Promise<(PIInfo & {
    databases: string[];
})[]>;
declare function getStaffUnderPI(piUsername: string): Promise<({
    empClass: string;
    staffEmpId: string;
    staffUsername: string;
    projectId: string;
    deptName: string;
    piEmpId: string;
    piUsername: string;
    piFullName: string;
} & {
    sourceDatabase: string;
})[]>;
declare function findStaffByEmployeeIds(employeeIds: string[]): Promise<({
    empClass: string;
    staffEmpId: string;
    staffUsername: string;
    projectId: string;
    deptName: string;
    piEmpId: string;
    piUsername: string;
    piFullName: string;
} & {
    sourceDatabase: string;
})[]>;
export declare const staffDbService: {
    findStaffByUsernameOrId: typeof findStaffByUsernameOrId;
    getAllPIs: typeof getAllPIs;
    getStaffUnderPI: typeof getStaffUnderPI;
    findStaffByEmployeeIds: typeof findStaffByEmployeeIds;
    staffDb1Prisma: StaffDb1PrismaClient<import("../../generated/staff_db1/index.js").Prisma.PrismaClientOptions, never, import("../../generated/staff_db1/runtime/library.js").DefaultArgs>;
    staffDb2Prisma: StaffDb2PrismaClient<import("../../generated/staff_db2/index.js").Prisma.PrismaClientOptions, never, import("../../generated/staff_db2/runtime/library.js").DefaultArgs>;
};
export {};
//# sourceMappingURL=staffDbService.d.ts.map