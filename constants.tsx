
import { Question } from './types';

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 1,
    theme: "Cuisine DZ",
    questionText: "Quel est le plat incontournable d'un mariage algérien ?",
    answers: [
      { id: 1, text: "Couscous", points: 45, revealed: false },
      { id: 2, text: "Chorba", points: 25, revealed: false },
      { id: 3, text: "Bourek", points: 15, revealed: false },
      { id: 4, text: "Tajine Zitoun", points: 10, revealed: false },
      { id: 5, text: "Ham Lahlou", points: 5, revealed: false }
    ]
  },
  {
    id: 2,
    theme: "Vie Quotidienne",
    questionText: "Qu'est-ce qu'on achète toujours au dernier moment avant l'Aïd ?",
    answers: [
      { id: 1, text: "Les vêtements des enfants", points: 40, revealed: false },
      { id: 2, text: "La semoule pour les gâteaux", points: 30, revealed: false },
      { id: 3, text: "Le mouton", points: 15, revealed: false },
      { id: 4, text: "Le henné", points: 10, revealed: false },
      { id: 5, text: "Les bougies", points: 5, revealed: false }
    ]
  },
  {
    id: 3,
    theme: "Transports",
    questionText: "Quel est le moyen de transport le plus typique à Alger ?",
    answers: [
      { id: 1, text: "Métro", points: 35, revealed: false },
      { id: 2, text: "Téléphérique", points: 30, revealed: false },
      { id: 3, text: "Bus ETUSA", points: 20, revealed: false },
      { id: 4, text: "Taxi clandestin", points: 10, revealed: false },
      { id: 5, text: "Tramway", points: 5, revealed: false }
    ]
  },
  {
    id: 4,
    theme: "Géographie",
    questionText: "Citez une ville côtière algérienne célèbre pour ses plages.",
    answers: [
      { id: 1, text: "Bejaia", points: 35, revealed: false },
      { id: 2, text: "Oran", points: 25, revealed: false },
      { id: 3, text: "Jijel", points: 20, revealed: false },
      { id: 4, text: "Annaba", points: 15, revealed: false },
      { id: 5, text: "Tipaza", points: 5, revealed: false }
    ]
  },
  {
    id: 5,
    theme: "Culture",
    questionText: "Quel objet trouve-t-on traditionnellement dans un salon algérien ?",
    answers: [
      { id: 1, text: "Sedari / Canapé", points: 40, revealed: false },
      { id: 2, text: "Tapis berbère", points: 25, revealed: false },
      { id: 3, text: "Table basse ronde", points: 15, revealed: false },
      { id: 4, text: "Service à thé en argent", points: 10, revealed: false },
      { id: 5, text: "Cadre avec versets", points: 10, revealed: false }
    ]
  },
  {
    id: 6,
    theme: "Sport",
    questionText: "Quel est le surnom de l'équipe nationale de football d'Algérie ?",
    answers: [
      { id: 1, text: "Les Fennecs", points: 50, revealed: false },
      { id: 2, text: "Les Verts", points: 30, revealed: false },
      { id: 3, text: "El Khadra", points: 20, revealed: false }
    ]
  },
  {
    id: 7,
    theme: "Musique",
    questionText: "Citez un style de musique populaire en Algérie.",
    answers: [
      { id: 1, text: "Raï", points: 40, revealed: false },
      { id: 2, text: "Chaâbi", points: 30, revealed: false },
      { id: 3, text: "Kabyle", points: 15, revealed: false },
      { id: 4, text: "Staifi", points: 10, revealed: false },
      { id: 5, text: "Gnaoui", points: 5, revealed: false }
    ]
  },
  {
    id: 8,
    theme: "Ramadan",
    questionText: "Que mange-t-on en premier pour rompre le jeûne ?",
    answers: [
      { id: 1, text: "Dattes", points: 60, revealed: false },
      { id: 2, text: "Lben", points: 25, revealed: false },
      { id: 3, text: "Eau", points: 15, revealed: false }
    ]
  },
  {
    id: 9,
    theme: "Langue",
    questionText: "Citez une expression typiquement algérienne pour dire 'C'est bon/D'accord'.",
    answers: [
      { id: 1, text: "Saha", points: 40, revealed: false },
      { id: 2, text: "Mlih", points: 25, revealed: false },
      { id: 3, text: "C'est bon", points: 15, revealed: false },
      { id: 4, text: "Yaatik es-saha", points: 10, revealed: false },
      { id: 5, text: "Aywa", points: 10, revealed: false }
    ]
  },
  {
    id: 10,
    theme: "Patrimoine",
    questionText: "Citez un monument historique célèbre en Algérie.",
    answers: [
      { id: 1, text: "Maquam E'chahid", points: 45, revealed: false },
      { id: 2, text: "La Casbah d'Alger", points: 30, revealed: false },
      { id: 3, text: "Ponts de Constantine", points: 15, revealed: false },
      { id: 4, text: "Timgad", points: 10, revealed: false }
    ]
  }
];
