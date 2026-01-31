// Translation interface for type safety
export interface Translation {
  programTitle: string;
  days: string;
  morning: string;
  lunch: string;
  afternoon: string;
  dinner: string;
  evening: string;
  tel: string;
  confidential: string;
  welcome: string;
  eiffelView: string;
  reservationRequired: string;
  introDefault: string;
  closingDefault: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  january: string;
  february: string;
  march: string;
  april: string;
  may: string;
  june: string;
  july: string;
  august: string;
  september: string;
  october: string;
  november: string;
  december: string;
}

export const translations: Record<string, Translation> = {
  fr: {
    programTitle: "Programme Personnalise",
    days: "JOURS",
    morning: "Matin",
    lunch: "Dejeuner",
    afternoon: "Apres-midi",
    dinner: "Diner",
    evening: "Soiree",
    tel: "Tel",
    confidential: "PROGRAMME CONFIDENTIEL - SERVICE CONCIERGERIE",
    welcome: "Bienvenue a Paris!",
    eiffelView: "Vue Tour Eiffel",
    reservationRequired: "Reservation necessaire",
    introDefault: "Bienvenue a Paris! Voici votre programme personnalise pour un sejour d'exception.",
    closingDefault: "Nous esperons que ce programme vous plaira. N'hesitez pas a nous contacter pour toute modification.",
    // Day names
    monday: "Lundi",
    tuesday: "Mardi",
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
    saturday: "Samedi",
    sunday: "Dimanche",
    // Month names
    january: "janvier",
    february: "fevrier",
    march: "mars",
    april: "avril",
    may: "mai",
    june: "juin",
    july: "juillet",
    august: "aout",
    september: "septembre",
    october: "octobre",
    november: "novembre",
    december: "decembre",
  },
  en: {
    programTitle: "Personalized Program",
    days: "DAYS",
    morning: "Morning",
    lunch: "Lunch",
    afternoon: "Afternoon",
    dinner: "Dinner",
    evening: "Evening",
    tel: "Phone",
    confidential: "CONFIDENTIAL PROGRAM - CONCIERGE SERVICE",
    welcome: "Welcome to Paris!",
    eiffelView: "Eiffel Tower View",
    reservationRequired: "Reservation required",
    introDefault: "Welcome to Paris! Here is your personalized program for an exceptional stay.",
    closingDefault: "We hope you enjoy this program. Please contact us for any modifications.",
    // Day names
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    // Month names
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
  },
  es: {
    programTitle: "Programa Personalizado",
    days: "DIAS",
    morning: "Manana",
    lunch: "Almuerzo",
    afternoon: "Tarde",
    dinner: "Cena",
    evening: "Noche",
    tel: "Tel",
    confidential: "PROGRAMA CONFIDENCIAL - SERVICIO DE CONSERJERIA",
    welcome: "Bienvenido a Paris!",
    eiffelView: "Vista Torre Eiffel",
    reservationRequired: "Reserva necesaria",
    introDefault: "Bienvenido a Paris! Aqui esta su programa personalizado para una estancia excepcional.",
    closingDefault: "Esperamos que disfrute este programa. Contactenos para cualquier modificacion.",
    // Day names
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miercoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sabado",
    sunday: "Domingo",
    // Month names
    january: "enero",
    february: "febrero",
    march: "marzo",
    april: "abril",
    may: "mayo",
    june: "junio",
    july: "julio",
    august: "agosto",
    september: "septiembre",
    october: "octubre",
    november: "noviembre",
    december: "diciembre",
  },
  it: {
    programTitle: "Programma Personalizzato",
    days: "GIORNI",
    morning: "Mattina",
    lunch: "Pranzo",
    afternoon: "Pomeriggio",
    dinner: "Cena",
    evening: "Serata",
    tel: "Tel",
    confidential: "PROGRAMMA RISERVATO - SERVIZIO CONCIERGE",
    welcome: "Benvenuto a Parigi!",
    eiffelView: "Vista Torre Eiffel",
    reservationRequired: "Prenotazione necessaria",
    introDefault: "Benvenuto a Parigi! Ecco il vostro programma personalizzato per un soggiorno eccezionale.",
    closingDefault: "Speriamo che questo programma vi piaccia. Contattateci per qualsiasi modifica.",
    // Day names
    monday: "Lunedi",
    tuesday: "Martedi",
    wednesday: "Mercoledi",
    thursday: "Giovedi",
    friday: "Venerdi",
    saturday: "Sabato",
    sunday: "Domenica",
    // Month names
    january: "gennaio",
    february: "febbraio",
    march: "marzo",
    april: "aprile",
    may: "maggio",
    june: "giugno",
    july: "luglio",
    august: "agosto",
    september: "settembre",
    october: "ottobre",
    november: "novembre",
    december: "dicembre",
  },
  de: {
    programTitle: "Personalisiertes Programm",
    days: "TAGE",
    morning: "Morgen",
    lunch: "Mittagessen",
    afternoon: "Nachmittag",
    dinner: "Abendessen",
    evening: "Abend",
    tel: "Tel",
    confidential: "VERTRAULICHES PROGRAMM - CONCIERGE-SERVICE",
    welcome: "Willkommen in Paris!",
    eiffelView: "Blick auf den Eiffelturm",
    reservationRequired: "Reservierung erforderlich",
    introDefault: "Willkommen in Paris! Hier ist Ihr personalisiertes Programm fur einen aussergewohnlichen Aufenthalt.",
    closingDefault: "Wir hoffen, dass Ihnen dieses Programm gefallt. Kontaktieren Sie uns fur jede Anderung.",
    // Day names
    monday: "Montag",
    tuesday: "Dienstag",
    wednesday: "Mittwoch",
    thursday: "Donnerstag",
    friday: "Freitag",
    saturday: "Samstag",
    sunday: "Sonntag",
    // Month names
    january: "Januar",
    february: "Februar",
    march: "Marz",
    april: "April",
    may: "Mai",
    june: "Juni",
    july: "Juli",
    august: "August",
    september: "September",
    october: "Oktober",
    november: "November",
    december: "Dezember",
  },
  pt: {
    programTitle: "Programa Personalizado",
    days: "DIAS",
    morning: "Manha",
    lunch: "Almoco",
    afternoon: "Tarde",
    dinner: "Jantar",
    evening: "Noite",
    tel: "Tel",
    confidential: "PROGRAMA CONFIDENCIAL - SERVICO DE CONCIERGE",
    welcome: "Bem-vindo a Paris!",
    eiffelView: "Vista da Torre Eiffel",
    reservationRequired: "Reserva necessaria",
    introDefault: "Bem-vindo a Paris! Aqui esta o seu programa personalizado para uma estadia excepcional.",
    closingDefault: "Esperamos que goste deste programa. Contacte-nos para qualquer alteracao.",
    // Day names
    monday: "Segunda-feira",
    tuesday: "Terca-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sabado",
    sunday: "Domingo",
    // Month names
    january: "janeiro",
    february: "fevereiro",
    march: "marco",
    april: "abril",
    may: "maio",
    june: "junho",
    july: "julho",
    august: "agosto",
    september: "setembro",
    october: "outubro",
    november: "novembro",
    december: "dezembro",
  },
  zh: {
    programTitle: "个性化行程",
    days: "天",
    morning: "上午",
    lunch: "午餐",
    afternoon: "下午",
    dinner: "晚餐",
    evening: "晚间",
    tel: "电话",
    confidential: "机密行程 - 礼宾服务",
    welcome: "欢迎来到巴黎!",
    eiffelView: "埃菲尔铁塔景观",
    reservationRequired: "需要预订",
    introDefault: "欢迎来到巴黎! 这是您的个性化行程, 祝您度过一个难忘的旅程。",
    closingDefault: "希望您喜欢这个行程。如有任何修改需要, 请随时与我们联系。",
    // Day names
    monday: "星期一",
    tuesday: "星期二",
    wednesday: "星期三",
    thursday: "星期四",
    friday: "星期五",
    saturday: "星期六",
    sunday: "星期日",
    // Month names
    january: "一月",
    february: "二月",
    march: "三月",
    april: "四月",
    may: "五月",
    june: "六月",
    july: "七月",
    august: "八月",
    september: "九月",
    october: "十月",
    november: "十一月",
    december: "十二月",
  },
  ar: {
    programTitle: "البرنامج المخصص",
    days: "ايام",
    morning: "صباحا",
    lunch: "غداء",
    afternoon: "بعد الظهر",
    dinner: "عشاء",
    evening: "مساء",
    tel: "هاتف",
    confidential: "برنامج سري - خدمة الكونسيرج",
    welcome: "مرحبا بكم في باريس!",
    eiffelView: "اطلالة برج ايفل",
    reservationRequired: "الحجز مطلوب",
    introDefault: "مرحبا بكم في باريس! اليكم برنامجكم المخصص لاقامة استثنائية.",
    closingDefault: "نامل ان ينال هذا البرنامج اعجابكم. لا تترددوا في التواصل معنا لاي تعديل.",
    // Day names
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الاربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    sunday: "الاحد",
    // Month names
    january: "يناير",
    february: "فبراير",
    march: "مارس",
    april: "ابريل",
    may: "مايو",
    june: "يونيو",
    july: "يوليو",
    august: "اغسطس",
    september: "سبتمبر",
    october: "اكتوبر",
    november: "نوفمبر",
    december: "ديسمبر",
  },
  ru: {
    programTitle: "Персональная программа",
    days: "ДНЕЙ",
    morning: "Утро",
    lunch: "Обед",
    afternoon: "День",
    dinner: "Ужин",
    evening: "Вечер",
    tel: "Тел",
    confidential: "КОНФИДЕНЦИАЛЬНАЯ ПРОГРАММА - КОНСЬЕРЖ-СЕРВИС",
    welcome: "Добро пожаловать в Париж!",
    eiffelView: "Вид на Эйфелеву башню",
    reservationRequired: "Требуется бронирование",
    introDefault: "Добро пожаловать в Париж! Вот ваша персональная программа для исключительного пребывания.",
    closingDefault: "Надеемся, что эта программа вам понравится. Свяжитесь с нами для внесения изменений.",
    // Day names
    monday: "Понедельник",
    tuesday: "Вторник",
    wednesday: "Среда",
    thursday: "Четверг",
    friday: "Пятница",
    saturday: "Суббота",
    sunday: "Воскресенье",
    // Month names
    january: "января",
    february: "февраля",
    march: "марта",
    april: "апреля",
    may: "мая",
    june: "июня",
    july: "июля",
    august: "августа",
    september: "сентября",
    october: "октября",
    november: "ноября",
    december: "декабря",
  },
};

export type Language = keyof typeof translations;
export type TranslationKeys = keyof Translation;

// Locale mapping for toLocaleDateString
export const localeMap: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
  it: "it-IT",
  de: "de-DE",
  pt: "pt-PT",
  zh: "zh-CN",
  ar: "ar-SA",
  ru: "ru-RU",
};

export function getTranslation(lang: string): Translation {
  const translation = translations[lang];
  if (translation) {
    return translation;
  }
  return translations.fr as Translation;
}

export function getLocale(lang: string): string {
  const locale = localeMap[lang];
  if (locale) {
    return locale;
  }
  return localeMap.fr as string;
}

export function isValidLanguage(lang: string): lang is Language {
  return lang in translations;
}
