import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sweep stale presence rows",
  { seconds: 30 },
  internal.presence.sweepStale,
);

export default crons;
