export type LangCode = "en" | "de";

export const LANG_NAMES: Record<LangCode, string> = {
  en: "English",
  de: "Deutsch",
};

export const LANG_FLAGS: Record<LangCode, string> = {
  en: "🇬🇧",
  de: "🇩🇪",
};

export const RTL_LANGS: LangCode[] = [];

export interface Translations {
  search: string;
  clear: string;
  places: string;
  of: string;
  sortTopRated: string;
  sortAtoZ: string;
  sortMostReviewed: string;
  catSpecialtyCoffee: string;
  catBakery: string;
  catBrunch: string;
  catRoastery: string;
  catWorkFriendly: string;
  catLateEvening: string;
  catNew: string;
  catOurPicks: string;
  catAll: string;
  tagline: string;
  location: string;
  surpriseMe: string;
  noCafesMatch: string;
  clearAllFilters: string;
  madeWithLove: string;
  openInMaps: string;
  noPhoto: string;
  tryAnother: string;
  moreLanguagesComing: string;
  // Lifestyle sections
  sectionBeans: string;
  sectionBeansSub: string;
  sectionGear: string;
  sectionGearSub: string;
  sectionKits: string;
  sectionKitsSub: string;
  sectionApparel: string;
  sectionApparelSub: string;
  shopNow: string;
  includes: string;
  // Contact
  contactTitle: string;
  contactSub: string;
  contactName: string;
  contactEmail: string;
  contactMessage: string;
  contactSend: string;
  contactSending: string;
  contactSuccess: string;
  contactError: string;
  allCafes: string;
  // Pagination
  showMore: string;
  showLess: string;
  left: string;
  // Nav tabs
  tabCafes: string;
  tabBeans: string;
  tabGear: string;
  tabKits: string;
  tabApparel: string;
  // Footer poem
  footerLine1: string;
  footerLine2: string;
  footerLine3: string;
  footerReachOut: string;
  footerLine4: string;
  // Contact placeholders
  contactNamePlaceholder: string;
  contactEmailPlaceholder: string;
  contactMessagePlaceholder: string;
}

