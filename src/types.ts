
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

export interface EventData {
  eventName: string;
  students: Student[];
  judges: Judge[];
  scores: Score[];
}
