
export type GuidePreparation = {
    name: string;
};

export type GuideCategory = {
    title: string;
    description: string;
    preparations: GuidePreparation[];
};

export const garnishesGuideData: GuideCategory[] = [
    {
        title: "Purées & mousselines",
        description: "Textures lisses, crémeuses, idéales pour accompagnements ou dressages élégants.",
        preparations: [
            { name: "Purée de pomme de terre (classique)" },
            { name: "Purée de pomme de terre Robuchon (riche en beurre)" },
            { name: "Mousseline de patate douce" },
            { name: "Purée de céleri-rave" },
            { name: "Purée de carottes au cumin" },
            { name: "Purée de petits pois à la menthe" },
            { name: "Mousseline de chou-fleur (nature ou au curry)" },
            { name: "Purée de panais à la vanille" },
            { name: "Purée de brocoli (texture verte intense)" },
            { name: "Purée de topinambours" },
        ],
    },
    {
        title: "Gratins & plats de légumes au four",
        description: "Préparations crémeuses/gratinées, portionnables en cubes, rectangles, cercles.",
        preparations: [
            { name: "Gratin dauphinois" },
            { name: "Gratin de courgettes au parmesan" },
            { name: "Gratin de brocoli et chou-fleur" },
            { name: "Tian de légumes provençal" },
            { name: "Gratin de potiron (ou butternut)" },
            { name: "Moussaka végétarienne" },
            { name: "Lasagnes de légumes grillés" },
        ],
    },
    {
        title: "Légumes glacés, rôtis ou vapeur",
        description: "Traitements simples mais calibrés pour garnitures fines.",
        preparations: [
            { name: "Carottes glacées à blanc" },
            { name: "Carottes glacées à brun" },
            { name: "Navets glacés à blanc" },
            { name: "Oignons grelots glacés" },
            { name: "Asperges vapeur (verte/blanche)" },
            { name: "Haricots verts vapeur ou poêlés au beurre" },
            { name: "Brocoli vapeur ou rôti au four" },
            { name: "Choux de Bruxelles rôtis ou étuvés" },
            { name: "Champignons poêlés au persil" },
            { name: "Courgettes rôties aux herbes" },
        ],
    },
    {
        title: "Céréales & féculents",
        description: "Bases rassasiantes, portionnées pour garniture standard.",
        preparations: [
            { name: "Riz pilaf" },
            { name: "Riz basmati vapeur" },
            { name: "Risotto crémeux" },
            { name: "Polenta crémeuse" },
            { name: "Polenta gratinée" },
            { name: "Semoule parfumée" },
            { name: "Couscous aux légumes" },
            { name: "Quinoa nature ou aux herbes" },
            { name: "Ebly blé tendre mijoté" },
        ],
    },
    {
        title: "Légumineuses & accompagnements végétariens mijotés",
        description: "Riches en protéines, bons pour plats végétariens ou garnitures consistantes.",
        preparations: [
            { name: "Lentilles vertes du Puy mijotées" },
            { name: "Lentilles corail au curry doux" },
            { name: "Pois chiches mijotés à la tomate et cumin" },
            { name: "Haricots blancs à l’huile d’olive et romarin" },
            { name: "Cassoulet de légumes" },
            { name: "Ratatouille classique" },
            { name: "Chakchouka (version légère algérienne, sans œuf)" },
            { name: "Caponata sicilienne" },
        ],
    },
    {
        title: "Accompagnements modernes & revisités",
        description: "Préparations plus gastronomiques ou contemporaines, idéales pour varier la carte.",
        preparations: [
            { name: "Gnocchis de pomme de terre poêlés au beurre noisette" },
            { name: "Gnocchis de semoule (à la romaine)" },
            { name: "Risotto de légumes verts" },
            { name: "Risotto de potiron" },
            { name: "Couscous revisité aux herbes fines" },
            { name: "Tagliatelles de légumes" },
            { name: "Millefeuille de légumes racines" },
            { name: "Cromesquis de purée de pomme de terre" },
            { name: "Flan de légumes" },
            { name: "Galette de légumes" },
        ],
    },
];
