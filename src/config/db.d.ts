import { PrismaClient as LocalPrismaClient } from "../../generated/presence/index.js";
import { PrismaClient as StaffDb1PrismaClient } from "../../generated/staff_db1/index.js";
import { PrismaClient as StaffDb2PrismaClient } from "../../generated/staff_db2/index.js";
export declare const localPrisma: LocalPrismaClient<import("../../generated/presence/index.js").Prisma.PrismaClientOptions, never, import("../../generated/presence/runtime/library.js").DefaultArgs>;
export declare const staffDb1Prisma: StaffDb1PrismaClient<import("../../generated/staff_db1/index.js").Prisma.PrismaClientOptions, never, import("../../generated/staff_db1/runtime/library.js").DefaultArgs>;
export declare const staffDb2Prisma: StaffDb2PrismaClient<import("../../generated/staff_db2/index.js").Prisma.PrismaClientOptions, never, import("../../generated/staff_db2/runtime/library.js").DefaultArgs>;
declare const prisma: LocalPrismaClient<import("../../generated/presence/index.js").Prisma.PrismaClientOptions, never, import("../../generated/presence/runtime/library.js").DefaultArgs>;
export default prisma;
export declare const connectDB: () => Promise<{
    success: boolean;
    message: string;
    connections: {
        local: boolean;
        staff_db1: boolean;
        staff_db2: boolean;
    };
    errors?: never;
} | {
    success: boolean;
    message: string;
    connections: {
        local: boolean;
        staff_db1: boolean;
        staff_db2: boolean;
    };
    errors: {
        database: string;
        error: string;
    }[];
}>;
export declare const seedBasicCalendar: () => Promise<{
    success: boolean;
    message: string;
    count: number;
    error?: never;
} | {
    success: boolean;
    message: string;
    error: unknown;
    count?: never;
}>;
export declare const addHoliday: (date: Date, description: string) => Promise<{
    success: boolean;
    message: string;
    error?: never;
} | {
    success: boolean;
    message: string;
    error: unknown;
}>;
export declare const initializeDatabase: () => Promise<{
    success: boolean;
    message: string;
    error?: never;
} | {
    success: boolean;
    message: string;
    error: unknown;
}>;
export declare const disconnectDB: () => Promise<{
    success: boolean;
    message: string;
    disconnections: {
        local: boolean;
        staff_db1: boolean;
        staff_db2: boolean;
    };
    errors?: never;
} | {
    success: boolean;
    message: string;
    disconnections: {
        local: boolean;
        staff_db1: boolean;
        staff_db2: boolean;
    };
    errors: {
        database: string;
        error: string;
    }[];
}>;
//# sourceMappingURL=db.d.ts.map