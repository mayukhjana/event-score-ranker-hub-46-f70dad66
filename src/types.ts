
export interface Student {
  id: string;
  name: string;
}

export interface Judge {
  id: string;
  name: string;
}

export interface Score {
  studentId: string;
  judgeId: string;
  value: number;
}

export interface ScoringColumn {
  id?: string;
  name: string;
  order: number;
}

export interface Event {
  id: string;
  name: string;
  school: string;
  maxMarks: number;
  students: Student[];
  judges: Judge[];
  scores: Score[];
  createdAt: string;
  rankingMethod?: "spearman" | "general";
  scoringColumns?: ScoringColumn[];
}

export interface EventsState {
  events: Event[];
  currentEventId: string | null;
}

// Define a more comprehensive SupabaseEvent interface to handle the ranking_method field
export interface SupabaseEvent {
  id: string;
  name: string;
  school: string;
  max_marks: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  ranking_method?: "spearman" | "general";
}

export interface SupabaseStudent {
  id: string;
  name: string;
  event_id: string;
}

export interface SupabaseJudge {
  id: string;
  name: string;
  event_id: string;
}

export interface SupabaseScore {
  id: string;
  value: number;
  student_id: string;
  judge_id: string;
  event_id: string;
}

export interface SupabaseScoringColumn {
  id: string;
  name: string;
  order: number;
  event_id: string;
}

// This helps us with the update type for Supabase
export interface SupabaseEventUpdate {
  name?: string;
  school?: string;
  max_marks?: number;
  updated_at?: string;
  user_id?: string;
  ranking_method?: "spearman" | "general";
}
