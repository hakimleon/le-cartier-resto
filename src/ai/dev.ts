import { config } from 'dotenv';
config();

import '@/ai/flows/optimize-menu-suggestions.ts';
import '@/ai/flows/recommend-dynamic-pricing.ts';
import '@/ai/flows/generate-daily-menu.ts';
import '@/ai/flows/generate-dish-image.ts';
