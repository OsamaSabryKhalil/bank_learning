/** Content model types shared by renderer, validator, and content scripts. */

export interface Bi {
  en: string;
  ar: string;
}

export interface CodeLine {
  code: string;
  comment?: Bi;
  mark?: 'bad' | 'good' | 'note';
}

export interface CodeBlock {
  lang: 'sql' | 'ts' | 'java' | 'python' | 'json' | 'pseudo';
  caption: Bi;
  lines: CodeLine[];
}

export interface BalanceChangeRow {
  account: Bi;
  currency: string;
  before_minor: number;
  delta_minor: number;
  after_minor: number;
  note?: Bi;
}

export interface BalanceChangeTable {
  kind: 'balance_change';
  caption: Bi;
  rows: BalanceChangeRow[];
}

export interface JournalEntry {
  account: Bi;
  currency: string;
  debit_minor: number;
  credit_minor: number;
}

export interface JournalTable {
  kind: 'journal';
  caption: Bi;
  entries: JournalEntry[];
}

export type LedgerTable = BalanceChangeTable | JournalTable;

export interface Diagram {
  id: string;
  role: 'analogy' | 'wrong_vs_right' | 'flow' | 'state' | 'er' | 'architecture' | 'timeline' | 'ledger';
  kind: 'sequence' | 'flowchart' | 'state' | 'er' | 'architecture' | 'timeline' | 'custom_svg';
  component?: string; // custom SVG component id, when kind=custom_svg
  structure?: string; // language-neutral mermaid-ish source with @key labels
  labels?: Record<string, Bi>;
  alt: Bi;
  caption: Bi;
  explanation: Bi;
}

export interface Analogy {
  tag: string;
  analogy: Bi;
  maps_to: Bi;
  where_it_breaks: Bi;
  diagram_id?: string;
}

export interface WorkedExample {
  title: Bi;
  steps: Bi[];
  ledger_tables: LedgerTable[];
  takeaway: Bi;
}

export interface IncidentStory {
  title: Bi;
  timeline: { t: string; text: Bi }[];
  root_cause: Bi;
  how_it_was_detected: Bi;
  fix: Bi;
}

export interface QuizQuestion {
  type: 'single' | 'scenario';
  question: Bi;
  options: Bi[];
  answer_index: number;
  explanation: Bi;
}

export interface HandsOnExercise {
  task: Bi;
  runner: 'sql' | 'js' | 'reading';
  starter: CodeBlock;
  solution: CodeBlock;
  tests: { description: Bi; expected: string }[];
}

export interface Lesson {
  id: string;
  module: string;
  title: Bi;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  estimated_minutes: number;
  content_reviewed_as_of: string;
  learning_objectives: Bi[];
  plain_summary: Bi;
  why_it_matters_in_banking: Bi;
  key_concepts: { term_id: string; definition: Bi }[];
  real_life_analogies: Analogy[];
  worked_examples: WorkedExample[];
  incident_stories: IncidentStory[];
  wrong_behavior: {
    scenario: Bi;
    code_block: CodeBlock;
    what_goes_wrong_step_by_step: Bi[];
    real_world_consequences: Bi[];
    diagram_id: string;
  };
  right_behavior: {
    correct_design: Bi;
    code_block: CodeBlock;
    why_it_works: Bi[];
    trade_offs: Bi[];
    diagram_id: string;
  };
  diagrams: Diagram[];
  jurisdiction_notes: Bi[];
  common_mistakes: Bi[];
  checklist_for_production: Bi[];
  glossary_terms: string[];
  quiz: QuizQuestion[];
  hands_on_exercise: HandsOnExercise;
  cheat_sheet: Bi[];
  simulator_ids: string[];
  next_lessons: string[];
}

export interface GlossaryTerm {
  id: string;
  en: string;
  ar: string;
  keep_latin: boolean;
  definition: Bi;
  ar_aliases: string[];
  related: string[];
}

export interface CurriculumLessonEntry {
  id: string;
  title: Bi;
  status: 'planned' | 'published';
}

export interface CurriculumModule {
  id: string;
  title: Bi;
  lessons: CurriculumLessonEntry[];
}

export interface Curriculum {
  version: string;
  simulator_hosts: Record<string, string>;
  modules: CurriculumModule[];
}
