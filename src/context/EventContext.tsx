
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Student {
  id: string;
  name: string;
}

interface Judge {
  id: string;
  name: string;
}

interface Score {
  studentId: string;
  judgeId: string;
  value: number;
}

interface EventData {
  eventName: string;
  students: Student[];
  judges: Judge[];
  scores: Score[];
}

interface EventContextType {
  eventData: EventData;
  setEventName: (name: string) => void;
  setStudents: (students: Student[]) => void;
  setJudges: (judges: Judge[]) => void;
  updateScore: (studentId: string, judgeId: string, value: number) => void;
  resetEvent: () => void;
}

const defaultEventData: EventData = {
  eventName: "",
  students: [],
  judges: [],
  scores: [],
};

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const [eventData, setEventData] = useState<EventData>(() => {
    const savedData = localStorage.getItem("eventData");
    return savedData ? JSON.parse(savedData) : defaultEventData;
  });

  useEffect(() => {
    localStorage.setItem("eventData", JSON.stringify(eventData));
  }, [eventData]);

  const setEventName = (name: string) => {
    setEventData((prev) => ({ ...prev, eventName: name }));
  };

  const setStudents = (students: Student[]) => {
    setEventData((prev) => ({ ...prev, students }));
  };

  const setJudges = (judges: Judge[]) => {
    setEventData((prev) => ({ ...prev, judges }));
  };

  const updateScore = (studentId: string, judgeId: string, value: number) => {
    setEventData((prev) => {
      const existingScoreIndex = prev.scores.findIndex(
        (score) => score.studentId === studentId && score.judgeId === judgeId
      );

      if (existingScoreIndex !== -1) {
        // Update existing score
        const newScores = [...prev.scores];
        newScores[existingScoreIndex] = { studentId, judgeId, value };
        return { ...prev, scores: newScores };
      } else {
        // Add new score
        return { ...prev, scores: [...prev.scores, { studentId, judgeId, value }] };
      }
    });
  };

  const resetEvent = () => {
    setEventData(defaultEventData);
  };

  return (
    <EventContext.Provider
      value={{
        eventData,
        setEventName,
        setStudents,
        setJudges,
        updateScore,
        resetEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
};
