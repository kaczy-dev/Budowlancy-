'use client';

import Image from 'next/image';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Trash2, 
  FileDown, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Settings as SettingsIcon, 
  Bell, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Info, 
  Search, 
  ChevronRight, 
  X, 
  Check, 
  DollarSign,
  Briefcase,
  AlertCircle,
  Tag,
  Award,
  Trophy,
  Hammer,
  Wrench,
  Droplet,
  RefreshCw,
  ExternalLink,
  Layers,
  Construction,
  Ruler,
  Paintbrush,
  Camera,
  CameraOff,
  Image as ImageIcon,
  Ban,
  AlertTriangle,
  Upload,
  FileText,
  Copy,
  Moon,
  Calculator,
  Volume2,
  VolumeX,
  Radio,
  MapPin,
  Sparkles,
  Shield,
  Lock,
  Unlock,
  Users,
  CheckSquare,
  XSquare,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- Helper Functions for Formatted Text / AI Markdown ---
const parseBoldText = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-black text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
    }
    // Check for inline code `code`
    const codeParts = part.split(/(`.*?`)/g);
    return codeParts.map((cPart, j) => {
      if (cPart.startsWith('`') && cPart.endsWith('`')) {
        return <code key={j} className="bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">{cPart.slice(1, -1)}</code>;
      }
      return cPart;
    }) as any;
  }) as any;
};

const renderFormattedText = (text: string): React.ReactNode => {
  if (!text) return null;
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, idx) => {
        // Check if header line (starts with ### or ## or #)
        if (line.startsWith('###')) {
          return <h4 key={idx} className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-3 mb-1.5">{line.replace('###', '').trim()}</h4>;
        }
        if (line.startsWith('##') || line.startsWith('#')) {
          return <h3 key={idx} className="text-sm font-black text-amber-500 uppercase tracking-widest mt-4 mb-2">{line.replace(/^#+/, '').trim()}</h3>;
        }
        // Check if list item
        if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
          const cleanLine = line.trim().substring(1).trim();
          return (
            <li key={idx} className="ml-4 list-disc text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed my-1">
              {parseBoldText(cleanLine)}
            </li>
          );
        }
        // Check if numbered list item (e.g. 1.)
        const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed my-1.5 pl-1">
              <span className="text-amber-500 font-black">{numMatch[1]}.</span>
              <span>{parseBoldText(numMatch[2])}</span>
            </div>
          );
        }
        // Normal paragraph
        if (line.trim() === '') return <div key={idx} className="h-2" />;
        return (
          <p key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed my-1">
            {parseBoldText(line)}
          </p>
        );
      })}
    </div>
  );
};

// --- Interfaces ---
interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyName?: string;
}

interface Project {
  id: string;
  name: string;
  clientId?: string;
  description?: string;
  budget?: number;
  status?: 'active' | 'completed' | 'on_hold';
  startDate?: string;
  endDate?: string;
}

interface WorkEntry {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakMinutes: number;
  hourlyRate: number;
  project: string;
  projectId?: string;
  clientId?: string;
  description: string;
  isOvertime: boolean;
  overtimeMultiplier: number;
  workerName?: string;
  location?: string;
  status?: 'pending' | 'approved' | 'rejected';
  category?: string;
}

interface TeamMember {
  name: string;
  role: 'Worker' | 'Manager' | 'Admin';
  hourlyRate: number;
  email: string;
  phone: string;
  rating: string;
  permissions: string[];
}

interface ConstructionTask {
  id: string;
  name: string;
  category: string; // np. Murarstwo, Hydraulika, Elektryka, Wykończenie
  completed: boolean;
  notes?: string;
  longDescription?: string;
  isCritical?: boolean;
  cancelled?: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  project?: string;
  assignedTo?: string;
  isOutdoor?: boolean;
}

interface ConstructionIssueRequest {
  id: string;
  type: 'problem' | 'wniosek';
  title: string;
  description: string;
  projectName: string;
  reportedBy: string;
  status: 'pending' | 'resolved' | 'rejected';
  date: string;
  priority: 'low' | 'medium' | 'high';
  imageUri?: string;
}

interface ConstructionPhoto {
  id: string;
  projectName: string;
  date: string;
  imageUri: string;
  notes?: string;
}

interface AppSettings {
  defaultHourlyRate: number;
  currency: string;
  defaultProject: string;
  taxRatePercent: number;
  reminderEnabled: boolean;
  reminderTime: string; // HH:MM
  projectStartDate?: string; // YYYY-MM-DD
  audioAlertsEnabled?: boolean;
  audioIntervalSeconds?: number;
  projectRates?: Record<string, number>;
  taskRates?: Record<string, number>;
  reminder10AMEnabled?: boolean;
  taskCompletionSound?: string;
  workEndSound?: string;
  weatherAlertsEnabled?: boolean; // New key
}

// --- Helper Functions ---
// Safety helper to normalize Polish characters in PDF generation (Standard PDF Helvetica font doesn't natively support Polish characters unless complex custom fonts are embedded)
const sanitizePolishChars = (text: string): string => {
  const map: { [key: string]: string } = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  };
  return text.split('').map(char => map[char] || char).join('');
};

const formatDuration = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}g ${m}m`;
};

const formatCurrencyValue = (val: number, currency: string) => {
  return `${val.toFixed(2)} ${currency}`;
};

const playNotificationSound = (soundType: string) => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Helper to play a quick note
    const playNote = (freq: number, start: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    switch (soundType) {
      // === TASK COMPLETION SOUNDS ===
      case 'chime':
      case 'success': { // Backward compatibility
        // Pleasant complete chime: two notes rising (E5 -> G5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain1.gain.setValueAtTime(0.12, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.35);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.55);
        break;
      }
      case 'digital': {
        // Fast dual electronic bleep
        playNote(880, 0, 0.1, 'square', 0.04);
        playNote(1760, 0.08, 0.15, 'square', 0.03);
        break;
      }
      case 'laser': {
        // Futuristic high-to-low pitch sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
        break;
      }
      case 'gong': {
        // resonant, industrial synth gong
        playNote(220, 0, 0.8, 'triangle', 0.15);
        playNote(330, 0.02, 0.7, 'sine', 0.1);
        playNote(440, 0.04, 0.6, 'sine', 0.08);
        break;
      }
      case 'tada': {
        // Multi-note happy fanfare: C5 -> E5 -> G5 -> C6
        playNote(523.25, 0, 0.12, 'sine', 0.08);
        playNote(659.25, 0.08, 0.12, 'sine', 0.08);
        playNote(783.99, 0.16, 0.12, 'sine', 0.08);
        playNote(1046.50, 0.24, 0.35, 'sine', 0.1);
        break;
      }

      // === WORK END SOUNDS ===
      case 'bell': {
        // Crystal-clear high-pitch metallic bell
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1254.38, ctx.currentTime); // D#6 bell tone
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.25);
        
        // Minor secondary harmonic for rich resonance
        playNote(1881.57, 0, 0.6, 'sine', 0.05);
        break;
      }
      case 'marimba': {
        // Warm wooden mallet arpeggio
        playNote(261.63, 0, 0.15, 'sine', 0.12); // C4
        playNote(329.63, 0.06, 0.15, 'sine', 0.12); // E4
        playNote(392.00, 0.12, 0.15, 'sine', 0.12); // G4
        playNote(523.25, 0.18, 0.3, 'sine', 0.12); // C5
        break;
      }
      case 'alert': {
        // Serious alternating dual-tone professional beeper
        playNote(660, 0, 0.15, 'square', 0.05);
        playNote(550, 0.18, 0.15, 'square', 0.05);
        playNote(660, 0.36, 0.15, 'square', 0.05);
        playNote(550, 0.54, 0.3, 'square', 0.05);
        break;
      }
      case 'whistle': {
        // Whistle blow
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(2300, ctx.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(2200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
        break;
      }
      case 'cosmic': {
        // Futuristic sci-fi cosmic sound sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
        break;
      }

      // === STOPER INTERVAL SOUND ===
      case 'interval': {
        // Subtle interval alert: soft retro chord/arpeggio (C5 -> E5 -> G5)
        playNote(523.25, 0, 0.3);      // C5
        playNote(659.25, 0.08, 0.3);   // E5
        playNote(783.99, 0.16, 0.4);   // G5
        break;
      }
      
      default:
        // Fallback to success chime
        playNote(659.25, 0, 0.3);
        playNote(783.99, 0.15, 0.3);
    }
  } catch (e) {
    console.warn("Failed to play notification sound", e);
  }
};

// Pure helpers moved outside of component to comply with React 19 purity and performance requirements
const calculateEntryHours = (entry: WorkEntry): number => {
  const [startH, startM] = entry.startTime.split(':').map(Number);
  const [endH, endM] = entry.endTime.split(':').map(Number);
  
  let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (totalMinutes < 0) {
    // Handles night shifts going past midnight (e.g. 22:00 to 06:00)
    totalMinutes += 24 * 60;
  }
  
  const activeMinutes = Math.max(0, totalMinutes - entry.breakMinutes);
  return activeMinutes / 60;
};

const calculateEntryEarnings = (entry: WorkEntry): number => {
  const hours = calculateEntryHours(entry);
  const multiplier = entry.isOvertime ? entry.overtimeMultiplier : 1;
  return hours * entry.hourlyRate * multiplier;
};

const getRateForProjectOrTask = (project: string, description: string, settings: AppSettings): number => {
  const normProject = (project || '').trim().toLowerCase();
  const normDesc = (description || '').trim().toLowerCase();

  // 1. Check for task/job rate exact match or substring match
  if (settings.taskRates) {
    for (const [taskKey, rate] of Object.entries(settings.taskRates)) {
      if (taskKey && rate > 0) {
        const normTaskKey = taskKey.trim().toLowerCase();
        if (normDesc.includes(normTaskKey) || normTaskKey.includes(normDesc)) {
          return rate;
        }
      }
    }
  }

  // 2. Check for project rate exact match or substring match
  if (settings.projectRates) {
    for (const [projKey, rate] of Object.entries(settings.projectRates)) {
      if (projKey && rate > 0) {
        const normProjKey = projKey.trim().toLowerCase();
        if (normProject === normProjKey || normProject.includes(normProjKey)) {
          return rate;
        }
      }
    }
  }

  // 3. Fallback to default rate
  return settings.defaultHourlyRate;
};

interface BuilderTip {
  topic: string;
  tip: string;
  sources: Array<{ title: string; url: string }>;
}

const LOCAL_BUILDER_TIPS: BuilderTip[] = [
  {
    topic: "Czas wiązania betonu C20/25",
    tip: "Pełną wytrzymałość normową beton C20/25 uzyskuje po 28 dniach dojrzewania w temperaturze ok. 20°C i wilgotności powyżej 95%. Rozszalowanie stropów można bezpiecznie wykonać zazwyczaj po 14-21 dniach.",
    sources: [
      { title: "Norma PN-EN 206 - Beton", url: "https://www.pkn.pl" },
      { title: "Poradnik Budowlany Murator", url: "https://muratordom.pl" }
    ]
  },
  {
    topic: "Praca na rusztowaniach - BHP",
    tip: "Przed rozpoczęciem prac na rusztowaniu wymagany jest formalny odbiór techniczny wpisany w dzienniku budowy. Każde stanowisko robocze powyżej 1m wysokości musi mieć poręcz ochronną (1,1 m), krawężnik (0,15 m) i poprzeczkę pośrednią.",
    sources: [
      { title: "Państwowa Inspekcja Pracy", url: "https://www.pip.gov.pl" },
      { title: "Rozporządzenie Ministra Infrastruktury", url: "https://www.gov.pl" }
    ]
  },
  {
    topic: "Wykopy ziemne i zabezpieczenia",
    tip: "Wykopy o głębokości powyżej 1,0 m bez podpór są bezwzględnie zabronione. Przy głębokości powyżej 2,0 m należy stosować pełne deskowanie i rozparcie ścian (np. szalunki boksowe), a wejście zabezpieczyć stabilną drabiną.",
    sources: [
      { title: "Zasady bezpiecznych wykopów - PIP", url: "https://www.pip.gov.pl" },
      { title: "Główny Urząd Nadzoru Budowlanego", url: "https://www.gunb.gov.pl" }
    ]
  },
  {
    topic: "Pył krzemionkowy przy cięciu betonu",
    tip: "Wdychanie drobnego pyłu krzemionkowego prowadzi do pylicy płuc. Zawsze stosuj cięcie na mokro w celu eliminacji zapylenia u źródła, a przy braku takiej możliwości – półmaski filtrujące klasy FFP3 oraz odciąg pyłu.",
    sources: [
      { title: "Centralny Instytut Ochrony Pracy", url: "https://www.ciop.pl" },
      { title: "Zagrożenia pyłowe - PIP", url: "https://www.pip.gov.pl" }
    ]
  },
  {
    topic: "Prace na wysokości i szelki bezpieczeństwa",
    tip: "Szelki bezpieczeństwa są wymagane przy pracach na wysokości powyżej 2 metrów bez barier ochronnych. Punkt kotwiczenia linki bezpieczeństwa z amortyzatorem musi znajdować się powyżej głowy pracownika i wytrzymywać min. 12 kN.",
    sources: [
      { title: "Środki Ochrony Indywidualnej - CIOP", url: "https://www.ciop.pl" }
    ]
  },
  {
    topic: "Wylewka samopoziomująca pod płytki",
    tip: "Optymalna grubość wylewki samopoziomującej wynosi 3-15 mm. Układanie płytek można rozpocząć przy wilgotności szczątkowej poniżej 2% (metoda CM) dla podłoży cementowych i poniżej 0,5% dla podłoży anhydrytowych.",
    sources: [
      { title: "Technologie budowlane Atlas", url: "https://www.atlas.com.pl" }
    ]
  },
  {
    topic: "Pielęgnacja betonu w niskich temperaturach",
    tip: "Dojrzewanie betonu poniżej 5°C ulega spowolnieniu, a poniżej -4°C całkowicie ustaje. Zimą stosuj cementy o wysokim cieple hydratacji, plastyfikatory przeciwmrozowe, ciepłą wodę oraz przykrywaj elementy matami PE.",
    sources: [
      { title: "Pielęgnacja zimowa betonu", url: "https://www.polskibeton.pl" }
    ]
  },
  {
    topic: "Dźwiganie ciężarów na budowie - BHP",
    tip: "Dla mężczyzn dopuszczalna masa ładunku przy pracy stałej wynosi 30 kg, a dorywczej – maks. 50 kg. Podnoszenie ciężarów powinno odbywać się wyłącznie z przysiadu przy prostych plecach, aby chronić kręgosłup.",
    sources: [
      { title: "Ręczne prace transportowe - PIP", url: "https://www.pip.gov.pl" }
    ]
  },
  {
    topic: "Oparzenia chemiczne wapnem lub cementem",
    tip: "Wapno hydratyzowane i mokry cement mają silny odczyn zasadowy (pH do 13) i mogą wywołać ciężkie oparzenia chemiczne skóry i oczu. W przypadku kontaktu należy natychmiast płukać wodą przez min. 15 minut.",
    sources: [
      { title: "Karty charakterystyki spoiw - CIOP", url: "https://www.ciop.pl" }
    ]
  },
  {
    topic: "Zagęszczanie betonu wibratorem buławowym",
    tip: "Wibrowanie powinno trwać zwykle 5-15 sekund – do momentu gdy powierzchnia ściemnieje i przestaną wydzielać się pęcherzyki. Nie dotykaj buławą zbrojenia i nie przeciągaj mieszanki poziomo.",
    sources: [
      { title: "Zagęszczanie mieszanki betonowej", url: "https://www.instytutbudowlany.pl" }
    ]
  },
  {
    topic: "Użytkowanie drabin na budowie",
    tip: "Drabina przystawna musi być ustawiona pod kątem 65-75 stopni i wystawać min. 1 m ponad krawędź wykopu lub stropu. Zabrania się wchodzenia z ciężarem pow. 10 kg lub wykonywania ciężkich prac dorywczych.",
    sources: [
      { title: "BHP przy drabinach przenośnych - PIP", url: "https://www.pip.gov.pl" }
    ]
  },
  {
    topic: "Bezpieczeństwo pilarek tarczowych",
    tip: "Pilarki tarczowe muszą bezwzględnie posiadać sprawny klin rozdzielający oraz sprawną osłonę tarczy tnącej. Do popychania małych i wąskich elementów należy zawsze używać dedykowanego popychacza.",
    sources: [
      { title: "Maszyny do obróbki drewna - PIP", url: "https://www.pip.gov.pl" }
    ]
  }
];

const generateUniqueId = (): string => {
  return 'entry-' + Math.random().toString(36).substring(2, 11);
};

export default function WorkTrackerApp() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // --- Polish Date Formatting for Bento Header ---
  const formattedTodayDate = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const d = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const str = d.toLocaleDateString('pl-PL', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, []);

  // --- Dynamic Shift & Encouraging Quotes State ---
  const currentShift = useMemo(() => {
    if (typeof window === 'undefined') {
      return { name: 'Szychta Poranna', emoji: '🌅', desc: 'Rozpoczynamy dzień od solidnego fundamentu!', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    }
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) {
      return {
        name: 'Szychta Poranna',
        emoji: '🌅',
        desc: 'Rozpoczynamy dzień od solidnego fundamentu. Kawa w dłoń i na rusztowanie!',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      };
    } else if (hour >= 14 && hour < 22) {
      return {
        name: 'Szychta Popołudniowa',
        emoji: '🌇',
        desc: 'Praca wre, słońce opada, ale tempo nie zwalnia. Bezpieczeństwo przede wszystkim!',
        color: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      };
    } else {
      return {
        name: 'Szychta Nocna',
        emoji: '🌃',
        desc: 'Cisza nocna na budowie, ale czujność i planowanie kolejnego dnia nigdy nie śpią.',
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
      };
    }
  }, []);

  // --- Core States (Lazily Initialized) ---
  const [entries, setEntries] = useState<WorkEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('work_entries');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse work entries from localStorage');
        }
      }
      // Return high-quality mock data on first load
      const initialMock: WorkEntry[] = [
        {
          id: 'mock-1',
          date: '2026-07-10',
          startTime: '08:00',
          endTime: '16:30',
          breakMinutes: 30,
          hourlyRate: 80,
          project: 'Projekt Alpha',
          description: 'Projektowanie architektury systemu i bazy danych',
          isOvertime: false,
          overtimeMultiplier: 1.5
        },
        {
          id: 'mock-2',
          date: '2026-07-12',
          startTime: '09:00',
          endTime: '17:00',
          breakMinutes: 15,
          hourlyRate: 80,
          project: 'Projekt Alpha',
          description: 'Kodowanie responsywnego interfejsu mobilnego',
          isOvertime: false,
          overtimeMultiplier: 1.5
        },
        {
          id: 'mock-3',
          date: '2026-07-13',
          startTime: '08:30',
          endTime: '18:00',
          breakMinutes: 30,
          hourlyRate: 95,
          project: 'Aplikacja SaaS',
          description: 'Implementacja logiki pracy offline i synchronizacji',
          isOvertime: true,
          overtimeMultiplier: 1.5
        },
        {
          id: 'mock-4',
          date: '2026-07-14',
          startTime: '10:00',
          endTime: '15:30',
          breakMinutes: 0,
          hourlyRate: 95,
          project: 'Aplikacja SaaS',
          description: 'Spotkanie projektowe i planowanie sprintu',
          isOvertime: false,
          overtimeMultiplier: 1.5
        }
      ];
      localStorage.setItem('work_entries', JSON.stringify(initialMock));
      return initialMock;
    }
    return [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    let parsed: any = {};
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('app_settings');
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch (e) {}
      }
    }
    return {
      defaultHourlyRate: parsed.defaultHourlyRate ?? 75,
      currency: parsed.currency ?? 'PLN',
      defaultProject: parsed.defaultProject ?? 'Budowa Domu',
      taxRatePercent: parsed.taxRatePercent ?? 12,
      reminderEnabled: parsed.reminderEnabled ?? true,
      reminderTime: parsed.reminderTime ?? '17:00',
      reminder10AMEnabled: parsed.reminder10AMEnabled ?? true,
      projectStartDate: parsed.projectStartDate ?? '2026-07-01',
      audioAlertsEnabled: parsed.audioAlertsEnabled ?? true,
      audioIntervalSeconds: parsed.audioIntervalSeconds ?? 3600,
      taskCompletionSound: parsed.taskCompletionSound ?? 'chime',
      workEndSound: parsed.workEndSound ?? 'bell',
      weatherAlertsEnabled: parsed.weatherAlertsEnabled ?? true,
      projectRates: parsed.projectRates ?? {
        'Budowa Domu': 80,
        'Remont Piwnicy': 90
      },
      taskRates: parsed.taskRates ?? {
        'murowanie': 100,
        'hydraulika': 95,
        'tynkowanie': 85
      }
    };
  });

  const [activeTab, setActiveTab] = useState<'today' | 'construction' | 'history' | 'stats' | 'settings' | 'projects'>('today');

  // --- Client State ---
  const [clients, setClients] = useState<Client[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('app_clients');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
      const initialMock: Client[] = [
        { id: 'client-1', name: 'Jan Kowalski-Nieruchomości', companyName: 'Kowalski Dev', email: 'jan@kowalski.pl', phone: '+48 500 600 700', address: 'Warszawa, ul. Złota 44' },
        { id: 'client-2', name: 'Anna Nowak-Prywatny', companyName: '', email: 'anna@nowak.pl', phone: '+48 600 700 800', address: 'Kraków, ul. Floriańska 12' }
      ];
      localStorage.setItem('app_clients', JSON.stringify(initialMock));
      return initialMock;
    }
    return [];
  });

  const saveClients = (newClients: Client[]) => {
    setClients(newClients);
    localStorage.setItem('app_clients', JSON.stringify(newClients));
  };

  // --- Project State ---
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('app_projects');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
      const initialMock: Project[] = [
        { id: 'proj-1', name: 'Budowa Domu', clientId: 'client-1', description: 'Budowa domu jednorodzinnego w technologii murowanej', budget: 450000, status: 'active', startDate: '2026-07-01', endDate: '2027-06-30' },
        { id: 'proj-2', name: 'Remont Piwnicy', clientId: 'client-2', description: 'Adaptacja piwnicy na domową siłownię i spiżarnię', budget: 35000, status: 'active', startDate: '2026-07-05', endDate: '2026-08-31' }
      ];
      localStorage.setItem('app_projects', JSON.stringify(initialMock));
      return initialMock;
    }
    return [];
  });

  const saveProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    localStorage.setItem('app_projects', JSON.stringify(newProjects));
  };

  // --- Category State ---
  const [categories, setCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('app_categories');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
    }
    return ['Spotkania', 'Praca projektowa', 'Administracja', 'Montaż', 'Wykończenie'];
  });

  const saveCategories = (newCategories: string[]) => {
    setCategories(newCategories);
    localStorage.setItem('app_categories', JSON.stringify(newCategories));
  };

  // --- Project & Client Form States ---
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<'active' | 'completed' | 'on_hold'>('active');
  const [newProjectStart, setNewProjectStart] = useState('');
  const [newProjectEnd, setNewProjectEnd] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Report filters
  const [reportProject, setReportProject] = useState('All');
  const [reportClient, setReportClient] = useState('All');
  const [reportWorker, setReportWorker] = useState('All');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  const [projectSubTab, setProjectSubTab] = useState<'projects' | 'team' | 'clients' | 'reports'>('projects');
  const [teamActiveTab, setTeamActiveTab] = useState<'approvals' | 'matrix' | 'payroll'>('approvals');
  const [editingTeamMemberName, setEditingTeamMemberName] = useState<string | null>(null);
  const [editingTeamMemberRate, setEditingTeamMemberRate] = useState<number>(0);
  const [editingTeamMemberRole, setEditingTeamMemberRole] = useState<'Worker' | 'Manager' | 'Admin'>('Worker');

  // --- Construction Tasks State ---
  const [tasks, setTasks] = useState<ConstructionTask[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('construction_tasks');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
      const initialMock: ConstructionTask[] = [
        { id: 'task-1', name: 'Wytyczenie budynku i wykopy pod fundamenty', category: 'Murarstwo', completed: true, notes: 'Zakończone przez geodetę', dueDate: '2026-07-05', priority: 'medium', project: 'Budowa Domu', assignedTo: 'Jan Kowalski', isOutdoor: true },
        { id: 'task-2', name: 'Wylewanie fundamentów i ław', category: 'Murarstwo', completed: true, notes: 'Fundamenty zalane prawidłowo', isCritical: true, dueDate: '2026-07-08', priority: 'high', project: 'Budowa Domu', assignedTo: 'Tomasz Nowak', isOutdoor: true },
        { id: 'task-3', name: 'Murowanie ścian konstrukcyjnych parteru', category: 'Murarstwo', completed: false, notes: 'Czeka na transport pustaka', isCritical: true, dueDate: '2026-07-10', priority: 'high', project: 'Budowa Domu', assignedTo: 'Jan Kowalski', isOutdoor: true },
        { id: 'task-4', name: 'Rozprowadzenie rur odpływowych w piwnicy', category: 'Hydraulika', completed: false, notes: 'Wymaga cięcia betonu', dueDate: '2026-07-14', priority: 'medium', project: 'Remont Piwnicy', assignedTo: 'Mariusz Wiśniewski', isOutdoor: false },
        { id: 'task-5', name: 'Ułożenie przewodów elektrycznych pod tynki', category: 'Elektryka', completed: false, notes: 'Anulowane z powodu zmiany projektu', cancelled: true, dueDate: '2026-07-18', priority: 'low', project: 'Budowa Domu', assignedTo: 'Krzysztof Wójcik', isOutdoor: false },
        { id: 'task-6', name: 'Tynkowanie i przygotowanie gładzi', category: 'Wykończenie', completed: false, notes: 'Po zamknięciu prac instalacyjnych', dueDate: '2026-07-25', priority: 'medium', project: 'Remont Piwnicy', assignedTo: 'Piotr Kamiński', isOutdoor: false }
      ];
      localStorage.setItem('construction_tasks', JSON.stringify(initialMock));
      return initialMock;
    }
    return [];
  });

  const [lastCompletedTaskId, setLastCompletedTaskId] = useState<string | null>(null);
  const [earningsChartType, setEarningsChartType] = useState<'linear' | 'bar'>('linear');

  // --- Weather Forecast State ---
  const [weatherForecast, setWeatherForecast] = useState<Record<string, 'sunny' | 'cloudy' | 'rainy' | 'stormy'>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('weather_forecast');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
      // Generate default 7 days forecast
      const forecast: Record<string, 'sunny' | 'cloudy' | 'rainy' | 'stormy'> = {};
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + i);
        const dateStr = nextDay.toLocaleDateString('sv'); // YYYY-MM-DD
        if (i === 1 || i === 4) {
          forecast[dateStr] = 'rainy';
        } else if (i === 3) {
          forecast[dateStr] = 'stormy';
        } else if (i === 2) {
          forecast[dateStr] = 'cloudy';
        } else {
          forecast[dateStr] = 'sunny';
        }
      }
      localStorage.setItem('weather_forecast', JSON.stringify(forecast));
      return forecast;
    }
    return {};
  });

  const saveWeatherForecast = (newForecast: Record<string, 'sunny' | 'cloudy' | 'rainy' | 'stormy'>) => {
    setWeatherForecast(newForecast);
    localStorage.setItem('weather_forecast', JSON.stringify(newForecast));
  };

  // --- Construction Photos (Gallery) State ---
  const [photos, setPhotos] = useState<ConstructionPhoto[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('construction_photos');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
      const initialMock: ConstructionPhoto[] = [
        { 
          id: 'photo-1', 
          projectName: 'Budowa Domu', 
          date: '2026-07-12', 
          imageUri: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80', 
          notes: 'Rozpoczęcie murowania ścian nośnych parteru.' 
        },
        { 
          id: 'photo-2', 
          projectName: 'Budowa Domu', 
          date: '2026-07-14', 
          imageUri: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80', 
          notes: 'Rozprowadzenie instalacji hydraulicznej i pionów.' 
        }
      ];
      localStorage.setItem('construction_photos', JSON.stringify(initialMock));
      return initialMock;
    }
    return [];
  });

  const savePhotos = (newPhotos: ConstructionPhoto[]) => {
    setPhotos(newPhotos);
    localStorage.setItem('construction_photos', JSON.stringify(newPhotos));
  };

  // Form states for tasks
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Murarstwo');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskLongDescription, setNewTaskLongDescription] = useState('');
  const [newTaskIsCritical, setNewTaskIsCritical] = useState<boolean>(false);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskProject, setNewTaskProject] = useState<string>('');
  const [newTaskIsOutdoor, setNewTaskIsOutdoor] = useState<boolean>(false);

  // Task grouping and sorting options
  const [taskGroupMode, setTaskGroupMode] = useState<'none' | 'category' | 'project'>('none');
  const [taskSortMode, setTaskSortMode] = useState<'default' | 'priority' | 'dueDate' | 'name'>('priority');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  const saveTasks = (newTasks: ConstructionTask[]) => {
    setTasks(newTasks);
    localStorage.setItem('construction_tasks', JSON.stringify(newTasks));
  };
  
  // --- Construction Site Log (Dziennik Budowy) States ---
  const [siteLogs, setSiteLogs] = useState<Array<{ id: string; date: string; project: string; type: 'info' | 'delivery' | 'inspection' | 'issue' | 'bhp'; text: string; author: string }>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('construction_site_logs');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
      const initialMock = [
        { id: 'log-1', date: '2026-07-15', project: 'Budowa Domu', type: 'delivery', text: 'Dostawa 15 palet pustaka Porotherm 25 oraz 10 worków zaprawy murarskiej.', author: 'Jan Kowalski' },
        { id: 'log-2', date: '2026-07-16', project: 'Budowa Domu', type: 'bhp', text: 'Szkolenie stanowiskowe BHP dla nowych monterów instalacji.', author: 'Tomasz Nowak' },
        { id: 'log-3', date: '2026-07-18', project: 'Remont Piwnicy', type: 'inspection', text: 'Odbiór techniczny instalacji odpływowej przez kierownika robót. Brak uwag.', author: 'Mariusz Wiśniewski' }
      ];
      localStorage.setItem('construction_site_logs', JSON.stringify(initialMock));
      return initialMock;
    }
    return [];
  });

  const saveSiteLogs = (newLogs: typeof siteLogs) => {
    setSiteLogs(newLogs);
    localStorage.setItem('construction_site_logs', JSON.stringify(newLogs));
  };

  const [newLogText, setNewLogText] = useState('');
  const [newLogType, setNewLogType] = useState<'info' | 'delivery' | 'inspection' | 'issue' | 'bhp'>('info');
  const [newLogProject, setNewLogProject] = useState('Budowa Domu');
  const [newLogAuthor, setNewLogAuthor] = useState('Kierownik');

  // --- Calculator States ---
  const [calcConcreteType, setCalcConcreteType] = useState<'slab' | 'column'>('slab');
  const [calcLength, setCalcLength] = useState('5');
  const [calcWidth, setCalcWidth] = useState('4');
  const [calcDepth, setCalcDepth] = useState('0.15');
  const [calcDiameter, setCalcDiameter] = useState('0.3');
  const [calcHeight, setCalcHeight] = useState('2.5');

  const [calcWallArea, setCalcWallArea] = useState('50');
  const [calcBrickType, setCalcBrickType] = useState<'porotherm' | 'silka' | 'brick'>('porotherm');
  const [calcWaste, setCalcWaste] = useState('5');

  // --- BHP Checklist State ---
  const [bhpChecked, setBhpChecked] = useState<Record<string, boolean>>({
    'odziez': true,
    'wykopy': false,
    'maszyny': true,
    'gasnica': false,
    'instalacja': false,
    'pasy': false
  });
  
  // Offline State (combines browser status with user custom override toggle for testing)
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });
  const [forceOffline, setForceOffline] = useState<boolean>(false);
  const isOffline = !isBrowserOnline || forceOffline;

  // --- Timer State (Lazily hydrated to avoid useEffect setState cascades) ---
  const [timerRunning, setTimerRunning] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('timer_running') === 'true';
    }
    return false;
  });

  const [timerStartTime, setTimerStartTime] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('timer_start_time');
      return stored ? parseInt(stored, 10) : null;
    }
    return null;
  });

  const [timerElapsedSeconds, setTimerElapsedSeconds] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const storedRunning = localStorage.getItem('timer_running') === 'true';
      const storedStart = localStorage.getItem('timer_start_time');
      if (storedRunning && storedStart) {
        const startTime = parseInt(storedStart, 10);
        return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      }
    }
    return 0;
  });

  const [timerProject, setTimerProject] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const storedProj = localStorage.getItem('timer_project');
      if (storedProj) return storedProj;
      const storedSettings = localStorage.getItem('app_settings');
      if (storedSettings) {
        try {
          return JSON.parse(storedSettings).defaultProject || 'Budowa Domu';
        } catch (e) {}
      }
    }
    return 'Budowa Domu';
  });

  const [timerDescription, setTimerDescription] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('timer_description') || '';
    }
    return '';
  });
  
  // --- UI Interactive States ---
  const [animationMode, setAnimationMode] = useState<'blueprint' | 'crane' | 'concrete' | 'excavator'>('blueprint');
  const [conSubTab, setConSubTab] = useState<'tasks' | 'calculators' | 'team' | 'issues' | 'logs' | 'calculator' | 'gallery' | 'ai'>('tasks');

  // --- Plaster Calculator States ---
  const [calcPlasterArea, setCalcPlasterArea] = useState('40');
  const [calcPlasterThickness, setCalcPlasterThickness] = useState('15'); // mm
  const [calcPlasterType, setCalcPlasterType] = useState<'cement' | 'gypsum'>('cement');

  // --- Szybka Szychta Calculator States ---
  const [szychtaStart, setSzychtaStart] = useState('07:00');
  const [szychtaEnd, setSzychtaEnd] = useState('15:00');
  const [szychtaBreak, setSzychtaBreak] = useState(30);
  const [szychtaRate, setSzychtaRate] = useState(35);
  const [szychtaOvertime, setSzychtaOvertime] = useState(false);
  const [szychtaOvertimeMultiplier, setSzychtaOvertimeMultiplier] = useState(1.5);

  // --- AI Construction Assistant States ---
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  
  // --- Calculator States ---
  const [calcSelectedMonth, setCalcSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [calcCustomDays, setCalcCustomDays] = useState<string>('');
  const [calcDailyHours, setCalcDailyHours] = useState<number>(8);
  const [calcHourlyRate, setCalcHourlyRate] = useState<string>('50');
  const [calcUnpaidDays, setCalcUnpaidDays] = useState<number>(0);
  const [calcOvertimeHours, setCalcOvertimeHours] = useState<number>(0);
  const [calcOvertimeRateMultiplier, setCalcOvertimeRateMultiplier] = useState<number>(1.5);

  // --- Team, Employees, Location, Compact View and Issues States ---
  const EMPLOYEES = useMemo(() => ['Jan Kowalski', 'Tomasz Nowak', 'Mariusz Wiśniewski', 'Krzysztof Wójcik', 'Piotr Kamiński', 'Marek Lewandowski'], []);
  const [currentWorker, setCurrentWorker] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('current_worker') || 'Jan Kowalski';
    }
    return 'Jan Kowalski';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_worker', currentWorker);
    }
  }, [currentWorker]);

  const [currentUserRole, setCurrentUserRole] = useState<'Worker' | 'Manager' | 'Admin'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('current_user_role') as any) || 'Admin';
    }
    return 'Admin';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_user_role', currentUserRole);
    }
  }, [currentUserRole]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('team_members_configs');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
    }
    const initialMembers: TeamMember[] = [
      { name: 'Jan Kowalski', role: 'Worker', hourlyRate: 45, email: 'jan@kowalski.pl', phone: '+48 500 600 700', rating: '⭐️ 4.9', permissions: ['submit_hours', 'edit_own_hours'] },
      { name: 'Tomasz Nowak', role: 'Worker', hourlyRate: 55, email: 'tomasz@nowak.pl', phone: '+48 600 700 800', rating: '⭐️ 5.0', permissions: ['submit_hours', 'edit_own_hours'] },
      { name: 'Mariusz Wiśniewski', role: 'Worker', hourlyRate: 28, email: 'mariusz@wisniewski.pl', phone: '+48 700 800 900', rating: '⭐️ 4.5', permissions: ['submit_hours', 'edit_own_hours'] },
      { name: 'Krzysztof Wójcik', role: 'Worker', hourlyRate: 40, email: 'krzysztof@wojcik.pl', phone: '+48 800 900 100', rating: '⭐️ 4.7', permissions: ['submit_hours', 'edit_own_hours'] },
      { name: 'Piotr Kamiński', role: 'Manager', hourlyRate: 60, email: 'piotr@kaminski.pl', phone: '+48 900 100 200', rating: '⭐️ 4.8', permissions: ['submit_hours', 'edit_own_hours', 'edit_all_hours', 'approve_hours'] },
      { name: 'Marek Lewandowski', role: 'Admin', hourlyRate: 80, email: 'marek@lewandowski.pl', phone: '+48 100 200 300', rating: '⭐️ 4.9', permissions: ['submit_hours', 'edit_own_hours', 'edit_all_hours', 'approve_hours', 'manage_roles'] },
    ];
    if (typeof window !== 'undefined') {
      localStorage.setItem('team_members_configs', JSON.stringify(initialMembers));
    }
    return initialMembers;
  });

  const saveTeamMembers = (updated: TeamMember[]) => {
    setTeamMembers(updated);
    localStorage.setItem('team_members_configs', JSON.stringify(updated));
  };

  const [taskFilterWorker, setTaskFilterWorker] = useState<'all' | 'mine'>('all');
  const [taskCompactView, setTaskCompactView] = useState<boolean>(false);
  const [timerLocation, setTimerLocation] = useState<string>('');
  const [manualLocation, setManualLocation] = useState<string>('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string>('Jan Kowalski');

  // Issues and Requests states
  const [issuesRequests, setIssuesRequests] = useState<ConstructionIssueRequest[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('construction_issues');
      if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
      }
      const initialMock: ConstructionIssueRequest[] = [
        {
          id: 'issue-1',
          type: 'problem',
          title: 'Uszkodzona tarcza piły do betonu',
          description: 'Podczas prac hydraulicznych w piwnicy pękła tarcza diamentowa. Potrzebny pilny zakup nowej (średnica 350mm).',
          projectName: 'Remont Piwnicy',
          reportedBy: 'Mariusz Wiśniewski',
          status: 'pending',
          date: '2026-07-16',
          priority: 'high'
        },
        {
          id: 'issue-2',
          type: 'wniosek',
          title: 'Zamówienie dodatkowego kontenera na gruz',
          description: 'Obecny kontener jest zapełniony w 90%. Prośba o podstawienie nowego kontenera 7m3 na jutro rano.',
          projectName: 'Budowa Domu',
          reportedBy: 'Tomasz Nowak',
          status: 'resolved',
          date: '2026-07-15',
          priority: 'medium'
        }
      ];
      localStorage.setItem('construction_issues', JSON.stringify(initialMock));
      return initialMock;
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('construction_issues', JSON.stringify(issuesRequests));
    }
  }, [issuesRequests]);

  // Issue reporting form states
  const [showAddIssueForm, setShowAddIssueForm] = useState<boolean>(false);
  const [newIssueType, setNewIssueType] = useState<'problem' | 'wniosek'>('problem');
  const [newIssueTitle, setNewIssueTitle] = useState<string>('');
  const [newIssueDesc, setNewIssueDesc] = useState<string>('');
  const [newIssueProject, setNewIssueProject] = useState<string>('');
  const [newIssuePriority, setNewIssuePriority] = useState<'low' | 'medium' | 'high'>('medium');

  const [showAddTaskForm, setShowAddTaskForm] = useState<boolean>(false);
  const [showImportForm, setShowImportForm] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [pastedImportText, setPastedImportText] = useState<string>('');
  const [parsedPreviewTasks, setParsedPreviewTasks] = useState<ConstructionTask[]>([]);
  const [showAddPhotoForm, setShowAddPhotoForm] = useState<boolean>(false);
  const [newPhotoProject, setNewPhotoProject] = useState<string>('');
  const [newPhotoNotes, setNewPhotoNotes] = useState<string>('');
  const [newPhotoDate, setNewPhotoDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new Date().toISOString().split('T')[0];
    }
    return '';
  });
  const [selectedFullPhoto, setSelectedFullPhoto] = useState<ConstructionPhoto | null>(null);
  const [galleryProjectFilter, setGalleryProjectFilter] = useState<string>('all');
  
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [showManualForm, setShowManualForm] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyProjectFilter, setHistoryProjectFilter] = useState<string>('All');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>('All');

  // --- Manual Entry Form State ---
  const [manualDate, setManualDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new Date().toISOString().split('T')[0];
    }
    return '';
  });
  const [manualStart, setManualStart] = useState<string>('08:00');
  const [manualEnd, setManualEnd] = useState<string>('16:00');
  const [manualBreak, setManualBreak] = useState<number>(0);

  // --- Daily Hours Target ---
  const [dailyTargetHours, setDailyTargetHours] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('daily_target_hours');
      return stored ? parseFloat(stored) : 8;
    }
    return 8;
  });

  const [showVisualToys, setShowVisualToys] = useState<boolean>(false);

  // --- Dark Mode State ---
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dark_mode');
      return stored !== null ? stored === 'true' : true;
    }
    return true;
  });

  // --- Builder's Tip (Podpowiedź Budowlańca) States ---
  const [builderTip, setBuilderTip] = useState<string>('');
  const [builderTipTopic, setBuilderTipTopic] = useState<string>('');
  const [builderTipSources, setBuilderTipSources] = useState<Array<{ title: string; url: string }>>([]);
  const [builderTipLoading, setBuilderTipLoading] = useState<boolean>(false);
  const [builderTipError, setBuilderTipError] = useState<string>('');

  const fetchBuilderTip = () => {
    setBuilderTipLoading(true);
    setBuilderTipError('');
    // Simulate a tiny, ultra-responsive 350ms delay to make the spinner transition beautifully
    const timer = setTimeout(() => {
      try {
        const randomIndex = Math.floor(Math.random() * LOCAL_BUILDER_TIPS.length);
        const selected = LOCAL_BUILDER_TIPS[randomIndex];
        setBuilderTip(selected.tip);
        setBuilderTipTopic(selected.topic);
        setBuilderTipSources(selected.sources);
      } catch (err: any) {
        setBuilderTipError('Nie udało się załadować porady budowlanej.');
      } finally {
        setBuilderTipLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  };

  const handleAskAi = async (customPrompt?: string) => {
    const queryToUse = customPrompt || aiQuery;
    if (!queryToUse.trim()) return;

    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: queryToUse })
      });
      const data = await res.json();
      if (data.error) {
        setAiResponse(`**Błąd:** ${data.error}`);
      } else {
        setAiResponse(data.text);
      }
    } catch (error: any) {
      setAiResponse(`**Błąd połączenia:** Nie udało się połączyć z serwerem asystenta AI.`);
    } finally {
      setAiLoading(false);
      if (!customPrompt) setAiQuery('');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBuilderTip();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('dark_mode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('dark_mode', 'false');
      }
    }
  }, [darkMode]);

  // --- Quick Construction Estimator (Material Calculator) States ---
  const [showQuickCalc, setShowQuickCalc] = useState<boolean>(false);
  const [calcType, setCalcType] = useState<'concrete' | 'bricks' | 'plaster'>('concrete');
  const [concreteLength, setConcreteLength] = useState<number>(5);
  const [concreteWidth, setConcreteWidth] = useState<number>(4);
  const [concreteThickness, setConcreteThickness] = useState<number>(0.15); // in meters
  const [brickWallArea, setBrickWallArea] = useState<number>(12); // m²
  const [brickType, setBrickType] = useState<'solbet' | 'porotherm' | 'silka'>('porotherm');
  const [plasterArea, setPlasterArea] = useState<number>(50); // m²
  const [plasterLayers, setPlasterLayers] = useState<number>(2);
  const [calcPricePerUnit, setCalcPricePerUnit] = useState<number>(25); // price in default currency

  // --- Inline Entry Editing State ---
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editProject, setEditProject] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editBreak, setEditBreak] = useState(0);
  const [editRate, setEditRate] = useState(0);
  const [editDesc, setEditDesc] = useState('');
  const [editOvertime, setEditOvertime] = useState(false);
  const [editOvertimeMultiplier, setEditOvertimeMultiplier] = useState(1.5);
  const [editCategory, setEditCategory] = useState('');
  const [manualProject, setManualProject] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem('app_settings');
      if (storedSettings) {
        try {
          return JSON.parse(storedSettings).defaultProject || 'Budowa Domu';
        } catch (e) {}
      }
    }
    return 'Budowa Domu';
  });
  const [manualRate, setManualRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem('app_settings');
      if (storedSettings) {
        try {
          return JSON.parse(storedSettings).defaultHourlyRate || 75;
        } catch (e) {}
      }
    }
    return 75;
  });
  const [manualDesc, setManualDesc] = useState<string>('');
  const [manualOvertime, setManualOvertime] = useState<boolean>(false);
  const [manualOvertimeMultiplier, setManualOvertimeMultiplier] = useState<number>(1.5);
  const [timerCategory, setTimerCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('timer_category') || 'Praca projektowa';
    }
    return 'Praca projektowa';
  });
  const [manualCategory, setManualCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('manual_category') || 'Praca projektowa';
    }
    return 'Praca projektowa';
  });

  // --- Premium UI & Experiential Polish States ---
  const [isFloatingHubOpen, setIsFloatingHubOpen] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // --- Custom Rate Management UI States ---
  const [newProjRateKey, setNewProjRateKey] = useState<string>('');
  const [newProjRateVal, setNewProjRateVal] = useState<string>('');
  const [newTaskRateKey, setNewTaskRateKey] = useState<string>('');
  const [newTaskRateVal, setNewTaskRateVal] = useState<string>('');

  const updateManualProject = (newProj: string) => {
    setManualProject(newProj);
    const matchedRate = getRateForProjectOrTask(newProj, manualDesc, settings);
    setManualRate(matchedRate);
  };

  const updateManualDesc = (newDesc: string) => {
    setManualDesc(newDesc);
    const matchedRate = getRateForProjectOrTask(manualProject, newDesc, settings);
    setManualRate(matchedRate);
  };

  // --- List of active projects for easy select & autocomplete ---
  const allProjectsList = useMemo(() => {
    const projSet = new Set<string>();
    
    // Add custom dynamic projects first
    projects.forEach(p => { if (p.name) projSet.add(p.name.trim()); });
    
    entries.forEach(e => { if (e.project) projSet.add(e.project.trim()); });
    photos.forEach(p => { if (p.projectName) projSet.add(p.projectName.trim()); });
    tasks.forEach(t => { if (t.project) projSet.add(t.project.trim()); });
    
    // Default list
    projSet.add('Budowa Domu');
    projSet.add('Remont Piwnicy');
    if (settings.defaultProject) projSet.add(settings.defaultProject.trim());
    
    return Array.from(projSet).filter(Boolean).sort();
  }, [projects, entries, photos, tasks, settings.defaultProject]);

  // --- Process and sort construction tasks ---
  const processedTasks = useMemo(() => {
    let filtered = [...tasks];
    
    if (taskFilterWorker === 'mine') {
      filtered = filtered.filter(t => t.assignedTo === currentWorker);
    }

    if (taskSearchQuery.trim()) {
      const query = taskSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        (t.category && t.category.toLowerCase().includes(query)) ||
        (t.project && t.project.toLowerCase().includes(query)) ||
        (t.notes && t.notes.toLowerCase().includes(query)) ||
        (t.longDescription && t.longDescription.toLowerCase().includes(query)) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(query))
      );
    }

    const sorted = filtered.sort((a, b) => {
      // 1. Group by status: Active (0) < Completed (1) < Cancelled (2)
      const groupA = a.cancelled ? 2 : a.completed ? 1 : 0;
      const groupB = b.cancelled ? 2 : b.completed ? 1 : 0;
      if (groupA !== groupB) {
        return groupA - groupB;
      }

      // 2. Sort within groups based on selected sorting mode
      const prioValue = { high: 3, medium: 2, low: 1 };

      if (taskSortMode === 'priority') {
        const pA = prioValue[a.priority || 'medium'];
        const pB = prioValue[b.priority || 'medium'];
        if (pB !== pA) return pB - pA; // highest priority first
      } else if (taskSortMode === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      } else if (taskSortMode === 'name') {
        return a.name.localeCompare(b.name);
      }

      // Default sorting: critical first, priority high first
      if (a.isCritical !== b.isCritical) {
        return a.isCritical ? -1 : 1;
      }
      const pA = prioValue[a.priority || 'medium'];
      const pB = prioValue[b.priority || 'medium'];
      return pB - pA;
    });

    return sorted;
  }, [tasks, taskSortMode, taskSearchQuery, taskFilterWorker, currentWorker]);

  // --- Group tasks by category or project ---
  const groupedTasks = useMemo(() => {
    if (taskGroupMode === 'none') {
      return { 'Wszystkie zadania': processedTasks };
    }

    const groups: { [key: string]: ConstructionTask[] } = {};

    processedTasks.forEach(task => {
      const key = taskGroupMode === 'category'
        ? task.category
        : (task.project || 'Budowa Domu');

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(task);
    });

    return groups;
  }, [processedTasks, taskGroupMode]);

  const filteredPhotos = useMemo(() => {
    if (galleryProjectFilter === 'all') return photos;
    return photos.filter(p => p.projectName === galleryProjectFilter);
  }, [photos, galleryProjectFilter]);

  // --- Timer Interval Ref ---
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Camera Stream Lifecycle Handler ---
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    if (cameraActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCameraError(null);
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera for construction shots
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
        .then(stream => {
          activeStream = stream;
          setCameraStream(stream);
        })
        .catch(err => {
          console.error("Camera access error:", err);
          setCameraError("Brak dostępu do aparatu. Sprawdź uprawnienia w przeglądarce.");
          setCameraActive(false);
        });
    } else {
      setCameraStream(null);
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive]);

  // Sync video ref when stream updates
  useEffect(() => {
    const videoElement = videoRef.current;
    if (cameraStream && videoElement) {
      if (videoElement.srcObject !== cameraStream) {
        // Pause first to reset player state and prevent interruption errors
        videoElement.pause();
        videoElement.srcObject = cameraStream;
        
        const playVideo = async () => {
          try {
            await videoElement.play();
          } catch (e: any) {
            if (e.name !== 'AbortError') {
              console.error("Video play failed:", e);
            }
          }
        };
        playVideo();
      }
    } else if (videoElement) {
      videoElement.pause();
      videoElement.srcObject = null;
    }
  }, [cameraStream]);

  // --- Trigger custom toast helper ---
  const triggerToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const adjustManualTimeHelper = (timeStr: string, minutes: number): string => {
    let [h, m] = timeStr.split(':').map(Number);
    let total = h * 60 + m + minutes;
    if (total < 0) total += 24 * 60;
    total = total % (24 * 60);
    const newH = Math.floor(total / 60).toString().padStart(2, '0');
    const newM = (total % 60).toString().padStart(2, '0');
    return `${newH}:${newM}`;
  };

  const copyTodayReportToClipboard = () => {
    const todayDateStr = new Date().toLocaleDateString('sv');
    const todayEntries = entries.filter(e => e.date === todayDateStr);
    
    if (todayEntries.length === 0) {
      triggerToast('Brak wpisów z dziś do skopiowania!', 'warning');
      return;
    }
    
    let totalHrs = 0;
    let totalBrutto = 0;
    const projectsList = new Set<string>();
    
    let text = `📋 *RAPORT PRACY - ${todayDateStr}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    todayEntries.forEach((entry, idx) => {
      const hrs = calculateEntryHours(entry);
      const earn = calculateEntryEarnings(entry);
      totalHrs += hrs;
      totalBrutto += earn;
      projectsList.add(entry.project);
      
      text += `📍 *Wpis #${idx + 1}*:\n`;
      text += `   • Projekt: ${entry.project}\n`;
      text += `   • Czas: ${entry.startTime} - ${entry.endTime} (${hrs.toFixed(2)}h, przerwa: ${entry.breakMinutes}m)\n`;
      if (entry.isOvertime) {
        text += `   • Nadgodziny: TAK (mnożnik x${entry.overtimeMultiplier})\n`;
      }
      text += `   • Stawka: ${entry.hourlyRate} ${settings.currency}/h\n`;
      if (entry.description) {
        text += `   • Opis: ${entry.description}\n`;
      }
      text += `   • Wynagrodzenie: ${earn.toFixed(2)} ${settings.currency}\n\n`;
    });
    
    const taxAmount = (totalBrutto * settings.taxRatePercent) / 100;
    const totalNetto = totalBrutto - taxAmount;
    
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `⏱️ *Łączny czas:* ${formatDuration(totalHrs)} (${totalHrs.toFixed(2)} godz.)\n`;
    text += `💼 *Projekty:* ${Array.from(projectsList).join(', ')}\n`;
    text += `💰 *Wynagrodzenie BRUTTO:* ${totalBrutto.toFixed(2)} ${settings.currency}\n`;
    text += `📉 *Podatek (${settings.taxRatePercent}%):* ${taxAmount.toFixed(2)} ${settings.currency}\n`;
    text += `💵 *Wynagrodzenie NETTO (do wypłaty):* ${totalNetto.toFixed(2)} ${settings.currency}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Generowane z aplikacji Budowlańcy PRO* 👷`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      triggerToast('Raport skopiowany do schowka! Możesz wkleić go na SMS/WhatsApp. 🚀', 'success');
    } else {
      triggerToast('Kopiowanie nie jest wspierane w tej przeglądarce.', 'warning');
    }
  };

  const generateTodayPDF = () => {
    const todayDateStr = new Date().toLocaleDateString('sv');
    const todayEntries = entries.filter(e => e.date === todayDateStr);
    
    if (todayEntries.length === 0) {
      triggerToast('Brak dzisiejszych wpisów do wygenerowania PDF!', 'warning');
      return;
    }

    const doc = new jsPDF();
    
    // Header Style Setup
    doc.setFillColor(15, 23, 42); // slate-900 background for top banner
    doc.rect(0, 0, 210, 38, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(sanitizePolishChars('DZIENNY RAPORT PRACY'), 14, 16);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Data raportu: ${todayDateStr}`, 14, 23);
    doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 14, 28);
    
    // Aggregates
    let totalHrs = 0;
    let totalBrutto = 0;
    let totalBreaks = 0;
    todayEntries.forEach(e => {
      totalHrs += calculateEntryHours(e);
      totalBrutto += calculateEntryEarnings(e);
      totalBreaks += e.breakMinutes;
    });
    const taxAmount = (totalBrutto * settings.taxRatePercent) / 100;
    const totalNetto = totalBrutto - taxAmount;

    // Summary box
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 44, 182, 34, 'F');
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(sanitizePolishChars('PODSUMOWANIE DNIA'), 18, 50);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Liczba wpisow z dzis: ${todayEntries.length}`, 18, 57);
    doc.text(`Calkowity czas pracy: ${formatDuration(totalHrs)} (${totalHrs.toFixed(2)} godz.)`, 18, 63);
    doc.text(`Suma przerw: ${totalBreaks} min`, 18, 69);
    
    doc.text(`Wynagrodzenie BRUTTO: ${formatCurrencyValue(totalBrutto, settings.currency)}`, 110, 57);
    doc.text(`Podatek (${settings.taxRatePercent}%): ${formatCurrencyValue(taxAmount, settings.currency)}`, 110, 63);
    doc.text(`DO WYPLATY (NETTO): ${formatCurrencyValue(totalNetto, settings.currency)}`, 110, 69);

    // Table Header
    doc.setFillColor(51, 65, 85); // slate-700
    doc.rect(14, 85, 182, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'bold');
    
    doc.text('Projekt', 16, 90);
    doc.text('Godziny', 65, 90);
    doc.text('Przerwa', 95, 90);
    doc.text('Stawka', 115, 90);
    doc.text('Brutto', 140, 90);
    doc.text('Opis/Roboty', 165, 90);
    
    // Table rows
    let currentY = 98;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    
    todayEntries.forEach((entry, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY - 4, 182, 6, 'F');
      }
      
      const hrs = calculateEntryHours(entry);
      const earn = calculateEntryEarnings(entry);
      const isOver = entry.isOvertime ? ` (x${entry.overtimeMultiplier})` : '';
      
      doc.text(sanitizePolishChars(entry.project.substring(0, 24)), 16, currentY);
      doc.text(`${entry.startTime}-${entry.endTime} (${hrs.toFixed(2)}h)`, 65, currentY);
      doc.text(`${entry.breakMinutes}m`, 95, currentY);
      doc.text(`${entry.hourlyRate}${isOver}`, 115, currentY);
      doc.text(`${earn.toFixed(2)}`, 140, currentY);
      doc.text(sanitizePolishChars(entry.description.substring(0, 20)), 165, currentY);
      
      currentY += 6;
    });

    // Signature Block
    currentY = Math.min(currentY + 20, 270);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, currentY, 80, currentY);
    doc.line(130, currentY, 196, currentY);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitizePolishChars('Podpis pracownika'), 14, currentY + 4);
    doc.text(sanitizePolishChars('Zatwierdzajacy (Pracodawca)'), 130, currentY + 4);

    doc.save(`Raport_Dzienny_Godzin_${todayDateStr}.pdf`);
    triggerToast('Dzisiejszy raport PDF został pomyślnie wygenerowany!', 'success');
  };

  // --- Hydrate data from localStorage ---
  useEffect(() => {
    // Online/Offline event listeners
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Overdue tasks automatic notification check ---
  const notifiedOverdueTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkOverdueAndNotify = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      let foundOverdue = false;
      const overdueNames: string[] = [];

      tasks.forEach(task => {
        if (!task.completed && !task.cancelled && task.dueDate && task.dueDate < todayStr) {
          if (!notifiedOverdueTasksRef.current.has(task.id)) {
            notifiedOverdueTasksRef.current.add(task.id);
            overdueNames.push(task.name);
            foundOverdue = true;
          }
        }
      });

      if (foundOverdue && overdueNames.length > 0) {
        const bodyText = overdueNames.length === 1
          ? `Zadanie "${overdueNames[0]}" jest opóźnione!`
          : `${overdueNames.length} zadań jest opóźnionych!`;

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('⚠️ Zaległe zadania budowlane!', {
            body: bodyText + ' Sprawdź harmonogram.',
            icon: '/favicon.ico'
          });
        }
        triggerToast(`⚠️ Opóźnienie: ${overdueNames.join(', ')}`, 'warning');
      }
    };

    const timer = setTimeout(checkOverdueAndNotify, 2000);
    return () => clearTimeout(timer);
  }, [tasks]);

  // --- Daily end-of-work reminder automatic check ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!settings.reminderEnabled || !settings.reminderTime) return;

    const checkDailyReminder = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      if (currentTimeStr === settings.reminderTime) {
        const todayStr = now.toLocaleDateString('sv');
        const lastNotifiedDate = localStorage.getItem('last_work_end_reminder_notified_date');
        if (lastNotifiedDate !== todayStr) {
          // Play selected work end audio alert
          if (settings.audioAlertsEnabled !== false) {
            playNotificationSound(settings.workEndSound || 'bell');
          }

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Czas zamknąć dzień! 🏗️', {
              body: `Przypomnienie: Zarejestruj czas pracy dla projektu "${settings.defaultProject}".`,
              icon: '/favicon.ico'
            });
          }
          triggerToast(`Przypomnienie: Nie zapomnij zapisać dzisiejszych godzin pracy dla "${settings.defaultProject}"! 👷`, 'warning');
          
          localStorage.setItem('last_work_end_reminder_notified_date', todayStr);
        }
      }
    };

    const interval = setInterval(checkDailyReminder, 30000); // Check every 30 seconds
    const timeout = setTimeout(checkDailyReminder, 1000); // Check shortly after load

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [settings.reminderEnabled, settings.reminderTime, settings.audioAlertsEnabled, settings.workEndSound, settings.defaultProject]);

  // --- 10:00 AM Reminder function for missing daily entries ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check10AMReminder = () => {
      // Check if reminders and specifically 10:00 AM reminders are enabled
      if (!settings.reminderEnabled || settings.reminder10AMEnabled === false) return;

      const now = new Date();
      const currentHour = now.getHours();
      const todayStr = now.toLocaleDateString('sv'); // 'YYYY-MM-DD'

      // Is it 10:00 AM or later?
      if (currentHour >= 10) {
        // Did we already notify today?
        const lastNotifiedDate = localStorage.getItem('last_10am_reminder_notified_date');
        if (lastNotifiedDate === todayStr) {
          return; // Already notified today
        }

        // Is there any entry for today?
        const todayEntries = entries.filter(e => e.date === todayStr);
        // Is timer running? That counts as active registration as well.
        if (todayEntries.length === 0 && !timerRunning) {
          // Send system notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('👷 Brak wpisu w Budowlańcy PRO', {
              body: 'Jest już po godzinie 10:00, a Ty nie zarejestrowałeś dzisiaj żadnego wpisu ani nie uruchomiłeś stopera! Zapisz swoje godziny pracy.',
              icon: '/favicon.ico'
            });
          }
          triggerToast('⚠️ Przypomnienie: Brak wpisów po godzinie 10:00 rano!', 'warning');
          
          if (settings.audioAlertsEnabled !== false) {
            playNotificationSound(settings.workEndSound || 'bell');
          }

          // Record that we notified today to prevent duplicate spam
          localStorage.setItem('last_10am_reminder_notified_date', todayStr);
        }
      }
    };

    // Run check on mount and then every 30 seconds
    const interval = setInterval(check10AMReminder, 30000);
    const timeout = setTimeout(check10AMReminder, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [entries, timerRunning, settings.reminderEnabled, settings.reminder10AMEnabled, settings.audioAlertsEnabled, settings.workEndSound]);

  // --- Smart Weather Reminder system for outdoor tasks ---
  const notifiedWeatherTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (settings.weatherAlertsEnabled === false) return;

    const checkWeatherAndNotify = () => {
      const todayStr = new Date().toLocaleDateString('sv');
      let foundRainWarning = false;
      const warningDetails: string[] = [];

      tasks.forEach(task => {
        // If task is not completed, not cancelled, has a due date, is marked as outdoor, and has a rainy/stormy forecast
        if (!task.completed && !task.cancelled && task.dueDate && task.isOutdoor) {
          const forecast = weatherForecast[task.dueDate];
          if (forecast === 'rainy' || forecast === 'stormy') {
            const notifiedKey = `${task.id}_${task.dueDate}_${forecast}`;
            if (!notifiedWeatherTasksRef.current.has(notifiedKey)) {
              notifiedWeatherTasksRef.current.add(notifiedKey);
              warningDetails.push(`"${task.name}" (${task.dueDate} - ${forecast === 'stormy' ? 'Burza ⛈️' : 'Deszcz 🌧️'})`);
              foundRainWarning = true;
            }
          }
        }
      });

      if (foundRainWarning && warningDetails.length > 0) {
        const title = '⚠️ Ostrzeżenie Pogodowe (Prace Zewnętrzne)!';
        const bodyText = `Skaner pogodowy wykrył ryzyko opadów deszczu dla prac zewnętrznych: ${warningDetails.join(', ')}. Sugerujemy zabezpieczenie placu budowy lub zmianę terminu!`;

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body: bodyText,
            icon: '/favicon.ico'
          });
        }
        triggerToast(`🌧️ ${bodyText}`, 'warning');

        if (settings.audioAlertsEnabled !== false) {
          playNotificationSound('alert');
        }
      }
    };

    // Run 3 seconds after load to allow state settling
    const timeout = setTimeout(checkWeatherAndNotify, 3500);
    return () => clearTimeout(timeout);
  }, [tasks, weatherForecast, settings.weatherAlertsEnabled, settings.audioAlertsEnabled]);

  // --- Save Entries to local storage on changes ---
  const saveEntries = (newEntries: WorkEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem('work_entries', JSON.stringify(newEntries));
  };

  // --- Save Settings Helper ---
  const saveAppSettings = (updatedSettings: AppSettings) => {
    setSettings(updatedSettings);
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));
  };

  const handleAddProjectRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjRateKey.trim() || !newProjRateVal) {
      triggerToast('Podaj nazwę projektu i stawkę!', 'warning');
      return;
    }
    const val = parseFloat(newProjRateVal);
    if (isNaN(val) || val <= 0) {
      triggerToast('Podaj poprawną stawkę większą od zera!', 'warning');
      return;
    }
    const updatedProjectRates = {
      ...(settings.projectRates || {}),
      [newProjRateKey.trim()]: val
    };
    saveAppSettings({
      ...settings,
      projectRates: updatedProjectRates
    });
    setNewProjRateKey('');
    setNewProjRateVal('');
    triggerToast('Dodano stawkę dla projektu!', 'success');
  };

  const handleDeleteProjectRate = (key: string) => {
    const updatedProjectRates = { ...(settings.projectRates || {}) };
    delete updatedProjectRates[key];
    saveAppSettings({
      ...settings,
      projectRates: updatedProjectRates
    });
    triggerToast('Usunięto stawkę dla projektu.', 'info');
  };

  const handleAddTaskRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskRateKey.trim() || !newTaskRateVal) {
      triggerToast('Podaj nazwę zadania/słowo kluczowe i stawkę!', 'warning');
      return;
    }
    const val = parseFloat(newTaskRateVal);
    if (isNaN(val) || val <= 0) {
      triggerToast('Podaj poprawną stawkę większą od zera!', 'warning');
      return;
    }
    const updatedTaskRates = {
      ...(settings.taskRates || {}),
      [newTaskRateKey.trim()]: val
    };
    saveAppSettings({
      ...settings,
      taskRates: updatedTaskRates
    });
    setNewTaskRateKey('');
    setNewTaskRateVal('');
    triggerToast('Dodano stawkę dla zadania!', 'success');
  };

  const handleDeleteTaskRate = (key: string) => {
    const updatedTaskRates = { ...(settings.taskRates || {}) };
    delete updatedTaskRates[key];
    saveAppSettings({
      ...settings,
      taskRates: updatedTaskRates
    });
    triggerToast('Usunięto stawkę dla zadania.', 'info');
  };

  // --- Download State Backup ---
  const downloadBackup = () => {
    try {
      const backupData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        work_entries: entries,
        construction_tasks: tasks,
        construction_photos: photos,
        app_settings: settings
      };
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kopia_zapasowa_budowa_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      triggerToast('Kopia zapasowa została pobrana pomyślnie!', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Błąd podczas generowania kopii zapasowej.', 'warning');
    }
  };

  // --- Timer Interval Logic ---
  useEffect(() => {
    if (timerRunning && timerStartTime !== null) {
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
        setTimerElapsedSeconds(elapsed);

        // Check for audio interval alert
        const intervalSecs = settings.audioIntervalSeconds || 3600;
        if (settings.audioAlertsEnabled !== false && elapsed > 0 && elapsed % intervalSecs === 0) {
          playNotificationSound('interval');
          triggerToast(`Stoper osiągnął interwał: ${formatDuration(elapsed / 3600)} ⏳`, 'info');
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, timerStartTime, settings.audioAlertsEnabled, settings.audioIntervalSeconds]);

  // --- Timer Actions ---
  const startTimer = () => {
    const startTime = Date.now();
    setTimerRunning(true);
    setTimerStartTime(startTime);
    setTimerElapsedSeconds(0);
    
    localStorage.setItem('timer_running', 'true');
    localStorage.setItem('timer_start_time', startTime.toString());
    localStorage.setItem('timer_project', timerProject || settings.defaultProject);
    localStorage.setItem('timer_description', timerDescription);
    
    triggerToast('Stoper został uruchomiony!', 'success');
  };

  const pauseTimer = () => {
    // For simplicity, we just save the current status.
    setTimerRunning(false);
    localStorage.setItem('timer_running', 'false');
    triggerToast('Stoper wstrzymany', 'info');
  };

  const resumeTimer = () => {
    const adjustedStartTime = Date.now() - (timerElapsedSeconds * 1000);
    setTimerRunning(true);
    setTimerStartTime(adjustedStartTime);
    localStorage.setItem('timer_running', 'true');
    localStorage.setItem('timer_start_time', adjustedStartTime.toString());
    triggerToast('Wznowiono rejestrację czasu', 'success');
  };

  const stopAndSaveTimer = () => {
    if (!timerStartTime) return;
    
    const elapsedMinutes = Math.floor(timerElapsedSeconds / 60);
    if (elapsedMinutes < 1) {
      if (!confirm('Twój wpis ma mniej niż minutę. Czy na pewno chcesz go zapisać?')) {
        resetTimerState();
        return;
      }
    }

    // Prepare time formats
    const endDate = new Date();
    const startDate = new Date(timerStartTime);
    
    const formatTime = (d: Date) => {
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins}`;
    };

    const dateStr = startDate.toISOString().split('T')[0];
    const startStr = formatTime(startDate);
    const endStr = formatTime(endDate);

    const activeTimerRate = getRateForProjectOrTask(timerProject, timerDescription, settings);

    const matchedProject = projects.find(p => p.name.trim().toLowerCase() === timerProject.trim().toLowerCase());

    const newEntry: WorkEntry = {
      id: generateUniqueId(),
      date: dateStr,
      startTime: startStr,
      endTime: endStr,
      breakMinutes: 0, // timer has no breaks default
      hourlyRate: activeTimerRate,
      project: timerProject.trim() || settings.defaultProject,
      projectId: matchedProject?.id,
      clientId: matchedProject?.clientId,
      description: timerDescription.trim() || 'Praca zarejestrowana stoperem',
      isOvertime: false,
      overtimeMultiplier: 1.5,
      workerName: currentWorker,
      location: timerLocation || manualLocation || 'Biuro / Budowa',
      status: currentUserRole === 'Worker' ? 'pending' : 'approved',
      category: timerCategory
    };

    const updated = [newEntry, ...entries];
    saveEntries(updated);
    resetTimerState();
    confetti({ particleCount: 60, spread: 45, origin: { y: 0.8 } });
    triggerToast('Czas pracy został zapisany pomyślnie!', 'success');
  };

  const fetchGPSLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      triggerToast('Geolokalizacja nie jest obsługiwana w tym środowisku!', 'warning');
      return;
    }
    
    triggerToast('Pobieranie lokalizacji GPS...', 'info');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const formattedLoc = `Sektor ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (GPS)`;
        setTimerLocation(formattedLoc);
        setManualLocation(formattedLoc);
        triggerToast('Pobrano współrzędne GPS!', 'success');
      },
      (error) => {
        console.error(error);
        triggerToast('Nie udało się uzyskać pozycji GPS. Wpisz lokalizację ręcznie.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const resetTimerState = () => {
    setTimerRunning(false);
    setTimerStartTime(null);
    setTimerElapsedSeconds(0);
    setTimerDescription('');
    setTimerLocation('');
    localStorage.removeItem('timer_running');
    localStorage.removeItem('timer_start_time');
    localStorage.removeItem('timer_project');
    localStorage.removeItem('timer_description');
  };

  // --- Client CRUD Actions ---
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      triggerToast('Podaj nazwę klienta!', 'warning');
      return;
    }
    const newClient: Client = {
      id: 'client-' + Math.random().toString(36).substring(2, 11),
      name: newClientName.trim(),
      companyName: newClientCompany.trim(),
      email: newClientEmail.trim() || undefined,
      phone: newClientPhone.trim() || undefined,
      address: newClientAddress.trim() || undefined,
    };
    saveClients([...clients, newClient]);
    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientAddress('');
    triggerToast('Pomyślnie dodano klienta!', 'success');
  };

  const handleStartEditClient = (client: Client) => {
    setEditingClientId(client.id);
    setNewClientName(client.name);
    setNewClientCompany(client.companyName || '');
    setNewClientEmail(client.email || '');
    setNewClientPhone(client.phone || '');
    setNewClientAddress(client.address || '');
  };

  const handleSaveEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientId || !newClientName.trim()) return;
    const updated = clients.map(c => {
      if (c.id === editingClientId) {
        return {
          ...c,
          name: newClientName.trim(),
          companyName: newClientCompany.trim(),
          email: newClientEmail.trim() || undefined,
          phone: newClientPhone.trim() || undefined,
          address: newClientAddress.trim() || undefined,
        };
      }
      return c;
    });
    saveClients(updated);
    setEditingClientId(null);
    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientAddress('');
    triggerToast('Pomyślnie zaktualizowano klienta!', 'success');
  };

  const handleDeleteClient = (id: string) => {
    const hasProjects = projects.some(p => p.clientId === id);
    if (hasProjects) {
      alert('Nie można usunąć klienta, który ma przypisane aktywne projekty! Usuń najpierw projekty.');
      return;
    }
    if (confirm('Czy na pewno chcesz usunąć tego klienta?')) {
      const updated = clients.filter(c => c.id !== id);
      saveClients(updated);
      triggerToast('Klient został usunięty.', 'info');
    }
  };

  const handleCancelEditClient = () => {
    setEditingClientId(null);
    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientAddress('');
  };

  // --- Project CRUD Actions ---
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      triggerToast('Podaj nazwę projektu!', 'warning');
      return;
    }
    const newProj: Project = {
      id: 'proj-' + Math.random().toString(36).substring(2, 11),
      name: newProjectName.trim(),
      clientId: newProjectClient || undefined,
      description: newProjectDesc.trim() || undefined,
      budget: newProjectBudget ? parseFloat(newProjectBudget) : undefined,
      status: newProjectStatus,
      startDate: newProjectStart || undefined,
      endDate: newProjectEnd || undefined,
    };
    saveProjects([...projects, newProj]);
    setNewProjectName('');
    setNewProjectClient('');
    setNewProjectDesc('');
    setNewProjectBudget('');
    setNewProjectStatus('active');
    setNewProjectStart('');
    setNewProjectEnd('');
    triggerToast('Pomyślnie dodano projekt!', 'success');
  };

  const handleStartEditProject = (proj: Project) => {
    setEditingProjectId(proj.id);
    setNewProjectName(proj.name);
    setNewProjectClient(proj.clientId || '');
    setNewProjectDesc(proj.description || '');
    setNewProjectBudget(proj.budget ? proj.budget.toString() : '');
    setNewProjectStatus(proj.status || 'active');
    setNewProjectStart(proj.startDate || '');
    setNewProjectEnd(proj.endDate || '');
  };

  const handleSaveEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProjectId || !newProjectName.trim()) return;
    const updated = projects.map(p => {
      if (p.id === editingProjectId) {
        return {
          ...p,
          name: newProjectName.trim(),
          clientId: newProjectClient || undefined,
          description: newProjectDesc.trim() || undefined,
          budget: newProjectBudget ? parseFloat(newProjectBudget) : undefined,
          status: newProjectStatus,
          startDate: newProjectStart || undefined,
          endDate: newProjectEnd || undefined,
        };
      }
      return p;
    });
    saveProjects(updated);
    setEditingProjectId(null);
    setNewProjectName('');
    setNewProjectClient('');
    setNewProjectDesc('');
    setNewProjectBudget('');
    setNewProjectStatus('active');
    setNewProjectStart('');
    setNewProjectEnd('');
    triggerToast('Pomyślnie zaktualizowano projekt!', 'success');
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten projekt? Powiązane wpisy czasu pracy nie zostaną skasowane, lecz stracą referencję do tego projektu.')) {
      const updated = projects.filter(p => p.id !== id);
      saveProjects(updated);
      triggerToast('Projekt został usunięty.', 'info');
    }
  };

  const handleCancelEditProject = () => {
    setEditingProjectId(null);
    setNewProjectName('');
    setNewProjectClient('');
    setNewProjectDesc('');
    setNewProjectBudget('');
    setNewProjectStatus('active');
    setNewProjectStart('');
    setNewProjectEnd('');
  };

  // --- Manual Form Actions ---
  const handleAddManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDate || !manualStart || !manualEnd) {
      triggerToast('Wypełnij wymagane pola!', 'warning');
      return;
    }

    const matchedProject = projects.find(p => p.name.trim().toLowerCase() === manualProject.trim().toLowerCase());

    const newEntry: WorkEntry = {
      id: generateUniqueId(),
      date: manualDate,
      startTime: manualStart,
      endTime: manualEnd,
      breakMinutes: Number(manualBreak) || 0,
      hourlyRate: Number(manualRate) || settings.defaultHourlyRate,
      project: manualProject.trim() || settings.defaultProject,
      projectId: matchedProject?.id,
      clientId: matchedProject?.clientId,
      description: manualDesc.trim(),
      isOvertime: manualOvertime,
      overtimeMultiplier: Number(manualOvertimeMultiplier) || 1.5,
      workerName: currentWorker,
      location: manualLocation || 'Biuro / Budowa',
      status: currentUserRole === 'Worker' ? 'pending' : 'approved',
      category: manualCategory
    };

    // Calculate duration to verify it is positive
    const hours = calculateEntryHours(newEntry);
    if (hours <= 0) {
      alert('Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia (uwzględniając przerwę).');
      return;
    }

    const updated = [newEntry, ...entries];
    saveEntries(updated);
    
    // Reset Form (except rates/projects for convenience)
    setManualBreak(0);
    setManualDesc('');
    setManualOvertime(false);
    setShowManualForm(false);
    
    confetti({ particleCount: 40, spread: 35, origin: { y: 0.85 } });
    triggerToast('Wpis dodany ręcznie!', 'success');
  };

  const handleStartEdit = (entry: WorkEntry) => {
    setEditingEntryId(entry.id);
    setEditProject(entry.project);
    setEditDate(entry.date);
    setEditStart(entry.startTime);
    setEditEnd(entry.endTime);
    setEditBreak(entry.breakMinutes);
    setEditRate(entry.hourlyRate);
    setEditDesc(entry.description);
    setEditOvertime(entry.isOvertime);
    setEditOvertimeMultiplier(entry.overtimeMultiplier);
    setEditCategory(entry.category || 'Praca projektowa');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntryId) return;

    const [startH, startM] = editStart.split(':').map(Number);
    const [endH, endM] = editEnd.split(':').map(Number);
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const activeMinutes = Math.max(0, totalMinutes - editBreak);
    
    if (activeMinutes <= 0) {
      alert('Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia (uwzględniając przerwę).');
      return;
    }

    const matchedProject = projects.find(p => p.name.trim().toLowerCase() === editProject.trim().toLowerCase());

    const updated = entries.map(item => {
      if (item.id === editingEntryId) {
        return {
          ...item,
          project: editProject.trim(),
          projectId: matchedProject?.id,
          clientId: matchedProject?.clientId,
          date: editDate,
          startTime: editStart,
          endTime: editEnd,
          breakMinutes: editBreak,
          hourlyRate: editRate,
          description: editDesc.trim(),
          isOvertime: editOvertime,
          overtimeMultiplier: editOvertimeMultiplier,
          category: editCategory
        };
      }
      return item;
    });

    saveEntries(updated);
    setEditingEntryId(null);
    triggerToast('Zaktualizowano wpis pomyślnie!', 'success');
  };

  const deleteEntry = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten wpis?')) {
      const updated = entries.filter(item => item.id !== id);
      saveEntries(updated);
      triggerToast('Wpis został usunięty.', 'info');
    }
  };

  // --- Construction Task Actions ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) {
      triggerToast('Podaj nazwę zadania!', 'warning');
      return;
    }
    const newTask: ConstructionTask = {
      id: `task-${Date.now()}`,
      name: newTaskName.trim(),
      category: newTaskCategory,
      completed: false,
      notes: newTaskNotes.trim() || undefined,
      longDescription: newTaskLongDescription.trim() || undefined,
      isCritical: newTaskIsCritical,
      dueDate: newTaskDueDate || undefined,
      priority: newTaskPriority,
      project: newTaskProject.trim() || settings.defaultProject || 'Budowa Domu',
      cancelled: false,
      assignedTo: newTaskAssignedTo || 'Jan Kowalski',
      isOutdoor: newTaskIsOutdoor
    };
    const updated = [...tasks, newTask];
    saveTasks(updated);
    
    // Reset fields
    setNewTaskName('');
    setNewTaskNotes('');
    setNewTaskLongDescription('');
    setNewTaskIsCritical(false);
    setNewTaskIsOutdoor(false);
    setNewTaskDueDate('');
    setNewTaskPriority('medium');
    setNewTaskProject('');
    
    triggerToast('Zadanie dodane do listy!', 'success');
  };

  // --- Export/Print Unfinished Tasks ---
  const generateUnfinishedTasksPDF = () => {
    const unfinished = tasks.filter(t => !t.completed && !t.cancelled);
    if (unfinished.length === 0) {
      triggerToast('Brak niezakończonych zadań do wygenerowania listy!', 'warning');
      return;
    }

    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    // Title & Info
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(sanitizePolishChars('DZIENNA LISTA ZADAN - PLAC BUDOWY'), 14, 16);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 14, 24);
    doc.text(`Do wykonania dzis: ${unfinished.length} zadan | Rejestr Plac Budowy`, 14, 29);
    
    // Table Header
    doc.setFillColor(245, 158, 11); // amber-500
    doc.rect(14, 46, 182, 8, 'F');
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('[ ]', 16, 51.5);
    doc.text('Zadanie / Opis i notatki', 26, 51.5);
    doc.text('Kategoria', 115, 51.5);
    doc.text('Priorytet', 145, 51.5);
    doc.text('Termin', 170, 51.5);
    
    // Table rows
    let currentY = 60;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    
    // Sort tasks: critical first, then high priority
    const sortedUnfinished = [...unfinished].sort((a, b) => {
      const prioVal = { high: 3, medium: 2, low: 1 };
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      const pA = prioVal[a.priority || 'medium'];
      const pB = prioVal[b.priority || 'medium'];
      if (pB !== pA) return pB - pA;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return a.name.localeCompare(b.name);
    });

      const todayStr = new Date().toISOString().split('T')[0];

      sortedUnfinished.forEach((task, idx) => {
        const hasLongDescription = !!task.longDescription;
        const rowHeight = hasLongDescription ? 12.5 : 8.5;

        // Page break check
        if (currentY + rowHeight > 275) {
          doc.addPage();
          currentY = 25;
          // Reprint header row
          doc.setFillColor(245, 158, 11);
          doc.rect(14, currentY - 5, 182, 8, 'F');
          doc.setTextColor(15, 23, 42);
          doc.setFont('Helvetica', 'bold');
          doc.text('[ ]', 16, currentY);
          doc.text('Zadanie / Opis i notatki', 26, currentY);
          doc.text('Kategoria', 115, currentY);
          doc.text('Priorytet', 145, currentY);
          doc.text('Termin', 170, currentY);
          currentY += 9;
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
        }
        
        // Zebra striping
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, currentY - 4, 182, rowHeight - 0.5, 'F');
        }

        // Overdue text warning
        const isOverdue = task.dueDate && task.dueDate < todayStr;
        
        // Checkbox square
        doc.setDrawColor(148, 163, 184); // slate-400
        doc.rect(16.5, currentY - 3.5, 3.5, 3.5); // checkbox box
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        
        let nameText = task.name;
        if (task.isCritical) {
          nameText = `[KRYTYCZNE] ${nameText}`;
        }
        
        doc.text(sanitizePolishChars(nameText.substring(0, 52)), 26, currentY);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        
        // Draw subtext (Project, Notes, Overdue)
        let subtext = `Projekt: ${task.project || 'Budowa Domu'}`;
        if (task.notes) {
          subtext += ` | Notatki: ${task.notes}`;
        }
        if (isOverdue) {
          subtext += ` | !!! ZALEGLE (Termin minal: ${task.dueDate}) !!!`;
        }
        
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(sanitizePolishChars(subtext.substring(0, 75)), 26, currentY + 3.5);

        // Draw long description if present
        if (hasLongDescription) {
          doc.setTextColor(71, 85, 105); // slate-600
          doc.setFont('Helvetica', 'italic');
          doc.text(sanitizePolishChars(`Szczegoly: ${task.longDescription!.substring(0, 85)}`), 26, currentY + 7);
          doc.setFont('Helvetica', 'normal');
        }
        
        // Restore normal text color
        doc.setTextColor(15, 23, 42);
        
        // Category, Priority, DueDate
        doc.text(sanitizePolishChars(task.category), 115, currentY);
        
        let prioText = task.priority === 'high' ? 'Wysoki' : task.priority === 'low' ? 'Niski' : 'Sredni';
        if (task.priority === 'high') {
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(220, 38, 38); // red for high priority
        } else {
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
        }
        doc.text(prioText, 145, currentY);
        
        // Restore standard colors for due date
        doc.setFont('Helvetica', 'normal');
        if (isOverdue) {
          doc.setTextColor(220, 38, 38); // red
          doc.setFont('Helvetica', 'bold');
        } else {
          doc.setTextColor(15, 23, 42);
        }
        doc.text(task.dueDate || '-', 170, currentY);
        
        // Restore colors
        doc.setTextColor(15, 23, 42);
        doc.setFont('Helvetica', 'normal');
        
        currentY += rowHeight; // spacing between rows
      });
    
    // Footer / Supervisor Signature
    currentY = Math.min(currentY + 20, 270);
    if (currentY > 245) {
      doc.addPage();
      currentY = 30;
    }
    
    doc.setDrawColor(203, 213, 225);
    doc.line(14, currentY, 80, currentY);
    doc.line(130, currentY, 196, currentY);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitizePolishChars('Podpis kierownika budowy'), 14, currentY + 4);
    doc.text(sanitizePolishChars('Data i uwagi odbioru'), 130, currentY + 4);
    
    doc.save(`Lista_Zadan_Dnia_${new Date().toISOString().split('T')[0]}.pdf`);
    triggerToast('Pomyślnie wygenerowano PDF z zadaniami dla kierownika budowy!', 'success');
  };

  const exportUnfinishedTasksTXT = () => {
    const unfinished = tasks.filter(t => !t.completed && !t.cancelled);
    if (unfinished.length === 0) {
      triggerToast('Brak niezakończonych zadań do wygenerowania listy!', 'warning');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    let txtContent = `DZIENNA LISTA ZADAŃ - PLAC BUDOWY\r\n`;
    txtContent += `==================================\r\n`;
    txtContent += `Wygenerowano: ${new Date().toLocaleString('pl-PL')}\r\n`;
    txtContent += `Liczba niezakończonych zadań: ${unfinished.length}\r\n\r\n`;

    // Sort tasks: critical first, then high priority
    const sortedUnfinished = [...unfinished].sort((a, b) => {
      const prioVal = { high: 3, medium: 2, low: 1 };
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      const pA = prioVal[a.priority || 'medium'];
      const pB = prioVal[b.priority || 'medium'];
      if (pB !== pA) return pB - pA;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return a.name.localeCompare(b.name);
    });

    sortedUnfinished.forEach((task, idx) => {
      const isOverdue = task.dueDate && task.dueDate < todayStr;
      const criticalMarker = task.isCritical ? ' [PILNE/KRYTYCZNE]' : '';
      const overdueMarker = isOverdue ? ` (ZALEGŁE - termin minął: ${task.dueDate})` : (task.dueDate ? ` (termin: ${task.dueDate})` : '');
      const priorityStr = task.priority === 'high' ? 'Wysoki' : task.priority === 'low' ? 'Niski' : 'Średni';
      
      txtContent += `${idx + 1}. [ ] ${task.name}${criticalMarker}\r\n`;
      txtContent += `   Projekt: ${task.project || 'Budowa Domu'} | Kategoria: ${task.category} | Priorytet: ${priorityStr}${overdueMarker}\r\n`;
      if (task.notes) {
        txtContent += `   Notatki: ${task.notes}\r\n`;
      }
      if (task.longDescription) {
        txtContent += `   Szczegóły / Wymagania: ${task.longDescription}\r\n`;
      }
      txtContent += `\r\n`;
    });

    txtContent += `==================================\r\n`;
    txtContent += `Podpis kierownika budowy: ............................\r\n`;

    // Download file
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Lista_Zadan_Dnia_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Also copy to clipboard for quick paste!
    try {
      navigator.clipboard.writeText(txtContent);
      triggerToast('Pomyślnie zapisano plik .TXT oraz skopiowano listę do schowka!', 'success');
    } catch (err) {
      triggerToast('Pomyślnie wyeksportowano listę do pliku .TXT!', 'success');
    }
  };

  // --- Construction Task Import QoL Handlers ---
  const parseTaskText = (text: string): ConstructionTask[] => {
    const lines = text.split('\n');
    const result: ConstructionTask[] = [];
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
        return; // skip empty and comment lines
      }
      
      // Support "|" and ";" as separators
      const separator = trimmed.includes('|') ? '|' : (trimmed.includes(';') ? ';' : null);
      
      if (separator) {
        const parts = trimmed.split(separator).map(p => p.trim());
        const name = parts[0] || 'Zadanie bez nazwy';
        
        let category = 'Inne';
        if (parts[1]) {
          const catLower = parts[1].toLowerCase();
          if (catLower.includes('mur')) category = 'Murarstwo';
          else if (catLower.includes('hydr')) category = 'Hydraulika';
          else if (catLower.includes('elek') || catLower.includes('prąd')) category = 'Elektryka';
          else if (catLower.includes('wyk') || catLower.includes('wyco')) category = 'Wykończenie';
          else if (catLower.includes('inn')) category = 'Inne';
          else category = parts[1];
        }
        
        const notes = parts[2] || undefined;
        
        let dueDate = undefined;
        if (parts[3]) {
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          if (datePattern.test(parts[3])) {
            dueDate = parts[3];
          }
        }
        
        let isCritical = false;
        if (parts[4]) {
          const critLower = parts[4].toLowerCase();
          if (critLower === 'tak' || critLower === 'yes' || critLower === 'true' || critLower === '1' || critLower.includes('kryt')) {
            isCritical = true;
          }
        }

        let priority: 'low' | 'medium' | 'high' = 'medium';
        if (parts[5]) {
          const prioLower = parts[5].toLowerCase();
          if (prioLower.includes('nis') || prioLower.includes('low')) priority = 'low';
          else if (prioLower.includes('wys') || prioLower.includes('high') || prioLower.includes('gor') || prioLower.includes('gór')) priority = 'high';
        }

        const project = parts[6] || settings.defaultProject || 'Budowa Domu';
        
        result.push({
          id: `temp-${Math.random().toString(36).substring(2, 11)}`,
          name,
          category,
          completed: false,
          notes,
          isCritical,
          dueDate,
          priority,
          project,
          cancelled: false
        });
      } else {
        // Line-by-line: each line is just the task name
        result.push({
          id: `temp-${Math.random().toString(36).substring(2, 11)}`,
          name: trimmed,
          category: 'Inne',
          completed: false,
          notes: undefined,
          isCritical: false,
          dueDate: undefined,
          priority: 'medium',
          project: settings.defaultProject || 'Budowa Domu',
          cancelled: false
        });
      }
    });
    
    return result;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/plain" || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const parsed = parseTaskText(text);
          if (parsed.length > 0) {
            setParsedPreviewTasks(parsed);
            triggerToast(`Wczytano plik! Wykryto ${parsed.length} zadań do zaimportowania.`, 'success');
          } else {
            triggerToast('Nie odnaleziono poprawnych zadań w pliku.', 'warning');
          }
        };
        reader.readAsText(file);
      } else {
        triggerToast('Błędny format pliku! Wybierz plik tekstowy .txt.', 'warning');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseTaskText(text);
        if (parsed.length > 0) {
          setParsedPreviewTasks(parsed);
          triggerToast(`Wczytano plik! Wykryto ${parsed.length} zadań do zaimportowania.`, 'success');
        } else {
          triggerToast('Nie odnaleziono poprawnych zadań w pliku.', 'warning');
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePasteImport = () => {
    if (!pastedImportText.trim()) {
      triggerToast('Wklej najpierw tekst harmonogramu!', 'warning');
      return;
    }
    const parsed = parseTaskText(pastedImportText);
    if (parsed.length > 0) {
      setParsedPreviewTasks(parsed);
      triggerToast(`Zidentyfikowano ${parsed.length} zadań do zaimportowania.`, 'success');
    } else {
      triggerToast('Nie odnaleziono żadnych zadań. Sprawdź format.', 'warning');
    }
  };

  const executeTaskImport = () => {
    if (parsedPreviewTasks.length === 0) return;
    
    const finalTasksToImport = parsedPreviewTasks.map((t, idx) => ({
      ...t,
      id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`
    }));
    
    const updated = [...tasks, ...finalTasksToImport];
    saveTasks(updated);
    
    triggerToast(`Zaimporowano ${finalTasksToImport.length} zadań budowlanych! 🚀`, 'success');
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
    
    setParsedPreviewTasks([]);
    setPastedImportText('');
    setShowImportForm(false);
  };

  const handleToggleTaskCompleted = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed, cancelled: false } : t);
    saveTasks(updated);
    
    const updatedTask = updated.find(t => t.id === id);
    if (updatedTask && updatedTask.completed) {
      // Trigger completed ripple animation state
      setLastCompletedTaskId(id);
      setTimeout(() => {
        setLastCompletedTaskId(null);
      }, 1500);

      // Play completion audio alert
      if (settings.audioAlertsEnabled !== false) {
        playNotificationSound(settings.taskCompletionSound || 'chime');
      }

      confetti({ particleCount: 40, spread: 40, origin: { y: 0.8 } });
      
      // If critical task, send a system desktop/mobile notification!
      if (updatedTask.isCritical) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🚀 Kamień milowy ukończony!', {
            body: `Gratulacje! Krytyczny etap "${updatedTask.name}" został zakończony pomyślnie.`,
            icon: '/favicon.ico'
          });
        }
        triggerToast(`🎉 SUKCES: Etap krytyczny "${updatedTask.name}" zakończony!`, 'success');
      } else {
        triggerToast('Zadanie ukończone! Dobra robota! 🧱', 'success');
      }
    } else {
      triggerToast('Zadanie cofnięte do realizacji.', 'info');
    }
  };

  const handleToggleTaskCancelled = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, cancelled: !t.cancelled, completed: t.cancelled ? t.completed : false } : t);
    saveTasks(updated);
    
    const updatedTask = updated.find(t => t.id === id);
    if (updatedTask && updatedTask.cancelled) {
      triggerToast('Zadanie zostało anulowane 🚫', 'warning');
    } else {
      triggerToast('Zadanie przywrócone do realizacji 🛠️', 'success');
    }
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      const updated = tasks.filter(t => t.id !== id);
      saveTasks(updated);
      triggerToast('Zadanie usunięte z listy.', 'info');
    }
  };

  // --- Construction Photo (Gallery) Actions ---
  const handleCapturePhoto = () => {
    if (!videoRef.current || !cameraStream) {
      triggerToast('Aparat nie jest gotowy!', 'warning');
      return;
    }
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        // Clean up stream immediately to release camera light/hardware
        setCameraActive(false);
        triggerToast('Zdjęcie zrobione! Uzupełnij opis i zapisz.', 'success');
      }
    } catch (err) {
      console.error("Error capturing photo:", err);
      triggerToast('Błąd podczas robienia zdjęcia.', 'warning');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
        triggerToast('Zdjęcie wczytane! Uzupełnij opis i zapisz.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedImage) {
      triggerToast('Najpierw zrób lub wybierz zdjęcie!', 'warning');
      return;
    }
    
    const newPhoto: ConstructionPhoto = {
      id: `photo-${Date.now()}`,
      projectName: newPhotoProject.trim() || settings.defaultProject || 'Budowa Domu',
      date: newPhotoDate || new Date().toISOString().split('T')[0],
      imageUri: capturedImage,
      notes: newPhotoNotes.trim() || undefined
    };

    const updated = [newPhoto, ...photos];
    savePhotos(updated);

    // Reset fields
    setCapturedImage(null);
    setNewPhotoNotes('');
    setShowAddPhotoForm(false);
    triggerToast('Zdjęcie zapisane w galerii placu budowy! 📸', 'success');
    confetti({ particleCount: 30, spread: 25, origin: { y: 0.8 } });
  };

  const handleDeletePhoto = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć to zdjęcie z galerii?')) {
      const updated = photos.filter(p => p.id !== id);
      savePhotos(updated);
      triggerToast('Zdjęcie usunięte z galerii.', 'info');
    }
  };

  // --- Filters & Search logic for history ---
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // 1. Text search (matches project, description, worker name, or location)
      const query = historySearch.toLowerCase().trim();
      const matchesSearch = 
        entry.project.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query) ||
        (entry.workerName && entry.workerName.toLowerCase().includes(query)) ||
        (entry.location && entry.location.toLowerCase().includes(query));
      
      // 2. Project filter
      const matchesProject = 
        historyProjectFilter === 'All' || 
        entry.project === historyProjectFilter;

      // 3. Month Filter
      let matchesMonth = true;
      if (historyMonthFilter !== 'All') {
        const [year, month] = entry.date.split('-');
        matchesMonth = `${year}-${month}` === historyMonthFilter;
      }

      return matchesSearch && matchesProject && matchesMonth;
    });
  }, [entries, historySearch, historyProjectFilter, historyMonthFilter]);

  // Unique list of projects for filters
  const uniqueProjects = useMemo(() => {
    const projs = entries.map(e => e.project.trim());
    return ['All', ...Array.from(new Set(projs))];
  }, [entries]);

  // Unique list of months for filters
  const uniqueMonths = useMemo(() => {
    const months = entries.map(e => {
      const [year, month] = e.date.split('-');
      return `${year}-${month}`;
    });
    return ['All', ...Array.from(new Set(months))].sort((a, b) => b.localeCompare(a));
  }, [entries]);

  // --- Aggregate Stats ---
  const totals = useMemo(() => {
    let totalHours = 0;
    let totalEarningsBrutto = 0;
    let totalBreaks = 0;
    let overtimeHours = 0;

    filteredEntries.forEach(entry => {
      const hrs = calculateEntryHours(entry);
      const earn = calculateEntryEarnings(entry);
      totalHours += hrs;
      totalEarningsBrutto += earn;
      totalBreaks += entry.breakMinutes;
      if (entry.isOvertime) {
        overtimeHours += hrs;
      }
    });

    const taxAmount = (totalEarningsBrutto * settings.taxRatePercent) / 100;
    const totalEarningsNetto = totalEarningsBrutto - taxAmount;

    return {
      totalHours,
      totalEarningsBrutto,
      totalEarningsNetto,
      taxAmount,
      totalBreaks,
      overtimeHours,
      averageRate: totalHours > 0 ? (totalEarningsBrutto / totalHours) : settings.defaultHourlyRate
    };
  }, [filteredEntries, settings.taxRatePercent, settings.defaultHourlyRate]);

  // --- Recharts Cumulative Earnings Over Time Dataset ---
  const earningsOverTime = useMemo(() => {
    // Sort chronologically
    const sorted = [...filteredEntries].sort((a, b) => a.date.localeCompare(b.date));
    
    // Group and sum daily earnings
    const map: { [key: string]: number } = {};
    sorted.forEach(entry => {
      const earn = calculateEntryEarnings(entry);
      map[entry.date] = (map[entry.date] || 0) + earn;
    });
    
    // Cumulative calculation
    let cumulative = 0;
    return Object.entries(map).map(([date, dailyEarnings]) => {
      cumulative += dailyEarnings;
      return {
        date,
        shortDate: date.substring(5), // MM-DD
        Suma: parseFloat(cumulative.toFixed(2)),
        Dzienny: parseFloat(dailyEarnings.toFixed(2))
      };
    });
  }, [filteredEntries]);

  // --- Charts Datasets (Custom SVG representations) ---
  // 1. Project breakdown
  const projectBreakdown = useMemo(() => {
    const map: { [key: string]: { hours: number; earnings: number } } = {};
    filteredEntries.forEach(entry => {
      const hrs = calculateEntryHours(entry);
      const earn = calculateEntryEarnings(entry);
      if (!map[entry.project]) {
        map[entry.project] = { hours: 0, earnings: 0 };
      }
      map[entry.project].hours += hrs;
      map[entry.project].earnings += earn;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      hours: data.hours,
      earnings: data.earnings
    })).sort((a, b) => b.hours - a.hours);
  }, [filteredEntries]);

  // 2. Daily breakdown (last 7 logs)
  const lastSevenLogs = useMemo(() => {
    return [...filteredEntries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
      .map(entry => ({
        date: entry.date.substring(5), // MM-DD
        hours: calculateEntryHours(entry),
        project: entry.project
      }));
  }, [filteredEntries]);

  // 3. Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: { [key: string]: { hours: number; earnings: number } } = {};
    filteredEntries.forEach(entry => {
      const cat = entry.category || 'Inne / Brak';
      const hrs = calculateEntryHours(entry);
      const earn = calculateEntryEarnings(entry);
      if (!map[cat]) {
        map[cat] = { hours: 0, earnings: 0 };
      }
      map[cat].hours += hrs;
      map[cat].earnings += earn;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      hours: data.hours,
      earnings: data.earnings
    })).sort((a, b) => b.hours - a.hours);
  }, [filteredEntries]);

  // 4. Achievement Badges (Dynamically calculated from entries state)
  const achievements = useMemo(() => {
    const totalHoursSum = entries.reduce((sum, e) => sum + calculateEntryHours(e), 0);
    const uniqueDays = Array.from(new Set(entries.map(e => e.date))).sort();
    
    let maxStreak = 0;
    let currentStreak = 0;
    let prevTime = 0;
    uniqueDays.forEach(dateStr => {
      const dateTime = new Date(dateStr).getTime();
      if (prevTime === 0) {
        currentStreak = 1;
      } else {
        const diffDays = Math.round((dateTime - prevTime) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      prevTime = dateTime;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    });

    const uniqueDaysCount = uniqueDays.length;
    const hasEightHoursEntry = entries.some(e => calculateEntryHours(e) >= 8);
    const hasDetailedDesc = entries.some(e => e.description && e.description.trim().length >= 30);
    const detailedEntriesCount = entries.filter(e => e.description && e.description.trim().length >= 20).length;

    return [
      {
        id: 'consistency',
        title: 'Systematyczność',
        description: 'Zarejestruj czas pracy w co najmniej 3 różnych dniach.',
        requirement: '3 unikalne dni',
        icon: '🗓️',
        current: uniqueDaysCount,
        target: 3,
        isEarned: uniqueDaysCount >= 3,
        category: 'Regularność'
      },
      {
        id: 'streak',
        title: 'Nawyk Pracy',
        description: 'Utrzymaj passę rejestrowania czasu pracy przez co najmniej 3 dni z rzędu.',
        requirement: '3 dni z rzędu',
        icon: '🔥',
        current: maxStreak,
        target: 3,
        isEarned: maxStreak >= 3,
        category: 'Regularność'
      },
      {
        id: 'daily_target',
        title: 'Szychta Zaliczona',
        description: 'Zarejestruj wpis o długości co najmniej 8 godzin.',
        requirement: 'Wpis ≥ 8 godzin',
        icon: '⏱️',
        current: hasEightHoursEntry ? 1 : 0,
        target: 1,
        isEarned: hasEightHoursEntry,
        category: 'Cele Godzinowe'
      },
      {
        id: 'weekly_target',
        title: 'Tytan Pracy',
        description: 'Przepracuj łącznie co najmniej 40 godzin w całym rejestrze.',
        requirement: 'Suma ≥ 40 godzin',
        icon: '🏆',
        current: parseFloat(totalHoursSum.toFixed(1)),
        target: 40,
        isEarned: totalHoursSum >= 40,
        category: 'Cele Godzinowe'
      },
      {
        id: 'detailed_desc',
        title: 'Skrupulatny Opis',
        description: 'Dodaj wpis z dokładnym opisem robót (co najmniej 30 znaków).',
        requirement: 'Opis ≥ 30 znaków',
        icon: '📝',
        current: hasDetailedDesc ? 1 : 0,
        target: 1,
        isEarned: hasDetailedDesc,
        category: 'Dokładność'
      },
      {
        id: 'perfect_documentation',
        title: 'Perfekcyjna Dokumentacja',
        description: 'Dodaj co najmniej 5 wpisów z opisem robót o długości minimum 20 znaków.',
        requirement: '5 wpisów z opisem ≥ 20 znaków',
        icon: '📚',
        current: detailedEntriesCount,
        target: 5,
        isEarned: detailedEntriesCount >= 5,
        category: 'Dokładność'
      }
    ];
  }, [entries]);

  // --- PDF Report Generator (Standard jsPDF) ---
  const generatePDFReport = () => {
    const doc = new jsPDF();
    
    // Header Style Setup
    doc.setFillColor(15, 23, 42); // slate-900 background for top banner
    doc.rect(0, 0, 210, 38, 'F');
    
    // Header Text (Polish sanitized to prevent font crashes)
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(sanitizePolishChars('KARTA PRACY - RAPORT GODZINOWY'), 14, 16);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 14, 23);
    doc.text(`Uzytkownik: ${sanitizePolishChars('Rejestr Lokalny')} | Status: ${isOffline ? 'Offline' : 'Online'}`, 14, 28);
    
    // Settings & Rates summary box
    doc.setFillColor(241, 245, 249); // light grey
    doc.rect(14, 44, 182, 34, 'F');
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(sanitizePolishChars('PODSUMOWANIE OKRESU'), 18, 50);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Liczba wpisow: ${filteredEntries.length}`, 18, 57);
    doc.text(`Calkowity czas pracy: ${formatDuration(totals.totalHours)} (${totals.totalHours.toFixed(2)} godz.)`, 18, 63);
    doc.text(`Suma przerw: ${totals.totalBreaks} min`, 18, 69);
    
    doc.text(`Stawka podstawowa: ${settings.defaultHourlyRate} ${settings.currency}/h`, 110, 57);
    doc.text(`Wynagrodzenie BRUTTO: ${formatCurrencyValue(totals.totalEarningsBrutto, settings.currency)}`, 110, 63);
    doc.text(`Podatek (${settings.taxRatePercent}%): ${formatCurrencyValue(totals.taxAmount, settings.currency)}`, 110, 69);
    
    // Netto big banner
    doc.setFillColor(220, 252, 231); // light green accent
    doc.rect(14, 82, 182, 12, 'F');
    doc.setTextColor(21, 128, 61); // deep green
    doc.setFont('Helvetica', 'bold');
    doc.text(`DO WYPLATY (NETTO): ${formatCurrencyValue(totals.totalEarningsNetto, settings.currency)}`, 18, 90);
    
    // Table Header
    doc.setFillColor(51, 65, 85); // slate-700
    doc.rect(14, 98, 182, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'bold');
    
    doc.text('Data', 16, 103);
    doc.text('Projekt', 36, 103);
    doc.text('Kategoria', 72, 103);
    doc.text('Godziny', 102, 103);
    doc.text('Przerwa', 128, 103);
    doc.text('Stawka', 148, 103);
    doc.text('Suma Brutto', 170, 103);
    
    // Table rows
    let currentY = 111;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    
    filteredEntries.forEach((entry, idx) => {
      // Page break check
      if (currentY > 265) {
        doc.addPage();
        currentY = 20;
        // Reprint header row
        doc.setFillColor(51, 65, 85);
        doc.rect(14, currentY - 5, 182, 7.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.text('Data', 16, currentY);
        doc.text('Projekt', 36, currentY);
        doc.text('Kategoria', 72, currentY);
        doc.text('Godziny', 102, currentY);
        doc.text('Przerwa', 128, currentY);
        doc.text('Stawka', 148, currentY);
        doc.text('Suma Brutto', 170, currentY);
        currentY += 8;
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
      }
      
      // Zebra striping
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY - 4, 182, 6, 'F');
      }
      
      const hoursWorked = calculateEntryHours(entry);
      const earnings = calculateEntryEarnings(entry);
      const isOver = entry.isOvertime ? ' (OT)' : '';
      
      doc.text(entry.date, 16, currentY);
      doc.text(sanitizePolishChars(entry.project.substring(0, 18)), 36, currentY);
      doc.text(sanitizePolishChars((entry.category || 'Ogólne').substring(0, 15)), 72, currentY);
      doc.text(`${entry.startTime}-${entry.endTime} (${hoursWorked.toFixed(2)}h)`, 102, currentY);
      doc.text(`${entry.breakMinutes}m`, 128, currentY);
      doc.text(`${entry.hourlyRate}${isOver}`, 148, currentY);
      doc.text(`${earnings.toFixed(2)} ${settings.currency}`, 170, currentY);
      
      currentY += 6;
    });
    
    // Signatures
    currentY = Math.min(currentY + 20, 270);
    if (currentY > 250) {
      doc.addPage();
      currentY = 30;
    }
    
    doc.setDrawColor(203, 213, 225);
    doc.line(14, currentY, 80, currentY);
    doc.line(130, currentY, 196, currentY);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitizePolishChars('Podpis pracownika'), 14, currentY + 4);
    doc.text(sanitizePolishChars('Zatwierdzajacy (Pracodawca)'), 130, currentY + 4);
    
    // Save PDF
    doc.save(`Raport_Godzin_${new Date().toISOString().split('T')[0]}.pdf`);
    triggerToast('Pomyślnie pobrano raport PDF!', 'success');
  };

  // --- Weekly PDF Report Generator ---
  const generateWeeklyPDFReport = () => {
    if (filteredEntries.length === 0) {
      triggerToast('Brak wpisów do wygenerowania raportu tygodniowego!', 'warning');
      return;
    }

    const doc = new jsPDF();
    
    // Header Style Setup
    doc.setFillColor(15, 23, 42); // slate-900 background for top banner
    doc.rect(0, 0, 210, 38, 'F');
    
    // Header Text (Polish sanitized to prevent font crashes)
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(sanitizePolishChars('RAPORT TYGODNIOWY - PODSUMOWANIE'), 14, 16);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 14, 23);
    doc.text(`Typ raportu: Zestawienie tygodniowe | Waluta: ${settings.currency}`, 14, 28);

    // Grouping logic
    const getWeekDetails = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const day = dateObj.getDay();
      // Monday is 1, Sunday is 0. Shift so Monday is index 0, Sunday is index 6.
      const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
      const mondayDate = new Date(y, m - 1, diff);
      
      const sundayDate = new Date(mondayDate);
      sundayDate.setDate(mondayDate.getDate() + 6);
      
      const pad = (n: number) => String(n).padStart(2, '0');
      const mondayStr = `${mondayDate.getFullYear()}-${pad(mondayDate.getMonth() + 1)}-${pad(mondayDate.getDate())}`;
      const sundayStr = `${sundayDate.getFullYear()}-${pad(sundayDate.getMonth() + 1)}-${pad(sundayDate.getDate())}`;
      
      return {
        mondayStr,
        sundayStr,
        rangeStr: `${mondayStr} do ${sundayStr}`,
        mondayTime: mondayDate.getTime()
      };
    };

    const groupsMap: { [key: string]: {
      rangeStr: string;
      mondayTime: number;
      entries: WorkEntry[];
      totalHours: number;
      totalBrutto: number;
      totalNetto: number;
      taxAmount: number;
    } } = {};
    
    filteredEntries.forEach(entry => {
      const { rangeStr, mondayTime } = getWeekDetails(entry.date);
      const hours = calculateEntryHours(entry);
      const brutto = calculateEntryEarnings(entry);
      
      if (!groupsMap[rangeStr]) {
        groupsMap[rangeStr] = {
          rangeStr,
          mondayTime,
          entries: [],
          totalHours: 0,
          totalBrutto: 0,
          totalNetto: 0,
          taxAmount: 0
        };
      }
      
      groupsMap[rangeStr].entries.push(entry);
      groupsMap[rangeStr].totalHours += hours;
      groupsMap[rangeStr].totalBrutto += brutto;
    });
    
    const weeklyGroups = Object.values(groupsMap).map(group => {
      group.entries.sort((a, b) => a.date.localeCompare(b.date));
      group.taxAmount = (group.totalBrutto * settings.taxRatePercent) / 100;
      group.totalNetto = group.totalBrutto - group.taxAmount;
      return group;
    });
    
    // Sort oldest weeks first chronologically
    weeklyGroups.sort((a, b) => a.mondayTime - b.mondayTime);

    // Calculate Grand Totals across all weeks
    let grandHours = 0;
    let grandBrutto = 0;
    let grandNetto = 0;
    let grandTax = 0;
    weeklyGroups.forEach(g => {
      grandHours += g.totalHours;
      grandBrutto += g.totalBrutto;
      grandNetto += g.totalNetto;
      grandTax += g.taxAmount;
    });

    // Grand Summary Box
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, 44, 182, 34, 'F');
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(sanitizePolishChars('GLOBALNE PODSUMOWANIE TYGODNIOWE'), 18, 50);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Liczba tygodni: ${weeklyGroups.length}`, 18, 57);
    doc.text(`Laczny czas pracy: ${formatDuration(grandHours)} (${grandHours.toFixed(2)} godz.)`, 18, 63);
    doc.text(`Sredni czas / tydzien: ${formatDuration(grandHours / (weeklyGroups.length || 1))}`, 18, 69);
    
    doc.text(`Suma brutto: ${formatCurrencyValue(grandBrutto, settings.currency)}`, 110, 57);
    doc.text(`Suma podatku (${settings.taxRatePercent}%): ${formatCurrencyValue(grandTax, settings.currency)}`, 110, 63);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(21, 128, 61); // deep green
    doc.text(`LACZNA WYPLATA (NETTO): ${formatCurrencyValue(grandNetto, settings.currency)}`, 110, 69);
    
    let currentY = 86;

    // Render each week
    weeklyGroups.forEach((group) => {
      // Check for page break before starting a new week section
      // If we don't have at least 55 units, start a new page
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      // Draw Weekly Header Banner
      doc.setFillColor(51, 65, 85); // slate-700
      doc.rect(14, currentY, 182, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(sanitizePolishChars(`TYDZIEN: ${group.rangeStr}`), 18, currentY + 5.5);
      
      // Draw Weekly Totals Bar right below
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(14, currentY + 8, 182, 8, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY + 16, 196, currentY + 16);

      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`Suma godzin: ${group.totalHours.toFixed(2)}h (${formatDuration(group.totalHours)})`, 18, currentY + 13.5);
      doc.text(`Brutto: ${formatCurrencyValue(group.totalBrutto, settings.currency)}`, 95, currentY + 13.5);
      doc.setTextColor(21, 128, 61); // deep green for netto
      doc.text(`Netto: ${formatCurrencyValue(group.totalNetto, settings.currency)}`, 150, currentY + 13.5);

      currentY += 21;

      // Draw Table Header for the week's entries
      doc.setFillColor(241, 245, 249);
      doc.rect(14, currentY - 4, 182, 6, 'F');
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('Data', 16, currentY);
      doc.text('Projekt', 36, currentY);
      doc.text('Kategoria', 68, currentY);
      doc.text('Opis i godziny', 95, currentY);
      doc.text('Przerwa', 145, currentY);
      doc.text('Stawka', 160, currentY);
      doc.text('Suma Brutto', 178, currentY);

      currentY += 5;

      // Draw entries
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);

      group.entries.forEach((entry, idx) => {
        // Page break check inside a week
        if (currentY > 275) {
          doc.addPage();
          currentY = 20;

          // Reprint header for context
          doc.setFillColor(241, 245, 249);
          doc.rect(14, currentY - 4, 182, 6, 'F');
          doc.setTextColor(100, 116, 139);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.text('Data', 16, currentY);
          doc.text('Projekt', 36, currentY);
          doc.text('Kategoria', 68, currentY);
          doc.text('Opis i godziny', 95, currentY);
          doc.text('Przerwa', 145, currentY);
          doc.text('Stawka', 160, currentY);
          doc.text('Suma Brutto', 178, currentY);
          
          currentY += 5;
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(15, 23, 42);
          doc.setFontSize(8);
        }

        // Row striping
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(14, currentY - 3.5, 182, 5, 'F');
        }

        const hrs = calculateEntryHours(entry);
        const earns = calculateEntryEarnings(entry);
        const isOver = entry.isOvertime ? ' (OT)' : '';

        doc.text(entry.date, 16, currentY);
        doc.text(sanitizePolishChars(entry.project.substring(0, 15)), 36, currentY);
        doc.text(sanitizePolishChars((entry.category || 'Ogólne').substring(0, 12)), 68, currentY);
        
        // Combine description and hours nicely
        const descAndHrs = `${entry.startTime}-${entry.endTime} (${hrs.toFixed(2)}h) - ${entry.description.substring(0, 22)}`;
        doc.text(sanitizePolishChars(descAndHrs), 95, currentY);
        
        doc.text(`${entry.breakMinutes}m`, 145, currentY);
        doc.text(`${entry.hourlyRate}${isOver}`, 160, currentY);
        doc.text(`${earns.toFixed(2)}`, 178, currentY);

        currentY += 5;
      });

      currentY += 4; // Add space between weeks
    });

    // Final signature page break or fit check
    if (currentY > 255) {
      doc.addPage();
      currentY = 30;
    } else {
      currentY = Math.min(currentY + 15, 270);
    }

    doc.setDrawColor(203, 213, 225);
    doc.line(14, currentY, 80, currentY);
    doc.line(130, currentY, 196, currentY);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(sanitizePolishChars('Podpis pracownika'), 14, currentY + 4);
    doc.text(sanitizePolishChars('Zatwierdzajacy (Pracodawca)'), 130, currentY + 4);

    // Save report
    doc.save(`Podsumowanie_Tygodniowe_${new Date().toISOString().split('T')[0]}.pdf`);
    triggerToast('Pomyślnie pobrano raport tygodniowy PDF!', 'success');
  };

  // --- Export to CSV Spreadsheet ---
  const exportToCSV = () => {
    // CSV with BOM (Byte Order Mark) so Excel reads Polish letters correctly
    let csvContent = '\uFEFF';
    
    // Headers
    csvContent += 'Data;Projekt;Kategoria;Od;Do;Przerwa (min);Stawka (PLN/h);Nadgodziny;Mnoznik Nadgodzin;Godziny Netto;Suma Brutto;Opis\r\n';
    
    filteredEntries.forEach(entry => {
      const hoursWorked = calculateEntryHours(entry);
      const earnings = calculateEntryEarnings(entry);
      
      const row = [
        entry.date,
        `"${entry.project.replace(/"/g, '""')}"`,
        `"${(entry.category || 'Ogólne').replace(/"/g, '""')}"`,
        entry.startTime,
        entry.endTime,
        entry.breakMinutes,
        entry.hourlyRate,
        entry.isOvertime ? 'TAK' : 'NIE',
        entry.overtimeMultiplier,
        hoursWorked.toFixed(2),
        earnings.toFixed(2),
        `"${entry.description.replace(/"/g, '""')}"`
      ];
      
      csvContent += row.join(';') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Eksport_Godzin_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerToast('Pomyślnie pobrano arkusz CSV!', 'success');
  };

  // --- Export to XLSX Spreadsheet ---
  const exportToXLSX = () => {
    try {
      if (filteredEntries.length === 0) {
        triggerToast('Brak wpisów do wyeksportowania do XLSX!', 'warning');
        return;
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheetData = filteredEntries.map((entry, index) => {
        const hoursWorked = calculateEntryHours(entry);
        const earnings = calculateEntryEarnings(entry);
        return {
          'Lp.': index + 1,
          'Data': entry.date,
          'Projekt': entry.project,
          'Kategoria': entry.category || 'Ogólne',
          'Od': entry.startTime,
          'Do': entry.endTime,
          'Przerwa (min)': entry.breakMinutes,
          'Stawka (PLN/h)': entry.hourlyRate,
          'Nadgodziny': entry.isOvertime ? 'TAK' : 'NIE',
          'Mnożnik': entry.overtimeMultiplier,
          'Godziny netto': parseFloat(hoursWorked.toFixed(2)),
          'Suma brutto': parseFloat(earnings.toFixed(2)),
          'Opis': entry.description
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Historia Godzin');

      // Autofit columns
      const maxLen = worksheetData.reduce((acc, row) => {
        Object.keys(row).forEach((key, colIdx) => {
          const val = String(row[key as keyof typeof row] || '');
          acc[colIdx] = Math.max(acc[colIdx] || 10, val.length + 2);
        });
        return acc;
      }, [] as number[]);
      worksheet['!cols'] = maxLen.map(w => ({ wch: w }));

      XLSX.writeFile(workbook, `Historia_Wpisow_${new Date().toISOString().split('T')[0]}.xlsx`);
      triggerToast('Pomyślnie pobrano arkusz Excel (.xlsx)! 📊', 'success');
    } catch (err) {
      console.error('Export to XLSX failed:', err);
      triggerToast('Błąd eksportu do XLSX.', 'warning');
    }
  };

  // --- Local Notifications Reminder Simulator ---
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        triggerToast('Dostęp do powiadomień przyznany!', 'success');
        // Send actual browser notification to test
        new Notification('Rejestrator Czasu Pracy', {
          body: 'Powiadomienia zostały pomyślnie włączone w Twojej przeglądarce!',
          icon: '/favicon.ico'
        });
      } else {
        triggerToast('Powiadomienia zablokowane.', 'warning');
      }
    } else {
      triggerToast('Powiadomienia nie są wspierane na tym urządzeniu.', 'warning');
    }
  };

  const simulateReminder = () => {
    if (settings.audioAlertsEnabled !== false) {
      playNotificationSound(settings.workEndSound || 'bell');
    }
    // Ensure offline mode works for triggers too
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Czas zamknąć dzień!', {
        body: `Przypomnienie: Zarejestruj czas pracy dla projektu "${settings.defaultProject}".`,
        icon: '/favicon.ico'
      });
      triggerToast('Wysłano testowe powiadomienie systemowe!', 'success');
    } else {
      // Fallback custom in-app modal / alert
      triggerToast('PRZYPOMNIENIE: Nie zapomnij zapisać dzisiejszych godzin pracy!', 'warning');
    }
  };

  const simulate10AMReminder = () => {
    const todayStr = new Date().toLocaleDateString('sv');
    const todayEntries = entries.filter(e => e.date === todayStr);

    if (todayEntries.length === 0 && !timerRunning) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('👷 Brak wpisu w Budowlańcy PRO (Test)', {
          body: 'Test: Jest już po godzinie 10:00, a Ty nie zarejestrowałeś dzisiaj żadnego wpisu ani nie uruchomiłeś stopera! Zapisz swoje godziny pracy.',
          icon: '/favicon.ico'
        });
      }
      triggerToast('⚠️ Test 10:00: Brak dzisiejszych wpisów!', 'warning');
      if (settings.audioAlertsEnabled !== false) {
        playNotificationSound(settings.workEndSound || 'bell');
      }
    } else {
      triggerToast('Test 10:00: Posiadasz już dzisiejsze wpisy lub stoper jest aktywny. Przypomnienie nie zostałoby wyzwolone.', 'info');
    }
  };

  const simulateWeatherCheck = () => {
    let foundRainWarning = false;
    const warningDetails: string[] = [];

    tasks.forEach(task => {
      if (!task.completed && !task.cancelled && task.dueDate && task.isOutdoor) {
        const forecast = weatherForecast[task.dueDate];
        if (forecast === 'rainy' || forecast === 'stormy') {
          warningDetails.push(`"${task.name}" (${task.dueDate} - ${forecast === 'stormy' ? 'Burza ⛈️' : 'Deszcz 🌧️'})`);
          foundRainWarning = true;
        }
      }
    });

    if (foundRainWarning && warningDetails.length > 0) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('⚠️ Ostrzeżenie Pogodowe (Prace Zewnętrzne)!', {
          body: `Zagrożenie opadami deszczu dla: ${warningDetails.join(', ')}. Sugerujemy zmianę terminu!`,
          icon: '/favicon.ico'
        });
      }
      triggerToast(`🌧️ Ryzyko opadów deszczu dla prac zewnętrznych: ${warningDetails.join(', ')}`, 'warning');
      if (settings.audioAlertsEnabled !== false) {
        playNotificationSound('alert');
      }
    } else {
      triggerToast('☀️ Skan kompletny: Brak zagrożeń pogodowych dla aktualnych prac zewnętrznych w najbliższych dniach.', 'success');
      if (settings.audioAlertsEnabled !== false) {
        playNotificationSound('success');
      }
    }
  };

  if (!isMounted) {
    return (
      <div id="app-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
        <div className="w-full h-2 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#1e293b_10px,#1e293b_20px)] shadow-md"></div>
        <header id="header-bar" className="bg-slate-50 dark:bg-slate-950 px-6 pt-6 pb-4 flex justify-between items-start max-w-lg mx-auto w-full">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>👷 Budowlańcy</span>
              <span className="text-amber-500 font-extrabold text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/30 uppercase tracking-widest">PRO</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs mt-0.5">Wczytywanie placu budowy...</p>
          </div>
        </header>
        <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-1 pb-24 overflow-y-auto flex items-center justify-center">
          <div className="text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
            <span>Wczytywanie...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div id="app-container" className={`min-h-screen flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden transition-colors duration-300 ${
      activeTab === 'today'
        ? 'bg-[#020617] text-slate-100'
        : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100'
    }`}>
      {/* Immersive sleek background: Beautiful futuristic blurred animated construction backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Futuristic glowing construction backdrop image with dynamic breathing animation */}
        <motion.div
          animate={{
            scale: [1.02, 1.06, 1.02],
            rotate: [0, 0.4, -0.4, 0],
            opacity: [0.13, 0.17, 0.13]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center filter blur-[12px] scale-105"
        />
        {/* Tech overlay tint with ambient gradient masking */}
        <div className={`absolute inset-0 bg-radial-gradient from-transparent opacity-95 transition-all duration-300 ${
          activeTab === 'today'
            ? 'via-blue-950/20 to-[#020617]'
            : 'via-slate-50/40 to-slate-50 dark:via-slate-950/30 dark:to-slate-950'
        }`} />
        
        {/* Soft moving futuristic glowing ambient orbs */}
        <motion.div 
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 left-1/4 w-[500px] h-[400px] bg-amber-500/10 dark:bg-amber-500/12 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -30, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-500/8 dark:bg-indigo-500/10 rounded-full blur-[110px]" 
        />
      </div>
      
      <div className="w-full h-2 bg-[repeating-linear-gradient(45deg,#fbbf24,#fbbf24_10px,#1e293b_10px,#1e293b_20px)] shadow-md relative z-10"></div>
      
      {/* Top Navigation / Status Header Bar matching Bento Grid exactly */}
      <header id="header-bar" className="bg-transparent px-6 pt-6 pb-4 flex justify-between items-start max-w-lg mx-auto w-full relative z-10">
        <div>
          <h1 className={`text-2xl font-black tracking-tight flex items-center gap-1.5 transition-colors duration-300 ${
            activeTab === 'today' ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}>
            <span>👷 Budowlańcy</span>
            <span className="text-amber-500 font-extrabold text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/30 uppercase tracking-widest">PRO</span>
          </h1>
          <div className="flex items-center flex-wrap gap-1.5 mt-1">
            <p className={`font-semibold text-[11px] leading-none transition-colors duration-300 ${
              activeTab === 'today' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
            }`}>{formattedTodayDate}</p>
            {isMounted && (
              <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${currentShift.color} flex items-center gap-1 leading-none shrink-0`}>
                <span className="text-[10px]">{currentShift.emoji}</span>
                <span>{currentShift.name}</span>
              </span>
            )}
          </div>
        </div>
        <motion.button 
          onClick={() => {
            setForceOffline(!forceOffline);
            triggerToast(!forceOffline ? 'Wymuszono tryb offline!' : 'Przywrócono domyślne połączenie', 'info');
          }}
          whileHover={{ scale: 1.05, rotate: isOffline ? -5 : 5 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.05)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isOffline 
              ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 focus:ring-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.15)]' 
              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/10 dark:hover:bg-emerald-950/40 focus:ring-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.15)]'
          }`}
          title="Kliknij, aby przełączyć wymuszony tryb offline"
        >
          <span className="font-extrabold text-xs font-mono tracking-tight">{isOffline ? 'OFF' : 'ON'}</span>
        </motion.button>
      </header>

      {/* Offline Mode Banner Warning if active */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-semibold flex items-center justify-center space-x-2 animate-fade-in shadow-inner max-w-lg mx-auto rounded-2xl mb-2">
          <AlertCircle className="w-4 h-4 text-slate-950 shrink-0" />
          <span>Działasz w trybie offline. Dane zapisujemy lokalnie.</span>
        </div>
      )}

      {/* Main Container viewport */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-1 pb-24 overflow-y-auto">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-16 left-4 right-4 z-50 pointer-events-none flex justify-center"
            >
              <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 border text-xs font-bold max-w-sm ${
                toastMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-100/50' 
                  : toastMessage.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-amber-100/50'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-indigo-100/50'
              }`}>
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                  toastMessage.type === 'success' 
                    ? 'text-emerald-600' 
                    : toastMessage.type === 'warning'
                    ? 'text-amber-600'
                    : 'text-indigo-600'
                }`} />
                <span>{toastMessage.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ==================== TAB 1: TODAY ==================== */}
          {activeTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="space-y-4"
            >
            
            {/* Dynamic Welcome & Shift Quote Panel */}
            {isMounted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative overflow-hidden rounded-[28px] border border-blue-500/20 bg-gradient-to-br from-[#070d1e] via-[#0b142c] to-[#020617] p-6 shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col justify-between group"
              >
                {/* Visual Diagonal Blue Warning Accents at top */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[repeating-linear-gradient(45deg,#2563eb,#2563eb_10px,#020617_10px,#020617_20px)] rounded-t-[28px] opacity-90 shadow-[0_1px_10px_rgba(37,99,235,0.4)]" />
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-500" />
                
                <div className="relative z-10 flex items-start gap-4 mt-1.5">
                  <motion.div 
                    whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                    className="text-3xl shrink-0 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[inset_0_1px_5px_rgba(59,130,246,0.2)]"
                  >
                    {currentShift.emoji}
                  </motion.div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 font-mono">
                        {currentShift.name}
                      </span>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white leading-snug tracking-tight">
                      {currentWorker ? `Witaj na budowie, szefie ${currentWorker}!` : 'Witaj na budowie, szefie!'}
                    </h4>
                    <p className="text-xs text-blue-200 italic leading-relaxed pt-1 pl-3 border-l-2 border-blue-500/40">
                      &ldquo;{currentShift.desc}&rdquo;
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Card 1: Czas dzisiaj */}
              <div className="bg-gradient-to-br from-[#070d1e] to-[#020617] border-t-3 border-t-blue-500 border-x border-b border-blue-500/15 rounded-[24px] p-5.5 flex flex-col justify-between shadow-[0_8px_30px_rgb(2,6,23,0.7)] hover:border-blue-500/30 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/[0.05] rounded-bl-[50px] pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                <div className="flex justify-between items-center relative z-10">
                  <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest font-mono">Czas dzisiaj</span>
                  <motion.div 
                    whileHover={{ scale: 1.15, rotate: 15 }}
                    className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400"
                  >
                    <Clock className="w-4 h-4 text-blue-400" />
                  </motion.div>
                </div>
                <div className="mt-4 flex items-baseline space-x-1 relative z-10">
                  <span className="text-3xl font-black text-white font-mono tracking-tight shadow-sm">
                    {formatDuration(
                      entries
                        .filter(e => e.date === new Date().toISOString().split('T')[0])
                        .reduce((acc, curr) => acc + calculateEntryHours(curr), 0)
                    )}
                  </span>
                </div>
                <div className="text-[9px] font-bold text-blue-400 mt-3 bg-blue-500/10 py-1 px-2.5 rounded-lg border border-blue-500/20 w-max flex items-center gap-1.5 relative z-10 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>Cel: {dailyTargetHours}h</span>
                </div>
              </div>

              {/* Card 2: Zarobek brutto */}
              <div className="bg-gradient-to-br from-[#070d1e] to-[#020617] border-t-3 border-t-cyan-500 border-x border-b border-blue-500/15 rounded-[24px] p-5.5 flex flex-col justify-between shadow-[0_8px_30px_rgb(2,6,23,0.7)] hover:border-cyan-500/30 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/[0.05] rounded-bl-[50px] pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                <div className="flex justify-between items-center relative z-10">
                  <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest font-mono">Zarobek brutto</span>
                  <motion.div 
                    whileHover={{ scale: 1.15, rotate: -15 }}
                    className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400"
                  >
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                  </motion.div>
                </div>
                <div className="mt-4 flex items-baseline space-x-1 relative z-10">
                  <span className="text-3xl font-black text-white font-mono tracking-tight shadow-sm">
                    {formatCurrencyValue(
                      entries
                        .filter(e => e.date === new Date().toISOString().split('T')[0])
                        .reduce((acc, curr) => acc + calculateEntryEarnings(curr), 0),
                      settings.currency
                    )}
                  </span>
                </div>
                <div className="text-[9px] font-bold text-cyan-400 mt-3 bg-cyan-500/10 py-1 px-2.5 rounded-lg border border-cyan-500/20 w-max flex items-center gap-1.5 relative z-10 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Stawka: {settings.defaultHourlyRate} {settings.currency}/h</span>
                </div>
              </div>
            </div>

            {/* Daily Hour Target & Progress Tracker */}
            <div className="bg-[#070d1e]/80 border border-blue-500/20 rounded-[28px] p-6 shadow-[0_8px_30px_rgb(2,6,23,0.6)] transition-all duration-300 hover:border-blue-500/40">
              <div className="flex items-center justify-between mb-4.5">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dzienny Cel Godzin</span>
                  </h3>
                  <p className="text-[10px] text-blue-200 mt-1 font-semibold leading-normal">Ustaw swój plan szychty i obserwuj postęp dnia</p>
                </div>
                <div className="flex items-center space-x-2 bg-slate-950 border border-blue-900/40 rounded-2xl p-1.5 shadow-inner">
                  <motion.button
                    type="button"
                    onClick={() => {
                      const newTarget = Math.max(1, dailyTargetHours - 0.5);
                      setDailyTargetHours(newTarget);
                      localStorage.setItem('daily_target_hours', newTarget.toString());
                      triggerToast(`Zmniejszono cel do ${newTarget}h`, 'info');
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    className="w-7.5 h-7.5 bg-slate-900 hover:bg-blue-500 text-blue-300 hover:text-white rounded-xl border border-blue-800 hover:border-blue-500 flex items-center justify-center text-xs font-black transition-all cursor-pointer shadow-2xs"
                  >
                    -
                  </motion.button>
                  <span className="text-xs font-black px-2 text-white font-mono tracking-tight">{dailyTargetHours}h</span>
                  <motion.button
                    type="button"
                    onClick={() => {
                      const newTarget = Math.min(24, dailyTargetHours + 0.5);
                      setDailyTargetHours(newTarget);
                      localStorage.setItem('daily_target_hours', newTarget.toString());
                      triggerToast(`Zwiększono cel do ${newTarget}h`, 'info');
                    }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    className="w-7.5 h-7.5 bg-slate-900 hover:bg-blue-500 text-blue-300 hover:text-white rounded-xl border border-blue-800 hover:border-blue-500 flex items-center justify-center text-xs font-black transition-all cursor-pointer shadow-2xs"
                  >
                    +
                  </motion.button>
                </div>
              </div>

              {/* Progress Gauge */}
              {(() => {
                const loggedToday = entries
                  .filter(e => e.date === new Date().toISOString().split('T')[0])
                  .reduce((acc, curr) => acc + calculateEntryHours(curr), 0);
                const pct = Math.min(100, Math.round((loggedToday / dailyTargetHours) * 100)) || 0;
                const isCompleted = loggedToday >= dailyTargetHours;

                return (
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-blue-300">
                        Zrealizowano: <span className="text-white font-black font-mono ml-1 text-xs">{loggedToday.toFixed(2)}h / {dailyTargetHours}h</span>
                      </span>
                      <span className={`font-black font-mono text-xs ${isCompleted ? 'text-cyan-400' : 'text-blue-400'}`}>{pct}%</span>
                    </div>
                    
                    {/* Visual Power Gauge Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden border border-blue-900/30 p-0.5 relative">
                      <motion.div
                        className={`h-full rounded-full transition-all duration-500`}
                        style={{ 
                          width: `${pct}%`,
                          backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)',
                          backgroundSize: '1rem 1rem'
                        }}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${pct}%`,
                          backgroundColor: isCompleted ? '#06b6d4' : '#2563eb'
                        }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                      />
                    </div>
                    
                    {isCompleted && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="flex items-center gap-2 justify-center py-2.5 bg-cyan-500/[0.08] border border-cyan-500/20 rounded-2xl mt-1 text-[10px] font-black text-cyan-400 uppercase tracking-widest font-mono shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 animate-bounce" />
                        <span>Dzienny cel osiągnięty! Dobra robota!</span>
                      </motion.div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-2 gap-3.5">
              <motion.button
                onClick={copyTodayReportToClipboard}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="group relative bg-[#070d1e] hover:bg-[#0c142c] border border-blue-500/15 hover:border-blue-500/40 text-blue-300 hover:text-blue-200 font-extrabold uppercase tracking-widest text-[10px] rounded-2xl py-3 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-sm font-mono"
              >
                <Copy className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                <span>Kopiuj Raport</span>
              </motion.button>
              <motion.button
                onClick={generateTodayPDF}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="group relative bg-[#070d1e] hover:bg-[#0c142c] border border-blue-500/15 hover:border-cyan-500/40 text-blue-300 hover:text-cyan-200 font-extrabold uppercase tracking-widest text-[10px] rounded-2xl py-3 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-sm font-mono"
              >
                <FileText className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                <span>Eksport PDF</span>
              </motion.button>
            </div>

            {/* Timer / Stoper Card - Premium Industrial Technical Theme */}
            <div className={`bg-gradient-to-br from-[#070d1e] to-[#020617] border-2 ${timerRunning ? 'border-blue-500/80 shadow-[0_0_35px_rgba(59,130,246,0.35)]' : 'border-blue-500/20'} p-6 rounded-[32px] text-slate-100 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-blue-500/40 group`}>
              {/* Technical drafting grid alignment corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500/40 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500/40 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500/40 pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500/40 pointer-events-none"></div>
              
              <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/[0.04] rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 font-mono flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${timerRunning ? 'bg-blue-500 animate-ping' : 'bg-slate-600'}`} />
                  <span>Plac Budowy - Czas Pracy</span>
                </span>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm transition-all ${
                  timerRunning ? 'bg-blue-600 text-white font-black animate-pulse shadow-[0_0_12px_rgba(37,99,235,0.4)]' : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {timerRunning ? 'SZYCHTA AKTYWNA' : 'PAUZA'}
                </div>
              </div>

              {/* Big Digital Clock Instrument */}
              <div className="my-5 flex flex-col relative z-10">
                <div className={`flex items-center justify-between ${timerRunning ? 'bg-slate-950 border-blue-500/30 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]' : 'bg-slate-950 border-slate-800'} border rounded-2xl p-5 shadow-inner transition-colors duration-300 relative overflow-hidden`}>
                  <div className="flex items-center space-x-4">
                    <Clock className={`w-8 h-8 ${timerRunning ? 'text-blue-400 animate-spin-slow' : 'text-slate-500'}`} style={{ animationDuration: '10s' }} />
                    <span className="text-4xl font-black font-mono tracking-wider text-white relative z-10 select-all">
                      {Math.floor(timerElapsedSeconds / 3600).toString().padStart(2, '0')}
                      <span className={timerRunning ? 'animate-pulse' : ''}>:</span>
                      {Math.floor((timerElapsedSeconds % 3600) / 60).toString().padStart(2, '0')}
                      <span className={timerRunning ? 'animate-pulse' : ''}>:</span>
                      {(timerElapsedSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  
                  {/* Glowing warning beacon when active */}
                  {timerRunning && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                    </div>
                  )}
                </div>
                
                <span className="text-blue-300 text-xs font-semibold mt-3 flex items-center justify-between">
                  <span>Szacowany zarobek na szychcie:</span>
                  <span className="text-cyan-400 font-mono font-black text-sm bg-cyan-500/[0.08] border border-cyan-500/20 px-3 py-1 rounded-xl shadow-xs">
                    {(timerElapsedSeconds / 3600 * getRateForProjectOrTask(timerProject, timerDescription, settings)).toFixed(2)} {settings.currency}
                  </span>
                </span>
              </div>

              {/* COLLAPSIBLE INTERACTIVE MATERIAL ESTIMATOR */}
              <div className="mt-4 pt-3.5 border-t border-blue-500/10 relative z-10">
                <motion.button
                  type="button"
                  onClick={() => setShowQuickCalc(!showQuickCalc)}
                  className="w-full flex items-center justify-between bg-slate-950 hover:bg-slate-900 border border-blue-900/40 hover:border-blue-500/40 rounded-xl py-2.5 px-4 text-blue-300 hover:text-blue-200 font-extrabold cursor-pointer transition-all select-none font-mono"
                >
                  <div className="flex items-center gap-2">
                    <Layers className={`w-3.5 h-3.5 text-blue-400 ${showQuickCalc ? 'rotate-180 transition-transform duration-300' : ''}`} />
                    <span className="uppercase tracking-wider text-[9px]">Szybki Kalkulator Materiałowy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-blue-400 font-black uppercase bg-slate-900 border border-blue-900/40 px-1.5 py-0.5 rounded-md font-mono">
                      {showQuickCalc ? 'Zwiń' : 'Rozwiń'}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-300 ${showQuickCalc ? 'rotate-90 text-blue-400' : ''}`} />
                  </div>
                </motion.button>

                <AnimatePresence>
                  {showQuickCalc && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-3.5 space-y-3.5"
                    >
                      {/* Calculator Tabs */}
                      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-blue-900/40">
                        <button
                          type="button"
                          onClick={() => {
                            setCalcType('concrete');
                            setCalcPricePerUnit(350);
                          }}
                          className={`px-2 py-2 text-[11px] font-black rounded-lg transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                            calcType === 'concrete' 
                              ? 'bg-blue-600 text-white font-black shadow-sm' 
                              : 'text-blue-300 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <span>🏗️ Beton</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCalcType('bricks');
                            setCalcPricePerUnit(9.5);
                          }}
                          className={`px-2 py-2 text-[11px] font-black rounded-lg transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                            calcType === 'bricks' 
                              ? 'bg-blue-600 text-white font-black shadow-sm' 
                              : 'text-blue-300 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <span>🧱 Cegły</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCalcType('plaster');
                            setCalcPricePerUnit(22);
                          }}
                          className={`px-2 py-2 text-[11px] font-black rounded-lg transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                            calcType === 'plaster' 
                              ? 'bg-blue-600 text-white font-black shadow-sm' 
                              : 'text-blue-300 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <span>🪄 Tynki</span>
                        </button>
                      </div>

                      {/* Calculator Inputs and Outputs depending on selection */}
                      <div className="bg-slate-950/80 rounded-2xl p-4 border border-blue-900/30 space-y-4">
                        {calcType === 'concrete' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1 font-mono">Długość (m)</label>
                                <input 
                                  type="number"
                                  step="0.1"
                                  value={concreteLength}
                                  onChange={(e) => setConcreteLength(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-blue-900/40 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1 font-mono">Szerokość (m)</label>
                                <input 
                                  type="number"
                                  step="0.1"
                                  value={concreteWidth}
                                  onChange={(e) => setConcreteWidth(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-blue-900/40 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1 font-mono">Grubość (m)</label>
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={concreteThickness}
                                  onChange={(e) => setConcreteThickness(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-blue-900/40 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1 font-mono">Cena za 1 m³ ({settings.currency})</label>
                              <input 
                                type="number"
                                value={calcPricePerUnit}
                                onChange={(e) => setCalcPricePerUnit(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-blue-900/40 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                              />
                            </div>

                            {/* Calculations output */}
                            {(() => {
                              const volume = concreteLength * concreteWidth * concreteThickness;
                              const weightTonnes = volume * 2.4;
                              const totalCost = volume * calcPricePerUnit;
                              return (
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-900/30 text-center">
                                  <div className="bg-slate-900 border border-blue-900/20 p-2 rounded-xl shadow-2xs">
                                    <span className="block text-[8px] text-blue-400 font-bold uppercase font-mono">Objętość</span>
                                    <span className="text-xs font-mono font-black text-blue-300">{volume.toFixed(2)} m³</span>
                                  </div>
                                  <div className="bg-slate-900 border border-blue-900/20 p-2 rounded-xl shadow-2xs">
                                    <span className="block text-[8px] text-cyan-400 font-bold uppercase font-mono">Masa</span>
                                    <span className="text-xs font-mono font-black text-cyan-300">~{weightTonnes.toFixed(1)} t</span>
                                  </div>
                                  <div className="bg-slate-900 border border-blue-900/20 p-2 rounded-xl shadow-2xs">
                                    <span className="block text-[8px] text-cyan-400 font-bold uppercase font-mono">Koszt</span>
                                    <span className="text-xs font-mono font-black text-cyan-400">{totalCost.toFixed(0)} {settings.currency}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {calcType === 'bricks' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1 font-mono">Ściany (m²)</label>
                                <input 
                                  type="number"
                                  value={brickWallArea}
                                  onChange={(e) => setBrickWallArea(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-blue-900/40 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1 font-mono">Typ bloczka</label>
                                <select
                                  value={brickType}
                                  onChange={(e) => setBrickType(e.target.value as any)}
                                  className="w-full bg-slate-900 border border-blue-900/40 rounded-lg px-2 py-1.5 text-xs text-white font-black focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                  <option value="porotherm" className="bg-slate-950 text-white">🧱 Porotherm (11.5 / m²)</option>
                                  <option value="solbet" className="bg-slate-950 text-white">⬜ Solbet (7 / m²)</option>
                                  <option value="silka" className="bg-slate-950 text-white">🧱 Silka (15 / m²)</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1 font-mono">Cena za 1 szt. ({settings.currency})</label>
                              <input 
                                type="number"
                                step="0.1"
                                value={calcPricePerUnit}
                                onChange={(e) => setCalcPricePerUnit(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-blue-900/40 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                              />
                            </div>

                            {/* Calculations output */}
                            {(() => {
                              const rate = brickType === 'porotherm' ? 11.5 : brickType === 'solbet' ? 7 : 15;
                              const qty = Math.ceil(brickWallArea * rate);
                              const totalCost = qty * calcPricePerUnit;
                              return (
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-900/30 text-center">
                                  <div className="bg-slate-900 border border-blue-900/20 p-2 rounded-xl shadow-2xs">
                                    <span className="block text-[8px] text-blue-400 font-bold uppercase font-mono">Zużycie/m²</span>
                                    <span className="text-xs font-mono font-black text-blue-300">{rate} szt.</span>
                                  </div>
                                  <div className="bg-slate-900 border border-blue-900/20 p-2 rounded-xl shadow-2xs">
                                    <span className="block text-[8px] text-cyan-400 font-bold uppercase font-mono">Bloczki</span>
                                    <span className="text-xs font-mono font-black text-cyan-300">{qty} szt.</span>
                                  </div>
                                  <div className="bg-slate-900 border border-blue-900/20 p-2 rounded-xl shadow-2xs">
                                    <span className="block text-[8px] text-cyan-400 font-bold uppercase font-mono">Koszt</span>
                                    <span className="text-xs font-mono font-black text-cyan-300">{totalCost.toFixed(0)} {settings.currency}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {calcType === 'plaster' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1 font-mono">Ściany (m²)</label>
                                <input 
                                  type="number"
                                  value={plasterArea}
                                  onChange={(e) => setPlasterArea(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-slate-900 border border-blue-900/40 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1 font-mono">Warstwy</label>
                                <select
                                  value={plasterLayers}
                                  onChange={(e) => setPlasterLayers(parseInt(e.target.value) || 1)}
                                  className="w-full bg-slate-900 border border-blue-900/40 rounded-lg px-2 py-1.5 text-xs text-white font-black focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                  <option value={1} className="bg-slate-950 text-white">1 warstwa</option>
                                  <option value={2} className="bg-slate-950 text-white">2 warstwy (Standard)</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] font-black text-blue-400 uppercase tracking-wider mb-1 font-mono">Cena za worek 25kg ({settings.currency})</label>
                              <input 
                                type="number"
                                value={calcPricePerUnit}
                                onChange={(e) => setCalcPricePerUnit(parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-blue-900/40 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                              />
                            </div>

                            {/* Calculations output */}
                            {(() => {
                              const totalKg = plasterArea * plasterLayers * 14;
                              const bagsNeeded = Math.ceil(totalKg / 25);
                              const totalCost = bagsNeeded * calcPricePerUnit;
                              return (
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-900/30 text-center">
                                  <div className="bg-slate-900 border border-blue-900/20 p-2 rounded-xl shadow-2xs">
                                    <span className="block text-[8px] text-blue-400 font-bold uppercase font-mono">Zużycie</span>
                                    <span className="text-xs font-mono font-black text-blue-300">{totalKg} kg</span>
                                  </div>
                                  <div className="bg-slate-900 border border-blue-900/20 p-2 rounded-xl shadow-2xs">
                                    <span className="block text-[8px] text-cyan-400 font-bold uppercase font-mono">Worki</span>
                                    <span className="text-xs font-mono font-black text-cyan-300">{bagsNeeded} szt.</span>
                                  </div>
                                  <div className="bg-slate-900 border border-blue-900/20 p-2 rounded-xl shadow-2xs">
                                    <span className="block text-[8px] text-cyan-400 font-bold uppercase font-mono">Koszt</span>
                                    <span className="text-xs font-mono font-black text-cyan-300">{totalCost.toFixed(0)} {settings.currency}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Project & Description inputs for running timer */}
              <div className="space-y-4 mt-5 pt-5 border-t border-blue-500/10 relative z-10">
                <div>
                  <label className="block text-[10px] font-black text-blue-400 mb-1.5 uppercase tracking-widest font-mono">Budowa / Projekt *</label>
                  <input 
                    type="text" 
                    value={timerProject} 
                    onChange={(e) => {
                      setTimerProject(e.target.value);
                      localStorage.setItem('timer_project', e.target.value);
                    }}
                    placeholder="Wpisz nazwę projektu budowlanego..."
                    className="w-full bg-slate-950 border border-blue-900/40 focus:border-blue-500 focus:bg-slate-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-bold"
                  />
                  {/* Quick-select project badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {allProjectsList.slice(0, 4).map((proj) => (
                      <button
                        type="button"
                        key={proj}
                        onClick={() => {
                          setTimerProject(proj);
                          localStorage.setItem('timer_project', proj);
                        }}
                        className={`text-[9px] px-2.5 py-1 rounded-lg font-black border tracking-wider transition-all cursor-pointer font-mono ${
                          timerProject === proj
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {proj}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-400 mb-1.5 uppercase tracking-widest font-mono">Pracownik rejestrujący *</label>
                  <select
                    value={currentWorker}
                    onChange={(e) => {
                      setCurrentWorker(e.target.value);
                      localStorage.setItem('current_worker', e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-blue-900/40 focus:border-blue-500 focus:bg-slate-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer font-mono"
                  >
                    {EMPLOYEES.map((emp) => (
                      <option key={emp} value={emp} className="bg-slate-950 text-slate-100 font-mono">👤 {emp}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-400 mb-1.5 uppercase tracking-widest font-mono">Kategoria Robót *</label>
                  <select
                    value={timerCategory}
                    onChange={(e) => {
                      setTimerCategory(e.target.value);
                      localStorage.setItem('timer_category', e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-blue-900/40 focus:border-blue-500 focus:bg-slate-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer font-mono"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-950 text-slate-100 font-mono">🏷️ {cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-400 mb-1.5 uppercase tracking-widest font-mono">Bieżąca Lokalizacja na Budowie (Nadzór GPS) *</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400 text-xs">📍</span>
                      <input 
                        type="text" 
                        value={timerLocation} 
                        onChange={(e) => setTimerLocation(e.target.value)}
                        placeholder="Wpisz lub pobierz lokalizację..."
                        className="w-full bg-slate-950 border border-blue-900/40 focus:border-blue-500 focus:bg-slate-900/60 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-bold"
                      />
                    </div>
                    <motion.button
                      type="button"
                      onClick={fetchGPSLocation}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className="bg-slate-950 hover:bg-slate-900 border border-blue-900/40 hover:border-blue-500/40 py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 shrink-0 hover:text-blue-400 font-mono text-xs cursor-pointer text-slate-400"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                      <span>GPS</span>
                    </motion.button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-blue-400 mb-1.5 uppercase tracking-widest font-mono">Opis robót budowlanych</label>
                  <input 
                    type="text" 
                    value={timerDescription} 
                    onChange={(e) => {
                      setTimerDescription(e.target.value);
                      localStorage.setItem('timer_description', e.target.value);
                    }}
                    placeholder="Opisz co teraz budujesz..."
                    className="w-full bg-slate-950 border border-blue-900/40 focus:border-blue-500 focus:bg-slate-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono font-bold"
                  />
                </div>
              </div>

              {/* Timer Control Buttons */}
              <div className="flex items-center space-x-2.5 mt-5 relative z-10">
                {!timerRunning && timerElapsedSeconds === 0 ? (
                  <motion.button 
                    onClick={startTimer}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl py-3.5 px-5 flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_25px_rgba(37,99,235,0.3)] transition-all duration-200 border border-blue-500 font-mono"
                  >
                    <Play className="w-4 h-4 fill-current text-white animate-pulse" />
                    <span>Rozpocznij Pracę</span>
                  </motion.button>
                ) : (
                  <>
                    {timerRunning ? (
                      <motion.button 
                        onClick={pauseTimer}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-[#0a1226] hover:bg-[#121c38] border border-blue-500/40 text-blue-400 font-black uppercase tracking-widest text-[11px] rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-mono"
                      >
                        <Pause className="w-4 h-4 fill-current text-blue-400 animate-pulse" />
                        <span>Wstrzymaj</span>
                      </motion.button>
                    ) : (
                      <motion.button 
                        onClick={resumeTimer}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(37,99,235,0.3)] transition-all duration-200 border border-blue-500 font-mono"
                      >
                        <Play className="w-4 h-4 fill-current text-white" />
                        <span>Wznów pracę</span>
                      </motion.button>
                    )}
                    
                    <motion.button 
                      onClick={stopAndSaveTimer}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-widest text-[11px] rounded-2xl py-3.5 px-5 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-200 border border-cyan-400 font-mono"
                      title="Zapisz wpis"
                    >
                      <Check className="w-4.5 h-4.5 stroke-[3] text-slate-950" />
                      <span>Zapisz</span>
                    </motion.button>

                    <motion.button 
                      onClick={() => {
                        if (confirm('Czy na pewno chcesz zresetować stoper bez zapisywania?')) {
                          resetTimerState();
                          triggerToast('Wpis odrzucony.', 'info');
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className="bg-slate-950 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer"
                      title="Anuluj"
                    >
                      <X className="w-4.5 h-4.5" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Action: Toggle Manual Form Entry */}
            <div className="flex flex-col space-y-3">
              <motion.button 
                onClick={() => setShowManualForm(!showManualForm)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-[#070d1e] hover:bg-slate-900 border border-blue-500/15 text-blue-200 rounded-2xl py-3.5 px-4 text-xs font-extrabold flex items-center justify-between transition-all shadow-md cursor-pointer group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Plus className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="font-black text-blue-300 tracking-wider uppercase text-[11px] font-mono">Dodaj godziny ręcznie (Manualnie)</span>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${showManualForm ? 'rotate-90 text-blue-400' : ''}`} />
              </motion.button>

              {/* Slide-out Manual Entry Form */}
              <AnimatePresence>
                {showManualForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleAddManualEntry} className="bg-[#070d1e] border-2 border-blue-500/20 rounded-3xl p-6 space-y-4 shadow-xl relative transition-all duration-300">
                      {/* Corner markings for technical industrial design */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-500/40"></div>
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-500/40"></div>
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-500/40"></div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-500/40"></div>

                      <div className="flex items-center justify-between pb-3 border-b border-blue-500/10">
                        <span className="text-xs font-black text-white uppercase tracking-widest font-mono flex items-center gap-1.5">
                          <span className="text-blue-400">📋</span> Nowy Wpis Robocizny (Manualny)
                        </span>
                        <motion.button 
                          type="button" 
                          onClick={() => setShowManualForm(false)} 
                          whileHover={{ scale: 1.15, rotate: 90 }}
                          whileTap={{ scale: 0.85 }}
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 p-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none"
                        >
                          <X className="w-4.5 h-4.5" />
                        </motion.button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-blue-400 mb-1.5 uppercase tracking-widest font-mono">Projekt / Budowa *</label>
                          <input 
                            type="text" 
                            required
                            value={manualProject}
                            onChange={(e) => updateManualProject(e.target.value)}
                            placeholder="np. Remont Łazienki"
                            className="w-full bg-slate-950 border border-blue-900/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-slate-900/60 transition-all font-mono font-black"
                          />
                          {/* Quick-select project badges */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {allProjectsList.slice(0, 4).map((proj) => (
                              <button
                                type="button"
                                key={proj}
                                onClick={() => updateManualProject(proj)}
                                className={`text-[9px] px-2 py-0.5 rounded-md font-bold border transition-all cursor-pointer font-mono ${
                                  manualProject === proj
                                    ? 'bg-blue-600 text-white border-blue-600 font-black'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                              >
                                {proj}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-blue-400 mb-1.5 uppercase tracking-widest font-mono">Data Robót *</label>
                          <input 
                            type="date" 
                            required
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                            className="w-full bg-slate-950 border border-blue-900/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-slate-900/60 transition-all font-mono font-black cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Manual Start with Adjusters */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-black text-blue-300 uppercase tracking-widest font-mono">Godzina Rozpoczęcia *</label>
                          <span className="text-[10px] font-mono text-cyan-400 font-black bg-slate-950 px-2 py-0.5 rounded border border-blue-900/40">{manualStart}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="time" 
                            required
                            value={manualStart}
                            onChange={(e) => setManualStart(e.target.value)}
                            className="bg-slate-950 border border-blue-900/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-slate-900/60 font-mono font-black flex-1"
                          />
                          <div className="flex items-center bg-slate-950 border border-blue-900/40 rounded-xl p-0.5 space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setManualStart(adjustManualTimeHelper(manualStart, -60))}
                              className="text-[9px] font-black px-1.5 py-1 text-blue-300 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer font-mono"
                              title="Cofnij o 1 godzinę"
                            >
                              -1h
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualStart(adjustManualTimeHelper(manualStart, -15))}
                              className="text-[9px] font-black px-1.5 py-1 text-blue-300 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer font-mono"
                              title="Cofnij o 15 minut"
                            >
                              -15m
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualStart(adjustManualTimeHelper(manualStart, 15))}
                              className="text-[9px] font-black px-1.5 py-1 text-blue-300 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer font-mono"
                              title="Dodaj 15 minut"
                            >
                              +15m
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualStart(adjustManualTimeHelper(manualStart, 60))}
                              className="text-[9px] font-black px-1.5 py-1 text-blue-300 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer font-mono"
                              title="Dodaj 1 godzinę"
                            >
                              +1h
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Manual End with Adjusters */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-black text-blue-300 uppercase tracking-widest font-mono">Godzina Zakończenia *</label>
                          <span className="text-[10px] font-mono text-cyan-400 font-black bg-slate-950 px-2 py-0.5 rounded border border-blue-900/40">{manualEnd}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="time" 
                            required
                            value={manualEnd}
                            onChange={(e) => setManualEnd(e.target.value)}
                            className="bg-slate-950 border border-blue-900/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-slate-900/60 font-mono font-black flex-1"
                          />
                          <div className="flex items-center bg-slate-950 border border-blue-900/40 rounded-xl p-0.5 space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setManualEnd(adjustManualTimeHelper(manualEnd, -60))}
                              className="text-[9px] font-black px-1.5 py-1 text-blue-300 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer font-mono"
                              title="Cofnij o 1 godzinę"
                            >
                              -1h
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualEnd(adjustManualTimeHelper(manualEnd, -15))}
                              className="text-[9px] font-black px-1.5 py-1 text-blue-300 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer font-mono"
                              title="Cofnij o 15 minut"
                            >
                              -15m
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualEnd(adjustManualTimeHelper(manualEnd, 15))}
                              className="text-[9px] font-black px-1.5 py-1 text-blue-300 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer font-mono"
                              title="Dodaj 15 minut"
                            >
                              +15m
                            </button>
                            <button
                              type="button"
                              onClick={() => setManualEnd(adjustManualTimeHelper(manualEnd, 60))}
                              className="text-[9px] font-black px-1.5 py-1 text-blue-300 hover:text-white hover:bg-slate-900 rounded-lg transition-all cursor-pointer font-mono"
                              title="Dodaj 1 godzinę"
                            >
                              +1h
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Break Field */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between text-[10px] font-black text-blue-300 uppercase tracking-widest font-mono">
                          <span>Długość przerwy</span>
                          <span className="text-cyan-400 font-black">{manualBreak} min</span>
                        </div>
                        <input 
                          type="range" 
                          min="0"
                          max="120"
                          step="5"
                          value={manualBreak}
                          onChange={(e) => setManualBreak(parseInt(e.target.value) || 0)}
                          className="w-full accent-cyan-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer border border-blue-900/40"
                        />
                      </div>

                      {/* Szybki wybór szychty (QoL) */}
                      <div className="bg-slate-950 border border-blue-900/40 rounded-2xl p-4 space-y-2.5">
                        <span className="block text-[10px] font-black text-blue-300 uppercase tracking-widest font-mono">Szybki Wybór Szychty (Wygoda)</span>
                        <div className="flex flex-col gap-1.5">
                          <div className="grid grid-cols-2 gap-2">
                            <motion.button
                              type="button"
                              onClick={() => {
                                setManualStart("07:00");
                                setManualEnd("15:00");
                                setManualBreak(30);
                                triggerToast("Ustawiono szychętę 07:00 - 15:00 (8h)", "info");
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="text-[10px] font-black py-2.5 bg-[#0a1226] hover:bg-[#121c38] rounded-xl border border-blue-900/30 hover:border-blue-500/30 transition-all shadow-xs cursor-pointer text-blue-200 font-mono"
                            >
                              ☀️ 07:00 - 15:00 (8h)
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => {
                                setManualStart("08:00");
                                setManualEnd("16:00");
                                setManualBreak(30);
                                triggerToast("Ustawiono szychętę 08:00 - 16:00 (8h)", "info");
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="text-[10px] font-black py-2.5 bg-[#0a1226] hover:bg-[#121c38] rounded-xl border border-blue-900/30 hover:border-blue-500/30 transition-all shadow-xs cursor-pointer text-blue-200 font-mono"
                            >
                              ☀️ 08:00 - 16:00 (8h)
                            </motion.button>
                          </div>
                          <motion.button
                            type="button"
                            onClick={() => {
                              setManualStart("07:00");
                              setManualEnd("17:00");
                              setManualBreak(45);
                              triggerToast("Ustawiono długą szychętę 07:00 - 17:00 (10h)", "info");
                            }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="text-[10px] font-black py-3 bg-[#0c1630] hover:bg-[#15244f] text-cyan-400 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-xs cursor-pointer tracking-wider uppercase font-mono"
                          >
                            🛠️ Długa Szychta: 07:00 - 17:00 (10h)
                          </motion.button>
                        </div>
                      </div>

                      {/* Hourly Rate & Overtime */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[10px] font-black text-blue-300 uppercase tracking-widest font-mono">Stawka ({settings.currency}/h)</label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveTooltip(activeTooltip === 'rate_helper' ? null : 'rate_helper')}
                                className="text-slate-500 hover:text-blue-400 transition-colors p-0.5 flex items-center justify-center cursor-pointer"
                                title="Więcej informacji"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                              <AnimatePresence>
                                {activeTooltip === 'rate_helper' && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40 cursor-default" 
                                      onClick={() => setActiveTooltip(null)} 
                                    />
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                      className="absolute right-0 bottom-full mb-2 w-56 p-3 bg-slate-900 text-white rounded-xl shadow-xl border border-blue-900 z-50 text-[10px] leading-relaxed font-semibold font-mono"
                                    >
                                      <div className="text-blue-400 font-black uppercase mb-1 tracking-widest flex items-center gap-1">
                                        <span>⚡ SYSTEM STAWEK</span>
                                      </div>
                                      Własna stawka nadpisuje stawkę domyślną przypisaną do wybranego projektu. Projekty i ich stawki możesz edytować w zakładce <span className="text-blue-400 font-black underline">Inwestycje</span>.
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          <input 
                            type="number" 
                            min="1"
                            value={manualRate}
                            onChange={(e) => setManualRate(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-blue-900/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-slate-900/60 transition-all font-mono font-black"
                          />
                        </div>
                        
                        <div className="flex flex-col justify-end">
                          <label className="flex items-center space-x-2.5 bg-slate-950 border border-blue-900/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 cursor-pointer hover:border-slate-700 select-none transition-all h-[42px]">
                            <input 
                              type="checkbox" 
                              checked={manualOvertime}
                              onChange={(e) => setManualOvertime(e.target.checked)}
                              className="w-4 h-4 rounded border-blue-900/40 text-blue-500 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-black text-blue-300 font-mono uppercase tracking-widest">Nadgodziny</span>
                          </label>
                        </div>
                      </div>

                      {manualOvertime && (
                        <div className="bg-slate-950 border border-blue-900/40 rounded-xl p-3.5 space-y-2">
                          <label className="block text-[10px] font-black text-blue-300 uppercase tracking-widest font-mono">Mnożnik nadgodzin</label>
                          <div className="flex items-center space-x-3">
                            {[1.5, 2.0, 2.5].map((mult) => (
                              <motion.button
                                type="button"
                                key={mult}
                                onClick={() => setManualOvertimeMultiplier(mult)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex-1 py-1.5 px-3 text-xs rounded-lg border font-black transition-all cursor-pointer font-mono ${
                                  manualOvertimeMultiplier === mult 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                                  }`}
                              >
                                x{mult.toFixed(1)}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-black text-blue-400 mb-1.5 uppercase tracking-widest font-mono">Kategoria Robót *</label>
                        <select
                          value={manualCategory}
                          onChange={(e) => setManualCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-blue-500 focus:bg-slate-900/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer font-mono"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat} className="bg-slate-950 text-slate-100 font-mono">🏷️ {cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest font-mono">Notatka / Opis Robót</label>
                        <textarea 
                          rows={2}
                          value={manualDesc}
                          onChange={(e) => updateManualDesc(e.target.value)}
                          placeholder="Co dokładnie zostało zrobione podczas tej szychty..."
                          className="w-full bg-slate-950 border border-blue-900/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 focus:bg-slate-900/60 resize-none transition-all font-mono font-black"
                        />
                      </div>

                      {/* Dynamic Real-time Calculations Preview box */}
                      {(() => {
                        const getLiveManualHours = () => {
                          if (!manualStart || !manualEnd) return 0;
                          const [sH, sM] = manualStart.split(':').map(Number);
                          const [eH, eM] = manualEnd.split(':').map(Number);
                          let diffMins = (eH * 60 + eM) - (sH * 60 + sM);
                          if (diffMins < 0) diffMins += 24 * 60;
                          diffMins -= manualBreak;
                          return Math.max(0, diffMins / 60);
                        };
                        const hrs = getLiveManualHours();
                        const earn = hrs * manualRate * (manualOvertime ? manualOvertimeMultiplier : 1);
                        return (
                          <div className="bg-cyan-500/[0.05] border border-cyan-500/20 rounded-2xl p-4 flex justify-between items-center animate-fade-in">
                            <div>
                              <span className="block text-[8px] font-black text-cyan-400 uppercase tracking-widest font-mono">Podsumowanie wpisu (Na Żywo)</span>
                              <span className="text-xs font-black text-slate-200 mt-1 block">
                                Czas roboczy: <span className="text-cyan-400 font-black font-mono">{hrs.toFixed(2)}h</span>
                                {manualBreak > 0 && <span className="text-[10px] text-slate-400 font-semibold font-sans"> (po odliczeniu {manualBreak}m przerwy)</span>}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="block text-[8px] font-black text-cyan-400 uppercase tracking-widest font-mono">Należność Razem</span>
                              <span className="text-sm font-black text-cyan-400 font-mono">{formatCurrencyValue(earn, settings.currency)}</span>
                            </div>
                          </div>
                        );
                      })()}

                      <motion.button 
                        type="submit"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[11px] py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(37,99,235,0.25)] cursor-pointer font-mono border border-blue-500"
                      >
                        <Check className="w-4.5 h-4.5 stroke-[3] text-white" />
                        <span>Zapisz Wpis Czasu (Zatwierdź)</span>
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Simulated Real-Time local reminder widget */}
            <div className="bg-[#070d1e] border-2 border-blue-500/20 rounded-3xl p-5 flex items-center justify-between shadow-xl relative overflow-hidden transition-all duration-300 hover:border-blue-500/40">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-center space-x-3.5 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Bell className="w-5 h-5 text-blue-400 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white font-mono uppercase tracking-widest">Powiadomienia BHP / Budowa</h4>
                  <p className="text-[10px] text-blue-300 font-semibold font-mono">Testuj przypomnienia o zakończeniu robót budowlanych</p>
                </div>
              </div>
              <motion.button 
                onClick={simulateReminder}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] cursor-pointer relative z-10 font-mono border border-blue-500"
              >
                Testuj
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ==================== TAB 1.5: CONSTRUCTION (PLAC BUDOWY) ==================== */}
        {activeTab === 'construction' && (
          <motion.div
            key="construction"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <Construction className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>Narzędzia Budowlane</span>
              </h3>
            </div>

            {/* Visual Donut Chart of Completed Tasks by Category */}
            {(() => {
              const activeTasks = tasks.filter(t => !t.cancelled);
              const totalCompleted = activeTasks.filter(t => t.completed).length;
              
              // Group completed tasks by category
              const categoryCompletedCounts: Record<string, number> = {};
              const categoryTotalCounts: Record<string, number> = {};
              
              activeTasks.forEach(t => {
                const cat = t.category || 'Inne';
                categoryTotalCounts[cat] = (categoryTotalCounts[cat] || 0) + 1;
                if (t.completed) {
                  categoryCompletedCounts[cat] = (categoryCompletedCounts[cat] || 0) + 1;
                }
              });
              
              const categories = Object.keys(categoryTotalCounts);
              
              const stats = categories.map(cat => {
                const completed = categoryCompletedCounts[cat] || 0;
                const total = categoryTotalCounts[cat] || 0;
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
                return {
                  category: cat,
                  completed,
                  total,
                  rate,
                  share: totalCompleted > 0 ? (completed / totalCompleted) * 100 : 0
                };
              }).sort((a, b) => b.completed - a.completed);

              // Colors list for categories
              const categoryColors: Record<string, string> = {
                'Murarstwo': '#fbbf24',    // Warm Amber-400
                'Hydraulika': '#3b82f6',   // Blue-500
                'Elektryka': '#ec4899',    // Pink-500
                'Wykończenie': '#10b981',  // Emerald-500
                'Fundamenty': '#a855f7',   // Purple-500
                'Inne': '#6366f1',         // Indigo-500
              };
              
              const getCategoryColor = (cat: string, index: number) => {
                if (categoryColors[cat]) return categoryColors[cat];
                const keys = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#a855f7', '#6366f1', '#14b8a6', '#f43f5e'];
                return keys[index % keys.length];
              };

              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-sm relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-1.5">
                        <span>📊 Rozkład Ukończonych Specjalizacji</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">Wizualizacja postępów prac na placu budowy</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-500 dark:text-slate-400">
                      Kierownik
                    </span>
                  </div>

                  {totalCompleted === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-6 text-center space-y-2">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Brak ukończonych zadań do wyświetlenia wykresu.</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Zaznacz ukończenie zadań w sekcji poniżej, aby wygenerować statystyki specjalizacji.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-6 pt-1">
                      {/* Left: SVG Donut Chart */}
                      <div className="sm:col-span-2 flex flex-col items-center justify-center relative">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            {/* Track circle */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="3" />
                            
                            {/* Slice circles */}
                            {(() => {
                              let accumulatedPercent = 0;
                              const activeSlices = stats.filter(s => s.completed > 0);
                              
                              return activeSlices.map((item, idx) => {
                                const strokeDasharray = `${item.share} ${100 - item.share}`;
                                const strokeDashoffset = 100 - accumulatedPercent;
                                accumulatedPercent += item.share;
                                
                                return (
                                  <circle 
                                    key={idx}
                                    cx="18" 
                                    cy="18" 
                                    r="15.915" 
                                    fill="none" 
                                    stroke={getCategoryColor(item.category, idx)} 
                                    strokeWidth="3.2" 
                                    strokeDasharray={strokeDasharray} 
                                    strokeDashoffset={strokeDashoffset} 
                                    strokeLinecap="round"
                                    className="transition-all duration-500"
                                  />
                                );
                              });
                            })()}
                          </svg>
                          
                          {/* Inner center labels */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-lg font-black text-slate-900 dark:text-slate-100 leading-none">{totalCompleted}</span>
                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Ukończone</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Category Legend list */}
                      <div className="sm:col-span-3 space-y-3.5">
                        {stats.map((item, idx) => {
                          const isCompleted = item.completed > 0;
                          const color = getCategoryColor(item.category, idx);
                          
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2 truncate">
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-slate-700 dark:text-slate-300 font-extrabold truncate">{item.category}</span>
                                </div>
                                <div className="flex items-center space-x-1.5 shrink-0 font-mono text-[11px] font-bold">
                                  <span className="text-slate-900 dark:text-slate-100">{item.completed}/{item.total}</span>
                                  {isCompleted && (
                                    <span className="text-slate-400 dark:text-slate-500 text-[10px]">({item.share.toFixed(0)}%)</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Specialty Progress Bar */}
                              <div className="w-full bg-slate-100 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden flex">
                                <div 
                                  className="h-full rounded-full transition-all duration-500" 
                                  style={{ 
                                    width: `${item.rate}%`,
                                    backgroundColor: color 
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Custom Subtab Selector */}
            <div className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl grid grid-cols-4 md:grid-cols-8 gap-1.5 text-center border border-slate-200/80 dark:border-slate-800 shadow-inner">
              <motion.button
                onClick={() => setConSubTab('tasks')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-2 px-1 text-[9px] font-black rounded-xl transition-all flex flex-col md:flex-row items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                  conSubTab === 'tasks'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/30 dark:border-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Hammer className="w-3.5 h-3.5 text-amber-500" />
                <span>Zadania</span>
              </motion.button>
              
              <motion.button
                onClick={() => setConSubTab('calculators')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-2 px-1 text-[9px] font-black rounded-xl transition-all flex flex-col md:flex-row items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                  conSubTab === 'calculators'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/30 dark:border-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-amber-500" />
                <span>Kalkulatory</span>
              </motion.button>

              <motion.button
                onClick={() => setConSubTab('team')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-2 px-1 text-[9px] font-black rounded-xl transition-all flex flex-col md:flex-row items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                  conSubTab === 'team'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/30 dark:border-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zespół Live</span>
              </motion.button>

              <motion.button
                onClick={() => setConSubTab('issues')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-2 px-1 text-[9px] font-black rounded-xl transition-all flex flex-col md:flex-row items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                  conSubTab === 'issues'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/30 dark:border-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>BHP i Usterki</span>
              </motion.button>

              <motion.button
                onClick={() => setConSubTab('logs')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-2 px-1 text-[9px] font-black rounded-xl transition-all flex flex-col md:flex-row items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                  conSubTab === 'logs'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/30 dark:border-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>Dziennik</span>
              </motion.button>

              <motion.button
                onClick={() => setConSubTab('calculator')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-2 px-1 text-[9px] font-black rounded-xl transition-all flex flex-col md:flex-row items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                  conSubTab === 'calculator'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/30 dark:border-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Godziny</span>
              </motion.button>

              <motion.button
                onClick={() => setConSubTab('gallery')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-2 px-1 text-[9px] font-black rounded-xl transition-all flex flex-col md:flex-row items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                  conSubTab === 'gallery'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/30 dark:border-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-amber-500" />
                <span>Galeria</span>
              </motion.button>

              <motion.button
                onClick={() => setConSubTab('ai')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`py-2 px-1 text-[9px] font-black rounded-xl transition-all flex flex-col md:flex-row items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                  conSubTab === 'ai'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/30 dark:border-slate-800'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span>Majster AI</span>
              </motion.button>
            </div>

            {/* SUBTAB CONTENT: TASKS */}
            {conSubTab === 'tasks' && (
              <div className="space-y-4 animate-fade-in">
                {/* Metric Box with Custom Progress Bar for EACH Project */}
                {(() => {
                  const uniqueProjects = Array.from(new Set(tasks.map(t => t.project || 'Budowa Domu')));
                  const totalCompletedAll = tasks.filter(t => t.completed).length;
                  const totalAll = tasks.length;
                  const overallPct = totalAll > 0 ? Math.round((totalCompletedAll / totalAll) * 100) : 0;
                  
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Skumulowany postęp całej budowy</span>
                        <div className="flex items-center justify-between mt-1">
                          <h4 className="text-base font-black text-slate-900 dark:text-slate-100">{totalCompletedAll} z {totalAll} zadań skończone</h4>
                          <span className="text-sm font-black text-amber-500 font-mono">{overallPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-800 mt-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${overallPct}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="h-full bg-amber-500 rounded-full"
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 space-y-3">
                        <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-mono block">
                          📁 Paski postępu według projektów
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {uniqueProjects.map(proj => {
                            const projTasks = tasks.filter(t => (t.project || 'Budowa Domu') === proj);
                            const comp = projTasks.filter(t => t.completed).length;
                            const tot = projTasks.length;
                            const pct = tot > 0 ? Math.round((comp / tot) * 100) : 0;
                            
                            return (
                              <div key={proj} className="bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-1.5 gap-1">
                                  <div className="max-w-[70%]">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block">📁 {proj}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{comp} z {tot} ukończone</span>
                                  </div>
                                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/50 px-2 py-0.5 rounded-lg shrink-0">{pct}%</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-800/50 mt-1">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Weather Forecast Widget */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <span className="text-sm">🌤️</span>
                        <span>Stacja Pogodowa &amp; Skaner Prac Zewnętrznych</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                        Automatyczna weryfikacja pogody pod kątem prac na wolnym powietrzu. Kliknij ikonę, by zmienić pogodę.
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50 px-2 py-0.5 rounded-lg tracking-wider uppercase font-mono animate-pulse shrink-0 self-start md:self-auto">
                      Skaner aktywny
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {(() => {
                      const today = new Date();
                      const days = [];
                      for (let i = 0; i < 7; i++) {
                        const d = new Date(today);
                        d.setDate(today.getDate() + i);
                        const dateStr = d.toLocaleDateString('sv');
                        const dayName = d.toLocaleDateString('pl-PL', { weekday: 'short' });
                        const dateLabel = d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
                        days.push({ dateStr, dayName, dateLabel });
                      }

                      return days.map(day => {
                        const condition = weatherForecast[day.dateStr] || 'sunny';
                        // Count active, uncompleted outdoor tasks for this date
                        const activeOutdoorTasks = tasks.filter(t => !t.completed && !t.cancelled && t.dueDate === day.dateStr && t.isOutdoor);
                        const isRainy = condition === 'rainy' || condition === 'stormy';
                        const hasConflict = isRainy && activeOutdoorTasks.length > 0;

                        let icon = '☀️';
                        let condLabel = 'Słonecznie';
                        let colorClass = 'border-amber-100 bg-amber-50/40 text-amber-600 dark:border-amber-900/30 dark:bg-amber-950/10 dark:text-amber-400';

                        if (condition === 'cloudy') {
                          icon = '☁️';
                          condLabel = 'Chmury';
                          colorClass = 'border-slate-200 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
                        } else if (condition === 'rainy') {
                          icon = '🌧️';
                          condLabel = 'Deszcz';
                          colorClass = 'border-blue-100 bg-blue-50/50 text-blue-500 dark:border-blue-900/30 dark:bg-blue-950/10 dark:text-blue-400';
                        } else if (condition === 'stormy') {
                          icon = '⛈️';
                          condLabel = 'Burza';
                          colorClass = 'border-red-100 bg-red-50/50 text-red-500 dark:border-red-900/30 dark:bg-red-950/10 dark:text-red-400';
                        }

                        // Toggle condition on click
                        const cycleCondition = () => {
                          const nextMap: Record<'sunny' | 'cloudy' | 'rainy' | 'stormy', 'sunny' | 'cloudy' | 'rainy' | 'stormy'> = {
                            sunny: 'cloudy',
                            cloudy: 'rainy',
                            rainy: 'stormy',
                            stormy: 'sunny'
                          };
                          const newForecast = { ...weatherForecast, [day.dateStr]: nextMap[condition] };
                          saveWeatherForecast(newForecast);
                          triggerToast(`Zmieniono prognozę dla ${day.dateLabel} na ${nextMap[condition].toUpperCase()}`, 'info');
                        };

                        return (
                          <motion.div
                            key={day.dateStr}
                            whileHover={{ scale: 1.02 }}
                            onClick={cycleCondition}
                            className={`p-2.5 rounded-2xl border flex flex-col items-center text-center cursor-pointer select-none transition-all relative ${
                              hasConflict 
                                ? 'border-red-500 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-450 ring-2 ring-red-500/20 shadow-sm' 
                                : colorClass
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">{day.dayName}</span>
                            <span className="text-[11px] font-extrabold block mt-0.5">{day.dateLabel}</span>
                            
                            <span className="text-xl my-2 block drop-shadow-sm transition-transform duration-300 hover:scale-125">{icon}</span>
                            
                            <span className="text-[9px] font-black block opacity-80 mb-1">{condLabel}</span>

                            {activeOutdoorTasks.length > 0 ? (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                hasConflict 
                                  ? 'bg-red-500 text-white animate-pulse' 
                                  : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                              }`}>
                                {activeOutdoorTasks.length} {activeOutdoorTasks.length === 1 ? 'zadanie' : 'zadania'}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600">Brak prac</span>
                            )}

                            {hasConflict && (
                              <span className="absolute -top-1.5 -right-1 bg-rose-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                                ⚠️
                              </span>
                            )}
                          </motion.div>
                        );
                      });
                    })()}
                  </div>

                  {/* Dynamic weather warnings and suggestions box */}
                  {(() => {
                    const activeConflictTasks = tasks.filter(t => {
                      if (t.completed || t.cancelled || !t.dueDate || !t.isOutdoor) return false;
                      const cond = weatherForecast[t.dueDate];
                      return cond === 'rainy' || cond === 'stormy';
                    });

                    if (activeConflictTasks.length > 0) {
                      return (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50/50 dark:bg-red-950/15 border border-red-200/50 dark:border-red-900/30 rounded-2xl p-4 flex gap-3 text-red-800 dark:text-red-350"
                        >
                          <span className="text-xl shrink-0">⚠️</span>
                          <div className="space-y-1">
                            <h5 className="text-xs font-black uppercase tracking-wider font-mono">Inteligentne Ostrzeżenie Pogodowe</h5>
                            <p className="text-[10px] font-semibold leading-relaxed">
                              Skaner wykrył konflikt pogodowy! Masz zaplanowane {activeConflictTasks.length} {activeConflictTasks.length === 1 ? 'zadanie zewnętrzne' : 'zadania zewnętrzne'} w dniach z przewidywanymi opadami lub burzą. Praca na wolnym powietrzu podczas deszczu może zagrażać bezpieczeństwu BHP lub poprawności technologicznej.
                            </p>
                            <div className="pt-2 space-y-1">
                              {activeConflictTasks.map(task => (
                                <div key={task.id} className="text-[10px] font-bold flex items-center space-x-1 text-red-750 dark:text-red-400">
                                  <span>• {task.name} ({task.dueDate} - {weatherForecast[task.dueDate || ''] === 'stormy' ? 'Burza ⛈️' : 'Opady 🌧️'})</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[9px] font-bold text-red-500 dark:text-red-400/80 pt-1 flex items-center gap-1">
                              <span>💡</span> <span>Sugerowane działanie: Przełóż te zadania lub zmień ich oznaczenie, jeśli będą wykonywane pod dachem.</span>
                            </p>
                          </div>
                        </motion.div>
                      );
                    } else {
                      return (
                        <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/30 rounded-2xl p-3.5 flex gap-2.5 text-emerald-800 dark:text-emerald-400 text-[10px] font-semibold">
                          <span className="text-xs shrink-0">☀️</span>
                          <p>
                            Bezpieczny harmonogram! Wszystkie zaplanowane zadania zewnętrzne posiadają sprzyjające prognozy pogodowe lub w deszczowe dni nie zaplanowano prac na wolnym powietrzu.
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Action Buttons: Add Task / Import */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowAddTaskForm(!showAddTaskForm);
                      if (!showAddTaskForm) setShowImportForm(false);
                    }}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className={`border-2 rounded-2xl py-3 px-4 text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer focus:outline-none ${
                      showAddTaskForm 
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 border-slate-900 dark:border-amber-500 font-black shadow-[0_4px_12px_rgba(245,158,11,0.2)]' 
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Plus className={`w-4 h-4 ${showAddTaskForm ? 'text-amber-400 dark:text-slate-950 animate-spin' : 'text-slate-500'}`} />
                    <span>Dodaj Ręcznie</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowImportForm(!showImportForm);
                      if (!showImportForm) setShowAddTaskForm(false);
                    }}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className={`border-2 rounded-2xl py-3 px-4 text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-sm focus:outline-none ${
                      showImportForm 
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.2)]' 
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <Upload className="w-4 h-4 text-amber-500" />
                    <span>Importuj (.TXT)</span>
                  </motion.button>
                </div>

                {/* Site Supervisor Daily Print Section */}
                <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-4.5 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                        <span>Kącik Kierownika Budowy</span>
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 leading-normal">
                        Szybkie przygotowanie odprawy. Pobierz gotową kartę to-do z wolnym miejscem na notatki i podpis kierownika.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      type="button"
                      onClick={generateUnfinishedTasksPDF}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="btn-cyber-primary py-2.5 px-3 rounded-2xl text-[10px] flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-amber-500"
                      title="Generuj i pobierz raport PDF gotowy do druku"
                    >
                      <FileDown className="w-4 h-4 text-slate-950 shrink-0" />
                      <span>Drukuj PDF</span>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={exportUnfinishedTasksTXT}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="btn-cyber-secondary py-2.5 px-3 rounded-2xl text-[10px] flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-amber-500/50"
                      title="Pobierz plik tekstowy .TXT i skopiuj treść do schowka"
                    >
                      <Copy className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Kopiuj / TXT</span>
                    </motion.button>
                  </div>
                </div>

                {/* Search Tasks Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Wyszukaj zadanie, kategorię, projekt lub materiały..."
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs font-semibold"
                  />
                  {taskSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTaskSearchQuery('')}
                      className="absolute right-3.5 top-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Wyczyść wyszukiwanie"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>

                {/* Add Task Form */}
                <AnimatePresence>
                  {showAddTaskForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleAddTask} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-md">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Nazwa Zadania *</label>
                          <input
                            type="text"
                            required
                            placeholder="np. Położenie tynków w salonie"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Kategoria</label>
                            <select
                              value={newTaskCategory}
                              onChange={(e) => setNewTaskCategory(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold cursor-pointer"
                            >
                              <option value="Murarstwo">🧱 Murarstwo</option>
                              <option value="Hydraulika">🚰 Hydraulika</option>
                              <option value="Elektryka">⚡ Elektryka</option>
                              <option value="Wykończenie">✨ Wykończenie</option>
                              <option value="Inne">🛠️ Inne</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Priorytet</label>
                            <select
                              value={newTaskPriority}
                              onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold cursor-pointer"
                            >
                              <option value="low">🟢 Niski</option>
                              <option value="medium">🟡 Średni</option>
                              <option value="high">🔴 Wysoki</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Projekt</label>
                            <input
                              type="text"
                              placeholder="np. Budowa Domu"
                              value={newTaskProject}
                              onChange={(e) => setNewTaskProject(e.target.value)}
                              list="task-projects-list"
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold"
                            />
                            <datalist id="task-projects-list">
                              {allProjectsList.map((p) => (
                                <option key={p} value={p} />
                              ))}
                            </datalist>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Termin Realizacji</label>
                            <input
                              type="date"
                              value={newTaskDueDate}
                              onChange={(e) => setNewTaskDueDate(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Przypisany Pracownik</label>
                            <select
                              value={newTaskAssignedTo}
                              onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold cursor-pointer"
                            >
                              {EMPLOYEES.map(emp => (
                                <option key={emp} value={emp}>{emp}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Notatki (Krótkie)</label>
                            <input
                              type="text"
                              placeholder="np. pilne, kupić worki..."
                              value={newTaskNotes}
                              onChange={(e) => setNewTaskNotes(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-4 pl-1">
                          <div className="flex items-center space-x-2">
                            <input
                              id="isCriticalCheckbox"
                              type="checkbox"
                              checked={newTaskIsCritical}
                              onChange={(e) => setNewTaskIsCritical(e.target.checked)}
                              className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                            />
                            <label htmlFor="isCriticalCheckbox" className="text-xs font-black text-slate-700 dark:text-slate-300 select-none cursor-pointer flex items-center space-x-1">
                              <span className="text-red-500">🔥</span>
                              <span>Etap krytyczny (Kluczowy kamień milowy dla projektu)</span>
                            </label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              id="isOutdoorCheckbox"
                              type="checkbox"
                              checked={newTaskIsOutdoor}
                              onChange={(e) => setNewTaskIsOutdoor(e.target.checked)}
                              className="w-4.5 h-4.5 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                            />
                            <label htmlFor="isOutdoorCheckbox" className="text-xs font-black text-slate-700 dark:text-slate-300 select-none cursor-pointer flex items-center space-x-1">
                              <span className="text-sky-500">🌤️</span>
                              <span>Praca zewnętrzna (Narażona na opady deszczu)</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Szczegółowy opis / Wymagania i materiały (Opcjonalnie)</label>
                          <textarea
                            rows={3}
                            placeholder="Wpisz szczegółowe wymagania technologiczne, wytyczne inwestora lub listę niezbędnych materiałów potrzebnych do realizacji..."
                            value={newTaskLongDescription}
                            onChange={(e) => setNewTaskLongDescription(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-semibold"
                          />
                        </div>

                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full btn-cyber-primary cyber-glow-border py-3 px-4 rounded-2xl text-xs flex items-center justify-center space-x-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        >
                          <Check className="w-4 h-4 text-slate-950" />
                          <span>Zapisz Zadanie</span>
                        </motion.button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Import Tasks Form */}
                <AnimatePresence>
                  {showImportForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-md text-slate-800 dark:text-slate-200">
                        {/* Format Guideline */}
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400">
                          <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Info className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Jak przygotować plik z harmonogramem?</span>
                          </p>
                          <p>Możesz wkleić listę zadań linia po linii lub użyć separatorów <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-black font-mono">|</code> lub <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-black font-mono">;</code> aby podać szczegóły:</p>
                          <div className="bg-slate-950 text-slate-300 border border-slate-800 p-2.5 rounded-xl font-mono text-[9px] leading-relaxed space-y-1 overflow-x-auto select-all">
                            <div># Format: Zadanie | Kategoria | Opis | Termin (RRRR-MM-DD) | Krytyczne?</div>
                            <div>Wylanie stropu | Murarstwo | Beton B25 szybki | 2026-07-20 | tak</div>
                            <div>Instalacja prądu | Elektryka | Rozdzielnica i kable | 2026-07-28 | nie</div>
                            <div>Zwykłe zadanie linia po linii bez separatorów</div>
                          </div>
                        </div>

                        {/* Drag and Drop Area */}
                        <div 
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                            dragActive 
                              ? 'border-amber-500 bg-amber-500/5 scale-[0.99]' 
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20'
                          }`}
                        >
                          <input 
                            id="file-import-input"
                            type="file" 
                            accept=".txt" 
                            onChange={handleFileInputChange}
                            className="hidden" 
                          />
                          <label htmlFor="file-import-input" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-amber-100/10 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-xs">
                              <span className="font-bold text-amber-600 dark:text-amber-400 hover:underline">Wybierz plik tekstowy</span> lub przeciągnij go tutaj
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Tylko pliki .txt z harmonogramem</span>
                          </label>
                        </div>

                        {/* Text Area Input */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">LUB wklej tekst bezpośrednio:</label>
                          <textarea
                            rows={4}
                            placeholder="Wpisz lub wklej zadania..."
                            value={pastedImportText}
                            onChange={(e) => setPastedImportText(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono leading-relaxed"
                          />
                          <button
                            type="button"
                            onClick={handlePasteImport}
                            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Dopasuj i przeanalizuj tekst
                          </button>
                        </div>

                        {/* Parsed Preview Section */}
                        {parsedPreviewTasks.length > 0 && (
                          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Podgląd wykrytych zadań ({parsedPreviewTasks.length}):</span>
                              <motion.button 
                                type="button"
                                onClick={() => setParsedPreviewTasks([])}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 rounded px-1"
                              >
                                Wyczyść podgląd
                              </motion.button>
                            </div>
                            
                            <div className="max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl p-2 bg-slate-50 dark:bg-slate-950 space-y-1.5">
                              {parsedPreviewTasks.map((t, idx) => (
                                <div key={t.id || idx} className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-start justify-between text-[11px] shadow-2xs">
                                  <div className="space-y-0.5 min-w-0 pr-2">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                                      {t.isCritical && <span className="text-red-500" title="Krytyczny etap">🔥</span>}
                                      <span>{t.name}</span>
                                    </p>
                                    <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-bold">
                                      <span className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-1 py-0.2 rounded">{t.category}</span>
                                      {t.dueDate && (
                                        <>
                                          <span>•</span>
                                          <span className="text-amber-600 dark:text-amber-400">Termin: {t.dueDate}</span>
                                        </>
                                      )}
                                    </div>
                                    {t.notes && <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium italic truncate">notatka: {t.notes}</p>}
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => setParsedPreviewTasks(parsedPreviewTasks.filter((_, i) => i !== idx))}
                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1 rounded-lg transition-colors shrink-0 cursor-pointer"
                                    title="Usuń z importu"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={executeTaskImport}
                              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all uppercase tracking-wider shadow-md shadow-emerald-100 dark:shadow-none cursor-pointer"
                            >
                              <CheckCircle2 className="w-4.5 h-4.5 text-slate-950" />
                              <span>Zatwierdź i Dodaj {parsedPreviewTasks.length} Zadań</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs mb-1 font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Grupowanie:</span>
                    <div className="bg-white dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-800 inline-flex shadow-xs">
                      <button
                        type="button"
                        onClick={() => setTaskGroupMode('none')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          taskGroupMode === 'none' 
                            ? 'bg-amber-500 text-slate-950 shadow-sm font-black' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        Brak
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskGroupMode('category')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          taskGroupMode === 'category' 
                            ? 'bg-amber-500 text-slate-950 shadow-sm font-black' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        Kategoria
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskGroupMode('project')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          taskGroupMode === 'project' 
                            ? 'bg-amber-500 text-slate-950 shadow-sm font-black' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        Projekt
                      </button>
                    </div>
                  </div>

                  {/* Filters, sorting and compact view row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 shadow-2xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Filtruj zadania:</span>
                      <div className="bg-slate-200/60 dark:bg-slate-900 rounded-xl p-0.5 flex border border-slate-300/20 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setTaskFilterWorker('all')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${taskFilterWorker === 'all' ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                        >
                          Wszystkie
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskFilterWorker('mine')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${taskFilterWorker === 'mine' ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                          title={`Pokaż tylko zadania przypisane do ${currentWorker}`}
                        >
                          Moje ({currentWorker.split(' ')[0]})
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* Compact View Toggle */}
                      <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={taskCompactView}
                          onChange={(e) => setTaskCompactView(e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-800 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5 accent-amber-500"
                        />
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Widok zwarty</span>
                      </label>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Sortowanie:</span>
                        <select
                          value={taskSortMode}
                          onChange={(e) => setTaskSortMode(e.target.value as any)}
                          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-2 py-1 text-[10px] font-black text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-amber-500 shadow-xs"
                        >
                          <option value="priority">🔥 Priorytet</option>
                          <option value="dueDate">📅 Termin</option>
                          <option value="name">🔤 Nazwa A-Z</option>
                          <option value="default">⚡ Domyślne</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks List Checklist */}
                <motion.div layout="position" className="space-y-5">
                  {tasks.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                      Brak zadań w wykazie. Kliknij przycisk powyżej, by dodać pierwsze zadanie.
                    </div>
                  ) : Object.values(groupedTasks).every(list => list.length === 0) ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                      Nie znaleziono zadań pasujących do frazy &quot;{taskSearchQuery}&quot;.
                    </div>
                  ) : (
                    Object.entries(groupedTasks).map(([groupName, groupList]) => {
                      if (groupList.length === 0) return null;
                      return (
                        <motion.div layout key={groupName} className="space-y-2.5">
                          {taskGroupMode !== 'none' && (
                            <div className="flex items-center justify-between px-1.5 pt-1">
                              <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-3.5 bg-amber-500 rounded-full inline-block" />
                                <span>{groupName}</span>
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                  {groupList.length}
                                </span>
                              </h4>
                            </div>
                          )}
                          
                          <motion.div layout className="space-y-2.5">
                            {groupList.map((task) => {
                              // Colored category pill
                              let categoryColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                              if (task.category === 'Murarstwo') categoryColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40';
                              else if (task.category === 'Hydraulika') categoryColor = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/40';
                              else if (task.category === 'Elektryka') categoryColor = 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-900/40';
                              else if (task.category === 'Wykończenie') categoryColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40';

                              const todayStr = new Date().toISOString().split('T')[0];
                              const isOverdue = !task.completed && !task.cancelled && task.dueDate && task.dueDate < todayStr;
                              const isCancelled = task.cancelled;

                              let cardBg = 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs hover:shadow-xs';
                              if (task.completed) {
                                cardBg = 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/50 dark:border-slate-800/60 text-slate-400 dark:text-slate-500';
                              } else if (isCancelled) {
                                cardBg = 'bg-red-50/10 dark:bg-red-950/10 border-red-200/40 dark:border-red-900/40 text-slate-400 dark:text-slate-500 opacity-70';
                              } else if (isOverdue) {
                                cardBg = 'bg-red-50/30 dark:bg-red-950/20 border-red-300 dark:border-red-900 shadow-sm border-l-4 border-l-red-500 dark:border-l-red-600 animate-pulse-subtle';
                              }

                              return (
                                <motion.div
                                  layout
                                  key={task.id}
                                  className={`border rounded-3xl p-4 flex items-center justify-between transition-colors duration-250 relative overflow-hidden ${cardBg}`}
                                >
                                  {/* Subtle ripple effect on completion */}
                                  {lastCompletedTaskId === task.id && (
                                    <motion.span
                                      initial={{ scale: 0, opacity: 0.6 }}
                                      animate={{ scale: 4, opacity: 0 }}
                                      transition={{ duration: 0.85, ease: "easeOut" }}
                                      className="absolute top-1/2 left-6 w-12 h-12 bg-amber-500 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
                                    />
                                  )}

                                  <div className="flex items-start space-x-3.5 pr-3 min-w-0 relative z-10">
                                    {/* Custom Checkbox Button */}
                                    <button
                                      type="button"
                                      disabled={isCancelled}
                                      onClick={() => handleToggleTaskCompleted(task.id)}
                                      className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 cursor-pointer ${
                                        task.completed
                                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                                          : isCancelled
                                          ? 'border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                          : 'border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50 dark:bg-slate-950'
                                      }`}
                                    >
                                      {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                                    </button>

                                    <div className="min-w-0">
                                      <h5 className={`text-xs font-bold leading-snug truncate flex items-center gap-1.5 ${task.completed ? 'line-through text-slate-400 dark:text-slate-500 font-semibold' : isCancelled ? 'line-through text-slate-400 dark:text-slate-500 font-semibold' : isOverdue ? 'text-red-700 dark:text-red-400 font-black' : 'text-slate-900 dark:text-slate-100 font-black'}`}>
                                        {isOverdue && <span className="text-red-500 font-extrabold shrink-0" title="Zadanie zaległe!">⚠️</span>}
                                        <span>{task.name}</span>
                                      </h5>
                                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        {/* Project Tag */}
                                        <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                                          📁 {task.project || 'Budowa Domu'}
                                        </span>

                                        {/* Category Tag */}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 ${categoryColor}`}>
                                          {task.category}
                                        </span>

                                        {/* Priority Tag */}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 flex items-center gap-1 border ${
                                          task.priority === 'high' 
                                            ? 'bg-red-50 dark:bg-red-950/40 border-red-200/60 dark:border-red-900/40 text-red-700 dark:text-red-400 font-bold' 
                                            : task.priority === 'low' 
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold' 
                                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 font-bold'
                                        }`}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                                          {task.priority === 'high' ? 'Wysoki' : task.priority === 'low' ? 'Niski' : 'Średni'}
                                        </span>

                                        {task.isCritical && (
                                          <span className="text-[9px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                                            🔥 Krytyczne
                                          </span>
                                        )}
                                        {task.isOutdoor && (
                                          <span className="text-[9px] bg-sky-550/15 dark:bg-sky-950/30 border border-sky-200/50 dark:border-sky-900/40 text-sky-700 dark:text-sky-450 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                                            🌤️ Zewnętrzne
                                          </span>
                                        )}
                                        {(() => {
                                          if (!task.completed && !task.cancelled && task.isOutdoor && task.dueDate) {
                                            const forecast = weatherForecast[task.dueDate];
                                            if (forecast === 'rainy' || forecast === 'stormy') {
                                              return (
                                                <span className="text-[9px] bg-red-600 dark:bg-red-700 text-white border border-red-500 px-2 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-xs animate-pulse">
                                                  🌧️ ZAGROŻENIE DESZCZEM
                                                </span>
                                              );
                                            }
                                          }
                                          return null;
                                        })()}
                                        {isCancelled && (
                                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0">
                                            🚫 Anulowano
                                          </span>
                                        )}
                                        {isOverdue && (
                                          <span className="text-[9px] bg-red-600 dark:bg-red-700 text-white border border-red-600 dark:border-red-700 px-2 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 flex items-center gap-1 animate-pulse shadow-sm shadow-red-100 dark:shadow-none">
                                            <AlertCircle className="w-2.5 h-2.5 shrink-0 text-white" /> ZALEGŁE
                                          </span>
                                        )}
                                        {task.assignedTo && (
                                          <span className="text-[9px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 flex items-center gap-0.5 animate-fade-in">
                                            👤 {task.assignedTo}
                                          </span>
                                        )}
                                        {task.dueDate && (
                                          <span className={`text-[9px] font-mono font-bold flex items-center gap-0.5 px-1 py-0.5 rounded ${isOverdue ? 'text-red-500 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30' : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950'}`}>
                                            <Calendar className="w-2.5 h-2.5 shrink-0 text-slate-400" /> do: {task.dueDate}
                                          </span>
                                        )}
                                        {!taskCompactView && task.notes && (
                                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate max-w-[200px]">
                                            • {task.notes}
                                          </span>
                                        )}
                                      </div>

                                      {!taskCompactView && task.longDescription && (
                                        <div className="mt-2.5 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-2.5 text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-md">
                                          <div className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider mb-1 flex items-center gap-1">
                                            <FileText className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                                            <span>Szczegółowy opis i materiały:</span>
                                          </div>
                                          <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-semibold">{task.longDescription}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-1 shrink-0 relative z-10">
                                    {/* Cancel / Restore button */}
                                    {!task.completed && (
                                      <button
                                        onClick={() => handleToggleTaskCancelled(task.id)}
                                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                                          isCancelled
                                            ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50 bg-amber-50/50 dark:bg-amber-950/30'
                                            : 'text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                        }`}
                                        title={isCancelled ? "Przywróć zadanie do realizacji" : "Anuluj to zadanie"}
                                      >
                                        <Ban className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Delete button */}
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                      title="Usuń zadanie z listy"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              </div>
            )}

            {/* SUBTAB CONTENT: CALCULATORS (CONCRETE & BRICK) */}
            {conSubTab === 'calculators' && (
              <div className="space-y-4 animate-fade-in">
                {/* Concrete Calculator */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <span>🧱</span>
                      <span>Kalkulator Mieszanki Betonowej</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455 font-semibold mt-0.5">
                      Oblicz objętość betonu oraz zapotrzebowanie na cement (worki 25kg), piasek i wodę (proporcja 1:2:3).
                    </p>
                  </div>

                  {/* Concrete Type Selector */}
                  <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCalcConcreteType('slab')}
                      className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                        calcConcreteType === 'slab'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Płyta / Fundament (Slab)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcConcreteType('column')}
                      className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                        calcConcreteType === 'column'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Słup okrągły (Column)
                    </button>
                  </div>

                  {/* Concrete Inputs */}
                  <div className="grid grid-cols-3 gap-3">
                    {calcConcreteType === 'slab' ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Długość (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={calcLength}
                            onChange={(e) => setCalcLength(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Szerokość (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={calcWidth}
                            onChange={(e) => setCalcWidth(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Grubość (m)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={calcDepth}
                            onChange={(e) => setCalcDepth(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Średnica (m)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={calcDiameter}
                            onChange={(e) => setCalcDiameter(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Wysokość słupa (m)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={calcHeight}
                            onChange={(e) => setCalcHeight(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Concrete Calculation Results */}
                  {(() => {
                    let volume = 0;
                    if (calcConcreteType === 'slab') {
                      volume = (parseFloat(calcLength) || 0) * (parseFloat(calcWidth) || 0) * (parseFloat(calcDepth) || 0);
                    } else {
                      const radius = (parseFloat(calcDiameter) || 0) / 2;
                      volume = Math.PI * Math.pow(radius, 2) * (parseFloat(calcHeight) || 0);
                    }

                    // A cubic meter of concrete weights ~2400 kg.
                    // For standard C20/25 mix ratio 1:2:3, per 1m3:
                    // ~350 kg cement, ~700 kg sand, ~1050 kg gravel, ~180 liters water
                    const cementBags = Math.ceil((volume * 350) / 25);
                    const sandKg = Math.round(volume * 700);
                    const gravelKg = Math.round(volume * 1050);
                    const waterLiters = Math.round(volume * 180);

                    return (
                      <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-slate-950/40 border border-indigo-100/50 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-indigo-100/40 dark:border-slate-800/60">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Całkowita objętość:</span>
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">{volume.toFixed(3)} m³</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Cement (worki 25kg):</span>
                            <span className="text-slate-800 dark:text-slate-200 font-extrabold">{cementBags} szt</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Woda:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-extrabold">{waterLiters} L</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Piasek:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-extrabold">~{sandKg} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Kruszywo:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-extrabold">~{gravelKg} kg</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Brick Calculator */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <span>📐</span>
                      <span>Kalkulator Materiału Ściennego</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455 font-semibold mt-0.5">
                      Oblicz zapotrzebowanie na pustaki lub cegły na podstawie powierzchni ścian i wybranego typu materiału.
                    </p>
                  </div>

                  {/* Brick Inputs */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Powierzchnia ścian (m²)</label>
                      <input
                        type="number"
                        value={calcWallArea}
                        onChange={(e) => setCalcWallArea(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Naddatek (%)</label>
                      <input
                        type="number"
                        value={calcWaste}
                        onChange={(e) => setCalcWaste(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Material Choice */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Rodzaj pustaka / cegły</label>
                    <select
                      value={calcBrickType}
                      onChange={(e: any) => setCalcBrickType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="porotherm">Porotherm 25 (ok. 11.5 szt/m²)</option>
                      <option value="silka">Silka E24 (ok. 15 szt/m²)</option>
                      <option value="brick">Cegła pełna 12cm (ok. 52 szt/m²)</option>
                    </select>
                  </div>

                  {/* Brick Calculation Results */}
                  {(() => {
                    const area = parseFloat(calcWallArea) || 0;
                    const wasteFactor = 1 + (parseFloat(calcWaste) || 0) / 100;
                    
                    let ratio = 11.5;
                    let label = 'Porotherm 25';
                    if (calcBrickType === 'silka') {
                      ratio = 15;
                      label = 'Silka E24';
                    } else if (calcBrickType === 'brick') {
                      ratio = 52;
                      label = 'Cegła pełna';
                    }

                    const rawCount = area * ratio;
                    const finalCount = Math.ceil(rawCount * wasteFactor);

                    return (
                      <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-slate-950/40 border border-amber-100/50 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-amber-100/40 dark:border-slate-800/60">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Zapotrzebowanie ({label}):</span>
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">{finalCount} szt</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                          *Uwzględniono naddatek na docinki i ubytki ({calcWaste}%). Szacunkowe zużycie zaprawy: <span className="font-bold text-slate-600 dark:text-slate-300">{(area * 1.5).toFixed(1)} worków</span> zaprawy gotowej.
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Plaster & Mortar Calculator */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <span>🎨</span>
                      <span>Kalkulator Tynków i Zapraw</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-455 font-semibold mt-0.5">
                      Oblicz zapotrzebowanie na suchą mieszankę tynkarską (gipsową lub cementowo-wapienną) oraz wodę na podstawie powierzchni i grubości.
                    </p>
                  </div>

                  {/* Plaster Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Powierzchnia tynkowania (m²)</label>
                      <input
                        type="number"
                        value={calcPlasterArea}
                        onChange={(e) => setCalcPlasterArea(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Średnia grubość (mm)</label>
                      <input
                        type="number"
                        value={calcPlasterThickness}
                        onChange={(e) => setCalcPlasterThickness(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Plaster Type Choice */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Rodzaj tynku</label>
                    <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setCalcPlasterType('cement')}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                          calcPlasterType === 'cement'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Cementowo-Wapienny (16 kg/m²/cm)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcPlasterType('gypsum')}
                        className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                          calcPlasterType === 'gypsum'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Gipsowy Maszynowy (10 kg/m²/cm)
                      </button>
                    </div>
                  </div>

                  {/* Plaster Calculation Results */}
                  {(() => {
                    const area = parseFloat(calcPlasterArea) || 0;
                    const thickness = parseFloat(calcPlasterThickness) || 0;
                    
                    // Consumption per m² per 1mm of thickness:
                    // Cement-lime: ~1.6 kg/m²/mm
                    // Gypsum: ~1.0 kg/m²/mm
                    const consumptionPerMm = calcPlasterType === 'cement' ? 1.6 : 1.0;
                    const totalKg = area * thickness * consumptionPerMm;
                    const bags = Math.ceil(totalKg / 25);
                    const waterLiters = Math.round(totalKg * 0.2);

                    return (
                      <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-slate-950/40 border border-amber-100/50 dark:border-slate-800 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex flex-col border-r border-amber-150/40 dark:border-slate-800/80 pr-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Sucha mieszanka:</span>
                            <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">{totalKg.toFixed(0)} kg</span>
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 mt-0.5 font-mono">{bags} worków (25kg)</span>
                          </div>
                          <div className="flex flex-col pl-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Potrzebna woda:</span>
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">~{waterLiters} Litrów</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">Około 5L na worek</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Szybka Szychta Calculator */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <span>⚡</span>
                        <span>Kalkulator Szychty &quot;Szybka Szychta&quot;</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        Oblicz czas pracy netto, odlicz przerwy automatycznie i oszacuj swój zarobek na czysto w ułamku sekundy.
                      </p>
                    </div>
                    <span className="text-[9px] font-mono font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      LIVE CALC
                    </span>
                  </div>

                  {/* Quick Presets */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSzychtaStart("07:00");
                        setSzychtaEnd("15:00");
                        setSzychtaBreak(30);
                        triggerToast("Ustawiono szychę standardową 07:00 - 15:00", "info");
                      }}
                      className="py-1.5 text-[9px] font-black rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all font-mono"
                    >
                      ☀️ Standard (8h)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSzychtaStart("07:00");
                        setSzychtaEnd("17:00");
                        setSzychtaBreak(45);
                        triggerToast("Ustawiono długą szychę 07:00 - 17:00", "info");
                      }}
                      className="py-1.5 text-[9px] font-black rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all font-mono"
                    >
                      🛠️ Przedłużona (10h)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSzychtaStart("06:00");
                        setSzychtaEnd("18:00");
                        setSzychtaBreak(60);
                        triggerToast("Ustawiono pełną szychę 06:00 - 18:00", "info");
                      }}
                      className="py-1.5 text-[9px] font-black rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all font-mono"
                    >
                      🔥 Hardcorowa (12h)
                    </button>
                  </div>

                  {/* Main Inputs Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Rozpoczęcie szychty</label>
                      <input
                        type="time"
                        value={szychtaStart}
                        onChange={(e) => setSzychtaStart(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Zakończenie szychty</label>
                      <input
                        type="time"
                        value={szychtaEnd}
                        onChange={(e) => setSzychtaEnd(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Break & Rate Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Przerwa (minuty)</label>
                        <span className="text-[10px] font-black text-amber-500 font-mono">{szychtaBreak}m</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="120"
                        step="5"
                        value={szychtaBreak}
                        onChange={(e) => setSzychtaBreak(parseInt(e.target.value) || 0)}
                        className="w-full accent-amber-500 h-1.5 bg-slate-100 dark:bg-slate-950 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">Stawka godzinowa ({settings.currency}/h)</label>
                      <input
                        type="number"
                        min="1"
                        value={szychtaRate}
                        onChange={(e) => setSzychtaRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Overtime Box */}
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 space-y-2">
                    <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={szychtaOvertime}
                        onChange={(e) => setSzychtaOvertime(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 font-mono uppercase tracking-widest">Uwzględnij nadgodziny</span>
                    </label>

                    {szychtaOvertime && (
                      <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Mnożnik za nadgodziny:</span>
                        <div className="flex gap-1.5">
                          {[1.5, 2.0, 2.5].map((m) => (
                            <button
                              type="button"
                              key={m}
                              onClick={() => setSzychtaOvertimeMultiplier(m)}
                              className={`px-3 py-1 text-xs rounded-lg font-bold border transition-all font-mono ${
                                szychtaOvertimeMultiplier === m
                                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                                  : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              x{m.toFixed(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calculations & Results */}
                  {(() => {
                    if (!szychtaStart || !szychtaEnd) return null;
                    const [sH, sM] = szychtaStart.split(':').map(Number);
                    const [eH, eM] = szychtaEnd.split(':').map(Number);
                    
                    let diffMins = (eH * 60 + eM) - (sH * 60 + sM);
                    if (diffMins < 0) diffMins += 24 * 60; // handle overnight shifts
                    
                    const grossHours = diffMins / 60;
                    const netHours = Math.max(0, (diffMins - szychtaBreak) / 60);
                    const rateToUse = szychtaRate * (szychtaOvertime ? szychtaOvertimeMultiplier : 1);
                    const totalEarnings = netHours * rateToUse;

                    return (
                      <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-3.5 animate-fade-in">
                        <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-400">Łączny czas:</span>
                            <span className="text-slate-950 dark:text-slate-100 font-extrabold font-mono text-xs">
                              {grossHours.toFixed(2)}h <span className="text-[10px] text-slate-400 font-normal">({Math.floor(diffMins/60)}h {diffMins%60}m)</span>
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-400">Przerwa do odliczenia:</span>
                            <span className="text-rose-500 font-extrabold font-mono text-xs">
                              -{szychtaBreak} min <span className="text-[10px] font-normal font-sans">({(szychtaBreak/60).toFixed(2)}h)</span>
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5 border-t border-slate-200/40 dark:border-slate-800/40 pt-2 col-span-2">
                            <span className="text-slate-400">Czas pracy netto (Szychta Netto):</span>
                            <span className="text-amber-500 dark:text-amber-400 font-black font-mono text-sm">
                              {netHours.toFixed(2)}h <span className="text-xs text-slate-400 font-normal font-sans">({Math.floor(Math.max(0, diffMins - szychtaBreak)/60)}h {Math.max(0, diffMins - szychtaBreak)%60}m)</span>
                            </span>
                          </div>
                        </div>

                        {/* Net Earnings big value */}
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex justify-between items-center">
                          <div>
                            <span className="block text-[9px] font-black text-amber-500 uppercase tracking-widest font-mono">SZACUNKOWY ZAROBEK</span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                              Stawka efektywna: <span className="font-mono font-black text-slate-300">{rateToUse.toFixed(2)} {settings.currency}/h</span>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-black text-amber-500 font-mono">
                              {totalEarnings.toFixed(2)} {settings.currency}
                            </span>
                          </div>
                        </div>

                        {/* Action: Use in main form */}
                        <button
                          type="button"
                          onClick={() => {
                            setManualStart(szychtaStart);
                            setManualEnd(szychtaEnd);
                            setManualBreak(szychtaBreak);
                            setManualRate(szychtaRate);
                            setManualOvertime(szychtaOvertime);
                            setManualOvertimeMultiplier(szychtaOvertimeMultiplier);
                            setIsAddManualOpen(true);
                            triggerToast("Przeniesiono dane szychty do formularza dodawania wpisu!", "success");
                          }}
                          className="w-full py-2 bg-slate-900 dark:bg-slate-950 hover:bg-slate-800 dark:hover:bg-slate-800 text-slate-200 hover:text-white font-mono text-[10px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer border border-slate-850 flex items-center justify-center gap-2"
                        >
                          📥 Użyj tych danych w nowym wpisie czasu pracy
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* SUBTAB CONTENT: TEAM & LIVE GPS */}
            {conSubTab === 'team' && (
              <div className="space-y-5 animate-fade-in">
                {/* Team Real-time Radar Monitoring Widget */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] text-white shadow-xl relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center mb-3.5 relative z-10">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <span>KONTROLA ZESPOŁU LIVE</span>
                    </span>
                    <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-800">
                      GPS ACTIVE
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-black tracking-wider uppercase font-mono mb-1 text-slate-100 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pozycje pracowników w czasie rzeczywistym</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal mb-4 font-semibold">
                    Lokalizator GPS rejestruje pozycję pracowników w obrębie placów budowy w czasie rzeczywistym.
                  </p>

                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {(() => {
                      const locationsMap: Record<string, { project: string; location: string; date: string; time: string; active: boolean; task: string }> = {};
                      
                      EMPLOYEES.forEach((emp, index) => {
                        const projects = ['Budowa Domu', 'Remont Piwnicy', 'Ogrodzenie', 'Garaż'];
                        const sectors = ['Sektor A-1 (Fundamenty)', 'Sektor B-3 (Ściany)', 'Ogrodzenie północne', 'Wjazd główny'];
                        locationsMap[emp] = {
                          project: projects[index % projects.length],
                          location: sectors[index % sectors.length],
                          date: new Date().toISOString().split('T')[0],
                          time: '07:00',
                          active: false,
                          task: 'Roboty ziemne i wyrównanie'
                        };
                      });

                      if (timerRunning) {
                        locationsMap[currentWorker] = {
                          project: timerProject || 'Budowa Domu',
                          location: timerLocation || 'Sektor Główny (Nadzór)',
                          date: new Date().toISOString().split('T')[0],
                          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
                          active: true,
                          task: timerDescription || 'Roboty ogólnobudowlane'
                        };
                      }

                      // Retrieve latest entry from actual history entries for each employee
                      entries.forEach(entry => {
                        const emp = entry.workerName || 'Jan Kowalski';
                        if (locationsMap[emp] && (!locationsMap[emp].active || emp !== currentWorker)) {
                          locationsMap[emp] = {
                            project: entry.project,
                            location: entry.location || 'Baza główna',
                            date: entry.date,
                            time: entry.startTime,
                            active: false,
                            task: entry.description
                          };
                        }
                      });

                      return Object.entries(locationsMap).map(([name, data]) => (
                        <div 
                          key={name}
                          className={`p-3 rounded-2xl border transition-all ${
                            data.active 
                              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-xs' 
                              : 'bg-slate-800/50 border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${data.active ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-500'}`} />
                              <span className="text-xs font-black text-slate-100">{name}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                              data.active 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {data.active ? 'PRACUJE' : 'PAUZA'}
                            </span>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-300 font-semibold">
                            <div className="flex items-center gap-1 text-slate-400 truncate">
                              <span className="shrink-0">🏢</span>
                              <span className="truncate">{data.project}</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400 truncate font-bold">
                              <span className="shrink-0 text-[10px]">📍</span>
                              <span className="truncate">{data.location}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-1 text-slate-400 truncate border-t border-slate-800/50 pt-1 mt-1">
                              <span className="shrink-0">🔨</span>
                              <span className="truncate text-[9px] font-semibold text-slate-300 italic">“{data.task}”</span>
                            </div>
                          </div>
                          
                          <div className="mt-1.5 text-[8px] font-mono text-slate-500 flex justify-between">
                            <span>Ostatni zapis: {data.date}</span>
                            <span>Godzina: {data.time}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Team Directory and Rates */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <span>👷</span>
                      <span>Stawki i Kwalifikacje Zespołu</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      Przegląd kadry pracowniczej, stawek godzinowych i przypisanych specjalizacji.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Jan Kowalski', role: 'Cieśla / Murarz', rate: '45 zł/h', rating: '⭐️ 4.9', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                      { name: 'Tomasz Nowak', role: 'Elektryk uprawniony', rate: '55 zł/h', rating: '⭐️ 5.0', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
                      { name: 'Mariusz Wiśniewski', role: 'Młodszy pomocnik', rate: '28 zł/h', rating: '⭐️ 4.5', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
                      { name: 'Piotr Wójcik', role: 'Kierownik Robót / BHP', rate: '60 zł/h', rating: '⭐️ 4.8', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
                    ].map((member, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-between space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">{member.name}</h5>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 inline-block ${member.color}`}>
                              {member.role}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-500">{member.rating}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[10px] font-semibold text-slate-500">
                          <span>Stawka podstawowa:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">{member.rate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB CONTENT: MAJSTER AI & BUILDER'S TIPS */}
            {conSubTab === 'ai' && (
              <div className="space-y-5 animate-fade-in">
                {/* Daily Tip Card (Podpowiedź Budowlańca) */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-slate-900 dark:to-slate-950/60 border border-amber-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>💡 PODPOWIEDŹ BUDOWLAŃCA</span>
                    </span>
                    <button
                      onClick={fetchBuilderTip}
                      disabled={builderTipLoading}
                      className="p-1.5 hover:bg-amber-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                      title="Wylosuj nową poradę"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ${builderTipLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {builderTipLoading ? (
                    <div className="py-8 text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                      <p className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-widest">Wyszukiwanie mądrości...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest font-mono">
                          {builderTipTopic || 'Temat Porady'}
                        </h4>
                        <div className="h-0.5 bg-amber-200 dark:bg-slate-800 w-12 mt-1" />
                      </div>
                      
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed whitespace-pre-line">
                        {builderTip}
                      </div>

                      {builderTipSources && builderTipSources.length > 0 && (
                        <div className="pt-2 border-t border-amber-200/40 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Normy / Źródła:</span>
                          {builderTipSources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                            >
                              {src.title} ↗
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Interactive AI Expert Chat (Majster AI) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                  
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>Ekspert Budowlany Majster AI</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      Zadaj pytanie na temat norm PN-EN, receptur betonu, przepisów BHP, instalacji czy technologii budowy.
                    </p>
                  </div>

                  {/* Sugerowane szybkie pytania */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Pielęgnacja betonu w upale',
                      'Jak poprawnie zbroić ławy fundamentowe?',
                      'Klasy wytrzymałości betonu i ich proporcje',
                      'Wymogi BHP przy pracach na wysokościach'
                    ].map((pill, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setAiQuery(pill);
                          handleAskAi(pill);
                        }}
                        disabled={aiLoading}
                        className="text-[9px] font-bold bg-slate-50 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-800/80 transition-all cursor-pointer font-mono disabled:opacity-50"
                      >
                        ⚡ {pill}
                      </button>
                    ))}
                  </div>

                  {/* Chat Message Window */}
                  <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20 min-h-[120px] max-h-[400px] overflow-y-auto space-y-3">
                    {aiResponse ? (
                      <div className="space-y-3">
                        <div className="text-[10px] font-mono font-black text-slate-400 dark:text-slate-500 flex justify-between items-center border-b dark:border-b-slate-800 pb-1.5">
                          <span>TEMAT ZAPYTANIA</span>
                          <span className="text-emerald-500">MAJSTER AI ONLINE</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {renderFormattedText(aiResponse)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center py-6 text-slate-400 dark:text-slate-500">
                        <span className="text-2xl mb-1">🏗️</span>
                        <p className="text-xs font-bold">Wpisz pytanie lub wybierz jedno z szybkich pytań powyżej.</p>
                        <p className="text-[9px] font-semibold mt-0.5">Asystent przeanalizuje zapytanie i poda precyzyjne wytyczne.</p>
                      </div>
                    )}

                    {aiLoading && (
                      <div className="flex items-center gap-2 text-indigo-500 font-mono text-[10px] font-black uppercase tracking-widest pt-2 border-t dark:border-t-slate-800">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Majster AI analizuje normy i przygotowuje odpowiedź...</span>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !aiLoading) {
                          handleAskAi();
                        }
                      }}
                      disabled={aiLoading}
                      placeholder="Napisz np. Jakie proporcje ma beton B20?..."
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-bold disabled:opacity-50"
                    />
                    <motion.button
                      onClick={() => handleAskAi()}
                      disabled={aiLoading || !aiQuery.trim()}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Zapytaj</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB CONTENT: PROBLEMS & REQUESTS REPORTER */}
            {conSubTab === 'issues' && (
              <div className="space-y-4 animate-fade-in">
                {/* BHP/OHS Pre-work Safety Checklist */}
                <div className="bg-gradient-to-br from-rose-50/25 to-orange-50/20 dark:from-slate-900/40 dark:to-slate-900/20 border border-amber-200/50 dark:border-amber-500/10 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <span>🦺</span>
                        <span>Przedstartowa Karta BHP</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        Codzienna weryfikacja warunków bezpiecznej pracy przed wejściem na budowę.
                      </p>
                    </div>
                    {Object.values(bhpChecked).every(v => v) ? (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        SECURE / BEZPIECZNIE
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/25 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                        UWAGA: SPRAWDŹ BHP!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                    {[
                      { key: 'odziez', label: 'ŚOI (kask, okulary, odzież ochronna i buty)' },
                      { key: 'wykopy', label: 'Wykopy odpowiednio zabezpieczone/szalowane' },
                      { key: 'maszyny', label: 'Sprawne maszyny i elektronarzędzia' },
                      { key: 'gasnica', label: 'Dostępność podręcznego sprzętu gaśniczego' },
                      { key: 'instalacja', label: 'Odłączone nieużywane instalacje pod napięciem' },
                      { key: 'pasy', label: 'Szelki i asekuracja do prac na wysokości (>2m)' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                          bhpChecked[item.key]
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/5 border-emerald-500/20 dark:border-emerald-500/10 text-slate-700 dark:text-slate-200'
                            : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-amber-200 hover:bg-amber-50/10'
                        }`}
                      >
                        <span className="text-[11px] select-none leading-relaxed">{item.label}</span>
                        <input
                          type="checkbox"
                          checked={bhpChecked[item.key] || false}
                          onChange={(e) => {
                            const updated = { ...bhpChecked, [item.key]: e.target.checked };
                            setBhpChecked(updated);
                            if (Object.values(updated).every(v => v)) {
                              triggerToast('Wszystkie warunki BHP zostały spełnione! Bezpieczna praca autoryzowana.', 'success');
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stats summary banner */}
                {(() => {
                  const problems = issuesRequests.filter(i => i.type === 'problem' && i.status === 'pending').length;
                  const requests = issuesRequests.filter(i => i.type === 'wniosek' && i.status === 'pending').length;
                  const totalResolved = issuesRequests.filter(i => i.status === 'resolved').length;
                  
                  return (
                    <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-sm">
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-3 text-center">
                        <span className="block text-[9px] font-black text-red-500 dark:text-red-400 uppercase tracking-wider font-mono">Problemy (Open)</span>
                        <span className="text-2xl font-black text-red-700 dark:text-red-400 font-mono animate-pulse">{problems}</span>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-3 text-center">
                        <span className="block text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-mono">Wnioski (Open)</span>
                        <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400 font-mono">{requests}</span>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3 text-center">
                        <span className="block text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-wider font-mono">Rozwiązane</span>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{totalResolved}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Main Action Bar */}
                <div className="flex justify-between items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={() => setShowAddIssueForm(!showAddIssueForm)}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 rounded-2xl py-3 px-4 text-xs font-black flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer border-2 ${
                      showAddIssueForm 
                        ? 'bg-slate-900 dark:bg-slate-800 text-white border-slate-700/50 dark:border-slate-800' 
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-amber-500/25 text-slate-950 font-black'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showAddIssueForm ? 'Zamknij formularz' : 'Zgłoś Nowy Problem / Wniosek'}</span>
                  </motion.button>
                </div>

                {/* Add Issue/Request Form */}
                {showAddIssueForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-md"
                  >
                    <h4 className="text-xs font-black uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b dark:border-b-slate-800 pb-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span>Formularz Zgłoszeniowy</span>
                    </h4>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const type = formData.get('type') as 'problem' | 'wniosek';
                        const title = formData.get('title') as string;
                        const description = formData.get('description') as string;
                        const priority = formData.get('priority') as 'low' | 'medium' | 'high';
                        const projName = formData.get('projectName') as string;
                        const reportedBy = formData.get('reportedBy') as string;

                        if (!title || !description) {
                          triggerToast('Uzupełnij tytuł i opis zgłoszenia!', 'warning');
                          return;
                        }

                        const newIssue: ConstructionIssueRequest = {
                          id: 'issue-' + Date.now(),
                          type,
                          title,
                          description,
                          projectName: projName || 'Budowa Domu',
                          reportedBy: reportedBy || currentWorker,
                          status: 'pending',
                          date: new Date().toISOString().split('T')[0],
                          priority
                        };

                        setIssuesRequests([newIssue, ...issuesRequests]);
                        setShowAddIssueForm(false);
                        triggerToast('Zgłoszenie zostało pomyślnie wysłane!', 'success');
                      }} 
                      className="space-y-3.5 text-xs"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Typ Zgłoszenia</label>
                          <select 
                            name="type" 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="problem">🔥 Problem / BHP / Awaria</option>
                            <option value="wniosek">📋 Wniosek / Materiał / Sprzęt</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Priorytet</label>
                          <select 
                            name="priority" 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="high">Wysoki (Pilne)</option>
                            <option value="medium">Średni (Normalny)</option>
                            <option value="low">Niski (Niski)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Tytuł Zgłoszenia *</label>
                        <input 
                          type="text" 
                          name="title" 
                          placeholder="Krótki tytuł (np. Brak piasku na podsypkę)"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Szczegółowy opis problemu lub prośby *</label>
                        <textarea 
                          name="description" 
                          rows={3}
                          placeholder="Dokładnie opisz sytuację, wymień potrzebne materiały lub opisz usterkę urządzenia..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 leading-relaxed"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Projekt / Budowa</label>
                          <select 
                            name="projectName" 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          >
                            {allProjectsList.map(proj => (
                              <option key={proj} value={proj}>{proj}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Zgłaszający</label>
                          <select 
                            name="reportedBy" 
                            defaultValue={currentWorker}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          >
                            {EMPLOYEES.map(emp => (
                              <option key={emp} value={emp}>{emp}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full btn-cyber-primary from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 border-emerald-500/30 py-3 px-4 rounded-xl text-center text-xs shadow-[0_0_15px_rgba(16,185,129,0.25)] focus-visible:ring-emerald-500"
                      >
                        Wyślij zgłoszenie do nadzoru
                      </motion.button>
                    </form>
                  </motion.div>
                )}

                {/* Filter and Timeline of Reports */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-400 dark:text-slate-500">Rejestr Zgłoszeń i Wniosków</span>
                    <span className="text-[9px] font-extrabold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-1.5 py-0.5 rounded">Bieżący dostęp</span>
                  </div>

                  <div className="space-y-3">
                    {issuesRequests.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center">
                        <span className="block text-2xl mb-1.5">🕊️</span>
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400">Brak zgłoszonych problemów lub wniosków na budowie!</span>
                      </div>
                    ) : (
                      issuesRequests.map((issue) => {
                        const isProblem = issue.type === 'problem';
                        const isHigh = issue.priority === 'high';
                        
                        return (
                          <div 
                            key={issue.id}
                            className={`bg-white dark:bg-slate-900 border-2 rounded-[24px] p-4.5 shadow-xs transition-all relative overflow-hidden ${
                              issue.status === 'resolved' 
                                ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10 dark:bg-emerald-950/5' 
                                : issue.status === 'rejected'
                                ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 opacity-70'
                                : isProblem
                                ? 'border-red-100 dark:border-red-900/55 bg-red-50/5 dark:bg-red-950/5'
                                : 'border-indigo-100 dark:border-indigo-900/55 bg-indigo-50/5 dark:bg-indigo-950/5'
                            }`}
                          >
                            {/* Accent badge for unresolved high priority */}
                            {issue.status === 'pending' && isHigh && (
                              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
                            )}

                            <div className="flex justify-between items-start gap-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                  isProblem 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-indigo-500 text-white'
                                }`}>
                                  {isProblem ? '🔥 PROBLEM / BHP' : '📋 WNIOSEK / MATERIAŁ'}
                                </span>
                                
                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                  isHigh 
                                    ? 'bg-red-50 dark:bg-red-950/40 border-red-200/50 dark:border-red-900/40 text-red-700 dark:text-red-400' 
                                    : issue.priority === 'low'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'
                                }`}>
                                  Priorytet: {issue.priority === 'high' ? 'Wysoki' : issue.priority === 'low' ? 'Niski' : 'Średni'}
                                </span>

                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  issue.status === 'resolved'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400'
                                    : issue.status === 'rejected'
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 animate-pulse'
                                }`}>
                                  {issue.status === 'resolved' ? '✅ Rozwiązane' : issue.status === 'rejected' ? '❌ Odrzucone' : '🕒 Oczekuje'}
                                </span>
                              </div>
                              <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">{issue.date}</span>
                            </div>

                            <div className="mt-3">
                              <h5 className="text-xs font-black text-slate-900 dark:text-slate-100">{issue.title}</h5>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed font-semibold whitespace-pre-wrap">{issue.description}</p>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-3">
                                <span className="font-bold">🏢 Projekt: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{issue.projectName}</span></span>
                                <span className="font-bold">👤 Zgłosił: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{issue.reportedBy}</span></span>
                              </div>

                              {/* Action controls for supervisor */}
                              <div className="flex gap-1 items-center">
                                {issue.status === 'pending' && (
                                  <>
                                    <motion.button
                                      type="button"
                                      onClick={() => {
                                        const updated = issuesRequests.map(i => i.id === issue.id ? { ...i, status: 'resolved' as const } : i);
                                        setIssuesRequests(updated);
                                        triggerToast('Zgłoszenie oznaczone jako rozwiązane!', 'success');
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer border border-emerald-500/20 shadow-2xs"
                                    >
                                      Rozwiąż
                                    </motion.button>
                                    <motion.button
                                      type="button"
                                      onClick={() => {
                                        const updated = issuesRequests.map(i => i.id === issue.id ? { ...i, status: 'rejected' as const } : i);
                                        setIssuesRequests(updated);
                                        triggerToast('Zgłoszenie odrzucone.', 'info');
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-black rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                                    >
                                      Odrzuć
                                    </motion.button>
                                  </>
                                )}
                                <motion.button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) {
                                      const updated = issuesRequests.filter(i => i.id !== issue.id);
                                      setIssuesRequests(updated);
                                      triggerToast('Zgłoszenie usunięte.', 'warning');
                                    }
                                  }}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                  title="Usuń permanentnie"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB CONTENT: DAILY SITE LOGS (DZIENNIK BUDOWY) */}
            {conSubTab === 'logs' && (
              <div className="space-y-4 animate-fade-in">
                {/* Form to add new site log */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <span>📝</span>
                      <span>Nowy Wpis do Dziennika Budowy</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      Zarejestruj ważne wydarzenie, dostawę materiałów, odbiór techniczny lub incydent BHP.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Kategoria wpisu</label>
                        <select
                          value={newLogType}
                          onChange={(e: any) => setNewLogType(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="info">ℹ️ Ogólne / Informacja</option>
                          <option value="delivery">🚚 Dostawa materiałów</option>
                          <option value="inspection">🔍 Odbiór / Inspekcja</option>
                          <option value="bhp">🦺 BHP / Szkolenie</option>
                          <option value="issue">⚠️ Problem / Przeszkoda</option>
                        </select>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Inwestycja / Projekt</label>
                        <select
                          value={newLogProject}
                          onChange={(e) => setNewLogProject(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                        >
                          <option value="Budowa Domu">Budowa Domu</option>
                          <option value="Remont Piwnicy">Remont Piwnicy</option>
                          <option value="Ogrodzenie">Ogrodzenie</option>
                          <option value="Garaż">Garaż</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Autor wpisu</label>
                        <input
                          type="text"
                          placeholder="Np. Piotr Wójcik"
                          value={newLogAuthor}
                          onChange={(e) => setNewLogAuthor(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Data wpisu</label>
                        <input
                          type="date"
                          defaultValue={new Date().toISOString().split('T')[0]}
                          disabled
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Treść wpisu</label>
                      <textarea
                        rows={2.5}
                        placeholder="Napisz szczegółowy raport z dzisiejszego dnia roboczego..."
                        value={newLogText}
                        onChange={(e) => setNewLogText(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 placeholder-slate-400"
                      />
                    </div>

                    <motion.button
                      type="button"
                      onClick={() => {
                        if (!newLogText.trim()) {
                          triggerToast('Wpis nie może być pusty!', 'warning');
                          return;
                        }
                        const newLog = {
                          id: 'log-' + Date.now(),
                          date: new Date().toISOString().split('T')[0],
                          project: newLogProject,
                          type: newLogType,
                          text: newLogText,
                          author: newLogAuthor || 'Kierownik'
                        };
                        const updated = [newLog, ...siteLogs];
                        saveSiteLogs(updated);
                        setNewLogText('');
                        triggerToast('Pomyślnie dodano wpis do dziennika budowy!', 'success');
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>➕ Dodaj wpis do dziennika</span>
                    </motion.button>
                  </div>
                </div>

                {/* Logs List Container */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Historia wpisów dziennika</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{siteLogs.length} wpisów</span>
                  </div>

                  {siteLogs.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs font-semibold">
                      Dziennik jest pusty. Dodaj pierwszy wpis powyżej!
                    </div>
                  ) : (
                    siteLogs.map((log) => {
                      const badgeColors: Record<string, string> = {
                        info: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/35',
                        delivery: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/35',
                        inspection: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/35',
                        bhp: 'bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/35',
                        issue: 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/35'
                      };
                      const typeLabel: Record<string, string> = {
                        info: 'ℹ️ OGÓLNE',
                        delivery: '🚚 DOSTAWA',
                        inspection: '🔍 INSPEKCJA',
                        bhp: '🦺 BHP',
                        issue: '⚠️ PROBLEM'
                      };

                      return (
                        <div key={log.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${badgeColors[log.type] || badgeColors.info}`}>
                                {typeLabel[log.type] || 'OGÓLNE'}
                              </span>
                              <span className="text-[9px] font-black text-slate-400 font-mono">{log.date}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.project}</span>
                          </div>

                          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-semibold">
                            {log.text}
                          </p>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[9px] font-mono text-slate-400">
                            <span>Wpisał: <strong className="text-slate-600 dark:text-slate-300">{log.author}</strong></span>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Czy na pewno chcesz usunąć ten wpis z dziennika?')) {
                                  const updated = siteLogs.filter(l => l.id !== log.id);
                                  saveSiteLogs(updated);
                                  triggerToast('Wpis usunięty z dziennika.', 'info');
                                }
                              }}
                              className="text-rose-500 hover:underline font-bold cursor-pointer"
                            >
                              Usuń wpis
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB CONTENT: GALLERY */}
            {conSubTab === 'gallery' && (
              <div className="space-y-4 animate-fade-in">
                {/* Metric Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dokumentacja Fotograficzna</span>
                    <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{photos.length} zdjęć z budowy</h4>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-500">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>

                {/* Camera Trigger Panel */}
                <button
                  onClick={() => {
                    setShowAddPhotoForm(!showAddPhotoForm);
                    if (!showAddPhotoForm) {
                      setCameraActive(false);
                      setCameraError(null);
                      setCapturedImage(null);
                      setNewPhotoProject(settings.defaultProject || 'Budowa Domu');
                    } else {
                      setCameraActive(false);
                    }
                  }}
                  className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-800/80 border border-slate-800 dark:border-slate-800 text-slate-200 dark:text-slate-300 rounded-2xl py-3.5 px-4 text-xs font-bold flex items-center justify-between transition-all shadow-md cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6.5 h-6.5 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span>{showAddPhotoForm ? 'Ukryj panel aparatu' : 'Zrób lub dodaj nowe zdjęcie z placu budowy...'}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showAddPhotoForm ? 'rotate-90' : ''}`} />
                </button>

                {/* Camera / Photo Form Drawer */}
                <AnimatePresence>
                  {showAddPhotoForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
                        {/* Live Camera Box or Upload */}
                        <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center border border-slate-800 dark:border-slate-800 group">
                          {cameraActive && !capturedImage && !cameraError && (
                            <>
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                              />
                              {/* Overlay controls for active camera */}
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col items-center">
                                <motion.button
                                  type="button"
                                  onClick={handleCapturePhoto}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="w-14 h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-all cursor-pointer"
                                  title="Zrób zdjęcie"
                                >
                                  <Camera className="w-6 h-6 text-slate-950 stroke-[3.5]" />
                                </motion.button>
                                <span className="text-[9px] text-white/70 font-black uppercase tracking-widest mt-1.5">Kliknij, by uchwycić kadr</span>
                              </div>
                            </>
                          )}

                          {cameraError && !capturedImage && (
                            <div className="p-4 text-center space-y-3 max-w-xs relative z-10">
                              <CameraOff className="w-8 h-8 text-rose-500 mx-auto" />
                              <p className="text-[10px] font-bold text-rose-400 leading-normal">{cameraError}</p>
                              <div className="flex items-center justify-center gap-2">
                                <motion.button
                                  type="button"
                                  onClick={() => { setCameraActive(true); setCameraError(null); }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-[9px] uppercase tracking-wider cursor-pointer"
                                >
                                  Spróbuj ponownie
                                </motion.button>
                                <motion.button
                                  type="button"
                                  onClick={() => setCameraError(null)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-[9px] uppercase tracking-wider cursor-pointer border border-slate-700"
                                >
                                  Ignoruj błąd
                                </motion.button>
                              </div>
                            </div>
                          )}

                          {!cameraActive && !capturedImage && !cameraError && (
                            <div className="text-center space-y-3 p-4">
                              <CameraOff className="w-8 h-8 text-slate-600 mx-auto" />
                              <p className="text-xs text-slate-400 font-bold">Aparat jest nieaktywny</p>
                              <motion.button
                                type="button"
                                onClick={() => { setCameraActive(true); setCameraError(null); }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border border-amber-500/20 text-slate-950 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Uruchom aparat
                              </motion.button>
                            </div>
                          )}

                          {capturedImage && (
                            <div className="relative w-full h-full min-h-[220px] overflow-hidden rounded-2xl">
                              <Image
                                src={capturedImage}
                                alt="Captured progress"
                                fill
                                className="object-cover rounded-2xl"
                                referrerPolicy="no-referrer"
                              />
                              
                              {/* Animated Holographic Laser Scanner Overlay Line */}
                              <motion.div
                                initial={{ top: '0%' }}
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#fbbf24,0_0_4px_#fbbf24] z-10 pointer-events-none"
                              />

                              {/* Futuristic camera grid overlay lines and targets */}
                              <div className="absolute inset-0 border border-amber-500/10 pointer-events-none rounded-2xl z-10">
                                <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-amber-500/50" />
                                <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-amber-500/50" />
                                <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-amber-500/50" />
                                <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-amber-500/50" />
                                <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-amber-500/15" />
                                <div className="absolute left-1/2 top-4 bottom-4 w-[1px] bg-amber-500/15" />
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-[7px] text-amber-500 font-mono tracking-widest uppercase">
                                  SCANNING_ACTIVE
                                </div>
                              </div>

                              <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 hover:opacity-100 transition-all rounded-2xl z-20">
                                <motion.button
                                  type="button"
                                  onClick={() => { setCapturedImage(null); setCameraActive(true); }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="bg-white hover:bg-slate-100 text-slate-900 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer"
                                >
                                  Zrób zdjęcie ponownie
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* File Upload Alternative */}
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Wgraj plik z galerii</span>
                          <motion.label 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl cursor-pointer transition-colors border border-slate-300/50 dark:border-slate-700 select-none shadow-2xs"
                          >
                            Wybierz plik
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </motion.label>
                        </div>

                        {/* Save Photo Form inputs */}
                        <form onSubmit={handleSavePhoto} className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Inwestycja / Projekt *</label>
                              <input
                                type="text"
                                required
                                placeholder="np. Budowa Domu"
                                value={newPhotoProject}
                                onChange={(e) => setNewPhotoProject(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-semibold"
                              />
                              {/* Quick-select project badges */}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {allProjectsList.slice(0, 4).map((proj) => (
                                  <button
                                    type="button"
                                    key={proj}
                                    onClick={() => setNewPhotoProject(proj)}
                                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold border transition-colors cursor-pointer ${
                                      newPhotoProject === proj
                                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                                        : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                                  >
                                    {proj}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Data wykonania *</label>
                              <input
                                type="date"
                                required
                                value={newPhotoDate}
                                onChange={(e) => setNewPhotoDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-semibold"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Opis / Notatka z postępu prac</label>
                            <input
                              type="text"
                              placeholder="np. Tynki wyschły, rozpoczynamy malowanie..."
                              value={newPhotoNotes}
                              onChange={(e) => setNewPhotoNotes(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-semibold"
                            />
                          </div>

                          <motion.button
                            type="submit"
                            disabled={!capturedImage}
                            whileHover={capturedImage ? { scale: 1.02, y: -1 } : {}}
                            whileTap={capturedImage ? { scale: 0.98 } : {}}
                            className={`w-full font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center space-x-1.5 transition-all uppercase tracking-wider shadow-md border-2 ${
                              capturedImage 
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-amber-500/25 text-slate-950 cursor-pointer' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>Zapisz w galerii projektu</span>
                          </motion.button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Photos Grid display with neat cards */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Archiwum budowlane</h4>
                      {photos.length > 0 && (
                        <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-850 dark:text-amber-400 px-2 py-0.5 rounded-full font-black">
                          {filteredPhotos.length} z {photos.length}
                        </span>
                      )}
                    </div>
                    {photos.length > 0 && (
                      <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Filtr:</span>
                        <select
                          value={galleryProjectFilter}
                          onChange={(e) => setGalleryProjectFilter(e.target.value)}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="all">Wszystkie projekty</option>
                          {allProjectsList.map((proj) => (
                            <option key={proj} value={proj}>{proj}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {filteredPhotos.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                      {photos.length === 0 
                        ? 'Brak zdjęć w galerii. Uruchom aparat powyżej lub wgraj gotowe zdjęcie z urządzenia.'
                        : 'Brak zdjęć dla wybranego projektu.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredPhotos.map((p) => (
                        <div
                          key={p.id}
                          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all flex flex-col relative"
                        >
                          {/* Image Box */}
                          <div 
                            onClick={() => setSelectedFullPhoto(p)}
                            className="aspect-[4/3] bg-slate-100 dark:bg-slate-950 overflow-hidden relative cursor-zoom-in"
                          >
                            <Image
                              src={p.imageUri}
                              alt={p.projectName}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            {/* Overlay tag for date */}
                            <div className="absolute left-2 top-2 bg-slate-950/75 text-[8px] font-black text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {p.date}
                            </div>
                          </div>

                          {/* Content Box */}
                          <div className="p-3 flex-1 flex flex-col justify-between space-y-1">
                            <div className="min-w-0">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider max-w-full inline-block truncate">
                                {p.projectName}
                              </span>
                              {p.notes && (
                                <p className="text-[10px] text-slate-700 dark:text-slate-300 font-semibold line-clamp-2 leading-relaxed mt-1">
                                  {p.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => handleDeletePhoto(p.id)}
                                className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                title="Usuń zdjęcie"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lightbox / Zoom-in Modal Dialog */}
                <AnimatePresence>
                  {selectedFullPhoto && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-4"
                      onClick={() => setSelectedFullPhoto(null)}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedFullPhoto(null)}
                        className="absolute right-4 top-4 bg-slate-900 text-slate-400 hover:text-white p-2.5 rounded-full border border-slate-800 shadow-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div 
                        className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-3.5 p-4 flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* High-res Image display */}
                        <div className="relative w-full aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950">
                          <Image
                            src={selectedFullPhoto.imageUri}
                            alt="Full Screen view"
                            fill
                            className="object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Photo metadata */}
                        <div className="w-full text-left space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md">
                              {selectedFullPhoto.projectName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-extrabold font-mono">
                              {selectedFullPhoto.date}
                            </span>
                          </div>
                          {selectedFullPhoto.notes && (
                            <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                              {selectedFullPhoto.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* SUBTAB CONTENT: CALCULATOR */}
            {conSubTab === 'calculator' && (
              <div className="space-y-4 animate-fade-in" id="hours-calculator-section">
                {/* Metric Summary Card */}
                {(() => {
                  const [yearStr, monthStr] = calcSelectedMonth.split('-');
                  const year = parseInt(yearStr || '2026');
                  const month = parseInt(monthStr || '07') - 1;

                  // Calculate working days in selected month (Mon-Fri)
                  let autoWorkDays = 0;
                  const totalDays = new Date(year, month + 1, 0).getDate();
                  for (let d = 1; d <= totalDays; d++) {
                    const dayOfWeek = new Date(year, month, d).getDay();
                    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                      autoWorkDays++;
                    }
                  }

                  const baseDays = calcCustomDays !== '' ? parseInt(calcCustomDays) || 0 : autoWorkDays;
                  const effectiveWorkDays = Math.max(0, baseDays - calcUnpaidDays);
                  const standardHours = effectiveWorkDays * calcDailyHours;
                  const totalHours = standardHours + calcOvertimeHours;

                  const parsedRate = parseFloat(calcHourlyRate) || 0;
                  const baseEarnings = standardHours * parsedRate;
                  const overtimeEarnings = calcOvertimeHours * (parsedRate * calcOvertimeRateMultiplier);
                  const totalEarnings = baseEarnings + overtimeEarnings;

                  return (
                    <>
                      {/* Metric summary widget */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kalkulator roboczogodzin</span>
                            <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">{totalHours} roboczogodzin(y)</h4>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 flex items-center justify-center text-amber-500">
                            <Calculator className="w-5 h-5 animate-pulse" />
                          </div>
                        </div>

                        {/* Interactive dynamic progress bar against standard full-time month (160h) */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                            <span>Wymiar etatu (standard 160h)</span>
                            <span className="text-slate-700 dark:text-slate-300">{Math.round((totalHours / 160) * 100)}% etatu</span>
                          </div>
                          <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-800 relative">
                            <div 
                              className="h-full bg-amber-500 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.min(100, (totalHours / 160) * 100)}%` }}
                            />
                            {totalHours > 160 && (
                              <div 
                                className="absolute top-0 right-0 h-full bg-red-500 rounded-r-full transition-all duration-300"
                                style={{ width: `${Math.min(100, ((totalHours - 160) / 160) * 100)}%` }}
                                title="Nadgodziny"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Calculator Config Form */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <SettingsIcon className="w-4 h-4 text-amber-500" />
                          <span>Ustawienia Kalkulacji</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Month Selector */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Miesiąc rozliczeniowy</label>
                            <input
                              type="month"
                              value={calcSelectedMonth}
                              onChange={(e) => {
                                setCalcSelectedMonth(e.target.value);
                                setCalcCustomDays(''); // Reset custom days override on month change
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
                            />
                          </div>

                          {/* Hours Per Day */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Wymiar dzienny (h / dzień)</label>
                            <select
                              value={calcDailyHours}
                              onChange={(e) => setCalcDailyHours(parseInt(e.target.value))}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                            >
                              {[4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                                <option key={h} value={h} className="dark:bg-slate-900">{h} godzin</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Custom Days Override */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                              Dni robocze <span className="text-[9px] text-amber-600 font-normal">(Opcjonalne nadpisanie)</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={31}
                              placeholder={`Automatycznie: ${autoWorkDays}`}
                              value={calcCustomDays}
                              onChange={(e) => setCalcCustomDays(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                            />
                          </div>

                          {/* Hourly Rate */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Stawka godzinowa (PLN / h)</label>
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                placeholder="50"
                                value={calcHourlyRate}
                                onChange={(e) => setCalcHourlyRate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-12 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
                              />
                              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">PLN/h</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Unpaid / Leave Days */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Urlop / Chorobowe (Dni)</label>
                            <input
                              type="number"
                              min={0}
                              max={31}
                              value={calcUnpaidDays}
                              onChange={(e) => setCalcUnpaidDays(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                            />
                          </div>

                          {/* Overtime Hours */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Godziny nadliczbowe (h)</label>
                            <input
                              type="number"
                              min={0}
                              value={calcOvertimeHours}
                              onChange={(e) => setCalcOvertimeHours(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                            />
                          </div>
                        </div>

                        {calcOvertimeHours > 0 && (
                          <div className="animate-fade-in bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 p-3 rounded-2xl">
                            <label className="block text-[10px] font-bold text-amber-800 dark:text-amber-500 mb-1.5 uppercase tracking-wider">Mnożnik stawki nadgodzin</label>
                            <select
                              value={calcOvertimeRateMultiplier}
                              onChange={(e) => setCalcOvertimeRateMultiplier(parseFloat(e.target.value))}
                              className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-bold cursor-pointer"
                            >
                              <option value={1.5} className="dark:bg-slate-900">150% (Standard w tygodniu)</option>
                              <option value={2.0} className="dark:bg-slate-900">200% (Soboty, niedziele i święta)</option>
                              <option value={1.0} className="dark:bg-slate-900">100% (Normalna stawka)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Calculations breakdown and visual calendar */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Financial breakdown */}
                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-3 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                              <DollarSign className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                              <span>Rozliczenie Finansowe</span>
                            </h4>

                            <div className="space-y-3.5 text-xs">
                              <div className="flex items-center justify-between font-semibold">
                                <span className="text-slate-500 dark:text-slate-400">Dni robocze w tym miesiącu:</span>
                                <span className="font-mono text-slate-800 dark:text-slate-100 font-black">{baseDays} dni</span>
                              </div>
                              {calcUnpaidDays > 0 && (
                                <div className="flex items-center justify-between font-semibold text-red-600 dark:text-red-400">
                                  <span>Dni wolne / urlopy (potrącenie):</span>
                                  <span className="font-mono font-black">-{calcUnpaidDays} dni</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between font-semibold">
                                <span className="text-slate-500 dark:text-slate-400">Efektywne dni pracy:</span>
                                <span className="font-mono text-slate-800 dark:text-slate-100 font-black">{effectiveWorkDays} dni</span>
                              </div>
                              <div className="flex items-center justify-between font-semibold">
                                <span className="text-slate-500 dark:text-slate-400">Godziny etatowe ({calcDailyHours}h/d):</span>
                                <span className="font-mono text-slate-800 dark:text-slate-100 font-black">{standardHours}h</span>
                              </div>
                              {calcOvertimeHours > 0 && (
                                <div className="flex items-center justify-between font-semibold text-amber-600 dark:text-amber-400">
                                  <span>Nadgodziny (mnożnik {calcOvertimeRateMultiplier}x):</span>
                                  <span className="font-mono font-black">+{calcOvertimeHours}h</span>
                                </div>
                              )}
                              <div className="border-t border-slate-200 dark:border-slate-800 my-2 pt-2 flex items-center justify-between text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                                <span>Łączny czas pracy:</span>
                                <span className="font-mono text-amber-600 dark:text-amber-400 text-base">{totalHours} godz.</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Szacowane Wynagrodzenie</span>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight flex items-baseline gap-1">
                              <span>{totalEarnings.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span className="text-xs text-emerald-700 dark:text-emerald-500 font-black">PLN</span>
                            </div>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block leading-normal">
                              Kwota obliczona na podstawie stawki {calcHourlyRate} PLN/h dla {standardHours}h oraz stawki nadliczbowej {(parsedRate * calcOvertimeRateMultiplier).toFixed(2)} PLN/h dla {calcOvertimeHours}h.
                            </span>
                          </div>
                        </div>

                        {/* Interactive Grid Calendar */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3.5">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
                              <Calendar className="w-4 h-4 text-amber-500" />
                              <span>Wizualizacja Miesiąca</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 leading-normal">
                              Legenda: <span className="inline-block w-2.5 h-2.5 rounded bg-amber-500 border border-amber-500 shrink-0 mx-1"></span> Praca 
                              <span className="inline-block w-2.5 h-2.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mx-1"></span> Weekend
                              {calcUnpaidDays > 0 && <><span className="inline-block w-2.5 h-2.5 rounded bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 shrink-0 mx-1"></span> Urlop</>}
                            </p>
                          </div>

                          {/* Day Grid representation */}
                          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                            <span>Pn</span><span>Wt</span><span>Śr</span><span>Cz</span><span>Pt</span><span>Sb</span><span>Nd</span>
                          </div>

                          <div className="grid grid-cols-7 gap-1.5">
                            {(() => {
                              // Find starting day of the week
                              const startDay = new Date(year, month, 1).getDay();
                              // Shift so Monday is index 0
                              const shiftedStartDay = (startDay + 6) % 7;

                              const cells = [];
                              // Empty slots before first day
                              for (let i = 0; i < shiftedStartDay; i++) {
                                cells.push(<div key={`empty-${i}`} className="aspect-square bg-slate-50/20 dark:bg-slate-950/20 rounded-lg"></div>);
                              }

                              // Day cells
                              let leaveDayCounter = 0;
                              for (let d = 1; d <= totalDays; d++) {
                                const currentDate = new Date(year, month, d);
                                const dayOfWeek = currentDate.getDay();
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                
                                let cellBg = 'bg-amber-500 text-slate-950 border border-amber-500';
                                let hoverTitle = `Dzień pracujący: ${d} ${monthStr}.${year}`;

                                if (isWeekend) {
                                  cellBg = 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700';
                                  hoverTitle = `Weekend: ${d} ${monthStr}.${year}`;
                                } else if (leaveDayCounter < calcUnpaidDays) {
                                  // Assign non-weekend days as leave days
                                  cellBg = 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40';
                                  hoverTitle = `Dzień wolny/urlop: ${d} ${monthStr}.${year}`;
                                  leaveDayCounter++;
                                }

                                cells.push(
                                  <div 
                                    key={`day-${d}`} 
                                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition-all hover:scale-105 select-none ${cellBg}`}
                                    title={hoverTitle}
                                  >
                                    {d}
                                  </div>
                                );
                              }
                              return cells;
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Actions: Export PDF report of monthly work timesheet */}
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                        <div className="text-left">
                          <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Karta Miesięczna Kierownika</span>
                          </h5>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 leading-normal">
                            Wygeneruj oficjalną kartę pracy z tym rozliczeniem, gotową do przekazania do biura rachunkowego.
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => {
                            // PDF Generator logic for calculation summary
                            const doc = new jsPDF();
                            doc.setFillColor(15, 23, 42); // slate-900
                            doc.rect(0, 0, 210, 42, 'F');
                            
                            doc.setTextColor(255, 255, 255);
                            doc.setFont('Helvetica', 'bold');
                            doc.setFontSize(18);
                            doc.text(sanitizePolishChars('MIESIECZNA KARTA PRACY - ROZLICZENIE'), 14, 18);
                            
                            doc.setFont('Helvetica', 'normal');
                            doc.setFontSize(9);
                            doc.setTextColor(203, 213, 225);
                            doc.text(`Okres rozliczeniowy: ${calcSelectedMonth} | Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 14, 27);
                            doc.text('Aplikacja Rejestr Budowlany - Modul Kalkulatora Roboczogodzin', 14, 32);

                            // Title details
                            doc.setTextColor(15, 23, 42);
                            doc.setFont('Helvetica', 'bold');
                            doc.setFontSize(12);
                            doc.text(sanitizePolishChars('1. PODSUMOWANIE CZASU PRACY'), 14, 55);

                            doc.setFont('Helvetica', 'normal');
                            doc.setFontSize(10);
                            
                            const leftColX = 14;
                            const rightColX = 120;
                            let currentY = 65;

                            doc.text(sanitizePolishChars(`Miesiąc rozliczeniowy: ${calcSelectedMonth}`), leftColX, currentY);
                            doc.text(sanitizePolishChars(`Stawka godzinowa: ${calcHourlyRate} PLN/h`), rightColX, currentY);
                            currentY += 8;

                            doc.text(sanitizePolishChars(`Suma dni kalendarzowych: ${totalDays}`), leftColX, currentY);
                            doc.text(sanitizePolishChars(`Dzienny wymiar pracy: ${calcDailyHours}h / dzień`), rightColX, currentY);
                            currentY += 8;

                            doc.text(sanitizePolishChars(`Wyliczone dni robocze: ${baseDays} dni`), leftColX, currentY);
                            doc.text(sanitizePolishChars(`Potrącone dni wolne/urlop: ${calcUnpaidDays} dni`), rightColX, currentY);
                            currentY += 8;

                            doc.setFont('Helvetica', 'bold');
                            doc.text(sanitizePolishChars(`Efektywne dni przepracowane: ${effectiveWorkDays} dni`), leftColX, currentY);
                            doc.text(sanitizePolishChars(`Przepracowane godziny etatowe: ${standardHours} godz.`), rightColX, currentY);
                            currentY += 10;

                            if (calcOvertimeHours > 0) {
                              doc.setFont('Helvetica', 'normal');
                              doc.text(sanitizePolishChars(`Godziny nadliczbowe (nadgodziny): ${calcOvertimeHours} godz.`), leftColX, currentY);
                              doc.text(sanitizePolishChars(`Mnożnik nadgodzin: ${calcOvertimeRateMultiplier * 100}%`), rightColX, currentY);
                              currentY += 8;
                            }

                            // Final Sum box
                            doc.setFillColor(245, 158, 11); // amber-500
                            doc.rect(14, currentY, 182, 12, 'F');
                            doc.setTextColor(15, 23, 42);
                            doc.setFont('Helvetica', 'bold');
                            doc.setFontSize(11);
                            doc.text(sanitizePolishChars(`LACZNY CZAS PRACY: ${totalHours} ROBOCZOGODZIN(Y)`), 18, currentY + 7.5);
                            currentY += 22;

                            // Earnings section
                            doc.setTextColor(15, 23, 42);
                            doc.setFont('Helvetica', 'bold');
                            doc.setFontSize(12);
                            doc.text(sanitizePolishChars('2. ROZLICZENIE FINANSOWE (SZACOWANE)'), 14, currentY);
                            currentY += 10;

                            doc.setFont('Helvetica', 'normal');
                            doc.setFontSize(10);
                            doc.text(sanitizePolishChars(`Wynagrodzenie zasadnicze (${standardHours}h * ${calcHourlyRate} PLN/h):`), leftColX, currentY);
                            doc.text(`${baseEarnings.toFixed(2)} PLN`, rightColX, currentY);
                            currentY += 8;

                            if (calcOvertimeHours > 0) {
                              doc.text(sanitizePolishChars(`Wynagrodzenie za nadgodziny (${calcOvertimeHours}h * ${(parsedRate * calcOvertimeRateMultiplier).toFixed(2)} PLN/h):`), leftColX, currentY);
                              doc.text(`${overtimeEarnings.toFixed(2)} PLN`, rightColX, currentY);
                              currentY += 8;
                            }

                            // Border line
                            doc.setDrawColor(203, 213, 225);
                            doc.line(14, currentY, 196, currentY);
                            currentY += 8;

                            // Total Earnings
                            doc.setFont('Helvetica', 'bold');
                            doc.setFontSize(12);
                            doc.text(sanitizePolishChars('SZACUNKOWE WYNAGRODZENIE BRUTTO RAZEM:'), leftColX, currentY);
                            doc.setTextColor(220, 38, 38); // red/dark color for total
                            doc.text(`${totalEarnings.toFixed(2)} PLN`, rightColX, currentY);
                            
                            // Signatures
                            currentY = Math.min(currentY + 40, 270);
                            doc.setDrawColor(203, 213, 225);
                            doc.line(14, currentY, 80, currentY);
                            doc.line(130, currentY, 196, currentY);
                            
                            doc.setFontSize(8);
                            doc.setTextColor(100, 116, 139);
                            doc.setFont('Helvetica', 'normal');
                            doc.text(sanitizePolishChars('Podpis pracownika'), 14, currentY + 4);
                            doc.text(sanitizePolishChars('Podpis kierownika budowy / pracodawcy'), 130, currentY + 4);

                            doc.save(`Rozliczenie_Pracy_Miesiac_${calcSelectedMonth}.pdf`);
                            triggerToast('Pomyślnie wygenerowano i pobrano PDF z miesięczną kartą pracy!', 'success');
                          }}
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all uppercase tracking-wider shadow-sm border border-slate-700 dark:border-slate-800 w-full sm:w-auto shrink-0 cursor-pointer"
                          title="Pobierz pełną kartę rozliczeniową w formacie PDF"
                        >
                          <FileDown className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Pobierz kartę PDF</span>
                        </motion.button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}

        {/* ==================== TAB 2: HISTORY ==================== */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Historia wpisów</h3>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {filteredEntries.length} z {entries.length}
                </span>
              </div>
            </div>

            {/* Exports Row (PDF, CSV, and XLSX Excel Spreadsheets) */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <motion.button 
                  onClick={generatePDFReport}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-cyber-secondary py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:border-rose-500/50 focus-visible:ring-rose-500"
                >
                  <FileDown className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                  <span>Raport dzienny PDF</span>
                </motion.button>

                <motion.button 
                  onClick={generateWeeklyPDFReport}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-cyber-secondary py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:border-amber-500/50 focus-visible:ring-amber-500"
                >
                  <Calendar className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                  <span>Podsumowanie Tygodniowe PDF</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <motion.button 
                  onClick={exportToCSV}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-cyber-secondary py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:border-indigo-500/50 focus-visible:ring-indigo-500"
                >
                  <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                  <span>Eksport CSV</span>
                </motion.button>

                <motion.button 
                  onClick={exportToXLSX}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-cyber-secondary py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:border-emerald-500/50 focus-visible:ring-emerald-500 text-emerald-300"
                >
                  <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                  <span>Eksport Excel</span>
                </motion.button>
              </div>
            </div>

            {/* Filters Widget Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              {/* Text Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3.5" />
                <input 
                  type="text" 
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Szukaj projektu, opisu, pracownika lub lokalizacji..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-3 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:border-indigo-400 dark:focus:bg-slate-900 transition-all font-semibold shadow-2xs"
                />
              </div>

              {/* Select filters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Filtruj Projekt</label>
                  <select
                    value={historyProjectFilter}
                    onChange={(e) => setHistoryProjectFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer"
                  >
                    {uniqueProjects.map(proj => (
                      <option key={proj} value={proj} className="dark:bg-slate-900">{proj === 'All' ? 'Wszystkie Projekty' : proj}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Filtruj Miesiąc</label>
                  <select
                    value={historyMonthFilter}
                    onChange={(e) => setHistoryMonthFilter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer"
                  >
                    {uniqueMonths.map(month => (
                      <option key={month} value={month} className="dark:bg-slate-900">{month === 'All' ? 'Wszystkie miesiące' : month}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* History Table / Cards */}
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
                  <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Brak zarejestrowanych wpisów spełniających kryteria.</p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const hours = calculateEntryHours(entry);
                  const earnings = calculateEntryEarnings(entry);
                  
                  return (
                    <div 
                      key={entry.id} 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-sans border border-slate-200/40 dark:border-slate-700/60">
                            {entry.date}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100/40 dark:border-indigo-900/40">
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <motion.button 
                            onClick={() => handleStartEdit(entry)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-all cursor-pointer"
                            title="Edytuj wpis"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>

                          <motion.button 
                            onClick={() => deleteEntry(entry.id)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all cursor-pointer"
                            title="Usuń wpis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-start justify-between">
                        <div className="space-y-1.5 pr-4">
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                            <span>{entry.project}</span>
                          </h4>
                          {entry.workerName && (
                            <div className="flex items-center space-x-1 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide font-mono">
                              <span>Pracownik:</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{entry.workerName}</span>
                            </div>
                          )}
                          {entry.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{entry.description}</p>
                          )}
                          {entry.location && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/40 px-2 py-1 rounded-lg w-fit">
                              <span>📍 Lokalizacja:</span>
                              <span className="font-extrabold text-slate-700 dark:text-slate-300">{entry.location}</span>
                            </div>
                          )}
                          {entry.breakMinutes > 0 && (
                            <span className="inline-block text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-100/60 dark:border-amber-900/40 px-1.5 py-0.5 rounded mt-1">
                              Przerwa: {entry.breakMinutes} min
                            </span>
                          )}
                        </div>

                        {/* Earnings layout */}
                        <div className="text-right shrink-0">
                          <span className="block text-xs font-black text-indigo-600 dark:text-indigo-400">
                            +{formatCurrencyValue(earnings, settings.currency)}
                          </span>
                          <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                            {hours.toFixed(2)} godz. @ {entry.hourlyRate}
                            {entry.isOvertime ? ` (x${entry.overtimeMultiplier})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ==================== TAB 3: STATISTICS ==================== */}
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Statystyki & Raporty</h3>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full font-black uppercase tracking-wider">
                Miesiąc: {historyMonthFilter === 'All' ? 'Wszystkie' : historyMonthFilter}
              </span>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Wynagrodzenie BRUTTO</span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
                  {formatCurrencyValue(totals.totalEarningsBrutto, settings.currency)}
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 block font-medium">Suma zarobków z wpisów</span>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Do wypłaty NETTO</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {formatCurrencyValue(totals.totalEarningsNetto, settings.currency)}
                </span>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${100 - settings.taxRatePercent}%` }}></div>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 block font-medium">
                  Podatek ({settings.taxRatePercent}%): {formatCurrencyValue(totals.taxAmount, settings.currency)}
                </span>
              </div>
            </div>

            {/* Total Hours Worked Bar Graph Indicator */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Łączny czas pracy</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
                    {formatDuration(totals.totalHours)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Nadgodziny</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                    {formatDuration(totals.overtimeHours)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Zarejestrowane przerwy</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{totals.totalBreaks} min</span>
              </div>
            </div>

            {/* Visual Custom Chart 1: Interactive SVG Daily Hours worked (Last 7 Logs) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Ostatnie 7 wpisów (godziny pracy)</h4>
              
              {lastSevenLogs.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 font-medium">Dodaj wpisy czasu, aby wyświetlić wykres słupkowy.</p>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="h-28 flex items-end justify-between px-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                    {lastSevenLogs.map((log, idx) => {
                      const maxHours = Math.max(...lastSevenLogs.map(l => l.hours), 8);
                      const heightPercent = (log.hours / maxHours) * 100;
                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 space-y-1">
                          <div className="w-full px-1.5 relative flex justify-center group">
                            {/* Hover info tooltip */}
                            <div className="absolute bottom-full mb-1 bg-slate-900 dark:bg-slate-800 text-white text-[9px] py-1 px-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 font-bold">
                              {log.hours.toFixed(1)}h ({log.project})
                            </div>
                            {/* Column Bar with beautiful micro-interactions and entry animation */}
                            <motion.div 
                              initial={{ scaleY: 0, originY: 1 }}
                              animate={{ scaleY: 1 }}
                              transition={{ type: "spring", stiffness: 180, damping: 15, delay: idx * 0.05 }}
                              className="w-full bg-gradient-to-t from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-500 rounded-t-lg cursor-pointer transition-all duration-500 hover:brightness-110" 
                              style={{ height: `${Math.max(8, heightPercent)}%` }}
                            ></motion.div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1">{log.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Visual Custom Chart 3: Interactive Recharts Line/Area Chart showing earnings over time */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm transition-colors duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>{earningsChartType === 'linear' ? 'Zarobki skumulowane w czasie' : 'Zarobki w poszczególnych dniach'}</span>
                </h4>
                <div className="flex items-center gap-2">
                  <div className="inline-flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60 shrink-0">
                    <motion.button
                      type="button"
                      onClick={() => setEarningsChartType('linear')}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer relative z-10 ${
                        earningsChartType === 'linear'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      Liniowy
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setEarningsChartType('bar')}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer relative z-10 ${
                        earningsChartType === 'bar'
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      Słupkowy
                    </motion.button>
                  </div>
                  <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-extrabold font-mono bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-xl uppercase tracking-wider shrink-0">
                    Suma: {formatCurrencyValue(totals.totalEarningsBrutto, settings.currency)}
                  </span>
                </div>
              </div>

              {earningsOverTime.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8 font-medium">Dodaj wpisy finansowe, aby zobaczyć wykres postępu zarobków.</p>
              ) : (
                <motion.div 
                  key={`chart-${activeTab}-${earningsChartType}`}
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.05 }}
                  className="w-full h-48 pt-2"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    {earningsChartType === 'linear' ? (
                      <AreaChart
                        data={earningsOverTime}
                        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} />
                        <XAxis 
                          dataKey="shortDate" 
                          stroke={darkMode ? "#64748b" : "#94a3b8"}
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          dy={6}
                        />
                        <YAxis 
                          stroke={darkMode ? "#64748b" : "#94a3b8"}
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          dx={-2}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                            borderColor: darkMode ? '#1e293b' : '#e2e8f0',
                            borderRadius: '16px',
                            fontSize: '11px',
                            color: darkMode ? '#f8fafc' : '#0f172a',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="Suma" 
                          name="Skumulowany zarobek"
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#colorEarnings)" 
                        />
                      </AreaChart>
                    ) : (
                      <BarChart
                        data={earningsOverTime}
                        margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} />
                        <XAxis 
                          dataKey="shortDate" 
                          stroke={darkMode ? "#64748b" : "#94a3b8"}
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          dy={6}
                        />
                        <YAxis 
                          stroke={darkMode ? "#64748b" : "#94a3b8"}
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                          dx={-2}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                            borderColor: darkMode ? '#1e293b' : '#e2e8f0',
                            borderRadius: '16px',
                            fontSize: '11px',
                            color: darkMode ? '#f8fafc' : '#0f172a',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#64748b' }}
                        />
                        <Bar 
                          dataKey="Dzienny" 
                          name="Zarobek dzienny"
                          fill="#10b981" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>

            {/* Visual Custom Chart 2: Projects breakdown (Pie Donut Visualization via Clean SVG) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Podział godzin na projekty</h4>
              
              {projectBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 font-medium">Brak danych projektów do analizy.</p>
              ) : (
                <div className="grid grid-cols-5 items-center gap-4">
                  {/* Visual SVG Donut Chart */}
                  <div className="col-span-2 flex justify-center">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="3" />
                      {(() => {
                        let accumulatedPercent = 0;
                        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
                        return projectBreakdown.map((item, idx) => {
                          const totalHrs = projectBreakdown.reduce((sum, p) => sum + p.hours, 0);
                          const percentage = totalHrs > 0 ? (item.hours / totalHrs) * 100 : 0;
                          const strokeDasharray = `${percentage} ${100 - percentage}`;
                          const strokeDashoffset = 100 - accumulatedPercent;
                          accumulatedPercent += percentage;
                          
                          return (
                            <circle 
                              key={idx}
                              cx="18" 
                              cy="18" 
                              r="15.915" 
                              fill="none" 
                              stroke={colors[idx % colors.length]} 
                              strokeWidth="3.5" 
                              strokeDasharray={strokeDasharray} 
                              strokeDashoffset={strokeDashoffset} 
                            />
                          );
                        });
                      })()}
                    </svg>
                  </div>

                  {/* Legends */}
                  <div className="col-span-3 space-y-2">
                    {projectBreakdown.slice(0, 4).map((item, idx) => {
                      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
                      const totalHrs = projectBreakdown.reduce((sum, p) => sum + p.hours, 0);
                      const percentage = totalHrs > 0 ? (item.hours / totalHrs) * 100 : 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5 truncate pr-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                            <span className="text-slate-600 dark:text-slate-300 truncate font-bold">{item.name}</span>
                          </div>
                          <span className="font-mono text-slate-400 dark:text-slate-500 shrink-0 font-bold">{percentage.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Podział godzin na kategorie */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-1.5 font-mono">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Podział godzin na kategorie</span>
              </h4>
              
              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 font-medium">Brak danych kategorii do analizy.</p>
              ) : (
                <div className="grid grid-cols-5 items-center gap-4">
                  {/* Visual SVG Donut Chart */}
                  <div className="col-span-2 flex justify-center">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="3" />
                      {(() => {
                        let accumulatedPercent = 0;
                        const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'];
                        return categoryBreakdown.map((item, idx) => {
                          const totalHrs = categoryBreakdown.reduce((sum, p) => sum + p.hours, 0);
                          const percentage = totalHrs > 0 ? (item.hours / totalHrs) * 100 : 0;
                          const strokeDasharray = `${percentage} ${100 - percentage}`;
                          const strokeDashoffset = 100 - accumulatedPercent;
                          accumulatedPercent += percentage;
                          
                          return (
                            <circle 
                              key={idx}
                              cx="18" 
                              cy="18" 
                              r="15.915" 
                              fill="none" 
                              stroke={colors[idx % colors.length]} 
                              strokeWidth="3.5" 
                              strokeDasharray={strokeDasharray} 
                              strokeDashoffset={strokeDashoffset} 
                            />
                          );
                        });
                      })()}
                    </svg>
                  </div>

                  {/* Legends */}
                  <div className="col-span-3 space-y-2">
                    {categoryBreakdown.slice(0, 5).map((item, idx) => {
                      const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'];
                      const totalHrs = categoryBreakdown.reduce((sum, p) => sum + p.hours, 0);
                      const percentage = totalHrs > 0 ? (item.hours / totalHrs) * 100 : 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1.5 truncate pr-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                            <span className="text-slate-600 dark:text-slate-300 truncate font-bold">{item.name}</span>
                          </div>
                          <span className="font-mono text-slate-400 dark:text-slate-500 shrink-0 font-bold">{percentage.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* System Osiągnięć i Odznak */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-1.5 font-mono">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Twoje osiągnięcia i odznaki</span>
                </h4>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 px-2 py-0.5 rounded-md font-mono">
                  Zdobyte: {achievements.filter(a => a.isEarned).length} / {achievements.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {achievements.map((badge) => {
                  const percent = Math.min(100, Math.round((badge.current / badge.target) * 100));
                  return (
                    <div 
                      key={badge.id}
                      className={`relative border rounded-2xl p-4 transition-all duration-300 ${
                        badge.isEarned 
                          ? 'bg-gradient-to-r from-amber-500/[0.04] to-indigo-500/[0.04] dark:from-amber-500/[0.02] dark:to-indigo-500/[0.02] border-amber-500/30 dark:border-amber-500/20' 
                          : 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`text-2xl p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
                          badge.isEarned
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                            : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 filter grayscale'
                        }`}>
                          {badge.icon}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              {badge.title}
                              {badge.isEarned && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/30 px-1.5 py-0.5 rounded-md">
                                  Zdobyte 🎉
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 font-mono">
                              {badge.current} / {badge.target}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {badge.description}
                          </p>

                          {/* Progress bar */}
                          <div className="space-y-1 pt-1.5">
                            <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-800/40">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  badge.isEarned 
                                    ? 'bg-gradient-to-r from-amber-500 to-indigo-500' 
                                    : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                              <span>Kategoria: {badge.category}</span>
                              <span>{percent}% ukończone</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ==================== TAB 4: SETTINGS ==================== */}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Konfiguracja profilu</h3>

            {/* Tryb Nocny (Dark Mode) Switch Panel */}
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center space-x-1.5">
                    <Moon className="w-4 h-4 text-amber-500" />
                    <span>Tryb nocny</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Przełącz kolorystykę aplikacji na ciemną, oszczędzając baterię w telefonie podczas pracy.
                  </p>
                </div>
                
                {/* Switch Button */}
                <motion.button 
                  onClick={() => {
                    const nextMode = !darkMode;
                    setDarkMode(nextMode);
                    triggerToast(nextMode ? 'Tryb nocny włączony! 🌙' : 'Tryb jasny włączony! ☀️', 'info');
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 flex items-center shrink-0 cursor-pointer ${
                    darkMode ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <div className={`bg-white dark:bg-slate-100 w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                    darkMode ? 'translate-x-5.5' : 'translate-x-0'
                  }`} />
                </motion.button>
              </div>
            </div>

            {/* Offline Simulator Switch Panel */}
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-1.5">
                    <Wifi className="w-4 h-4 text-emerald-500" />
                    <span>Tryb Offline</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Symuluj brak połączenia internetowego, aby sprawdzić zabezpieczenia i zapis lokalny.
                  </p>
                </div>
                
                {/* Switch Button */}
                <motion.button 
                  onClick={() => {
                    setForceOffline(!forceOffline);
                    triggerToast(!forceOffline ? 'Tryb offline włączony!' : 'Tryb online przywrócony', 'info');
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                    forceOffline ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <div className={`bg-white dark:bg-slate-100 w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                    forceOffline ? 'translate-x-5.5' : 'translate-x-0'
                  }`} />
                </motion.button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-3.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
                <p>💡 <strong>Aplikacja korzysta z lokalnej bazy danych.</strong></p>
                <p>Nawet po odłączeniu od sieci możesz uruchamiać stoper, dodawać manualne wpisy i generować raporty PDF oraz CSV!</p>
              </div>
            </div>

            {/* Reminders Preferences */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-1.5">
                <Bell className="w-4 h-4 text-indigo-500" />
                <span>Przypomnienia dzienne</span>
              </h4>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Włącz powiadomienia o logowaniu godzin</span>
                <motion.button 
                  onClick={() => {
                    const nextVal = !settings.reminderEnabled;
                    saveAppSettings({ ...settings, reminderEnabled: nextVal });
                    if (nextVal && notificationPermission !== 'granted') {
                      requestNotificationPermission();
                    } else {
                      triggerToast(nextVal ? 'Powiadomienia aktywne' : 'Wyłączono powiadomienia', 'info');
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                    settings.reminderEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <div className={`bg-white dark:bg-slate-100 w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                    settings.reminderEnabled ? 'translate-x-5.5' : 'translate-x-0'
                  }`} />
                </motion.button>
              </div>

              {settings.reminderEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Godzina Przypomnienia</label>
                    <input 
                      type="time" 
                      value={settings.reminderTime}
                      onChange={(e) => {
                        saveAppSettings({ ...settings, reminderTime: e.target.value });
                        triggerToast(`Zmieniono godzinę przypomnienia na ${e.target.value}`, 'success');
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer font-semibold"
                    />
                  </div>
                  <div className="flex items-end font-semibold">
                    <motion.button
                      onClick={simulateReminder}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-100/60 dark:border-indigo-900/40 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <span>Przetestuj teraz</span>
                    </motion.button>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800/60 my-2 pt-3">
                <div className="flex items-center justify-between">
                  <div className="pr-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Przypomnienie o godzinie 10:00</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">Powiadom, jeśli brak dzisiejszych wpisów do godz. 10:00 rano</span>
                  </div>
                  <motion.button 
                    onClick={() => {
                      const nextVal = !settings.reminder10AMEnabled;
                      saveAppSettings({ ...settings, reminder10AMEnabled: nextVal });
                      if (nextVal && notificationPermission !== 'granted') {
                        requestNotificationPermission();
                      } else {
                        triggerToast(nextVal ? 'Przypomnienie o 10:00 aktywne' : 'Wyłączono przypomnienie o 10:00', 'info');
                      }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer ${
                      settings.reminder10AMEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    <div className={`bg-white dark:bg-slate-100 w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                      settings.reminder10AMEnabled ? 'translate-x-5.5' : 'translate-x-0'
                    }`} />
                  </motion.button>
                </div>

                {settings.reminder10AMEnabled && (
                  <div className="mt-3">
                    <motion.button
                      onClick={simulate10AMReminder}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-800 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <span>Przetestuj przypomnienie o 10:00</span>
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Intelligent Weather Warnings Section */}
              <div className="border-t border-slate-100 dark:border-slate-800/60 my-2 pt-3">
                <div className="flex items-center justify-between">
                  <div className="pr-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Inteligentna prognoza pogody 🌤️</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">Ostrzegaj przed opadami deszczu dla zadań zaplanowanych na zewnątrz</span>
                  </div>
                  <motion.button 
                    onClick={() => {
                      const nextVal = settings.weatherAlertsEnabled === false ? true : false;
                      saveAppSettings({ ...settings, weatherAlertsEnabled: nextVal });
                      triggerToast(nextVal ? 'Inteligentne alerty pogodowe włączone 🌤️' : 'Wyłączono alerty pogodowe 🔇', 'info');
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer ${
                      settings.weatherAlertsEnabled !== false ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    <div className={`bg-white dark:bg-slate-100 w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                      settings.weatherAlertsEnabled !== false ? 'translate-x-5.5' : 'translate-x-0'
                    }`} />
                  </motion.button>
                </div>

                {settings.weatherAlertsEnabled !== false && (
                  <div className="mt-3">
                    <motion.button
                      onClick={simulateWeatherCheck}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-100/40 dark:border-indigo-900/20 font-extrabold py-2 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <span>Skanuj pogodę i zadania teraz 📡</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Alerts Settings Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-amber-500" />
                <span>Alerty dźwiękowe</span>
              </h4>

              <div className="flex items-center justify-between">
                <div className="pr-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Dźwięki powiadomień</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">Odtwarzaj subtelny dźwięk po ukończeniu zadania lub w określonych interwałach stopera</span>
                </div>
                <motion.button 
                  type="button"
                  onClick={() => {
                    const nextVal = settings.audioAlertsEnabled === false ? true : false;
                    saveAppSettings({ ...settings, audioAlertsEnabled: nextVal });
                    triggerToast(nextVal ? 'Alerty dźwiękowe włączone 🔊' : 'Wyciszono alerty dźwiękowe 🔇', 'info');
                    if (nextVal) {
                      playNotificationSound('success');
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 shrink-0 cursor-pointer ${
                    settings.audioAlertsEnabled !== false ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <div className={`bg-white dark:bg-slate-100 w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                    settings.audioAlertsEnabled !== false ? 'translate-x-5.5' : 'translate-x-0'
                  }`} />
                </motion.button>
              </div>

              {settings.audioAlertsEnabled !== false && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Częstotliwość stopera</label>
                      <select
                        value={settings.audioIntervalSeconds || 3600}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          saveAppSettings({ ...settings, audioIntervalSeconds: val });
                          triggerToast(`Ustawiono interwał powiadomień dźwiękowych`, 'success');
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer font-semibold"
                      >
                        <option value="60" className="dark:bg-slate-900">Każda 1 minuta (testowe)</option>
                        <option value="300" className="dark:bg-slate-900">Co 5 minut</option>
                        <option value="900" className="dark:bg-slate-900">Co 15 minut</option>
                        <option value="1800" className="dark:bg-slate-900">Co 30 minut</option>
                        <option value="3600" className="dark:bg-slate-900">Co 1 godzinę</option>
                        <option value="7200" className="dark:bg-slate-900">Co 2 godziny</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Dźwięk ukończenia zadania</label>
                      <div className="flex gap-2">
                        <select
                          value={settings.taskCompletionSound || 'chime'}
                          onChange={(e) => {
                            const val = e.target.value;
                            saveAppSettings({ ...settings, taskCompletionSound: val });
                            playNotificationSound(val);
                            triggerToast(`Ustawiono dźwięk zadania: ${val}`, 'success');
                          }}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer font-semibold"
                        >
                          <option value="chime" className="dark:bg-slate-900">Domyślny (Chime) 🔔</option>
                          <option value="digital" className="dark:bg-slate-900">Cyfrowy (Digital) ⚡</option>
                          <option value="laser" className="dark:bg-slate-900">Kosmiczny (Laser) ☄️</option>
                          <option value="gong" className="dark:bg-slate-900">Mocny (Gong) 🥁</option>
                          <option value="tada" className="dark:bg-slate-900">Triumf (Tada) 🎉</option>
                        </select>
                        <motion.button
                          type="button"
                          onClick={() => playNotificationSound(settings.taskCompletionSound || 'chime')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-2 border-amber-100/60 dark:border-amber-900/30 p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center w-9 h-9 shrink-0"
                          title="Testuj dźwięk zadania"
                        >
                          <Volume2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Dźwięk końca pracy</label>
                      <div className="flex gap-2">
                        <select
                          value={settings.workEndSound || 'bell'}
                          onChange={(e) => {
                            const val = e.target.value;
                            saveAppSettings({ ...settings, workEndSound: val });
                            playNotificationSound(val);
                            triggerToast(`Ustawiono dźwięk końca pracy: ${val}`, 'success');
                          }}
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all cursor-pointer font-semibold"
                        >
                          <option value="bell" className="dark:bg-slate-900">Dzwonek (Bell) 🏛️</option>
                          <option value="marimba" className="dark:bg-slate-900">Marimba (Warm) 🪵</option>
                          <option value="alert" className="dark:bg-slate-900">Alarm (Alert) 🚨</option>
                          <option value="whistle" className="dark:bg-slate-900">Gwizdek (Whistle) 🌬️</option>
                          <option value="cosmic" className="dark:bg-slate-900">Futurystyczny (Cosmic) 🌌</option>
                        </select>
                        <motion.button
                          type="button"
                          onClick={() => playNotificationSound(settings.workEndSound || 'bell')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-100/60 dark:border-indigo-900/30 p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center w-9 h-9 shrink-0"
                          title="Testuj dźwięk końca pracy"
                        >
                          <Volume2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Parameters Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Parametry finansowe</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Stawka domyślna (/h)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={settings.defaultHourlyRate}
                    onChange={(e) => saveAppSettings({ ...settings, defaultHourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Waluta</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => saveAppSettings({ ...settings, currency: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer font-semibold"
                  >
                    <option value="PLN" className="dark:bg-slate-900">PLN (zł)</option>
                    <option value="EUR" className="dark:bg-slate-900">EUR (€)</option>
                    <option value="USD" className="dark:bg-slate-900">USD ($)</option>
                    <option value="GBP" className="dark:bg-slate-900">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Domyślny Projekt</label>
                <input 
                  type="text" 
                  value={settings.defaultProject}
                  onChange={(e) => saveAppSettings({ ...settings, defaultProject: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Data Rozpoczęcia Inwestycji (Budowy)</label>
                <input 
                  type="date" 
                  value={settings.projectStartDate || ''}
                  onChange={(e) => {
                    saveAppSettings({ ...settings, projectStartDate: e.target.value });
                    triggerToast(`Zmieniono datę rozpoczęcia inwestycji na: ${e.target.value}`, 'success');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">Wielkość podatku do netto (%)</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="range" 
                    min="0"
                    max="50"
                    value={settings.taxRatePercent}
                    onChange={(e) => saveAppSettings({ ...settings, taxRatePercent: parseInt(e.target.value) || 0 })}
                    className="flex-1 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-slate-800 dark:text-slate-200">
                    {settings.taxRatePercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Zarządzanie stawkami projektów i zadań */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none"></div>
              
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-1.5 font-mono">
                <Wrench className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>Niestandardowe stawki godzinowe</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Przypisz niestandardowe stawki do projektów lub konkretnych zadań (słów kluczowych w opisie). System automatycznie wybierze odpowiednią stawkę.
              </p>

              {/* SECTION 1: PROJECT SPECIFIC RATES */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <span className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                  🏢 Stawki dla konkretnych projektów
                </span>

                {/* Rates List */}
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {!settings.projectRates || Object.keys(settings.projectRates).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-1">Brak niestandardowych stawek projektowych. Używana jest stawka domyślna.</p>
                  ) : (
                    Object.entries(settings.projectRates).map(([projName, rate]) => (
                      <div key={projName} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs">
                        <span className="font-extrabold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{projName}</span>
                        <div className="flex items-center space-x-3.5 shrink-0">
                          <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{rate} {settings.currency}/h</span>
                          <motion.button
                            type="button"
                            onClick={() => handleDeleteProjectRate(projName)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            className="text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Usuń stawkę"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Form */}
                <form onSubmit={handleAddProjectRate} className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      required
                      list="project-rate-options"
                      placeholder="Wpisz lub wybierz projekt..."
                      value={newProjRateKey}
                      onChange={(e) => setNewProjRateKey(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                    />
                    <datalist id="project-rate-options">
                      {allProjectsList.map(p => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </div>
                  <div className="w-24 relative">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Stawka"
                      value={newProjRateVal}
                      onChange={(e) => setNewProjRateVal(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold font-mono">/h</span>
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-2 border-amber-500/25 text-slate-950 rounded-xl px-3.5 font-black text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-sm"
                    title="Dodaj stawkę projektową"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </form>
              </div>

              {/* SECTION 2: TASK KEYWORD SPECIFIC RATES */}
              <div className="space-y-3 pt-3.5 border-t border-slate-100 dark:border-slate-800/60">
                <span className="block text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                  🔨 Stawki dla zadań (słowa kluczowe w opisie)
                </span>

                {/* Rates List */}
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {!settings.taskRates || Object.keys(settings.taskRates).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic py-1">Brak niestandardowych stawek dla zadań. Używana jest stawka projektu lub domyślna.</p>
                  ) : (
                    Object.entries(settings.taskRates).map(([taskKey, rate]) => (
                      <div key={taskKey} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs">
                        <div className="flex items-center space-x-1.5 truncate max-w-[180px]">
                          <span className="text-slate-400">🔑</span>
                          <span className="font-extrabold text-slate-700 dark:text-slate-300 truncate font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px]">{taskKey}</span>
                        </div>
                        <div className="flex items-center space-x-3.5 shrink-0">
                          <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{rate} {settings.currency}/h</span>
                          <motion.button
                            type="button"
                            onClick={() => handleDeleteTaskRate(taskKey)}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                            className="text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Usuń stawkę"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Form */}
                <form onSubmit={handleAddTaskRate} className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      required
                      placeholder="np. murowanie, tynkowanie, wykop..."
                      value={newTaskRateKey}
                      onChange={(e) => setNewTaskRateKey(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div className="w-24 relative">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Stawka"
                      value={newTaskRateVal}
                      onChange={(e) => setNewTaskRateVal(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold font-mono">/h</span>
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-2 border-amber-500/25 text-slate-950 rounded-xl px-3.5 font-black text-xs transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-sm"
                    title="Dodaj stawkę zadaniową"
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </form>
              </div>
            </div>

            {/* Zarządzanie kategoriami zadań */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.02] rounded-full blur-2xl pointer-events-none"></div>
              
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-1.5 font-mono">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span>Zarządzanie kategoriami zadań</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                Twórz własne kategorie zadań (np. Spotkania, Praca projektowa, Administracja, Prace wykończeniowe), aby precyzyjnie przypisywać i analizować czas pracy.
              </p>

              {/* Add form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem('newCategoryInput') as HTMLInputElement;
                  const val = input.value.trim();
                  if (!val) return;
                  if (categories.includes(val)) {
                    triggerToast('Ta kategoria już istnieje!', 'warning');
                    return;
                  }
                  const updated = [...categories, val];
                  saveCategories(updated);
                  input.value = '';
                  triggerToast(`Dodano nową kategorię: ${val} 🏷️`, 'success');
                }}
                className="flex gap-2"
              >
                <input 
                  name="newCategoryInput"
                  type="text" 
                  required
                  placeholder="np. Tynkowanie, Spotkania..."
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 font-black text-xs transition-all flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </form>

              {/* List of active categories with deletion capability */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {categories.map((cat) => (
                  <div 
                    key={cat} 
                    className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono"
                  >
                    <span>🏷️ {cat}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (categories.length <= 1) {
                          triggerToast('Musisz zachować co najmniej jedną kategorię!', 'warning');
                          return;
                        }
                        if (confirm(`Czy na pewno chcesz usunąć kategorię "${cat}"?`)) {
                          const updated = categories.filter(c => c !== cat);
                          saveCategories(updated);
                          triggerToast(`Usunięto kategorię: ${cat}`, 'info');
                        }
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Kopia bezpieczeństwa */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-1.5">
                <FileDown className="w-4 h-4 text-emerald-500 animate-bounce" />
                <span>Kopia bezpieczeństwa</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Pobierz cały stan aplikacji (wszystkie wpisy czasu pracy, zadania budowlane oraz galerię zdjęć) do jednego pliku .json, aby zabezpieczyć swoje dane.
              </p>
              <motion.button 
                onClick={downloadBackup}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 border-2 border-emerald-500/20 text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.25)] transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Pobierz kopię zapasową</span>
              </motion.button>
            </div>

            {/* Clear database action */}
            <div className="bg-rose-50/50 dark:bg-rose-950/10 border-2 border-rose-200/60 dark:border-rose-900/40 rounded-3xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-black text-rose-700 dark:text-rose-400">Kasowanie danych</h4>
                <p className="text-[10px] text-rose-600 dark:text-rose-500 font-bold mt-1">Trwale wyczyść historię wszystkich godzin.</p>
              </div>
              <motion.button 
                onClick={() => {
                  if (confirm('Czy na pewno chcesz usunąć absolutnie wszystkie dane? Tego kroku nie można cofnąć.')) {
                    localStorage.removeItem('work_entries');
                    setEntries([]);
                    triggerToast('Baza danych wyczyszczona!', 'warning');
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4.5 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 border-2 border-rose-200 dark:border-rose-900/40 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs focus:outline-none"
              >
                Resetuj
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ==================== TAB 3.5: PROJECTS DASHBOARD ==================== */}
        {activeTab === 'projects' && (
          <motion.div
            key="projects-tab"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="space-y-6 pb-20"
          >
            {/* Internal Sub-Tabs Navigation */}
            <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl shadow-inner">
              {(['projects', 'team', 'clients', 'reports'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  type="button"
                  onClick={() => setProjectSubTab(tab)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 ${
                    projectSubTab === tab
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/50'
                  }`}
                >
                  {tab === 'projects' ? '📁 Projekty' : tab === 'team' ? '👥 Zespół' : tab === 'clients' ? '💼 Klienci' : '📊 Raporty'}
                </motion.button>
              ))}
            </div>

            {/* ==================== SUB-TAB 1: PROJECTS ==================== */}
            {projectSubTab === 'projects' && (
              <div className="space-y-5">
                {/* Create / Edit Project Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 font-mono">
                      {editingProjectId ? '✏️' : '＋'}
                    </span>
                    <span>{editingProjectId ? 'Edytuj Projekt' : 'Nowy Projekt'}</span>
                  </h3>

                  <form onSubmit={editingProjectId ? handleSaveEditProject : handleAddProject} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Nazwa Projektu *</label>
                        <input
                          type="text"
                          required
                          placeholder="np. Budowa Domu jednorodzinnego"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Klient (Opcjonalnie)</label>
                        <select
                          value={newProjectClient}
                          onChange={(e) => setNewProjectClient(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
                        >
                          <option value="">-- Wybierz klienta --</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Budżet ({settings.currency})</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="np. 50000"
                          value={newProjectBudget}
                          onChange={(e) => setNewProjectBudget(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Data Rozpoczęcia</label>
                        <input
                          type="date"
                          value={newProjectStart}
                          onChange={(e) => setNewProjectStart(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Data Zakończenia</label>
                        <input
                          type="date"
                          value={newProjectEnd}
                          onChange={(e) => setNewProjectEnd(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Status</label>
                        <div className="flex gap-2">
                          {(['active', 'completed', 'on_hold'] as const).map(st => (
                            <motion.button
                              key={st}
                              type="button"
                              onClick={() => setNewProjectStatus(st)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex-1 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 ${
                                newProjectStatus === st
                                  ? 'bg-amber-500/15 border-amber-500 text-amber-500 shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                            >
                              {st === 'active' ? '🟢 Aktywny' : st === 'completed' ? '🔵 Zakończony' : '🟡 Wstrzymany'}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Opis Projektu</label>
                        <textarea
                          placeholder="Krótki opis celów projektu, lokalizacji itp..."
                          rows={2}
                          value={newProjectDesc}
                          onChange={(e) => setNewProjectDesc(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-805 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 btn-cyber-primary cyber-glow-border py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                      >
                        {editingProjectId ? <Check className="w-4 h-4 text-slate-950" /> : <Plus className="w-4 h-4 text-slate-950" />}
                        <span>{editingProjectId ? 'Zapisz zmiany' : 'Dodaj Projekt'}</span>
                      </motion.button>
                      {editingProjectId && (
                        <motion.button
                          type="button"
                          onClick={handleCancelEditProject}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 btn-cyber-secondary rounded-xl text-xs"
                        >
                          Anuluj
                        </motion.button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Projects List */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                      Zdefiniowane Projekty ({projects.length})
                    </span>
                  </div>

                  {projects.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center">
                      <p className="text-xs text-slate-400 font-bold italic">Brak zdefiniowanych projektów. Dodaj swój pierwszy projekt powyżej!</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {projects.map(proj => {
                        const linkedClient = clients.find(c => c.id === proj.clientId);
                        const projEntries = entries.filter(e => e.project.trim().toLowerCase() === proj.name.trim().toLowerCase());
                        const projHours = projEntries.reduce((sum, e) => sum + calculateEntryHours(e), 0);
                        const projEarnings = projEntries.reduce((sum, e) => sum + calculateEntryEarnings(e), 0);

                        return (
                          <div key={proj.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-3 relative overflow-hidden shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all group">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-amber-500/80 to-orange-500/80" />
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-slate-800 dark:text-white">{proj.name}</h4>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                                    proj.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                      : proj.status === 'completed'
                                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                  }`}>
                                    {proj.status === 'active' ? 'aktywny' : proj.status === 'completed' ? 'zakończony' : 'wstrzymany'}
                                  </span>
                                </div>
                                {linkedClient && (
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                                    👤 Klient: <span className="text-slate-600 dark:text-slate-300 font-bold">{linkedClient.name}</span> {linkedClient.companyName ? `(${linkedClient.companyName})` : ''}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                                <motion.button
                                  onClick={() => handleStartEditProject(proj)}
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.85 }}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-amber-500 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                                  title="Edytuj projekt"
                                >
                                  ✏️
                                </motion.button>
                                <motion.button
                                  onClick={() => handleDeleteProject(proj.id)}
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.85 }}
                                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-500 dark:text-slate-400 hover:text-rose-500 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                                  title="Usuń projekt"
                                >
                                  🗑️
                                </motion.button>
                              </div>
                            </div>

                            {proj.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {proj.description}
                              </p>
                            )}

                            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40 font-mono text-center">
                              <div>
                                <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Suma Godzin</span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-200">{projHours.toFixed(1)}h</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Suma Kosztów</span>
                                <span className="text-xs font-black text-emerald-500">{formatCurrencyValue(projEarnings, settings.currency)}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider">Budżet</span>
                                <span className="text-xs font-black text-indigo-400">
                                  {proj.budget ? formatCurrencyValue(proj.budget, settings.currency) : 'Brak'}
                                </span>
                              </div>
                            </div>

                            {(proj.startDate || proj.endDate) && (
                              <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-semibold font-mono pt-1">
                                <span>Start: {proj.startDate || '--'}</span>
                                <span>Koniec: {proj.endDate || '--'}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== SUB-TAB 1.5: TEAM & LIVE GPS ==================== */}
            {projectSubTab === 'team' && (
              <div className="space-y-6">
                
                {/* ROLE SWITCHER - FOR DEMO PURPOSES AND EASY ACCESS CONTROL TESTING */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-[28px] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono font-black text-amber-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      <span>PRZEŁĄCZNIK UPRAWNIEŃ (WIZUALIZACJA)</span>
                    </span>
                    <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                      Rola: {currentUserRole === 'Admin' ? 'ADMINISTRATOR' : currentUserRole === 'Manager' ? 'MENEDŻER' : 'PRACOWNIK'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider font-mono mb-2">Wybierz swoją rolę do przetestowania uprawnień:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Worker', 'Manager', 'Admin'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setCurrentUserRole(role);
                          triggerToast(`Przełączono rolę testową na: ${role === 'Admin' ? 'Administrator' : role === 'Manager' ? 'Menedżer' : 'Pracownik'}`, 'info');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                          currentUserRole === role
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : 'bg-slate-800 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-base">
                          {role === 'Worker' ? '👷' : role === 'Manager' ? '👔' : '🛡️'}
                        </span>
                        <span>{role === 'Worker' ? 'Pracownik' : role === 'Manager' ? 'Menedżer' : 'Admin'}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-400 font-semibold mt-3 leading-normal font-mono">
                    💡 <span className="text-slate-300">Pracownik</span> widzi tylko własne godziny w Historii i nie ma dostępu do zatwierdzania i edycji stawek. <span className="text-slate-300">Menedżer</span> może przeglądać i zatwierdzać godziny wszystkich. <span className="text-slate-300">Admin</span> zarządza wszystkim, w tym stawkami i uprawnieniami.
                  </p>
                </div>

                {/* LOCAL TEAM SUB-TABS NAVIGATION */}
                <div className="flex bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl">
                  {(['approvals', 'matrix', 'payroll'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setTeamActiveTab(tab)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        teamActiveTab === tab
                          ? 'bg-indigo-500 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab === 'approvals' ? '✅ Zatwierdzanie' : tab === 'matrix' ? '🔑 Role i Uprawnienia' : '💰 Rozliczenia i PDF'}
                    </button>
                  ))}
                </div>

                {/* 1. APPROVALS TAB */}
                {teamActiveTab === 'approvals' && (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                            <span>✅</span>
                            <span>Zatwierdzanie kart czasu pracy podwładnych</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                            Lista przesłanych wpisów oczekujących na zatwierdzenie przez menedżera.
                          </p>
                        </div>
                        <span className="text-[10px] font-black font-mono bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full">
                          Wszystkich wpisów: {entries.length}
                        </span>
                      </div>

                      {/* Filter entries for display */}
                      {(() => {
                        const pendingEntries = entries.filter(e => e.status === 'pending');
                        const processedEntries = entries.filter(e => e.status === 'approved' || e.status === 'rejected');

                        const handleApproveEntry = (id: string, approved: boolean) => {
                          const updated = entries.map(item => {
                            if (item.id === id) {
                              return { ...item, status: (approved ? 'approved' : 'rejected') as any };
                            }
                            return item;
                          });
                          saveEntries(updated);
                          triggerToast(approved ? 'Wpis został zaakceptowany!' : 'Wpis został odrzucony.', approved ? 'success' : 'info');
                        };

                        if (currentUserRole === 'Worker') {
                          // Workers can only see their own submitted hours status
                          const myEntries = entries.filter(e => e.workerName === currentWorker || !e.workerName);
                          return (
                            <div className="space-y-3">
                              <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-start gap-2.5">
                                <span className="text-base">⚠️</span>
                                <p>Jesteś zalogowany jako Pracownik. Poniżej widzisz status swoich własnych zgłoszonych godzin roboczych. Menedżer lub Administrator musi je zatwierdzić do wypłaty.</p>
                              </div>
                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {myEntries.length === 0 ? (
                                  <p className="text-xs text-slate-400 font-bold italic text-center py-4">Brak zgłoszonych wpisów czasu pracy.</p>
                                ) : (
                                  myEntries.map(e => (
                                    <div key={e.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-xl flex justify-between items-center">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-black text-slate-400 font-mono">{e.date}</span>
                                          <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">{e.project}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5 truncate max-w-[200px]">&ldquo;{e.description}&rdquo;</p>
                                      </div>
                                      <div className="text-right shrink-0 flex items-center gap-2">
                                        <div className="font-mono">
                                          <span className="block text-xs font-black text-slate-800 dark:text-white">{calculateEntryHours(e).toFixed(1)}h</span>
                                          <span className="text-[9px] font-bold text-slate-400">({e.startTime} - {e.endTime})</span>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md border ${
                                          e.status === 'approved'
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : e.status === 'rejected'
                                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                                        }`}>
                                          {e.status === 'approved' ? 'Zatwierdzony' : e.status === 'rejected' ? 'Odrzucony' : 'Oczekuje'}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Manager or Admin View
                        return (
                          <div className="space-y-4">
                            <div>
                              <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-2">
                                Oczekujące na Twoją decyzję ({pendingEntries.length})
                              </span>
                              {pendingEntries.length === 0 ? (
                                <div className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-center">
                                  <span className="text-xl">🎉</span>
                                  <p className="text-xs text-slate-400 font-bold italic mt-1">Wszystkie wpisy zostały zweryfikowane!</p>
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                  {pendingEntries.map(e => (
                                    <div key={e.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[10px] font-black text-indigo-500 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded">{e.workerName || 'Jan Kowalski'}</span>
                                          <span className="text-[10px] font-bold text-slate-400 font-mono">{e.date}</span>
                                          <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 truncate max-w-[120px]">{e.project}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium italic">&ldquo;{e.description || 'Bez opisu'}&rdquo;</p>
                                      </div>
                                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                        <div className="text-right font-mono">
                                          <span className="block text-xs font-black text-slate-800 dark:text-white">{calculateEntryHours(e).toFixed(1)}h</span>
                                          <span className="text-[9px] text-slate-400">({e.startTime} - {e.endTime})</span>
                                        </div>
                                        <div className="flex gap-1.5 shrink-0">
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleApproveEntry(e.id, true)}
                                            className="p-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-lg cursor-pointer text-xs font-black transition-all"
                                            title="Zatwierdź wpis"
                                          >
                                            ✔️ Tak
                                          </motion.button>
                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleApproveEntry(e.id, false)}
                                            className="p-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-lg cursor-pointer text-xs font-black transition-all"
                                            title="Odrzuć wpis"
                                          >
                                            ❌ Nie
                                          </motion.button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
                              <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mb-2">
                                Ostatnio przetworzone wpisy ({processedEntries.length})
                              </span>
                              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                {processedEntries.slice(0, 5).map(e => (
                                  <div key={e.id} className="p-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/60 dark:border-slate-800/40 rounded-xl flex justify-between items-center text-xs">
                                    <div className="truncate pr-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-black text-slate-500 font-mono">{e.workerName || 'Jan Kowalski'}</span>
                                        <span className="text-[9px] font-medium text-slate-400 font-mono">{e.date}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">&ldquo;{e.description}&rdquo;</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="text-right font-mono text-[10px]">
                                        <span className="font-extrabold text-slate-700 dark:text-slate-300">{calculateEntryHours(e).toFixed(1)}h</span>
                                      </div>
                                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                                        e.status === 'approved'
                                          ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10'
                                          : 'bg-rose-500/5 text-rose-500 border-rose-500/10'
                                      }`}>
                                        {e.status === 'approved' ? 'Zatwierdzony' : 'Odrzucony'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 2. MATRIX TAB */}
                {teamActiveTab === 'matrix' && (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                            <span>🔑</span>
                            <span>Zarządzanie Rolami i Uprawnieniami Zespołu</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                            Konfiguracja poziomów dostępu, uprawnień operacyjnych i stawek godzinowych dla kadry.
                          </p>
                        </div>
                        {currentUserRole !== 'Admin' && (
                          <span className="text-[9px] font-black bg-rose-500/10 text-rose-500 px-2.5 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Tylko Admin</span>
                          </span>
                        )}
                      </div>

                      {/* Employees List with Roles, Rates, and Permissions Matrix */}
                      <div className="space-y-4">
                        {teamMembers.map((member) => {
                          const isEditing = editingTeamMemberName === member.name;
                          return (
                            <div 
                              key={member.name} 
                              className={`p-4 rounded-2xl border transition-all ${
                                isEditing 
                                  ? 'bg-indigo-50/20 border-indigo-500 dark:bg-indigo-950/10' 
                                  : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800/60'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/40 dark:border-slate-800/40 pb-2.5">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">👷</span>
                                    <h5 className="text-xs font-black text-slate-800 dark:text-white">{member.name}</h5>
                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                      member.role === 'Admin' 
                                        ? 'bg-rose-500/10 text-rose-500' 
                                        : member.role === 'Manager' 
                                        ? 'bg-indigo-500/10 text-indigo-500' 
                                        : 'bg-emerald-500/10 text-emerald-500'
                                    }`}>
                                      {member.role === 'Admin' ? 'Admin' : member.role === 'Manager' ? 'Menedżer' : 'Pracownik'}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-400 font-mono">{member.email} | {member.phone}</p>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                  <div className="font-mono text-xs">
                                    <span className="text-[10px] text-slate-400">Stawka: </span>
                                    <span className="font-extrabold text-slate-700 dark:text-slate-300">{member.hourlyRate} zł/h</span>
                                  </div>

                                  {currentUserRole === 'Admin' && (
                                    <div>
                                      {isEditing ? (
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => {
                                              const updated = teamMembers.map(m => {
                                                if (m.name === member.name) {
                                                  // Automatically set default permissions on role change
                                                  let perms = ['submit_hours', 'edit_own_hours'];
                                                  if (editingTeamMemberRole === 'Manager') {
                                                    perms = ['submit_hours', 'edit_own_hours', 'edit_all_hours', 'approve_hours'];
                                                  } else if (editingTeamMemberRole === 'Admin') {
                                                    perms = ['submit_hours', 'edit_own_hours', 'edit_all_hours', 'approve_hours', 'manage_roles'];
                                                  }
                                                  return { ...m, hourlyRate: editingTeamMemberRate, role: editingTeamMemberRole, permissions: perms };
                                                }
                                                return m;
                                              });
                                              saveTeamMembers(updated);
                                              setEditingTeamMemberName(null);
                                              triggerToast(`Zaktualizowano dane dla: ${member.name}`, 'success');
                                            }}
                                            className="px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-lg text-[10px] font-black cursor-pointer"
                                          >
                                            Zapisz
                                          </button>
                                          <button
                                            onClick={() => setEditingTeamMemberName(null)}
                                            className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black cursor-pointer"
                                          >
                                            Anuluj
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setEditingTeamMemberName(member.name);
                                            setEditingTeamMemberRate(member.hourlyRate);
                                            setEditingTeamMemberRole(member.role);
                                          }}
                                          className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
                                        >
                                          ✏️ Edytuj
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Configurator Fields or Details */}
                              <div className="mt-2.5 space-y-2">
                                {isEditing ? (
                                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                                    <div>
                                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">Ustaw Rolę</label>
                                      <select
                                        value={editingTeamMemberRole}
                                        onChange={(e) => setEditingTeamMemberRole(e.target.value as any)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                                      >
                                        <option value="Worker">Pracownik</option>
                                        <option value="Manager">Menedżer</option>
                                        <option value="Admin">Administrator</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">Stawka Godzinowa (zł/h)</label>
                                      <input
                                        type="number"
                                        value={editingTeamMemberRate}
                                        onChange={(e) => setEditingTeamMemberRate(Number(e.target.value))}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-1.5">Uprawnienia aktywne:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {[
                                        { key: 'submit_hours', name: 'Zgłaszanie godzin' },
                                        { key: 'edit_own_hours', name: 'Edycja własnych' },
                                        { key: 'edit_all_hours', name: 'Edycja innych' },
                                        { key: 'approve_hours', name: 'Zatwierdzanie czasu' },
                                        { key: 'manage_roles', name: 'Zarządzanie rolami' }
                                      ].map((perm) => {
                                        const hasPerm = member.permissions.includes(perm.key);
                                        const togglePermission = () => {
                                          if (currentUserRole !== 'Admin') return;
                                          const isIncluded = member.permissions.includes(perm.key);
                                          const newPerms = isIncluded 
                                            ? member.permissions.filter(p => p !== perm.key) 
                                            : [...member.permissions, perm.key];
                                          const updated = teamMembers.map(m => m.name === member.name ? { ...m, permissions: newPerms } : m);
                                          saveTeamMembers(updated);
                                          triggerToast(`Zaktualizowano uprawnienie dla ${member.name}`, 'success');
                                        };

                                        return (
                                          <button
                                            key={perm.key}
                                            disabled={currentUserRole !== 'Admin'}
                                            onClick={togglePermission}
                                            className={`text-[8px] font-bold px-2 py-1 rounded-md transition-all flex items-center gap-1 border ${
                                              hasPerm
                                                ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-black'
                                                : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200/50 dark:border-slate-800'
                                            } ${currentUserRole === 'Admin' ? 'cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-800/50' : 'cursor-not-allowed'}`}
                                          >
                                            <span className="text-[10px]">{hasPerm ? '🛡️' : '🔒'}</span>
                                            <span>{perm.name}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PAYROLL & PDF TAB */}
                {teamActiveTab === 'payroll' && (
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                            <span>💰</span>
                            <span>Rozliczenia finansowe i kosztowe zespołu</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                            Automatycznie wyliczone koszty wynagrodzeń w oparciu o zarejestrowane, zatwierdzone godziny pracy.
                          </p>
                        </div>
                      </div>

                      {/* Payroll Summary Statistics */}
                      {(() => {
                        // Aggregate metrics from all entries
                        const approvedEntries = entries.filter(e => e.status === 'approved' || !e.status);
                        const totalHours = approvedEntries.reduce((sum, e) => sum + calculateEntryHours(e), 0);
                        
                        // Map out cost per employee based on their actual entries and custom rates
                        const employeeWages = teamMembers.map(member => {
                          const memberEntries = approvedEntries.filter(e => (e.workerName || 'Jan Kowalski') === member.name);
                          const totalHrs = memberEntries.reduce((sum, e) => sum + calculateEntryHours(e), 0);
                          const totalEarnings = memberEntries.reduce((sum, e) => sum + calculateEntryEarnings(e), 0);
                          return {
                            name: member.name,
                            role: member.role,
                            hours: totalHrs,
                            earnings: totalEarnings,
                            entriesCount: memberEntries.length
                          };
                        });

                        const totalPayrollCost = employeeWages.reduce((sum, ew) => sum + ew.earnings, 0);

                        // PDF Generation for Aggregate Team Payroll
                        const handleExportTeamPayrollPDF = () => {
                          try {
                            const doc = new jsPDF();
                            
                            // Header Banner
                            doc.setFillColor(15, 23, 42); // slate-900
                            doc.rect(0, 0, 210, 42, 'F');
                            
                            // Title & Info
                            doc.setTextColor(255, 255, 255);
                            doc.setFont('Helvetica', 'bold');
                            doc.setFontSize(18);
                            doc.text(sanitizePolishChars('ZAGREGOWANY RAPORT PLACOWY ZESPOLU'), 14, 18);
                            
                            doc.setFont('Helvetica', 'normal');
                            doc.setFontSize(9);
                            doc.setTextColor(203, 213, 225);
                            doc.text(`Wygenerowano: ${new Date().toLocaleString('pl-PL')}`, 14, 27);
                            doc.text(`Liczba czlonkow zespołu: ${teamMembers.length} | Status rozliczenia: Zatwierdzone`, 14, 32);
                            
                            // Table Header
                            doc.setFillColor(79, 70, 229); // indigo-600
                            doc.rect(14, 48, 182, 8, 'F');
                            doc.setTextColor(255, 255, 255);
                            doc.setFont('Helvetica', 'bold');
                            doc.setFontSize(9);
                            doc.text('Nazwisko pracownika', 18, 53.5);
                            doc.text('Liczba wpisow', 75, 53.5);
                            doc.text('Suma godzin', 110, 53.5);
                            doc.text('Suma zarobków (Brutto)', 145, 53.5);
                            
                            // Table rows
                            let currentY = 62;
                            doc.setFont('Helvetica', 'normal');
                            doc.setTextColor(51, 65, 85); // slate-700
                            
                            employeeWages.forEach((ew, index) => {
                              // Alternating row background
                              if (index % 2 === 1) {
                                doc.setFillColor(248, 250, 252); // slate-50
                                doc.rect(14, currentY - 5, 182, 7.5, 'F');
                              }
                              
                              doc.text(sanitizePolishChars(ew.name), 18, currentY);
                              doc.text(`${ew.entriesCount} wpisow`, 75, currentY);
                              doc.text(`${ew.hours.toFixed(1)} h`, 110, currentY);
                              doc.text(`${ew.earnings.toFixed(2)} PLN`, 145, currentY);
                              
                              currentY += 7.5;
                            });

                            // Summary block
                            doc.setDrawColor(226, 232, 240);
                            doc.line(14, currentY, 196, currentY);
                            currentY += 10;

                            doc.setFillColor(243, 244, 246);
                            doc.rect(14, currentY - 5, 182, 22, 'F');
                            doc.setFont('Helvetica', 'bold');
                            doc.text(sanitizePolishChars('GLOBALNE PODSUMOWANIE KOSZTOWE:'), 18, currentY);
                            doc.setFont('Helvetica', 'normal');
                            doc.text(`Calkowity czas pracy zespołu: ${totalHours.toFixed(1)} roboczogodzin(y)`, 18, currentY + 6);
                            doc.setFont('Helvetica', 'bold');
                            doc.text(sanitizePolishChars(`LACZNY KOSZT WYNAGRODZEN (BRUTTO): ${totalPayrollCost.toFixed(2)} PLN`), 18, currentY + 12);

                            // Signatures
                            currentY += 35;
                            doc.line(14, currentY, 80, currentY);
                            doc.line(130, currentY, 196, currentY);
                            doc.setFontSize(8);
                            doc.setFont('Helvetica', 'normal');
                            doc.text(sanitizePolishChars('Sporzadził (Główny Ksiegowy)'), 14, currentY + 4);
                            doc.text(sanitizePolishChars('Zatwierdził (Dyrektor Zarzadzajacy)'), 130, currentY + 4);

                            doc.save(`Raport_Placowy_Zespolu_${new Date().toISOString().split('T')[0]}.pdf`);
                            triggerToast('Raport płacowy PDF został wygenerowany i pobrany!', 'success');
                          } catch (err) {
                            console.error(err);
                            triggerToast('Błąd generowania raportu PDF.', 'warning');
                          }
                        };

                        return (
                          <div className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Praca zespołu</span>
                                <div className="text-2xl font-black text-slate-800 dark:text-white mt-1 font-mono">{totalHours.toFixed(1)}h</div>
                                <span className="text-[9px] text-indigo-500 font-semibold mt-1 block">Zatwierdzonych wpisów: {approvedEntries.length}</span>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Suma kosztów zespołu</span>
                                <div className="text-2xl font-black text-emerald-500 mt-1 font-mono">
                                  {formatCurrencyValue(totalPayrollCost, settings.currency)}
                                </div>
                                <span className="text-[9px] text-slate-400 font-semibold mt-1 block">Średnia stawka: ~{(totalHours > 0 ? (totalPayrollCost / totalHours) : 0).toFixed(1)} zł/h</span>
                              </div>
                            </div>

                            {/* Export PDF Button */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleExportTeamPayrollPDF}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Generuj i pobierz raport płacowy (PDF)</span>
                            </motion.button>

                            {/* Breakdown table */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4.5 space-y-3">
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Zestawienie pracowników</span>
                              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {employeeWages.map(ew => (
                                  <div key={ew.name} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex justify-between items-center text-xs">
                                    <div className="truncate pr-2">
                                      <h5 className="font-extrabold text-slate-800 dark:text-white truncate">{ew.name}</h5>
                                      <span className="text-[9px] text-slate-400 font-mono">{ew.entriesCount} zatwierdzonych wpisów</span>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="block font-black text-slate-700 dark:text-slate-300 font-mono">{ew.hours.toFixed(1)}h</span>
                                      <span className="block text-[10px] font-bold text-emerald-500 font-mono">+{formatCurrencyValue(ew.earnings, settings.currency)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* TEAM REAL-TIME MONITORING WIDGET (Preserved & Enhanced!) */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-[32px] text-white shadow-xl relative overflow-hidden transition-all duration-300">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center mb-3.5 relative z-10">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <span>KONTROLA ZESPOŁU LIVE</span>
                    </span>
                    <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-800">
                      GPS ACTIVE
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-black tracking-wider uppercase font-mono mb-1 text-slate-100 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pozycje pracowników w czasie rzeczywistym</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal mb-4 font-semibold">
                    Lokalizator GPS rejestruje pozycję pracowników w obrębie placów budowy w czasie rzeczywistym.
                  </p>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {(() => {
                      const locationsMap: Record<string, { project: string; location: string; date: string; time: string; active: boolean; task: string }> = {};
                      
                      EMPLOYEES.forEach((emp, index) => {
                        const projects = ['Budowa Domu', 'Remont Piwnicy', 'Ogrodzenie', 'Garaż'];
                        const sectors = ['Sektor A-1 (Fundamenty)', 'Sektor B-3 (Ściany)', 'Ogrodzenie północne', 'Wjazd główny'];
                        locationsMap[emp] = {
                          project: projects[index % projects.length],
                          location: sectors[index % sectors.length],
                          date: new Date().toISOString().split('T')[0],
                          time: '07:00',
                          active: false,
                          task: 'Roboty ziemne i wyrównanie'
                        };
                      });

                      if (timerRunning) {
                        locationsMap[currentWorker] = {
                          project: timerProject || 'Budowa Domu',
                          location: timerLocation || 'Sektor Główny (Nadzór)',
                          date: new Date().toISOString().split('T')[0],
                          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
                          active: true,
                          task: timerDescription || 'Roboty ogólnobudowlane'
                        };
                      }

                      // Retrieve latest entry from actual history entries for each employee
                      entries.forEach(entry => {
                        const emp = entry.workerName || 'Jan Kowalski';
                        if (locationsMap[emp] && (!locationsMap[emp].active || emp !== currentWorker)) {
                          locationsMap[emp] = {
                            project: entry.project,
                            location: entry.location || 'Baza główna',
                            date: entry.date,
                            time: entry.startTime,
                            active: false,
                            task: entry.description
                          };
                        }
                      });

                      return Object.entries(locationsMap).map(([name, data]) => (
                        <div 
                          key={name}
                          className={`p-3 rounded-2xl border transition-all ${
                            data.active 
                              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-xs' 
                              : 'bg-slate-800/50 border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${data.active ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-500'}`} />
                              <span className="text-xs font-black text-slate-100">{name}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                              data.active 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {data.active ? 'PRACUJE' : 'PAUZA'}
                            </span>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-300 font-semibold">
                            <div className="flex items-center gap-1 text-slate-400 truncate">
                              <span className="shrink-0">🏢</span>
                              <span className="truncate">{data.project}</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400 truncate font-bold">
                              <span className="shrink-0 text-[10px]">📍</span>
                              <span className="truncate">{data.location}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-1 text-slate-400 truncate border-t border-slate-800/50 pt-1 mt-1">
                              <span className="shrink-0">🔨</span>
                              <span className="truncate text-[9px] font-semibold text-slate-300 italic">“{data.task}”</span>
                            </div>
                          </div>
                          
                          <div className="mt-1.5 text-[8px] font-mono text-slate-500 flex justify-between">
                            <span>Ostatni zapis: {data.date}</span>
                            <span>Godzina: {data.time}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

              </div>
            )}

            {/* ==================== SUB-TAB 2: CLIENTS ==================== */}
            {projectSubTab === 'clients' && (
              <div className="space-y-5">
                {/* Create / Edit Client Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 font-mono">
                      {editingClientId ? '✏️' : '＋'}
                    </span>
                    <span>{editingClientId ? 'Edytuj Dane Klienta' : 'Nowy Klient'}</span>
                  </h3>

                  <form onSubmit={editingClientId ? handleSaveEditClient : handleAddClient} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Imię i Nazwisko *</label>
                        <input
                          type="text"
                          required
                          placeholder="np. Jan Kowalski"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Nazwa Firmy</label>
                        <input
                          type="text"
                          placeholder="np. Kowalski Dev"
                          value={newClientCompany}
                          onChange={(e) => setNewClientCompany(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">E-mail</label>
                        <input
                          type="email"
                          placeholder="np. jan@kowalski.pl"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Numer Telefonu</label>
                        <input
                          type="text"
                          placeholder="np. +48 500 600 700"
                          value={newClientPhone}
                          onChange={(e) => setNewClientPhone(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-semibold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Adres</label>
                        <input
                          type="text"
                          placeholder="np. Warszawa, ul. Złota 44"
                          value={newClientAddress}
                          onChange={(e) => setNewClientAddress(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 btn-cyber-primary cyber-glow-border py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                      >
                        {editingClientId ? <Check className="w-4 h-4 text-slate-950" /> : <Plus className="w-4 h-4 text-slate-950" />}
                        <span>{editingClientId ? 'Zapisz dane' : 'Dodaj Klienta'}</span>
                      </motion.button>
                      {editingClientId && (
                        <motion.button
                          type="button"
                          onClick={handleCancelEditClient}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-4 btn-cyber-secondary rounded-xl text-xs"
                        >
                          Anuluj
                        </motion.button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Clients List */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                      Nasi Klienci ({clients.length})
                    </span>
                  </div>

                  {clients.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center">
                      <p className="text-xs text-slate-400 font-bold italic">Brak zdefiniowanych klientów. Dodaj swojego pierwszego kontrahenta powyżej!</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {clients.map(client => {
                        const clientProjects = projects.filter(p => p.clientId === client.id);
                        return (
                          <div key={client.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 space-y-2.5 relative shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all group">
                            <div className="flex justify-between items-start gap-2">
                              <div className="space-y-0.5">
                                <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                  <span>{client.name}</span>
                                  {client.companyName && (
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                                      🏢 {client.companyName}
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                  📁 Liczba projektów: <span className="text-amber-500 font-black">{clientProjects.length}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                                <motion.button
                                  onClick={() => handleStartEditClient(client)}
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.85 }}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-amber-500 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
                                  title="Edytuj dane klienta"
                                >
                                  ✏️
                                </motion.button>
                                <motion.button
                                  onClick={() => handleDeleteClient(client.id)}
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.85 }}
                                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-500 dark:text-slate-400 hover:text-rose-500 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                                  title="Usuń klienta"
                                >
                                  🗑️
                                </motion.button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium font-mono border-t border-slate-50 dark:border-slate-950 pt-2 bg-slate-50/40 dark:bg-slate-950/20 p-2 rounded-xl">
                              <div className="truncate">📞 {client.phone || 'Brak telefonu'}</div>
                              <div className="truncate">✉️ {client.email || 'Brak email'}</div>
                              <div className="col-span-2 truncate">📍 {client.address || 'Brak adresu'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== SUB-TAB 3: REPORTS (AGGREGATED) ==================== */}
            {projectSubTab === 'reports' && (
              <div className="space-y-6">
                
                {/* Report Filter Bento */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 font-mono">📊</span>
                    <span>Rozbudowane Filtrowanie i Analiza Raportów</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Projekt</label>
                      <select
                        value={reportProject}
                        onChange={(e) => setReportProject(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                      >
                        <option value="All">Wszystkie projekty</option>
                        {allProjectsList.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Klient</label>
                      <select
                        value={reportClient}
                        onChange={(e) => setReportClient(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                      >
                        <option value="All">Wszyscy klienci</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Pracownik</label>
                      <select
                        value={reportWorker}
                        onChange={(e) => setReportWorker(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-bold"
                      >
                        <option value="All">Wszyscy pracownicy</option>
                        {teamMembers.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Data od (Włącznie)</label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 font-mono">Data do (Włącznie)</label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          setReportProject('All');
                          setReportClient('All');
                          setReportWorker('All');
                          setReportStartDate('');
                          setReportEndDate('');
                          triggerToast('Wyczyszczono filtry raportu', 'info');
                        }}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        🔄 Resetuj filtry
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calculated Report Results & Aggregated Breakdowns */}
                {(() => {
                  // Filter logic
                  const filtered = entries.filter(e => {
                    // Project check
                    if (reportProject !== 'All') {
                      if (e.project.trim().toLowerCase() !== reportProject.trim().toLowerCase()) return false;
                    }

                    // Client check
                    if (reportClient !== 'All') {
                      if (e.clientId !== reportClient) {
                        const matchedP = projects.find(p => p.name.trim().toLowerCase() === e.project.trim().toLowerCase());
                        if (!matchedP || matchedP.clientId !== reportClient) return false;
                      }
                    }

                    // Worker check
                    if (reportWorker !== 'All') {
                      const worker = e.workerName || 'Jan Kowalski';
                      if (worker.trim().toLowerCase() !== reportWorker.trim().toLowerCase()) return false;
                    }

                    // Date range check
                    if (reportStartDate && e.date < reportStartDate) return false;
                    if (reportEndDate && e.date > reportEndDate) return false;

                    return true;
                  });

                  // Aggregate stats
                  const totalHours = filtered.reduce((sum, e) => sum + calculateEntryHours(e), 0);
                  const totalEarnings = filtered.reduce((sum, e) => sum + calculateEntryEarnings(e), 0);
                  const taxRate = settings.taxRatePercent || 0;
                  const totalEarningsNetto = totalEarnings * (1 - taxRate / 100);

                  // 1. PROJECT BREAKDOWN
                  const projectSummaryMap: Record<string, { hours: number; cost: number }> = {};
                  filtered.forEach(e => {
                    const p = e.project || 'Inny';
                    const hrs = calculateEntryHours(e);
                    const cost = calculateEntryEarnings(e);
                    if (!projectSummaryMap[p]) projectSummaryMap[p] = { hours: 0, cost: 0 };
                    projectSummaryMap[p].hours += hrs;
                    projectSummaryMap[p].cost += cost;
                  });
                  const projectBreakdown = Object.entries(projectSummaryMap).map(([name, data]) => ({ name, ...data }));

                  // 2. CLIENT BREAKDOWN
                  const clientSummaryMap: Record<string, { hours: number; cost: number }> = {};
                  filtered.forEach(e => {
                    let clientName = 'Brak klienta / Wewnętrzny';
                    if (e.clientId) {
                      const matchedC = clients.find(c => c.id === e.clientId);
                      if (matchedC) clientName = matchedC.name;
                    } else {
                      const matchedP = projects.find(p => p.name.trim().toLowerCase() === e.project.trim().toLowerCase());
                      if (matchedP && matchedP.clientId) {
                        const matchedC = clients.find(c => c.id === matchedP.clientId);
                        if (matchedC) clientName = matchedC.name;
                      }
                    }
                    const hrs = calculateEntryHours(e);
                    const cost = calculateEntryEarnings(e);
                    if (!clientSummaryMap[clientName]) clientSummaryMap[clientName] = { hours: 0, cost: 0 };
                    clientSummaryMap[clientName].hours += hrs;
                    clientSummaryMap[clientName].cost += cost;
                  });
                  const clientBreakdown = Object.entries(clientSummaryMap).map(([name, data]) => ({ name, ...data }));

                  // 3. EMPLOYEE BREAKDOWN
                  const employeeSummaryMap: Record<string, { hours: number; cost: number }> = {};
                  filtered.forEach(e => {
                    const emp = e.workerName || 'Jan Kowalski';
                    const hrs = calculateEntryHours(e);
                    const cost = calculateEntryEarnings(e);
                    if (!employeeSummaryMap[emp]) employeeSummaryMap[emp] = { hours: 0, cost: 0 };
                    employeeSummaryMap[emp].hours += hrs;
                    employeeSummaryMap[emp].cost += cost;
                  });
                  const employeeBreakdown = Object.entries(employeeSummaryMap).map(([name, data]) => ({ name, ...data }));

                  // 4. DAILY BREAKDOWN
                  const dailySummaryMap: Record<string, { hours: number; cost: number }> = {};
                  filtered.forEach(e => {
                    const d = e.date;
                    const hrs = calculateEntryHours(e);
                    const cost = calculateEntryEarnings(e);
                    if (!dailySummaryMap[d]) dailySummaryMap[d] = { hours: 0, cost: 0 };
                    dailySummaryMap[d].hours += hrs;
                    dailySummaryMap[d].cost += cost;
                  });
                  const dailyBreakdown = Object.entries(dailySummaryMap)
                    .map(([name, data]) => ({ name, ...data }))
                    .sort((a, b) => a.name.localeCompare(b.name));

                  // Export to CSV Function
                  const handleExportCSV = () => {
                    if (filtered.length === 0) {
                      triggerToast('Brak danych do wyeksportowania!', 'warning');
                      return;
                    }
                    try {
                      const headers = ['Id', 'Data', 'Pracownik', 'Projekt', 'Klient ID', 'Rozpoczecie', 'Zakonczenie', 'Przerwa (min)', 'Stawka', 'Opis', 'Nadgodziny', 'Suma Godzin', 'Zarobek Brutto'];
                      const rows = filtered.map(e => [
                        e.id,
                        e.date,
                        e.workerName || 'Jan Kowalski',
                        `"${e.project.replace(/"/g, '""')}"`,
                        e.clientId || '',
                        e.startTime,
                        e.endTime,
                        e.breakMinutes.toString(),
                        e.hourlyRate.toString(),
                        `"${e.description.replace(/"/g, '""')}"`,
                        e.isOvertime ? 'Tak' : 'Nie',
                        calculateEntryHours(e).toFixed(2),
                        calculateEntryEarnings(e).toFixed(2)
                      ]);

                      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Raport_Zlecen_Budowlanych_${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      triggerToast('Raport CSV został pobrany!', 'success');
                    } catch (err) {
                      console.error(err);
                      triggerToast('Nie udało się wyeksportować raportu.', 'warning');
                    }
                  };

                  // Colors for Pie Chart Cells
                  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#6366F1', '#8B5CF6', '#EF4444', '#14B8A6'];

                  return (
                    <div className="space-y-6">
                      
                      {/* Report Aggregate Bento Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[22px] shadow-xs relative overflow-hidden">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Zagregowany Czas</span>
                          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1.5 font-mono">{totalHours.toFixed(1)}h</div>
                          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Łączna liczba wpisów: {filtered.length}</p>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[22px] shadow-xs relative overflow-hidden">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Zagregowany Zarobek</span>
                          <div className="text-3xl font-black text-emerald-500 mt-1.5 font-mono">
                            {formatCurrencyValue(totalEarnings, settings.currency)}
                          </div>
                          <p className="text-[9px] text-indigo-400 font-bold mt-1 uppercase tracking-wider">
                            Netto (~{taxRate}% podatku): {formatCurrencyValue(totalEarningsNetto, settings.currency)}
                          </p>
                        </div>
                      </div>

                      {/* WORK DISTRIBUTION VISUAL CHARTS */}
                      {filtered.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5">
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                            <span>📈</span>
                            <span>Graficzna Wizualizacja Rozkładu Pracy</span>
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Bar Chart for Projects */}
                            <div className="space-y-2">
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono text-center">Czas pracy wg projektów (roboczogodziny)</span>
                              <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={projectBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94A3B8" />
                                    <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94A3B8" />
                                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, fontWeight: 'bold' }} />
                                    <Bar dataKey="hours" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Pie Chart for Employee Hours */}
                            <div className="space-y-2">
                              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono text-center">Rozkład zaangażowania pracowników (godziny)</span>
                              <div className="h-56 flex flex-col justify-between items-center">
                                <div className="w-full h-44">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={employeeBreakdown}
                                        dataKey="hours"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={55}
                                        paddingAngle={3}
                                      >
                                        {employeeBreakdown.map((entry, idx) => (
                                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, fontWeight: 'bold' }} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[8px] font-bold text-slate-500 max-w-xs">
                                  {employeeBreakdown.map((entry, idx) => (
                                    <div key={entry.name} className="flex items-center gap-1">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                      <span>{entry.name} ({entry.hours.toFixed(1)}h)</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                      {/* INTEGRATED TIME AND COST CRITERIA BREAKDOWNS (Requested by user!) */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-1.5 font-mono border-b border-slate-100 dark:border-slate-800 pb-3">
                          <span>📋</span>
                          <span>Podsumowania czasowe i kosztowe kryteriów</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Project Breakdown List */}
                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2.5">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">📁 WG PROJEKTÓW</span>
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {projectBreakdown.map(pb => (
                                <div key={pb.name} className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl flex justify-between items-center text-[11px]">
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate pr-2">{pb.name}</span>
                                  <div className="text-right shrink-0 font-mono">
                                    <span className="block font-black text-slate-800 dark:text-white">{pb.hours.toFixed(1)}h</span>
                                    <span className="text-[10px] font-bold text-emerald-500">{formatCurrencyValue(pb.cost, settings.currency)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Client Breakdown List */}
                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2.5">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">💼 WG KLIENTÓW</span>
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {clientBreakdown.map(cb => (
                                <div key={cb.name} className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl flex justify-between items-center text-[11px]">
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate pr-2">{cb.name}</span>
                                  <div className="text-right shrink-0 font-mono">
                                    <span className="block font-black text-slate-800 dark:text-white">{cb.hours.toFixed(1)}h</span>
                                    <span className="text-[10px] font-bold text-emerald-500">{formatCurrencyValue(cb.cost, settings.currency)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Employee Breakdown List */}
                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2.5">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">👷 WG PRACOWNIKÓW</span>
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {employeeBreakdown.map(eb => (
                                <div key={eb.name} className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl flex justify-between items-center text-[11px]">
                                  <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate pr-2">{eb.name}</span>
                                  <div className="text-right shrink-0 font-mono">
                                    <span className="block font-black text-slate-800 dark:text-white">{eb.hours.toFixed(1)}h</span>
                                    <span className="text-[10px] font-bold text-emerald-500">{formatCurrencyValue(eb.cost, settings.currency)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Daily Breakdown List */}
                          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-2.5">
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">📅 WG DNI</span>
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {dailyBreakdown.map(db => (
                                <div key={db.name} className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl flex justify-between items-center text-[11px]">
                                  <span className="font-mono font-black text-indigo-500 truncate pr-2">{db.name}</span>
                                  <div className="text-right shrink-0 font-mono">
                                    <span className="block font-black text-slate-800 dark:text-white">{db.hours.toFixed(1)}h</span>
                                    <span className="text-[10px] font-bold text-emerald-500">{formatCurrencyValue(db.cost, settings.currency)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Export & Action Buttons */}
                      <div className="flex gap-2">
                        <motion.button
                          onClick={handleExportCSV}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 btn-cyber-primary from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 border-emerald-500/20 py-3.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(16,185,129,0.25)] focus-visible:ring-emerald-500"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                          <span>Eksportuj Raport do Excel / CSV</span>
                        </motion.button>
                      </div>

                      {/* Filtered Entry Table List */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3">
                        <span className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                          Zestawienie Wpisów Raportowanych ({filtered.length})
                        </span>

                        {filtered.length === 0 ? (
                          <p className="text-xs text-slate-400 font-bold italic text-center py-4">Brak wpisów spełniających wybrane kryteria.</p>
                        ) : (
                          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                            {filtered.map(entry => (
                              <div key={entry.id} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40 text-xs flex justify-between items-center gap-2">
                                <div className="space-y-1 truncate">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-black text-slate-400 font-mono">{entry.date}</span>
                                    <span className="font-extrabold text-slate-700 dark:text-slate-300 truncate font-sans bg-indigo-50/50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded text-[10px] border border-indigo-100/30">
                                      {entry.project}
                                    </span>
                                    <span className="text-[9px] text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-1 py-0.5 rounded">
                                      {entry.workerName || 'Jan Kowalski'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold truncate italic">
                                    &ldquo;{entry.description || 'Bez opisu'}&rdquo;
                                  </p>
                                </div>
                                <div className="text-right shrink-0 font-mono">
                                  <span className="block text-xs font-black text-slate-800 dark:text-white">{calculateEntryHours(entry).toFixed(1)}h</span>
                                  <span className="text-[10px] font-bold text-emerald-500">+{formatCurrencyValue(calculateEntryEarnings(entry), settings.currency)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      </main>

      {/* ==================== BOTTOM TAB BAR NAVIGATION ==================== */}
      <nav id="bottom-navigation-bar" className={`fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto flex items-center justify-around py-3 px-3 pb-safe rounded-t-[28px] overflow-hidden transition-all duration-300 backdrop-blur-md ${
        activeTab === 'today'
          ? 'bg-[#0a0f1d]/95 border-t border-slate-800/80 shadow-[0_-10px_30px_rgba(0,0,0,0.4)]'
          : 'bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/60 dark:border-slate-800/80 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)]'
      }`}>
        
        {/* Tab 1: Today */}
        <motion.button 
          onClick={() => setActiveTab('today')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center justify-center flex-1 py-1.5 relative z-10 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded-2xl"
        >
          {activeTab === 'today' && (
            <motion.div
              layoutId="activeTabPill"
              className="absolute inset-0 bg-amber-500/10 rounded-2xl mx-1.5 -my-0.5"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <Clock className={`w-5 h-5 mb-0.5 transition-colors duration-200 ${activeTab === 'today' ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`} />
          <span className={`text-[10.5px] tracking-wide transition-colors duration-200 ${activeTab === 'today' ? 'text-amber-500 font-extrabold' : 'text-slate-500 dark:text-slate-400 font-semibold'}`}>Dziś</span>
        </motion.button>

        {/* Tab 1.5: Construction */}
        <motion.button 
          onClick={() => setActiveTab('construction')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center justify-center flex-1 py-1.5 relative z-10 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded-2xl"
        >
          {activeTab === 'construction' && (
            <motion.div
              layoutId="activeTabPill"
              className="absolute inset-0 bg-amber-500/10 rounded-2xl mx-1.5 -my-0.5"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <Hammer className={`w-5 h-5 mb-0.5 transition-colors duration-200 ${
            activeTab === 'construction' 
              ? 'text-amber-500' 
              : activeTab === 'today'
              ? 'text-slate-500 hover:text-slate-300'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`} />
          <span className={`text-[10.5px] tracking-wide transition-colors duration-200 ${
            activeTab === 'construction' 
              ? 'text-amber-500 font-extrabold' 
              : activeTab === 'today'
              ? 'text-slate-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 font-semibold'
          }`}>Budowa</span>
        </motion.button>

        {/* Tab 2: History */}
        <motion.button 
          onClick={() => setActiveTab('history')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center justify-center flex-1 py-1.5 relative z-10 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded-2xl"
        >
          {activeTab === 'history' && (
            <motion.div
              layoutId="activeTabPill"
              className="absolute inset-0 bg-amber-500/10 rounded-2xl mx-1.5 -my-0.5"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <Calendar className={`w-5 h-5 mb-0.5 transition-colors duration-200 ${
            activeTab === 'history' 
              ? 'text-amber-500' 
              : activeTab === 'today'
              ? 'text-slate-500 hover:text-slate-300'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`} />
          <span className={`text-[10.5px] tracking-wide transition-colors duration-200 ${
            activeTab === 'history' 
              ? 'text-amber-500 font-extrabold' 
              : activeTab === 'today'
              ? 'text-slate-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 font-semibold'
          }`}>Historia</span>
        </motion.button>

        {/* Tab 3: Stats */}
        <motion.button 
          onClick={() => setActiveTab('stats')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center justify-center flex-1 py-1.5 relative z-10 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded-2xl"
        >
          {activeTab === 'stats' && (
            <motion.div
              layoutId="activeTabPill"
              className="absolute inset-0 bg-amber-500/10 rounded-2xl mx-1.5 -my-0.5"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <TrendingUp className={`w-5 h-5 mb-0.5 transition-colors duration-200 ${
            activeTab === 'stats' 
              ? 'text-amber-500' 
              : activeTab === 'today'
              ? 'text-slate-500 hover:text-slate-300'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`} />
          <span className={`text-[10.5px] tracking-wide transition-colors duration-200 ${
            activeTab === 'stats' 
              ? 'text-amber-500 font-extrabold' 
              : activeTab === 'today'
              ? 'text-slate-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 font-semibold'
          }`}>Statystyki</span>
        </motion.button>

        {/* Tab 3.5: Projects Dashboard */}
        <motion.button 
          onClick={() => setActiveTab('projects')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center justify-center flex-1 py-1.5 relative z-10 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded-2xl"
        >
          {activeTab === 'projects' && (
            <motion.div
              layoutId="activeTabPill"
              className="absolute inset-0 bg-amber-500/10 rounded-2xl mx-1.5 -my-0.5"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <Briefcase className={`w-5 h-5 mb-0.5 transition-colors duration-200 ${
            activeTab === 'projects' 
              ? 'text-amber-500' 
              : activeTab === 'today'
              ? 'text-slate-500 hover:text-slate-300'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`} />
          <span className={`text-[10.5px] tracking-wide transition-colors duration-200 ${
            activeTab === 'projects' 
              ? 'text-amber-500 font-extrabold' 
              : activeTab === 'today'
              ? 'text-slate-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 font-semibold'
          }`}>Projekty</span>
        </motion.button>

        {/* Tab 4: Settings */}
        <motion.button 
          onClick={() => setActiveTab('settings')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center justify-center flex-1 py-1.5 relative z-10 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded-2xl"
        >
          {activeTab === 'settings' && (
            <motion.div
              layoutId="activeTabPill"
              className="absolute inset-0 bg-amber-500/10 rounded-2xl mx-1.5 -my-0.5"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <SettingsIcon className={`w-5 h-5 mb-0.5 transition-colors duration-200 ${
            activeTab === 'settings' 
              ? 'text-amber-500' 
              : activeTab === 'today'
              ? 'text-slate-500 hover:text-slate-300'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`} />
          <span className={`text-[10.5px] tracking-wide transition-colors duration-200 ${
            activeTab === 'settings' 
              ? 'text-amber-500 font-extrabold' 
              : activeTab === 'today'
              ? 'text-slate-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 font-semibold'
          }`}>Ustawienia</span>
        </motion.button>
      </nav>

      {/* MODAL: EDYCJA WPISU CZASU PRACY */}
      <AnimatePresence>
        {editingEntryId !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest font-mono flex items-center gap-2">
                  <span>✏️</span>
                  <span>Edycja wpisu czasu pracy</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingEntryId(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/80 mb-1 uppercase tracking-widest font-mono">Projekt / Budowa *</label>
                    <input
                      type="text"
                      required
                      value={editProject}
                      onChange={(e) => setEditProject(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/80 mb-1 uppercase tracking-widest font-mono">Data Robót *</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/80 mb-1 uppercase tracking-widest font-mono">Rozpoczęcie *</label>
                    <input
                      type="time"
                      required
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/80 mb-1 uppercase tracking-widest font-mono">Zakończenie *</label>
                    <input
                      type="time"
                      required
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Przerwa</label>
                    <span className="text-xs font-mono text-amber-500 font-bold">{editBreak} min</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="5"
                    value={editBreak}
                    onChange={(e) => setEditBreak(parseInt(e.target.value) || 0)}
                    className="w-full accent-amber-500 h-1.5 bg-slate-100 dark:bg-slate-950 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/80 mb-1 uppercase tracking-widest font-mono">Stawka ({settings.currency}/h)</label>
                    <input
                      type="number"
                      min="1"
                      value={editRate}
                      onChange={(e) => setEditRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-bold font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-500/80 mb-1 uppercase tracking-widest font-mono">Kategoria Robót *</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>🏷️ {cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-2 rounded-xl">
                  <input
                    type="checkbox"
                    checked={editOvertime}
                    onChange={(e) => setEditOvertime(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 font-mono uppercase tracking-widest">Nadgodziny</span>
                </div>

                {editOvertime && (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-3 space-y-1.5">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Mnożnik nadgodzin</label>
                    <div className="flex gap-2">
                      {[1.5, 2.0, 2.5].map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setEditOvertimeMultiplier(m)}
                          className={`flex-1 py-1 text-xs rounded-lg font-bold border transition-all cursor-pointer font-mono ${
                            editOvertimeMultiplier === m
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          x{m.toFixed(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest font-mono">Opis robót</label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-widest text-[11px] rounded-xl font-mono cursor-pointer transition-all text-center"
                  >
                    Zapisz Zmiany
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingEntryId(null)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] rounded-xl cursor-pointer transition-all"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