export const TRANSLATIONS: Record<LangCode, Translations> = {
  en: {
    search: "Search...",
    clear: "Clear",
    places: "places",
    of: "of",
    sortTopRated: "Top Rated",
    sortAtoZ: "A to Z",
    sortMostReviewed: "Most Reviewed",
    catSpecialtyCoffee: "Specialty Coffee",
    catBakery: "Bakery",
    catBrunch: "Brunch",
    catRoastery: "Roastery",
    catWorkFriendly: "Work-friendly",
    catLateEvening: "Late Evening",
    catNew: "New",
    catOurPicks: "Our Picks",
    catAll: "All",
    tagline: "Your inside scoop on Düsseldorf cafes, curated by coffee nerds.",
    location: "Düsseldorf",
    surpriseMe: "Surprise me",
    noCafesMatch: "No cafes match your filters",
    clearAllFilters: "Clear all filters",
    madeWithLove: "Made with love in Düsseldorf",
    openInMaps: "Open in Maps",
    noPhoto: "No photo",
    tryAnother: "Try another",
    moreLanguagesComing: "More languages coming",
    sectionBeans: "Coffee Beans",
    sectionBeansSub: "Bags we've actually loved — order online and brew at home.",
    sectionGear: "Coffee Gear",
    sectionGearSub: "The tools worth having. No fluff.",
    sectionKits: "Home Barista Kits",
    sectionKitsSub: "Start somewhere good.",
    sectionApparel: "Apparel",
    sectionApparelSub: "Wear your obsession with some dignity.",
    shopNow: "Shop",
    includes: "Includes",
    contactTitle: "Have something to say?",
    contactSub: "A tip, a suggestion, a café we missed — write to us. We read everything.",
    contactName: "Your name",
    contactEmail: "Your email",
    contactMessage: "Your message",
    contactSend: "Send message",
    contactSending: "Sending…",
    contactSuccess: "Message sent. Thank you!",
    contactError: "Something went wrong. Please try again.",
    allCafes: "All cafes",
    showMore: "Show more",
    showLess: "Show less",
    left: "left",
    tabCafes: "Cafes",
    tabBeans: "Beans",
    tabGear: "Gear",
    tabKits: "Kits",
    tabApparel: "Apparel",
    footerLine1: "Photos from Maps, some shot by our crew,",
    footerLine2: "See something off? Just give us a cue.",
    footerLine3: "A listing, a café, not quite right?",
    footerReachOut: "Reach out to us",
    footerLine4: ", we'll fix it up tight.",
    contactNamePlaceholder: "e.g. Anna",
    contactEmailPlaceholder: "you@example.com",
    contactMessagePlaceholder: "Tell us anything…",
  },
  de: {
    search: "Suchen...",
    clear: "Zurücksetzen",
    places: "Orte",
    of: "von",
    sortTopRated: "Beste Bewertung",
    sortAtoZ: "A bis Z",
    sortMostReviewed: "Meistbewertet",
    catSpecialtyCoffee: "Specialty Coffee",
    catBakery: "Bäckerei",
    catBrunch: "Brunch",
    catRoastery: "Rösterei",
    catWorkFriendly: "Arbeitsfreundlich",
    catLateEvening: "Abendlokal",
    catNew: "Neu",
    catOurPicks: "Unsere Empfehlungen",
    catAll: "Alle",
    tagline: "Dein Insider-Guide zu den besten Düsseldorfer Cafés, zusammengestellt von Kaffee-Nerds.",
    location: "Düsseldorf",
    surpriseMe: "Überrasch mich",
    noCafesMatch: "Keine Cafés entsprechen deinen Filtern",
    clearAllFilters: "Alle Filter löschen",
    madeWithLove: "Mit Liebe gemacht in Düsseldorf",
    openInMaps: "In Maps öffnen",
    noPhoto: "Kein Foto",
    tryAnother: "Nächstes",
    moreLanguagesComing: "Weitere Sprachen kommen bald",
    sectionBeans: "Kaffeebohnen",
    sectionBeansSub: "Beutel, die wir wirklich geliebt haben — online bestellen, zuhause aufbrühen.",
    sectionGear: "Kaffee-Ausrüstung",
    sectionGearSub: "Die Werkzeuge, die sich lohnen. Ohne Schnickschnack.",
    sectionKits: "Home-Barista-Sets",
    sectionKitsSub: "Fang irgendwo gut an.",
    sectionApparel: "Bekleidung",
    sectionApparelSub: "Zeige deine Leidenschaft mit Stil.",
    shopNow: "Kaufen",
    includes: "Enthält",
    contactTitle: "Hast du etwas zu sagen?",
    contactSub: "Ein Tipp, ein Vorschlag, ein Café das wir verpasst haben — schreib uns. Wir lesen alles.",
    contactName: "Dein Name",
    contactEmail: "Deine E-Mail",
    contactMessage: "Deine Nachricht",
    contactSend: "Nachricht senden",
    contactSending: "Wird gesendet…",
    contactSuccess: "Nachricht gesendet. Danke!",
    contactError: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
    allCafes: "Alle Cafés",
    showMore: "Mehr anzeigen",
    showLess: "Weniger anzeigen",
    left: "übrig",
    tabCafes: "Cafés",
    tabBeans: "Bohnen",
    tabGear: "Ausrüstung",
    tabKits: "Sets",
    tabApparel: "Kleidung",
    footerLine1: "Fotos von Maps, manche von uns aufgenommen,",
    footerLine2: "Fehler entdeckt? Sag es uns einfach.",
    footerLine3: "Ein Eintrag, ein Café – stimmt was nicht?",
    footerReachOut: "Schreib uns",
    footerLine4: ", wir kümmern uns drum.",
    contactNamePlaceholder: "z. B. Anna",
    contactEmailPlaceholder: "du@beispiel.de",
    contactMessagePlaceholder: "Schreib uns alles…",
  },
};
