
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
}

export interface EventsState {
  events: Event[];
  currentEventId: string | null;
}

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
