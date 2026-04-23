export type LanguageKey = 'python' | 'java' | 'cpp';

export type RouteKey =
  | 'login'
  | 'signup'
  | 'language'
  | 'levels'
  | 'deck'
  | 'flash'
  | 'result'
  | 'profile';

export interface FlashCard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
}

export interface LanguageMeta {
  key: LanguageKey;
  label: string;
  symbol: string;
  description: string;
  profileSummary: string;
  levelTopics: string[];
}
