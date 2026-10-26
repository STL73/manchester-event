import { AppError } from '../lib/errors.js';

// validate({ body: schema, query: schema, params: schema }) checks each part of
// the request against its Zod schema. The cleaned values go on req.valid, since
// Express 5 doesn't let req.query be replaced. Routes read req.valid only, so
// fields a schema doesn't list (an organiser's `status`, say) never reach the database
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
