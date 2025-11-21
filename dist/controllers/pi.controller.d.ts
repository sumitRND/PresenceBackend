import type { Request, Response } from "express";
export declare const getPIUsersAttendance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getModifiedAttendance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteModifiedAttendance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get PI notifications from database
 * This REPLACES checking the in-memory hrRequests object
 */
export declare const getPiNotifications: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * Submit attendance data to HR (database approach)
 * This REPLACES storing in the in-memory submittedData object
 */
export declare const submitDataToHR: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const modifyPIUsersAttendance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=pi.controller.d.ts.map