
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
        title: "Fonds, fumets & bouillons",
        description: "Les bases liquides, essentielles pour sauces, jus et cuissons.",
        preparations: [
            { name: "Fond brun de veau" },
            { name: "Fond blanc de volaille" },
            { name: "Fond brun de volaille" },
            { name: "Fond d’agneau" },
            { name: "Fond de gibier" },
            { name: "Fumet de poisson blanc" },
            { name: "Fumet de crustacés" },
            { name: "Bouillon de légumes" },
            { name: "Court-bouillon" },
        ],
    },
    {
        title: "Sauces mères & dérivées",
        description: "Les grandes bases de la cuisine classique, adaptées en version moderne.",
        preparations: [
            { name: "Béchamel" },
            { name: "Sauce Mornay" },
            { name: "Sauce au fromage (dérivée de béchamel)" },
            { name: "Velouté de volaille" },
            { name: "Velouté de poisson" },
            { name: "Velouté de légumes" },
            { name: "Sauce suprême (volaille + crème)" },
            { name: "Sauce tomate de base" },
            { name: "Sauce espagnole (base pour jus corsés)" },
            { name: "Mayonnaise" },
            { name: "Aïoli" },
            { name: "Sauce tartare" },
            { name: "Sauce gribiche" },
            { name: "Vinaigrette classique" },
            { name: "Vinaigrette moutarde" },
            { name: "Vinaigrette agrumes" },
            { name: "Vinaigrette soja-sésame" },
        ],
    },
    {
        title: "Purées & coulis de légumes colorés (version décor)",
        description: "Destinés au dressage, aux assiettes gastronomiques, pas aux accompagnements copieux.",
        preparations: [
            { name: "Purée de carottes" },
            { name: "Purée de betterave" },
            { name: "Purée de petits pois" },
            { name: "Purée de chou-fleur" },
            { name: "Purée de chou rouge" },
            { name: "Purée de potiron" },
            { name: "Coulis de poivron rouge" },
            { name: "Coulis de poivron jaune" },
            { name: "Coulis de tomate" },
        ],
    },
    {
        title: "Huiles parfumées & aromatisées",
        description: "Utilisées en finition, assaisonnement, décoration.",
        preparations: [
            { name: "Huile verte (persil, basilic, herbes)" },
            { name: "Huile fumée maison" },
            { name: "Huile de crustacés" },
            { name: "Huile d’agrumes" },
            { name: "Huile au piment" },
        ],
    },
    {
        title: "Beurres composés",
        description: "Classiques de la cuisine française, pour viandes, poissons et légumes.",
        preparations: [
            { name: "Beurre maître d’hôtel" },
            { name: "Beurre aux herbes" },
            { name: "Beurre citronné" },
            { name: "Beurre au piment" },
            { name: "Beurre d’anchois" },
        ],
    },
    {
        title: "Pâtes fraîches & farces",
        description: "Bases italiennes à décliner en plats.",
        preparations: [
            { name: "Pâte à pâtes fraîches (tagliatelles, spaghetti, lasagnes)" },
            { name: "Pâte à ravioli" },
            { name: "Farce ricotta-épinards" },
            { name: "Farce ricotta-champignons" },
            { name: "Gnocchis de pomme de terre (base crue)" },
        ],
    },
    {
        title: "Bases boulangères simples",
        description: "Indispensables pour un gastro à touche française/algérienne/italienne.",
        preparations: [
            { name: "Pâte à pain blanc" },
            { name: "Pâte à khobz dar (pain algérien maison revisité)" },
            { name: "Pâte à brioche salée" },
            { name: "Focaccia italienne" },
        ],
    },
    {
        title: "Légumes glacés standardisés",
        description: "Traitement classique des légumes en garniture fine, très français.",
        preparations: [
            { name: "Carottes glacées à blanc" },
            { name: "Carottes glacées à brun" },
            { name: "Navets glacés à blanc" },
            { name: "Navets glacés à brun" },
            { name: "Oignons grelots glacés" },
        ],
    },
    {
        title: "Pickles & condiments",
        description: "Apports de peps, d’acidité et de contraste en assiette.",
        preparations: [
            { name: "Pickles de radis roses" },
            { name: "Pickles de carottes" },
            { name: "Pickles d’oignons rouges" },
            { name: "Chutney d’oignons" },
            { name: "Chutney de mangue" },
            { name: "Compotée de tomates" },
        ],
    },
    {
        title: "Gelées & gélifications",
        description: "Éléments modernes de texture et fraîcheur.",
        preparations: [
            { name: "Gelée d’agrumes" },
            { name: "Gelée de légumes verts" },
            { name: "Sphérification de basilic" },
            { name: "Gelée de betterave" },
            { name: "Jus clarifié en gelée" },
        ],
    },
    {
        title: "Mousses légères & espumas",
        description: "Préparations au siphon, aériennes, tendance gastro moderne.",
        preparations: [
            { name: "Espuma de parmesan" },
            { name: "Espuma de carotte" },
            { name: "Espuma de petits pois" },
            { name: "Espuma de yaourt" },
            { name: "Mousse de fromage frais" },
            { name: "Mousse de légumes (selon saison)" },
        ],
    },
    {
        title: "Poudres & croustillants",
        description: "Éléments de texture et de finition assiette.",
        preparations: [
            { name: "Poudre de tomate séchée" },
            { name: "Poudre de betterave séchée" },
            { name: "Poudre de champignon" },
            { name: "Tuile dentelle salée" },
            { name: "Crumble salé (parmesan, noisette, pain)" },
            { name: "Chips de pomme de terre" },
            { name: "Chips de patate douce" },
            { name: "Chips de pois chiche" },
        ],
    },
    {
        title: "Réductions & jus corsés",
        description: "Condensés de saveur pour sauces modernes.",
        preparations: [
            { name: "Jus de viande réduit" },
            { name: "Jus de veau corsé" },
            { name: "Jus de volaille réduit" },
            { name: "Jus de légumes corsé" },
            { name: "Réduction d’agrumes" },
        ],
    },
    {
        title: "Fermentations légères",
        description: "Très tendance, apporte acidité, fraîcheur, complexité.",
        preparations: [
            { name: "Kéfir maison" },
            { name: "Choux lactofermentés" },
            { name: "Carottes lactofermentées" },
            { name: "Pickles fermentés mixtes" },
        ],
    },
    {
        title: "Bases pâtissières essentielles",
        description: "Même pour un gastro salé, utiles pour desserts et éléments techniques.",
        preparations: [
            { name: "Pâte sablée" },
            { name: "Pâte sucrée" },
            { name: "Pâte à choux" },
            { name: "Crème pâtissière" },
            { name: "Crème mousseline" },
            { name: "Crème chantilly nature" },
            { name: "Crème chantilly parfumée (vanille, café, cacao)" },
            { name: "Biscuit dacquoise" },
            { name: "Biscuit génoise" },
            { name: "Coulis de fruits rouges" },
            { name: "Coulis de mangue" },
            { name: "Caramel" },
        ],
    },
];
