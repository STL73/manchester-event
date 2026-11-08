import { and, asc, eq, inArray, notInArray } from 'drizzle-orm';

import { db } from '../db/index.js';
import { categories, categoryFollows } from '../db/schema/index.js';
import { fieldError } from './errors.js';

// Preferences' picks, as slugs A to Z. Archived categories are hidden there, so
// they're left out here too
export async function listFollows(userId) {
    const rows = await db
        .select({ slug: categories.slug })
        .from(categoryFollows)
        .innerJoin(categories, eq(categories.categoryId, categoryFollows.categoryId))
        .where(and(eq(categoryFollows.userId, userId), eq(categories.isActive, true)))
        .orderBy(asc(categories.slug));
    return rows.map((row) => row.slug);
}

// The picks replace the active categories followed. Follows of an archived
// category stay: the honeycomb doesn't show it, so leaving it out isn't a choice
export async function replaceFollows(userId, slugs) {
    const picked = slugs.length
        ? await db
            .select({ categoryId: categories.categoryId, slug: categories.slug })
            .from(categories)
            .where(and(inArray(categories.slug, slugs), eq(categories.isActive, true)))
        : [];
    if (picked.length !== slugs.length) {
        throw fieldError(400, 'categories', 'Choose categories from the list.');
    }

    const pickedIds = picked.map((category) => category.categoryId);
    const active = db.select({ categoryId: categories.categoryId }).from(categories).where(eq(categories.isActive, true));
    const dropped = and(
        eq(categoryFollows.userId, userId),
        inArray(categoryFollows.categoryId, active),
        ...(pickedIds.length ? [notInArray(categoryFollows.categoryId, pickedIds)] : []),
    );
    // One batch, one transaction: the follows never sit half replaced
    await db.batch([
        db.delete(categoryFollows).where(dropped),
        ...(pickedIds.length
            ? [db.insert(categoryFollows).values(pickedIds.map((categoryId) => ({ userId, categoryId }))).onConflictDoNothing()]
            : []),
    ]);
    return picked.map((category) => category.slug).sort();
}
