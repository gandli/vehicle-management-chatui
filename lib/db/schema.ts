import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// User table (required by auth)
export const user = pgTable('user', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof user.$inferSelect;

// Chat table
export const chat = pgTable('chat', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
  title: varchar('title', { length: 255 }).notNull(),
  visibility: varchar('visibility', { length: 20 }).notNull().default('private'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Chat = typeof chat.$inferSelect;

// Message table
export const message = pgTable('message', {
  id: varchar('id', { length: 255 }).primaryKey(),
  chatId: varchar('chat_id', { length: 255 }).notNull().references(() => chat.id),
  role: varchar('role', { length: 20 }).notNull(),
  parts: text('parts').notNull(),
  attachments: text('attachments').notNull().default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type DBMessage = typeof message.$inferSelect;

// Document table
export const document = pgTable('document', {
  id: varchar('id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
  title: varchar('title', { length: 255 }).notNull(),
  kind: varchar('kind', { length: 20 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Suggestion table
export const suggestion = pgTable('suggestion', {
  id: serial('id').primaryKey(),
  documentId: varchar('document_id', { length: 255 }).notNull(),
  documentCreatedAt: timestamp('document_created_at').notNull(),
  originalText: text('original_text').notNull(),
  suggestedText: text('suggested_text').notNull(),
  description: text('description'),
  isResolved: boolean('is_resolved').notNull().default(false),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Suggestion = typeof suggestion.$inferSelect;

// Stream table
export const stream = pgTable('stream', {
  id: varchar('id', { length: 255 }).primaryKey(),
  chatId: varchar('chat_id', { length: 255 }).notNull().references(() => chat.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Vote table
export const vote = pgTable('vote', {
  chatId: varchar('chat_id', { length: 255 }).notNull().references(() => chat.id),
  messageId: varchar('message_id', { length: 255 }).notNull(),
  isUpvoted: boolean('is_upvoted').notNull(),
});

// ===== Vehicle Management Tables =====

// 车辆表
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  vehicleId: varchar('vehicle_id', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(), // sedan, suv, van, truck
  brand: varchar('brand', { length: 50 }).notNull(),
  model: varchar('model', { length: 50 }).notNull(),
  licensePlate: varchar('license_plate', { length: 20 }).notNull().unique(),
  capacity: integer('capacity').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('available'), // available, booked, maintenance, unavailable
  location: varchar('location', { length: 100 }).notNull(),
  lastMaintenance: timestamp('last_maintenance'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 预订表
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingId: varchar('booking_id', { length: 50 }).notNull().unique(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  userName: varchar('user_name', { length: 100 }).notNull(),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  pickupTime: timestamp('pickup_time').notNull(),
  returnTime: timestamp('return_time').notNull(),
  pickupLocation: varchar('pickup_location', { length: 100 }).notNull(),
  destination: varchar('destination', { length: 100 }).notNull(),
  purpose: varchar('purpose', { length: 200 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, confirmed, completed, cancelled
  estimatedCost: integer('estimated_cost'),
  actualCost: integer('actual_cost'),
  driverAssigned: boolean('driver_assigned').default(false),
  driverName: varchar('driver_name', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 司机表
export const drivers = pgTable('drivers', {
  id: serial('id').primaryKey(),
  driverId: varchar('driver_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  licenseNumber: varchar('license_number', { length: 50 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('available'), // available, assigned, off-duty
  rating: integer('rating').default(5),
  totalTrips: integer('total_trips').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 费用表
export const costs = pgTable('costs', {
  id: serial('id').primaryKey(),
  costId: varchar('cost_id', { length: 50 }).notNull().unique(),
  bookingId: varchar('booking_id', { length: 50 }).notNull(),
  baseFee: integer('base_fee').notNull(),
  distanceFee: integer('distance_fee').notNull(),
  timeFee: integer('time_fee').notNull(),
  tollFee: integer('toll_fee').default(0),
  parkingFee: integer('parking_fee').default(0),
  otherFees: integer('other_fees').default(0),
  totalAmount: integer('total_amount').notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('CNY'),
  paid: boolean('paid').default(false),
  paymentMethod: varchar('payment_method', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
});