import { init, i } from "@instantdb/react";

// InstantDB App ID for THE WHITE LIST
const APP_ID = "47d313d7-8b03-4057-8fac-fca73ef5e47c";

// Define the schema for our application
const schema = i.schema({
  entities: {
    // User profiles (extends InstantDB auth)
    userProfiles: i.entity({
      odukiogaUserId: i.string(),       // InstantDB auth user ID
      email: i.string(),
      firstName: i.string(),
      lastName: i.string(),
      hotelName: i.string(),
      passwordHash: i.string(),         // Hashed password for 2FA
      subscriptionStatus: i.string(),   // 'unpaid' | 'active' | 'canceled'
      stripeCustomerId: i.string().optional(),      // Stripe Customer ID
      stripeSessionId: i.string().optional(),       // Stripe Checkout Session ID
      createdAt: i.number(),
    }),
    // Saved itineraries/programs
    itineraries: i.entity({
      odukiogaUserId: i.string(),       // Owner user ID
      programId: i.string(),     // ID from the backend program
      title: i.string(),         // Program title
      city: i.string(),          // Destination city
      clientName: i.string().optional(), // Client name if provided
      startDate: i.string(),     // Start date
      endDate: i.string(),       // End date
      intensity: i.string(),     // DETENDU, MODERE, INTENSE
      totalDays: i.number(),     // Number of days
      status: i.string(),        // draft, validated
      programData: i.string(),   // Full program JSON (for reopening)
      createdAt: i.number(),     // When saved
      updatedAt: i.number(),     // Last update
      pdfExportedAt: i.number().optional(), // When PDF was exported
    }),
    // Notes attached to programs/stays
    programNotes: i.entity({
      programId: i.string(),       // ID of the program this note belongs to
      content: i.string(),         // Note content
      title: i.string().optional(), // Optional title
      createdAt: i.number(),       // Timestamp
      updatedAt: i.number(),       // Last update timestamp
      userId: i.string(),          // User who created the note
      userEmail: i.string(),       // User email for display
    }),
    // File attachments for notes
    noteAttachments: i.entity({
      noteId: i.string(),          // ID of the note this attachment belongs to
      programId: i.string(),       // ID of the program
      fileName: i.string(),        // Original file name
      fileUrl: i.string(),         // URL to access the file
      filePath: i.string(),        // Storage path
      fileType: i.string(),        // MIME type
      fileSize: i.number(),        // Size in bytes
      createdAt: i.number(),       // Upload timestamp
      userId: i.string(),          // User who uploaded
    }),
  },
});

// Initialize InstantDB
export const db = init({ appId: APP_ID, schema });

// Simple hash function for passwords (for client-side verification)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + APP_ID); // Salt with app ID
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Export types for TypeScript
export type Schema = typeof schema;

export type UserProfile = {
  id: string;
  odukiogaUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  hotelName: string;
  passwordHash: string;
  subscriptionStatus: 'unpaid' | 'active' | 'canceled';
  stripeCustomerId?: string;
  stripeSessionId?: string;
  createdAt: number;
};

export type Itinerary = {
  id: string;
  odukiogaUserId: string;
  programId: string;
  title: string;
  city: string;
  clientName?: string;
  startDate: string;
  endDate: string;
  intensity: string;
  totalDays: number;
  status: string;
  programData: string;
  createdAt: number;
  updatedAt: number;
  pdfExportedAt?: number;
};

export type ProgramNote = {
  id: string;
  programId: string;
  content: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  userId: string;
  userEmail: string;
};

export type NoteAttachment = {
  id: string;
  noteId: string;
  programId: string;
  fileName: string;
  fileUrl: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: number;
  userId: string;
};
