import { AppError } from '../lib/errors.js';

// validate({ body, query, params }) checks each part against its Zod schema onto
// req.valid. Routes read only that, so fields a schema doesn't list never reach the database
export function validate(schemas) {
    return (req, res, next) => {
        const valid = {};
        // Every problem in every part, so a form can show them all at once
        const details = [];

        for (const [part, schema] of Object.entries(schemas)) {
            const result = schema.safeParse(req[part] ?? {});
            if (result.success) {
                valid[part] = result.data;
                continue;
            }
            for (const issue of result.error.issues) {
                details.push({ path: [part, ...issue.path].map(String).join('.'), message: issue.message });
            }
        }

        if (details.length > 0) throw new AppError(400, 'Invalid input', details);
        req.valid = valid;
        next();
    };
}
