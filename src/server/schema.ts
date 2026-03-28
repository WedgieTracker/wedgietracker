import { sql, relations } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2";

// ─── Domain Tables ───────────────────────────────────────────────────────────

export const wedgie = sqliteTable(
  "wedgie",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    videoUrl: text("video_url", { mode: "json" })
      .$type<Record<string, string | undefined>>()
      .default({}),
    position: text("position", { mode: "json" })
      .$type<{ x: number; y: number }>()
      .notNull()
      .default({ x: 0, y: 0 }),
    wedgieDate: text("wedgie_date")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
    number: integer("number").default(1).notNull(),
    teamName: text("team_name").notNull(),
    teamAgainstName: text("team_against_name").notNull(),
    playerName: text("player_name").notNull(),
    seasonName: text("season_name").notNull(),
    gameName: text("game_name"),
  },
  (table) => [
    index("wedgie_team_name_idx").on(table.teamName),
    index("wedgie_team_against_name_idx").on(table.teamAgainstName),
    index("wedgie_player_name_idx").on(table.playerName),
    index("wedgie_season_name_idx").on(table.seasonName),
    index("wedgie_game_name_idx").on(table.gameName),
  ],
);

export const player = sqliteTable(
  "player",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").unique().notNull(),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  (table) => [index("player_name_idx").on(table.name)],
);

export const season = sqliteTable(
  "season",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").unique().notNull(),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
    totalGames: integer("total_games").default(0).notNull(),
  },
  (table) => [index("season_name_idx").on(table.name)],
);

export const game = sqliteTable(
  "game",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").unique().notNull(),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
    seasonName: text("season_name"),
    live: integer("live", { mode: "boolean" }).default(false).notNull(),
  },
  (table) => [
    index("game_season_name_idx").on(table.seasonName),
    index("game_name_idx").on(table.name),
  ],
);

export const team = sqliteTable(
  "team",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").unique().notNull(),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  (table) => [index("team_name_idx").on(table.name)],
);

export const type = sqliteTable(
  "type",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").unique().notNull(),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  (table) => [index("type_name_idx").on(table.name)],
);

export const global = sqliteTable("global", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  currentSeasonId: integer("current_season_id").default(1).notNull(),
  currentTotalWedgies: integer("current_total_wedgies").default(0).notNull(),
  currentTotalGames: integer("current_total_games").default(0).notNull(),
  currentTotalMinutes: integer("current_total_minutes").default(0).notNull(),
  currentTotalFGA: integer("current_total_fga").default(0).notNull(),
  currentTotalPoss: integer("current_total_poss").default(0).notNull(),
  pace: integer("pace").default(0).notNull(),
  simplePace: integer("simple_pace").notNull(),
  mathPace: integer("math_pace").notNull(),
  liveGames: integer("live_games", { mode: "boolean" })
    .default(false)
    .notNull(),
});

// ─── Many-to-Many Join Table ─────────────────────────────────────────────────

export const wedgieToType = sqliteTable(
  "wedgie_to_type",
  {
    wedgieId: integer("wedgie_id")
      .notNull()
      .references(() => wedgie.id, { onDelete: "cascade" }),
    typeId: integer("type_id")
      .notNull()
      .references(() => type.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.wedgieId, table.typeId] })],
);

// ─── Auth Tables (NextAuth) ──────────────────────────────────────────────────

export const user = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
});

export const account = sqliteTable(
  "account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
    refresh_token_expires_in: integer("refresh_token_expires_in"),
  },
  (table) => [
    uniqueIndex("account_provider_providerAccountId_idx").on(
      table.provider,
      table.providerAccountId,
    ),
  ],
);

export const session = sqliteTable("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  sessionToken: text("sessionToken").unique().notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationToken = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").unique().notNull(),
    expires: integer("expires", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("verificationToken_identifier_token_idx").on(
      table.identifier,
      table.token,
    ),
  ],
);

// ─── E-Commerce ──────────────────────────────────────────────────────────────

export const tshirtOrder = sqliteTable("tshirt_order", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  size: text("size").notNull(),
  color: text("color").notNull(),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
  customerEmail: text("customer_email").notNull(),
  shippingAddress: text("shipping_address", { mode: "json" })
    .$type<Record<string, string>>()
    .notNull(),
  shippingName: text("shipping_name").notNull(),
  stripeSessionId: text("stripe_session_id").unique().notNull(),
  printfulOrderId: text("printful_order_id"),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const wedgieRelations = relations(wedgie, ({ one, many }) => ({
  game: one(game, {
    fields: [wedgie.gameName],
    references: [game.name],
  }),
  player: one(player, {
    fields: [wedgie.playerName],
    references: [player.name],
  }),
  season: one(season, {
    fields: [wedgie.seasonName],
    references: [season.name],
  }),
  team: one(team, {
    fields: [wedgie.teamName],
    references: [team.name],
    relationName: "team",
  }),
  teamAgainst: one(team, {
    fields: [wedgie.teamAgainstName],
    references: [team.name],
    relationName: "teamAgainst",
  }),
  wedgieToTypes: many(wedgieToType),
}));

export const playerRelations = relations(player, ({ many }) => ({
  wedgies: many(wedgie),
}));

export const seasonRelations = relations(season, ({ many }) => ({
  games: many(game),
  wedgies: many(wedgie),
  globals: many(global),
}));

export const gameRelations = relations(game, ({ one, many }) => ({
  season: one(season, {
    fields: [game.seasonName],
    references: [season.name],
  }),
  wedgies: many(wedgie),
}));

export const teamRelations = relations(team, ({ many }) => ({
  teamGames: many(wedgie, { relationName: "team" }),
  teamAgainstGames: many(wedgie, { relationName: "teamAgainst" }),
}));

export const typeRelations = relations(type, ({ many }) => ({
  wedgieToTypes: many(wedgieToType),
}));

export const globalRelations = relations(global, ({ one }) => ({
  currentSeason: one(season, {
    fields: [global.currentSeasonId],
    references: [season.id],
  }),
}));

export const wedgieToTypeRelations = relations(wedgieToType, ({ one }) => ({
  wedgie: one(wedgie, {
    fields: [wedgieToType.wedgieId],
    references: [wedgie.id],
  }),
  type: one(type, {
    fields: [wedgieToType.typeId],
    references: [type.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));
