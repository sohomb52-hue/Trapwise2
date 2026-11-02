export type UserRole = 
  | 'Tenant'
  | 'Student'
  | 'Job Seeker'
  | 'Freelancer'
  | 'Small Business Owner';

export type UserWorry = 
  | 'Losing my deposit'
  | 'Hidden fees'
  | 'Auto-renewal or lock-in'
  | 'Unfair termination'
  | 'Non-compete or IP ownership'
  | 'Everything';

export type NegotiationTone = 'Polite' | 'Firm' | 'Friendly';

export type Language = 'English' | 'Hindi' | 'Bengali' | 'Spanish' | 'French';

export type ClauseCategory = 
  | 'Auto-Renewal'
  | 'Hidden Fee'
  | 'Deposit Trap'
  | 'Lock-In'
  | 'Unilateral Change'
  | 'IP Grab'
  | 'Non-Compete'
  | 'Penalty'
  | 'Liability Waiver'
  | 'Other';

export type Severity = 'Low' | 'Medium' | 'High';

export type RiskVerdict = 'Safe' | 'Careful' | 'Negotiate' | 'Walk Away';

export interface RiskyClause {
  id: string;
  exactQuote: string;
  plainEnglish: string;
  category: ClauseCategory;
  severity: Severity;
  worstCase: string;
  isQuoteVerified?: boolean;
}

export interface VillainCardData {
  id: string;
  name: string;
  emoji: string;
  archetype: string;
  exactClause: string;
  attack: string;
  weakness: string;
  dangerLevel: number; // 1 to 5
  portraitUrl?: string;
  category: ClauseCategory;
}

export interface CounterOffer {
  id: string;
  clauseQuote: string;
  suggestedReplacement: string;
  fallbackCompromise: string;
  priority: 'Must-Have' | 'Nice-to-Have' | 'Can-Concede';
  whyTheyLikelyAgree: string;
  selectedForEmail: boolean;
  category?: ClauseCategory;
}

export interface AutoRenewalHero {
  hasTrap: boolean;
  title: string;
  finePrintLine: string;
  financialTrap: string;
  deadline: string;
  replacementSentence: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface AnalysisResult {
  id: string;
  userId?: string;
  contractTitle: string;
  role: UserRole;
  worry: UserWorry;
  tone: NegotiationTone;
  language: Language;
  riskScore: number; // 0 - 100
  verdict: RiskVerdict;
  justification: string;
  counts: {
    high: number;
    medium: number;
    low: number;
  };
  clauses: RiskyClause[];
  villains: VillainCardData[];
  counterOffers: CounterOffer[];
  autoRenewalHero: AutoRenewalHero;
  negotiationEmail: string;
  checklist: ChecklistItem[];
  contractText?: string;
  savedContractText?: boolean;
  chatMessages?: ChatMessage[];
  createdAt: string;
}

export interface ComparisonDiff {
  category: string;
  originalText?: string;
  revisedText?: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  riskImpact: 'improved' | 'worsened' | 'neutral';
  notes: string;
}

export interface ComparisonResult {
  summary: string;
  isNewRiskier: boolean;
  originalScore: number;
  newScore: number;
  scoreDifference: number;
  keyTakeaways: string[];
  diffs: ComparisonDiff[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  referencedClause?: string;
}
