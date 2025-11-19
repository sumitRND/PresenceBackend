export interface RequestInfo {
    requestedAt: number;
    message?: string;
}
export interface SubmittedDataEntry {
    users: {
        username: string | undefined;
        employeeId: string;
        monthlyStatistics: {
            totalDays: number;
        };
    }[];
    isPartial?: boolean;
    submittedEmployeeIds: string[];
    totalEmployeeCount: number;
}
export declare const hrRequests: Record<string, Record<string, RequestInfo>>;
export declare const submittedData: Record<string, Record<string, SubmittedDataEntry>>;
//# sourceMappingURL=state.d.ts.map