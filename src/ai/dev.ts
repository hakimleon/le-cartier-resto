import { config } from 'dotenv';
config();

// Importer tous les flows pour s'assurer qu'ils sont enregistrés.
import './flows/assistant-flow';
import './flows/recipe-workshop-flow';
import './flows/suggestion-flow';
import './flows/workshop-flow';
