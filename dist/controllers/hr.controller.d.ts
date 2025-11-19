import type { Request, Response } from "express";
export declare const hrLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllPIs: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const requestDataFromPIs: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getSubmissionStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const downloadReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPIUsersWithAttendance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const downloadPIReport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=hr.controller.d.ts.map