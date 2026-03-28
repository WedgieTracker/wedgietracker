import { nbaUpdate } from "~/lib/nba-schedule";

const handler = () => nbaUpdate(false);

export const GET = handler;
export const POST = handler;
