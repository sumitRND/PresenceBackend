import type { Request, Response } from "express";
export declare const saveFieldTrips: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getFieldTrips: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserFieldTrips: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserFieldTripsByUsername: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserFieldTripsByEmployeeNumber: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const checkAndDeactivateExpiredFieldTrips: (req: Request, res: Response) => Promise<void>;
export declare const processFieldTripAttendance: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteFieldTrip: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllActiveFieldTrips: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateFieldTrip: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userLocation.controller.d.ts.map