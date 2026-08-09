import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'ar'

const EN = {
  brand: 'QSeat',
  home: 'Home',
  places: 'Places',
  checkin: 'Check in',
  alerts: 'Alerts',
  me: 'Me',
  searchPlaceholder: 'Where to tonight',
  byArea: 'By area',
  allAreas: 'All areas',
  openNear: 'Open near you',
  alsoTonight: 'Also tonight',
  tonightIn: 'Tonight in',
  reserve: 'Reserve a table',
  chooseRoom: 'Choose a room',
  hours: 'Hours',
  where: 'Where',
  guests: 'Guests',
  date: 'Date',
  time: 'Time',
  room: 'Room',
  preference: 'Preference',
  occasion: 'Occasion',
  anythingElse: 'Anything else',
  chooseTime: 'Choose a time',
  holding: 'Holding your table',
  heldNote: 'Held for two minutes while you finish. The house replies after that.',
  signIn: 'Sign in',
  signOut: 'Sign out',
  save: 'Save',
  saved: 'Saved',
  cancel: 'Cancel this booking',
  accept: 'Accept',
  decline: 'Decline',
  showCode: 'Show my code',
  upcoming: 'Upcoming',
  earlier: 'Earlier',
  filters: 'Filters',
  clear: 'Clear',
  apply: 'Show results',
  map: 'Map',
  list: 'List',
  favourites: 'Saved',
  lists: 'Your lists',
  reviews: 'Reviews',
  writeReview: 'Leave a note',
  joinWaitlist: 'Join the waitlist',
  waitlisted: 'On the waitlist',
  appearance: 'Appearance',
  language: 'Language',
  legal: 'Legal',
  runningLate: 'I’m running late',
  yourDetails: 'Your details',
  fullName: 'Full name',
  mobile: 'Mobile (+974)',
  noTables: 'No tables available',
} as const

type Key = keyof typeof EN

const AR: Record<Key, string> = {
  brand: 'كيو سيت',
  home: 'الرئيسية',
  places: 'الأماكن',
  checkin: 'تسجيل الوصول',
  alerts: 'التنبيهات',
  me: 'حسابي',
  searchPlaceholder: 'إلى أين الليلة',
  byArea: 'حسب المنطقة',
  allAreas: 'كل المناطق',
  openNear: 'مفتوح قريباً منك',
  alsoTonight: 'أيضاً الليلة',
  tonightIn: 'الليلة في',
  reserve: 'احجز طاولة',
  chooseRoom: 'اختر القاعة',
  hours: 'ساعات العمل',
  where: 'الموقع',
  guests: 'عدد الضيوف',
  date: 'التاريخ',
  time: 'الوقت',
  room: 'القاعة',
  preference: 'التفضيلات',
  occasion: 'المناسبة',
  anythingElse: 'ملاحظات أخرى',
  chooseTime: 'اختر الوقت',
  holding: 'نحتفظ بطاولتك',
  heldNote: 'محفوظة لمدة دقيقتين. سيرد المكان بعد ذلك.',
  signIn: 'تسجيل الدخول',
  signOut: 'تسجيل الخروج',
  save: 'حفظ',
  saved: 'تم الحفظ',
  cancel: 'إلغاء الحجز',
  accept: 'قبول',
  decline: 'رفض',
  showCode: 'أظهر رمزي',
  upcoming: 'القادمة',
  earlier: 'السابقة',
  filters: 'تصفية',
  clear: 'مسح',
  apply: 'إظهار النتائج',
  map: 'الخريطة',
  list: 'القائمة',
  favourites: 'المحفوظة',
  lists: 'قوائمك',
  reviews: 'التقييمات',
  writeReview: 'اكتب ملاحظة',
  joinWaitlist: 'انضم لقائمة الانتظار',
  waitlisted: 'في قائمة الانتظار',
  appearance: 'المظهر',
  language: 'اللغة',
  legal: 'قانوني',
  runningLate: 'سأتأخر قليلاً',
  yourDetails: 'بياناتك',
  fullName: 'الاسم الكامل',
  mobile: 'الجوال (+974)',
  noTables: 'لا توجد طاولات متاحة',
}

interface I18nValue {
  lang: Lang
  dir: 'ltr' | 'rtl'
  t: (k: Key) => string
  setLang: (l: Lang) => void
}

const Ctx = createContext<I18nValue>({
  lang: 'en',
  dir: 'ltr',
  t: (k) => EN[k],
  setLang: () => {},
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem('qseat-lang') as Lang) || 'en'
    } catch {
      return 'en'
    }
  })

  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  function setLang(l: Lang) {
    setLangState(l)
    try {
      localStorage.setItem('qseat-lang', l)
    } catch {
      /* private mode */
    }
  }

  const t = (k: Key) => (lang === 'ar' ? AR[k] : EN[k])

  return <Ctx.Provider value={{ lang, dir, t, setLang }}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)

/** Pick the Arabic field when the interface is Arabic and the value exists. */
export function localised(lang: Lang, en: string | null, ar: string | null): string {
  if (lang === 'ar' && ar && ar.trim()) return ar
  return en ?? ''
}
