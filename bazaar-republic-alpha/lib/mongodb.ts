// 🛡️ MESH-OVERRIDE: MongoDB driver neutralized for Drizzle migration.
// All execution blocks and environment variable checks are severed.

export const MongoClient = class {
    constructor(uri: any, options: any) {}
    async connect() { return this; }
    db(name: string) { return { collection: (name: string) => ({}) }; }
    close() {}
};

export const clientPromise = Promise.resolve(new (MongoClient as any)());