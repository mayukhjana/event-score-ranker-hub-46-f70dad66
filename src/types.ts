
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
  students: Student[];
  judges: Judge[];
  scores: Score[];
  createdAt: string;
}

export interface EventsState {
  events: Event[];
  currentEventId: string | null;
}
