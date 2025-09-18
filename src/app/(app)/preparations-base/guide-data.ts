
export type GuidePreparation = {
    name: string;
};

export type GuideCategory = {
    title: string;
    description: string;
    preparations: GuidePreparation[];
};

export const preparationsGuideData: GuideCategory[] = [
    {
        title: "Fonds, Fumets & Bouillons",
        description: "Les bases liquides, essentielles pour sauces, jus et cuissons.",
        preparations: [
            { name: "Fond Brun de Veau" },
            { name: "Fond Blanc de Volaille" },
            { name: "Fond Brun de Volaille" },
            { name: "Fond d’Agneau" },
            { name: "Fond de Gibier" },
            { name: "Fumet de Poisson Blanc" },
            { name: "Fumet de Crustacés" },
            { name: "Bouillon de Légumes" },
            { name: "Court-Bouillon" },
        ],
    },
    {
        title: "Sauces Mères & Dérivées",
        description: "Les grandes bases de la cuisine classique, adaptées en version moderne.",
        preparations: [
            { name: "Béchamel" },
            { name: "Sauce Mornay" },
            { name: "Sauce au Fromage" },
            { name: "Velouté de Volaille" },
            { name: "Velouté de Poisson" },
            { name: "Velouté de Légumes" },
            { name: "Sauce Suprême" },
            { name: "Sauce Tomate de Base" },
            { name: "Sauce Espagnole" },
            { name: "Mayonnaise" },
            { name: "Aïoli" },
            { name: "Sauce Tartare" },
            { name: "Sauce Gribiche" },
            { name: "Vinaigrette Classique" },
            { name: "Vinaigrette Moutarde" },
            { name: "Vinaigrette Agrumes" },
            { name: "Vinaigrette Soja-Sésame" },
        ],
    },
    {
        title: "Purées & Coulis de Légumes Colorés (Version Décor)",
        description: "Destinés au dressage, aux assiettes gastronomiques, pas aux accompagnements copieux.",
        preparations: [
            { name: "Purée de Carottes" },
            { name: "Purée de Betterave" },
            { name: "Purée de Petits Pois" },
            { name: "Purée de Chou-Fleur" },
            { name: "Purée de Chou Rouge" },
            { name: "Purée de Potiron" },
            { name: "Coulis de Poivron Rouge" },
            { name: "Coulis de Poivron Jaune" },
            { name: "Coulis de Tomate" },
        ],
    },
    {
        title: "Huiles Parfumées & Aromatisées",
        description: "Utilisées en finition, assaisonnement, décoration.",
        preparations: [
            { name: "Huile Verte (Persil, Basilic, Herbes)" },
            { name: "Huile Fumée Maison" },
            { name: "Huile de Crustacés" },
            { name: "Huile d’Agrumes" },
            { name: "Huile au Piment" },
        ],
    },
    {
        title: "Beurres Composés",
        description: "Classiques de la cuisine française, pour viandes, poissons et légumes.",
        preparations: [
            { name: "Beurre Maître d’Hôtel" },
            { name: "Beurre aux Herbes" },
            { name: "Beurre Citronné" },
            { name: "Beurre au Piment" },
            { name: "Beurre d’Anchois" },
        ],
    },
    {
        title: "Pâtes Fraîches & Farces",
        description: "Bases italiennes à décliner en plats.",
        preparations: [
            { name: "Pâte à Pâtes Fraîches" },
            { name: "Pâte à Ravioli" },
            { name: "Farce Ricotta-Épinards" },
            { name: "Farce Ricotta-Champignons" },
            { name: "Gnocchis de Pomme de Terre" },
        ],
    },
    {
        title: "Bases Boulangères Simples",
        description: "Indispensables pour un gastro à touche française/algérienne/italienne.",
        preparations: [
            { name: "Pâte à Pain Blanc" },
            { name: "Pâte à Khobz Dar" },
            { name: "Pâte à Brioche Salée" },
            { name: "Focaccia Italienne" },
        ],
    },
    {
        title: "Légumes Glacés Standardisés",
        description: "Traitement classique des légumes en garniture fine, très français.",
        preparations: [
            { name: "Carottes Glacées à Blanc" },
            { name: "Carottes Glacées à Brun" },
            { name: "Navets Glacés à Blanc" },
            { name: "Navets Glacés à Brun" },
            { name: "Oignons Grelots Glacés" },
        ],
    },
    {
        title: "Pickles & Condiments",
        description: "Apports de peps, d’acidité et de contraste en assiette.",
        preparations: [
            { name: "Pickles de Radis Roses" },
            { name: "Pickles de Carottes" },
            { name: "Pickles d’Oignons Rouges" },
            { name: "Chutney d’Oignons" },
            { name: "Chutney de Mangue" },
            { name: "Compotée de Tomates" },
        ],
    },
    {
        title: "Gelées & Gélifications",
        description: "Éléments modernes de texture et fraîcheur.",
        preparations: [
            { name: "Gelée d’Agrumes" },
            { name: "Gelée de Légumes Verts" },
            { name: "Sphérification de Basilic" },
            { name: "Gelée de Betterave" },
            { name: "Jus Clarifié en Gelée" },
        ],
    },
    {
        title: "Mousses Légères & Espumas",
        description: "Préparations au siphon, aériennes, tendance gastro moderne.",
        preparations: [
            { name: "Espuma de Parmesan" },
            { name: "Espuma de Carotte" },
            { name: "Espuma de Petits Pois" },
            { name: "Espuma de Yaourt" },
            { name: "Mousse de Fromage Frais" },
            { name: "Mousse de Légumes" },
        ],
    },
    {
        title: "Poudres & Croustillants",
        description: "Éléments de texture et de finition assiette.",
        preparations: [
            { name: "Poudre de Tomate Séchée" },
            { name: "Poudre de Betterave Séchée" },
            { name: "Poudre de Champignon" },
            { name: "Tuile Dentelle Salée" },
            { name: "Crumble Salé" },
            { name: "Chips de Pomme de Terre" },
            { name: "Chips de Patate Douce" },
            { name: "Chips de Pois Chiche" },
        ],
    },
    {
        title: "Réductions & Jus Corsés",
        description: "Condensés de saveur pour sauces modernes.",
        preparations: [
            { name: "Jus de Viande Réduit" },
            { name: "Jus de Veau Corsé" },
            { name: "Jus de Volaille Réduit" },
            { name: "Jus de Légumes Corsé" },
            { name: "Réduction d’Agrumes" },
        ],
    },
    {
        title: "Fermentations Légères",
        description: "Très tendance, apporte acidité, fraîcheur, complexité.",
        preparations: [
            { name: "Kéfir Maison" },
            { name: "Choux Lactofermentés" },
            { name: "Carottes Lactofermentées" },
            { name: "Pickles Fermentés Mixtes" },
        ],
    },
    {
        title: "Bases Pâtissières Essentielles",
        description: "Même pour un gastro salé, utiles pour desserts et éléments techniques.",
        preparations: [
            { name: "Pâte Sablée" },
            { name: "Pâte Sucrée" },
            { name: "Pâte à Choux" },
            { name: "Crème Pâtissière" },
            { name: "Crème Mousseline" },
            { name: "Crème Chantilly Nature" },
            { name: "Crème Chantilly Parfumée" },
            { name: "Biscuit Dacquoise" },
            { name: "Biscuit Génoise" },
            { name: "Coulis de Fruits Rouges" },
            { name: "Coulis de Mangue" },
            { name: "Caramel" },
        ],
    },
];
