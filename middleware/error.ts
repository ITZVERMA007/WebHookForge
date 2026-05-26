import { Request, Response, NextFunction } from "express";

// Custom error interface for errors
interface HttpError extends Error {
  statusCode?: number;
  status?: number;
}


// Error handler for 404 error
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.status(404).json({
    error: "Not Found",
    message: `The route ${req.method} ${req.originalUrl} does not exist`,
    hint: "Check the URL and HTTP method. Available endpoints: GET /webhooks, POST /w/:relayId",
  });
}


// Global error handler 
export function errorHandler(err:HttpError,req:Request,res:Response,next:NextFunction): void{

  console.error(`ERROR--> ${req.method} ${req.originalUrl}:`,err.message);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    error:err.name || "Internal Server Error",
    message: err.message || "Something went wrong",
    
    // stack trace for development mode 
    ...(process.env.NODE_ENV === "development" ? {stack: err.stack}:{})
  });
}