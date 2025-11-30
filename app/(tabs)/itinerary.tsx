import { Colors, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createItineraryICS, generateMalaysiaItinerary, type ItineraryDay, type ItineraryRequest } from '@/services/agent';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import { printToFileAsync } from 'expo-print';

const travelStyles: Array<{ id: ItineraryRequest['travelStyle']; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'mixed', label: 'Mixed', icon: 'sparkles-outline' },
  { id: 'culture', label: 'Culture', icon: 'color-palette-outline' },
  { id: 'food', label: 'Foodie', icon: 'restaurant-outline' },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  { id: 'adventure', label: 'Adventure', icon: 'walk-outline' },
];

const budgetLevels: Array<{ id: ItineraryRequest['budgetLevel']; label: string }> = [
  { id: 'budget', label: 'Budget' },
  { id: 'midrange', label: 'Midrange' },
  { id: 'luxury', label: 'Luxury' },
];

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });

const formatDateInput = (date: Date) => {
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildItineraryPdfHtml = (options: { itinerary: ItineraryDay[]; startingCity: string; tripStartDate: string }) => {
  const { itinerary, startingCity, tripStartDate } = options;
  const daySections = itinerary
    .map((day) => {
      const activities = day.activities
        .map(
          (activity) => `
            <li class="activity">
              <div class="activity-time">${escapeHtml(activity.time)}</div>
              <div>
                <div class="activity-name">${escapeHtml(activity.name)}</div>
                <div class="activity-details">${escapeHtml(activity.details)}</div>
              </div>
            </li>
          `
        )
        .join('');
      const tips = day.tips?.length
        ? `<div class="tips">
            <div class="pill pill-muted">Tips</div>
            <ul>
              ${day.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join('')}
            </ul>
          </div>`
        : '';
      return `
        <section class="day-card">
          <header class="day-header">
            <div class="pill">Day ${day.day}</div>
            <h2>${escapeHtml(day.title)}</h2>
          </header>
          <p class="summary">${escapeHtml(day.summary)}</p>
          <ul class="activities">${activities}</ul>
          ${tips}
        </section>
      `;
    })
    .join('');

  const heroSubtitle = `Start date: ${escapeHtml(tripStartDate || 'TBD')} • ${itinerary.length} day${
    itinerary.length === 1 ? '' : 's'
  }`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #0f172a;
            color: #0f172a;
          }
          .page {
            padding: 32px;
            background: linear-gradient(135deg, #0f172a 0%, #0f172a 25%, #f8fafc 25%, #f8fafc 100%);
            min-height: 100vh;
          }
          .hero {
            background: linear-gradient(120deg, #2563eb, #0ea5e9);
            border-radius: 28px;
            padding: 24px;
            color: #ffffff;
            margin-bottom: 24px;
            box-shadow: 0 15px 35px rgba(37, 99, 235, 0.35);
          }
          .hero h1 {
            margin: 0;
            font-size: 32px;
            letter-spacing: -0.5px;
          }
          .hero p {
            margin: 8px 0 0;
            font-size: 15px;
            opacity: 0.9;
          }
          .hero .meta-row {
            margin-top: 18px;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
          }
          .pill {
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(6px);
            border-radius: 999px;
            padding: 6px 14px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .pill-muted {
            background: rgba(15, 23, 42, 0.08);
            color: #0f172a;
          }
          .content {
            background: #ffffff;
            border-radius: 28px;
            padding: 28px;
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.15);
          }
          .day-card {
            border-radius: 22px;
            padding: 18px;
            border: 1px solid rgba(15, 23, 42, 0.06);
            margin-bottom: 18px;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          }
          .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
          }
          .day-header h2 {
            margin: 0;
            font-size: 22px;
          }
          .summary {
            margin: 0;
            color: #475569;
            line-height: 1.5;
          }
          .activities {
            list-style: none;
            padding: 0;
            margin: 10px 0 0;
          }
          .activities .activity {
            display: grid;
            grid-template-columns: 110px 1fr;
            gap: 14px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(15, 23, 42, 0.08);
          }
          .activities .activity:first-child {
            padding-top: 0;
          }
          .activities .activity:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .activity:last-child {
            padding-bottom: 0;
          }
          .activity-time {
            font-weight: 600;
            color: #0ea5e9;
            font-size: 14px;
          }
          .activity-name {
            font-weight: 600;
            font-size: 16px;
            color: #0f172a;
          }
          .activity-details {
            color: #475569;
            font-size: 13px;
            margin-top: 4px;
            line-height: 1.4;
          }
          .tips {
            margin-top: 18px;
          }
          .tips ul {
            margin: 10px 0 0 18px;
            color: #475569;
          }
          @media print {
            body {
              background: #f8fafc;
            }
            .page {
              padding: 24px;
              background: transparent;
            }
            .hero {
              page-break-inside: avoid;
            }
            .day-card {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <section class="hero">
            <div class="pill">Malaysia Tour Designer</div>
            <h1>${escapeHtml(startingCity)} Itinerary</h1>
            <p>${heroSubtitle}</p>
            <div class="meta-row">
              <span class="pill">Customized travel plan</span>
              <span class="pill">Food • Culture • Nature</span>
            </div>
          </section>
          <section class="content">
            ${daySections}
          </section>
        </div>
      </body>
    </html>
  `;
};

export default function ItineraryScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [startingCity, setStartingCity] = useState('Kuala Lumpur');
  const [days, setDays] = useState('3');
  const [travelStyle, setTravelStyle] = useState<ItineraryRequest['travelStyle']>('mixed');
  const [budgetLevel, setBudgetLevel] = useState<ItineraryRequest['budgetLevel']>('midrange');
  const [mustVisitInput, setMustVisitInput] = useState('');
  const [mustVisit, setMustVisit] = useState<string[]>([]);
  const [tripStartDate, setTripStartDate] = useState(() => formatDateInput(new Date()));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canGenerate = useMemo(() => {
    return startingCity.trim().length > 0 && Number(days) > 0 && !isGenerating;
  }, [startingCity, days, isGenerating]);

  const handleAddMustVisit = useCallback(() => {
    const trimmed = mustVisitInput.trim();
    if (!trimmed) return;
    setMustVisit((prev) => Array.from(new Set([...prev, trimmed])));
    setMustVisitInput('');
  }, [mustVisitInput]);

  const handleRemoveMustVisit = useCallback((tag: string) => {
    setMustVisit((prev) => prev.filter((item) => item !== tag));
  }, []);

  const handleGenerateItinerary = useCallback(async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const result = await generateMalaysiaItinerary({
        startingCity: startingCity.trim(),
        days: Math.min(10, Math.max(1, Number(days))),
        travelStyle: travelStyle ?? 'mixed',
        budgetLevel: budgetLevel ?? 'midrange',
        mustVisit,
      });
      if (!result.length) {
        setErrorMessage('Unable to craft an itinerary right now. Please try again.');
      }
      setItinerary(result);
    } catch (error) {
      console.warn('Itinerary generation failed', error);
      setErrorMessage('Failed to reach the itinerary agent. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  }, [startingCity, days, travelStyle, budgetLevel, mustVisit, canGenerate]);

  const handleExportCalendar = useCallback(async () => {
    if (!itinerary.length) {
      Alert.alert('No itinerary', 'Generate an itinerary before exporting to calendar.');
      return;
    }
    try {
      setIsExporting(true);
      const startDate = new Date(tripStartDate);
      if (Number.isNaN(startDate.getTime())) {
        Alert.alert('Invalid date', 'Enter a valid start date (YYYY-MM-DD).');
        return;
      }
      const ics = createItineraryICS(itinerary, startDate, startingCity);
      const fileUri = FileSystem.cacheDirectory + `itinerary-${Date.now()}.ics`;
      await FileSystem.writeAsStringAsync(fileUri, ics);
      if (Platform.OS === 'web') {
        Alert.alert('Download ICS', 'On web, exporting requires manual download. Copy the file from cache.');
      } else {
        await Share.share({
          url: fileUri,
          message: `Trip itinerary for ${startingCity}`,
          title: 'Add itinerary to calendar',
        });
      }
    } catch (error) {
      console.warn('Calendar export failed', error);
      Alert.alert('Export failed', 'Unable to export to calendar at the moment.');
    } finally {
      setIsExporting(false);
    }
  }, [itinerary, tripStartDate, startingCity]);

  const handleExportPdf = useCallback(async () => {
    if (!itinerary.length) {
      Alert.alert('No itinerary', 'Generate an itinerary before exporting the PDF.');
      return;
    }
    try {
      setIsExportingPdf(true);
      const html = buildItineraryPdfHtml({ itinerary, startingCity, tripStartDate });
      const { uri } = await printToFileAsync({ html });
      if (Platform.OS === 'web') {
        Alert.alert('PDF ready', 'Download the generated itinerary PDF from the browser.');
      } else {
        await Share.share({
          url: uri,
          message: `Trip itinerary for ${startingCity}`,
          title: 'Share itinerary PDF',
        });
      }
    } catch (error) {
      console.warn('Itinerary PDF export failed', error);
      Alert.alert('Export failed', 'Unable to create the itinerary PDF right now.');
    } finally {
      setIsExportingPdf(false);
    }
  }, [itinerary, startingCity, tripStartDate]);

  const headerComponent = (
    <View style={styles.formWrapper}>
      <LinearGradient colors={Gradients.sunrise} style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>Malaysia Tour Designer</Text>
          <Text style={styles.heroTitle}>Build your itinerary</Text>
          <Text style={styles.heroSubtitle}>Malaysia Tour Itinerary Agent</Text>
          <View style={styles.heroPillsRow}>
            <View style={styles.heroPill}>
              <Ionicons name="sparkles" size={14} color="#007dfaff" />
              <Text style={styles.heroPillText}>Food • Culture • Nature</Text>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#00ffb3ff" />
              <Text style={styles.heroPillText}>AI powered</Text>
            </View>
          </View>
        </View>
        <View style={styles.heroIconWrapper}>
          <Ionicons name="map" size={46} color="#FFFFFF" />
          <Ionicons name="airplane" size={24} color="#FFFFFF" style={{ position: 'absolute', bottom: 4, right: -2, opacity: 0.8 }} />
        </View>
      </LinearGradient>

      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <View style={styles.formRow}>
          <View style={styles.formGrow}>
            <Text style={[styles.sectionLabel, { color: theme.mutedText }]}>Starting city</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              value={startingCity}
              onChangeText={setStartingCity}
              placeholder="Kuala Lumpur"
              placeholderTextColor={theme.mutedText}
            />
          </View>
          <View style={styles.formGrow}>
            <Text style={[styles.sectionLabel, { color: theme.mutedText }]}>Start date</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              value={tripStartDate}
              onChangeText={setTripStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.mutedText}
              keyboardType="numbers-and-punctuation"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGrow}>
            <Text style={[styles.sectionLabel, { color: theme.mutedText }]}>Days</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              value={days}
              onChangeText={(text) => setDays(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              placeholder="3"
              placeholderTextColor={theme.mutedText}
              maxLength={2}
            />
          </View>
          <View style={styles.formGrow}>
            <Text style={[styles.sectionLabel, { color: theme.mutedText }]}>Budget</Text>
            <View style={styles.chipRow}>
              {budgetLevels.map((budget) => {
                const active = budgetLevel === budget.id;
                return (
                  <TouchableOpacity
                    key={budget.id}
                    style={[styles.budgetChip, active && { backgroundColor: theme.tint, borderColor: 'transparent' }]}
                    onPress={() => setBudgetLevel(budget.id)}
                  >
                    <Text style={[styles.budgetChipText, { color: active ? '#FFFFFF' : theme.text }]}>
                      {budget.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <View style={styles.formSection}>
          <Text style={[styles.sectionLabel, { color: theme.mutedText }]}>Travel style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {travelStyles.map((style) => {
              const active = travelStyle === style.id;
              return (
                <TouchableOpacity key={style.id} onPress={() => setTravelStyle(style.id)} activeOpacity={0.85}>
                  <LinearGradient
                    colors={active ? Gradients.dusk : (['#E2E8F0', '#E2E8F0'] as const)}
                    style={[styles.travelChip, active && styles.travelChipActive]}
                  >
                    <Ionicons
                      name={style.icon}
                      size={16}
                      color={active ? '#FFFFFF' : '#475569'}
                    />
                    <Text style={[styles.travelChipText, { color: active ? '#FFFFFF' : '#475569' }]}>
                      {style.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.sectionLabel, { color: theme.mutedText }]}>Must-visit stops</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.tagInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              value={mustVisitInput}
              onChangeText={setMustVisitInput}
              placeholder="Add location (e.g. Batu Caves)"
              placeholderTextColor={theme.mutedText}
              onSubmitEditing={handleAddMustVisit}
            />
            <TouchableOpacity style={[styles.addTagButton, { backgroundColor: theme.tint }]} onPress={handleAddMustVisit}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagList}>
            {mustVisit.map((tag) => (
              <View key={tag} style={[styles.tagChip, { borderColor: theme.border, backgroundColor: theme.glass }]}
              >
                <Text style={[styles.tagChipText, { color: theme.text }]}>{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveMustVisit(tag)}>
                  <Ionicons name="close-circle" size={18} color={theme.mutedText} />
                </TouchableOpacity>
              </View>
            ))}
            {mustVisit.length === 0 && (
              <Text style={[styles.emptyTagHint, { color: theme.mutedText }]}>Optional – highlight specific places</Text>
            )}
          </View>
        </View>
      </View>

      {errorMessage && (
        <View style={[styles.errorCard, { backgroundColor: '#FEF2F2', borderColor: '#F87171' }]}> 
          <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
          <Text style={[styles.errorText, { color: '#B91C1C' }]}>{errorMessage}</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleGenerateItinerary}
        disabled={!canGenerate}
        activeOpacity={0.9}
        style={[styles.generateButton, { opacity: canGenerate ? 1 : 0.6 }]}
      >
        <LinearGradient colors={Gradients.rainforest} style={styles.generateButtonGradient}>
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Design itinerary</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleExportCalendar}
        disabled={!itinerary.length || isExporting}
        activeOpacity={0.9}
        style={[styles.exportButton, { opacity: itinerary.length ? 1 : 0.6 }]}
      >
        <LinearGradient colors={Gradients.dusk} style={styles.generateButtonGradient}>
          {isExporting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="calendar" size={18} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Export to calendar</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleExportPdf}
        disabled={!itinerary.length || isExportingPdf}
        activeOpacity={0.9}
        style={[styles.snapshotButton, { opacity: itinerary.length ? 1 : 0.6 }]}
      >
        <LinearGradient colors={Gradients.ocean} style={styles.generateButtonGradient}>
          {isExportingPdf ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="document-text" size={18} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Export itinerary PDF</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      <Text style={[styles.helperText, { color: theme.mutedText }]}>Sample prompt: "Hi! I'm going to Kuala Lumpur for 3 days. I love food, shopping, and taking photos."</Text>
    </View>
  );

  const renderDay = (item: ItineraryDay) => (
    <View
      key={`day-${item.day}-${item.title}`}
      style={[styles.dayCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
    >
      <LinearGradient colors={Gradients.ocean} style={styles.dayCardHeader}>
        <Text style={styles.dayBadgeText}>Day {item.day}</Text>
        <Text style={styles.dayTitle}>{item.title}</Text>
      </LinearGradient>
      <Text style={[styles.daySummary, { color: theme.mutedText }]}>{item.summary}</Text>
      <View style={styles.activitiesList}>
        {item.activities.map((activity, index) => {
          const isLast = index === item.activities.length - 1;
          return (
            <View key={`${item.day}-${activity.time}-${index}`} style={styles.activityRow}>
              <View style={styles.timelineColumn}>
                <View style={styles.timelineDot} />
                {!isLast && <View style={styles.timelineLine} />}
              </View>
              <View style={[styles.activityDetails, isLast && styles.activityDetailsLast]}>
                <View style={[styles.activityTimeChip, { backgroundColor: theme.glass }]}>
                  <Ionicons name="time-outline" size={12} color={theme.tint} />
                  <Text style={[styles.activityTimeText, { color: theme.text }]}>{activity.time}</Text>
                </View>
                <Text style={[styles.activityName, { color: theme.text }]}>{activity.name}</Text>
                <Text style={[styles.activityDescription, { color: theme.mutedText }]}>{activity.details}</Text>
              </View>
            </View>
          );
        })}
      </View>
      {item.tips?.length ? (
        <View style={styles.tipSection}>
          <Text style={[styles.tipHeading, { color: theme.text }]}>Tips</Text>
          {item.tips.map((tip, idx) => (
            <Text key={`${item.day}-tip-${idx}`} style={[styles.tipText, { color: theme.mutedText }]}>
              • {tip}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {headerComponent}
        {itinerary.length
          ? itinerary.map((item) => renderDay(item))
          : !isGenerating && (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={48} color={theme.mutedText} />
                <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Your itinerary will appear here</Text>
                <Text style={[styles.emptyStateSubtitle, { color: theme.mutedText }]}>
                  Fill in the details above and tap &quot;Design itinerary&quot;
                </Text>
              </View>
            )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 80,
    paddingHorizontal: 20,
    gap: 20,
  },
  formWrapper: {
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroEyebrow: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  heroSubtitle: {
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 6,
  },
  heroPillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 16,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroPillText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
  heroIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sectionCard: {
    borderRadius: 24,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  formSection: {
    gap: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGrow: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  budgetChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.12)',
  },
  budgetChipText: {
    fontWeight: '600',
  },
  travelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 12,
    gap: 8,
  },
  travelChipActive: {
    shadowColor: '#00000025',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  travelChipText: {
    fontWeight: '600',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  addTagButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  tagChipText: {
    fontWeight: '600',
  },
  emptyTagHint: {
    fontSize: 13,
    marginTop: 4,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  generateButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  exportButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  snapshotButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  helperText: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  dayCard: {
    borderRadius: 24,
    padding: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dayCardHeader: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  dayBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  daySummary: {
    marginTop: 8,
    fontSize: 14,
  },
  activitiesList: {
    marginTop: 16,
    gap: 14,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineColumn: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0EA5E9',
    borderWidth: 2,
    borderColor: '#ECFEFF',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(14,165,233,0.2)',
    marginTop: 2,
  },
  activityDetails: {
    flex: 1,
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,23,42,0.08)',
  },
  activityDetailsLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  activityTimeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activityTimeText: {
    fontWeight: '600',
    fontSize: 12,
  },
  activityName: {
    fontWeight: '600',
    fontSize: 15,
  },
  activityDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipSection: {
    marginTop: 16,
    gap: 6,
  },
  tipHeading: {
    fontWeight: '700',
    fontSize: 14,
  },
  tipText: {
    fontSize: 13,
  },
});
