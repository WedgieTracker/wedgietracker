import { nbaUpdate } from "~/lib/nba-schedule";

const handler = () => nbaUpdate(true);

export const GET = handler;
export const POST = handler;
