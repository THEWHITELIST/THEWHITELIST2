import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Program } from "../types";
import { getTranslation, getLocale, type Translation } from "./translations";

// Register elegant fonts with all needed variants
// Using hyphenation callback to prevent issues
Font.registerHyphenationCallback((word) => [word]);

// Register fonts - these are loaded asynchronously by react-pdf
try {
  Font.register({
    family: "Cormorant",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_v86GnM.ttf",
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_iE9GnM.ttf",
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3smX5slCNuHLi8bLeY9MK7whWMhyjYrGFEsdtdc62E6zd58jDOjw.ttf",
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  });

  Font.register({
    family: "Montserrat",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf",
        fontWeight: 400,
        fontStyle: "normal",
      },
      {
        src: "https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtZ6Ew-.ttf",
        fontWeight: 500,
        fontStyle: "normal",
      },
      {
        src: "https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu170w-.ttf",
        fontWeight: 600,
        fontStyle: "normal",
      },
      {
        src: "https://fonts.gstatic.com/s/montserrat/v31/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R9aX8.ttf",
        fontWeight: 400,
        fontStyle: "italic",
      },
    ],
  });
} catch (fontError) {
  console.error("Error registering fonts:", fontError);
}

// Luxury color palette
const colors = {
  primary: "#1a1a2e", // Deep navy
  secondary: "#c9a961", // Gold accent
  text: "#2d2d2d",
  lightText: "#666666",
  border: "#e0d5c5",
  background: "#fdfcfa",
  accent: "#8b7355",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  header: {
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    paddingBottom: 30,
  },
  headerTitle: {
    fontFamily: "Cormorant",
    fontSize: 32,
    fontWeight: 600,
    color: colors.primary,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontFamily: "Montserrat",
    fontSize: 11,
    color: colors.secondary,
    textAlign: "center",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  introduction: {
    marginBottom: 35,
    paddingHorizontal: 20,
  },
  introText: {
    fontFamily: "Cormorant",
    fontSize: 13,
    color: colors.text,
    lineHeight: 1.8,
    textAlign: "justify",
  },
  dayContainer: {
    marginBottom: 30,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  dayNumber: {
    fontFamily: "Montserrat",
    fontSize: 9,
    fontWeight: 600,
    color: colors.secondary,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginRight: 15,
  },
  dayTheme: {
    fontFamily: "Cormorant",
    fontSize: 18,
    fontWeight: 600,
    color: colors.primary,
    flex: 1,
  },
  activityContainer: {
    marginBottom: 16,
    paddingLeft: 15,
  },
  activityRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  activityTime: {
    fontFamily: "Montserrat",
    fontSize: 9,
    fontWeight: 500,
    color: colors.secondary,
    width: 55,
    paddingTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  venueName: {
    fontFamily: "Cormorant",
    fontSize: 14,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: 3,
  },
  venueDetails: {
    fontFamily: "Montserrat",
    fontSize: 8,
    color: colors.lightText,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  venueAddress: {
    fontFamily: "Montserrat",
    fontSize: 8,
    color: colors.lightText,
    marginBottom: 2,
  },
  venuePhone: {
    fontFamily: "Montserrat",
    fontSize: 8,
    color: colors.accent,
    marginBottom: 2,
  },
  conciergeNotes: {
    fontFamily: "Montserrat",
    fontSize: 8,
    fontStyle: "italic",
    color: colors.accent,
    marginTop: 5,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: colors.secondary,
  },
  closing: {
    marginTop: 30,
    paddingTop: 25,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
    paddingHorizontal: 20,
  },
  closingText: {
    fontFamily: "Cormorant",
    fontSize: 12,
    color: colors.text,
    lineHeight: 1.8,
    textAlign: "center",
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: "center",
  },
  footerText: {
    fontFamily: "Montserrat",
    fontSize: 8,
    color: colors.lightText,
    letterSpacing: 1,
  },
  pageNumber: {
    fontFamily: "Montserrat",
    fontSize: 8,
    color: colors.lightText,
    textAlign: "center",
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
    marginHorizontal: 40,
  },
});

// Helper to get translated time slot names
function getTimeSlotLabel(timeSlot: string, t: Translation): string {
  const labels: Record<string, keyof Translation> = {
    morning: "morning",
    lunch: "lunch",
    afternoon: "afternoon",
    dinner: "dinner",
    evening: "evening",
  };
  const key = labels[timeSlot];
  if (key && key in t) {
    return t[key];
  }
  return timeSlot;
}

// Helper to format time display
function formatTime(time?: string, timeSlot?: string): string {
  if (time) return time;
  // Default times based on time slot
  const defaultTimes: Record<string, string> = {
    morning: "10h00",
    lunch: "12h30",
    afternoon: "15h00",
    dinner: "19h30",
    evening: "22h00",
  };
  return timeSlot ? defaultTimes[timeSlot] || "" : "";
}

interface ProgramPdfProps {
  program: Program;
  language?: string;
}

// Helper to get translated day name
function getTranslatedDayName(dayIndex: number, t: Translation): string {
  const dayKeys: (keyof Translation)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const key = dayKeys[dayIndex];
  return key ? t[key] : "";
}

// Helper to get translated month name
function getTranslatedMonthName(monthIndex: number, t: Translation): string {
  const monthKeys: (keyof Translation)[] = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const key = monthKeys[monthIndex];
  return key ? t[key] : "";
}

// Helper to format day date from startDate + dayNumber with translations
function formatDayDate(
  startDate: string | undefined,
  dayNumber: number,
  t: Translation,
  locale: string
): string {
  if (!startDate) return `Jour ${dayNumber}`;

  try {
    const start = new Date(startDate);
    start.setDate(start.getDate() + dayNumber - 1);

    const dayName = getTranslatedDayName(start.getDay(), t);
    const dayNum = start.getDate().toString().padStart(2, "0");
    const month = getTranslatedMonthName(start.getMonth(), t);

    // Capitalize first letter
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    return `${capitalizedDay} ${dayNum} ${month}`;
  } catch {
    return `Jour ${dayNumber}`;
  }
}

export function ProgramPdfDocument({ program, language = "fr" }: ProgramPdfProps) {
  // Get translations for the specified language
  const t = getTranslation(language);
  const locale = getLocale(language);

  // Format dates for display
  const formatProgramDates = () => {
    if (program.startDate && program.endDate) {
      const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      };
      return `${formatDate(program.startDate)} - ${formatDate(program.endDate)}`;
    }

    // Fallback to computed dates from duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + program.duration - 1);

    const formatDate = (d: Date) => {
      return d.toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {program.title || t.programTitle}
          </Text>
          <Text style={styles.headerSubtitle}>
            {program.city.toUpperCase()} | {program.duration} {t.days} |{" "}
            {formatProgramDates()}
          </Text>
        </View>

        {/* Introduction - use translated default if generating for non-French language */}
        <View style={styles.introduction}>
          <Text style={styles.introText}>
            {language !== "fr" ? t.introDefault : (program.introClient || t.introDefault)}
          </Text>
        </View>

        {/* Day by day itinerary */}
        {program.days.map((day) => {
          const dayDateLabel = formatDayDate(program.startDate, day.dayNumber, t, locale);

          return (
          <View key={day.id} style={styles.dayContainer} wrap={false}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayNumber}>{dayDateLabel}</Text>
              {day.themeClient && (
                <Text style={styles.dayTheme}>{day.themeClient}</Text>
              )}
            </View>

            {/* Only show selected activities, skip rest slots (V3: no "Temps libre" mention) */}
            {day.activities.map((activity) => {
              // V3: Skip rest slots completely - no mention in PDF
              if (activity.isRest) return null;

              const selectedOption = activity.options.find(
                (opt) => opt.isSelected
              );
              if (!selectedOption) return null;

              return (
                <View key={activity.id} style={styles.activityContainer}>
                  <View style={styles.activityRow}>
                    <Text style={styles.activityTime}>
                      {formatTime(activity.time, activity.timeSlot)}
                    </Text>
                    <View style={styles.activityContent}>
                      <Text style={styles.venueName}>
                        {selectedOption.venueName}
                      </Text>
                      {selectedOption.venueStyle && (
                        <Text style={styles.venueDetails}>
                          {selectedOption.venueStyle}
                        </Text>
                      )}
                      {selectedOption.venueAddress && (
                        <Text style={styles.venueAddress}>
                          {selectedOption.venueAddress}
                        </Text>
                      )}
                      {/* V11: Phone numbers removed from client-facing PDF */}
                      {activity.conciergeNotes && (
                        <Text style={styles.conciergeNotes}>
                          {activity.conciergeNotes}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )})}


        {/* Closing notes - use translated default if generating for non-French language */}
        <View style={styles.closing}>
          <Text style={styles.closingText}>
            {language !== "fr" ? t.closingDefault : (program.closingClient || t.closingDefault)}
          </Text>
        </View>

        {/* Footer with page number */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {t.confidential}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
