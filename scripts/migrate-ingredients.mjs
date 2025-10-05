// Ce script permet de mettre à jour tous les documents de la collection "ingredients"
// pour s'assurer qu'ils contiennent les nouveaux champs "baseUnit" et "equivalences".

// IMPORTANT : Pour exécuter ce script, vous devez :
// 1. Installer les dépendances : npm install dotenv firebase
// 2. Créer un fichier .env.local à la racine du projet et y mettre vos clés Firebase
//    (vous pouvez copier/coller depuis le fichier .env et remplir les valeurs).
// 3. Exécuter la commande : node --env-file=.env.local scripts/migrate-ingredients.mjs

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch } from "firebase/firestore";
import 'dotenv/config';

// Configuration de Firebase (doit correspondre à votre projet)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateIngredients() {
  console.log("Démarrage de la migration des ingrédients...");

  const ingredientsCol = collection(db, "ingredients");
  const ingredientsSnapshot = await getDocs(ingredientsCol);
  
  if (ingredientsSnapshot.empty) {
    console.log("Aucun ingrédient trouvé. La migration est terminée.");
    return;
  }

  const batch = writeBatch(db);
  let updatedCount = 0;

  ingredientsSnapshot.forEach((doc) => {
    const ingredient = doc.data();
    let needsUpdate = false;
    
    // Valeurs par défaut à ajouter
    const defaults = {
        baseUnit: 'g',
        equivalences: {}
    };

    const dataToUpdate = {};

    if (!('baseUnit' in ingredient)) {
        dataToUpdate.baseUnit = defaults.baseUnit;
        needsUpdate = true;
    }
    if (!('equivalences' in ingredient)) {
        dataToUpdate.equivalences = defaults.equivalences;
        needsUpdate = true;
    }
    
    if (needsUpdate) {
        console.log(`Mise à jour de l'ingrédient: "${ingredient.name}" (ID: ${doc.id})`);
        batch.update(doc.ref, dataToUpdate);
        updatedCount++;
    }
  });

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`\nMigration terminée avec succès !`);
    console.log(`${updatedCount} ingrédient(s) ont été mis à jour.`);
  } else {
    console.log("\nTous les ingrédients étaient déjà à jour. Aucune modification nécessaire.");
  }
}

migrateIngredients().catch((err) => {
  console.error("\nUne erreur est survenue durant la migration:", err);
  process.exit(1);
}).then(() => {
    // On attend un peu pour que tous les logs s'affichent avant de quitter
    setTimeout(() => process.exit(0), 1000);
});
