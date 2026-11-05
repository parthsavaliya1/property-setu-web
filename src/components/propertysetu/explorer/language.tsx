import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronRight, Languages, X } from "lucide-react";

const options = [
  { code: "en", name: "English", label: "Language", choose: "Choose language" },
  { code: "hi", name: "हिन्दी", label: "भाषा", choose: "भाषा चुनें" },
  { code: "gu", name: "ગુજરાતી", label: "ભાષા", choose: "ભાષા પસંદ કરો" },
] as const;
type Language = (typeof options)[number]["code"];
const storageKey = "propertyhub.language";
const labels: Record<string, [string, string]> = {
  Home: ["होम", "હોમ"],
  Search: ["खोजें", "શોધો"],
  Saved: ["सहेजे गए", "સાચવેલા"],
  Profile: ["प्रोफ़ाइल", "પ્રોફાઇલ"],
  Sell: ["बेचें", "વેચો"],
  "My profile": ["मेरी प्रोफ़ाइल", "મારી પ્રોફાઇલ"],
  "Search properties": ["प्रॉपर्टी खोजें", "પ્રોપર્ટી શોધો"],
  "Finding city": ["शहर खोज रहे हैं", "શહેર શોધી રહ્યાં છીએ"],
  "All properties": ["सभी प्रॉपर्टी", "બધી પ્રોપર્ટી"],
  "Find the right property for you": [
    "अपने लिए सही प्रॉपर्टी खोजें",
    "તમારા માટે યોગ્ય પ્રોપર્ટી શોધો",
  ],
  Messages: ["संदेश", "સંદેશા"],
  Inquiries: ["पूछताछ", "પૂછપરછ"],
  Notifications: ["सूचनाएँ", "સૂચનાઓ"],
  "My properties": ["मेरी प्रॉपर्टी", "મારી પ્રોપર્ટી"],
  "My wallet": ["मेरा वॉलेट", "મારું વૉલેટ"],
  "Payment history": ["भुगतान इतिहास", "ચુકવણી ઇતિહાસ"],
  "Saved properties": ["सहेजी गई प्रॉपर्टी", "સાચવેલી પ્રોપર્ટી"],
  "Saved searches": ["सहेजी गई खोज", "સાચવેલી શોધ"],
  Visits: ["मुलाकातें", "મુલાકાતો"],
  "Blocked users": ["ब्लॉक किए गए उपयोगकर्ता", "બ્લોક કરેલા વપરાશકર્તાઓ"],
  About: ["हमारे बारे में", "અમારા વિશે"],
  "Available balance": ["उपलब्ध बैलेंस", "ઉપલબ્ધ બેલેન્સ"],
  "Add money": ["पैसे जोड़ें", "પૈસા ઉમેરો"],
  History: ["इतिहास", "ઇતિહાસ"],
  Guest: ["अतिथि", "મહેમાન"],
  "Sign in": ["साइन इन", "સાઇન ઇન"],
  "Find your dream home": ["अपने सपनों का घर खोजें", "તમારા સપનાનું ઘર શોધો"],
  "Homes, plots, and land": ["घर, प्लॉट और ज़मीन", "ઘર, પ્લોટ અને જમીન"],
  "Explore now": ["अभी देखें", "હમણાં જુઓ"],
};
type LanguageContextValue = {
  language: Language;
  setLanguage: (code: Language) => void;
  text: (label: string) => string;
};
const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  text: (label) => label,
});
export function ExplorerLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "en" || saved === "hi" || saved === "gu") setLanguageState(saved);
    } catch {
      /* Language remains available for this visit. */
    }
  }, []);
  function setLanguage(code: Language) {
    setLanguageState(code);
    try {
      localStorage.setItem(storageKey, code);
    } catch {
      /* Keep the current selection in memory. */
    }
  }
  const text = (label: string) =>
    language === "en" ? label : labels[label]?.[language === "hi" ? 0 : 1] || label;
  return (
    <LanguageContext.Provider value={{ language, setLanguage, text }}>
      {children}
    </LanguageContext.Provider>
  );
}
export const useExplorerLanguage = () => useContext(LanguageContext);
export function LanguageSelection() {
  const { language, setLanguage } = useExplorerLanguage();
  const selected = options.find((item) => item.code === language)!;
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="xp-profile-language">
        <Languages size={22} aria-hidden="true" />
        <strong>{selected.label}</strong>
        <span>{selected.name}</span>
        <ChevronRight size={18} aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="xp-modal-overlay" />
        <Dialog.Content className="xp-modal xp-language-dialog" aria-describedby={undefined}>
          <div className="xp-row">
            <Dialog.Title>{selected.choose}</Dialog.Title>
            <Dialog.Close aria-label="Close language selection">
              <X size={20} />
            </Dialog.Close>
          </div>
          <div role="group" aria-label={selected.choose}>
            {options.map((item) => (
              <button
                key={item.code}
                type="button"
                lang={item.code}
                aria-pressed={language === item.code}
                onClick={() => {
                  setLanguage(item.code);
                  setOpen(false);
                }}
              >
                <span>{item.name}</span>
                {language === item.code && <Check size={20} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
