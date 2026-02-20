import { requireAuth } from "../utils/guard.js";
import { initNav } from "../utils/nav.js";

requireAuth();
initNav();
