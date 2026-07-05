import { z } from "zod";

/** Used when an admin adds a movie by Drive file id. */
export const movieIngestSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(220)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  description: z.string().max(5000).optional().nullable(),
  year: z.number().int().min(1888).max(2099).optional().nullable(),
  durationSeconds: z.number().int().positive().optional().nullable(),
  genre: z.array(z.string().min(1).max(40)).default([]),
  posterDriveFileId: z.string().min(5).optional().nullable(),
  backdropDriveFileId: z.string().min(5).optional().nullable(),
  trailerDriveFileId: z.string().min(5).optional().nullable(),
  driveFileId: z.string().min(5),
  rating: z.number().min(0).max(10).optional().nullable(),
  featured: z.boolean().default(false),
  isPublic: z.boolean().default(true),
});

export type MovieIngestInput = z.infer<typeof movieIngestSchema>;

/** Approving, suspending, promoting a user — takes effect immediately. */
export const userAdminActionSchema = z.object({
  action: z.enum(["approve", "suspend", "promote_admin", "demote_user"]),
  targetUserId: z.string().uuid(),
});
