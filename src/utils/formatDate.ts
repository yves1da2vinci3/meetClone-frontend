import moment from "moment";
import "moment/locale/fr"; // Import French locale

const momentFrenchConfig: moment.LocaleSpecification = {
  months:
    "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split(
      "_"
    ),
  monthsShort:
    "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
  monthsParseExact: true,
  weekdays: "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
  weekdaysShort: "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
  weekdaysMin: "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
  weekdaysParseExact: true,
  longDateFormat: {
    LT: "HH:mm",
    LTS: "HH:mm:ss",
    L: "DD/MM/YYYY",
    LL: "D MMMM YYYY",
    LLL: "D MMMM YYYY HH:mm",
    LLLL: "dddd D MMMM YYYY HH:mm",
  },
  calendar: {
    sameDay: "[Aujourd’hui à] LT",
    nextDay: "[Demain à] LT",
    nextWeek: "dddd [à] LT",
    lastDay: "[Hier à] LT",
    lastWeek: "dddd [dernier à] LT",
    sameElse: "L",
  },
  relativeTime: {
    future: "dans %s",
    past: "il y a %s",
    s: "quelques secondes",
    m: "une minute",
    mm: "%d minutes",
    h: "une heure",
    hh: "%d heures",
    d: "un jour",
    dd: "%d jours",
    M: "un mois",
    MM: "%d mois",
    y: "un an",
    yy: "%d ans",
  },
  dayOfMonthOrdinalParse: /\d{1,2}(er|e)/,
  ordinal: function (number) {
    return number + (number === 1 ? "er" : "e");
  },
  meridiemParse: /PD|MD/,
  isPM: function (input) {
    return input.charAt(0) === "M";
  },
  meridiem: function (hours, minutes, isLower) {
    return hours < 12 ? "PD" : "MD";
  },
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // Used to determine first week of the year.
  },
};

moment.updateLocale("fr", momentFrenchConfig);

const formatDate = (date: Date): string => {
  // Format the date using moment.js
  const formattedDate = moment(date).format("dddd DD MMMM YYYY");

  // Capitalize the first letter of the month
  const capitalizedMonth = formattedDate.replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

  return capitalizedMonth;
};

export const formatTime = (date: Date | string | number): string => {
  const DateObject = new Date(date);
  const actualDate = new Date();
  const timeInMeetHours = actualDate.getHours() - DateObject.getHours();
  const inMinutes = actualDate.getMinutes() - DateObject.getMinutes();
  const timeInMeetMinutes = inMinutes < 0 ? inMinutes * -1 : inMinutes;
  const inSeconds = actualDate.getSeconds() - DateObject.getSeconds();
  const timeInMeetSeconds = inSeconds < 0 ? inSeconds * -1 : inSeconds;

  const hours = String(timeInMeetHours).padStart(2, "0");
  const minutes = String(timeInMeetMinutes).padStart(2, "0");
  const seconds = String(timeInMeetSeconds).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
};

export default formatDate;
