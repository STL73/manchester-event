// An error the client is meant to see: the error handler sends its status and
// message as they are. Anything else that's thrown becomes a plain 500
export class AppError extends Error {
    constructor(status, message, details) {
        super(message);
        this.name = 'AppError';
        this.status = status;
        this.details = details;
    }
}

// A row pointing at one that no longer exists. Drizzle keeps Postgres's own error on `cause`
export const isForeignKeyViolation = (error) => (error.code ?? error.cause?.code) === '23503';
