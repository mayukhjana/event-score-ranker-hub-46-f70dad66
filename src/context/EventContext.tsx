
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { Event, Student, Judge, Score, EventsState } from "@/types";

interface EventContextType {
  events: Event[];
  currentEvent: Event | null;
  setCurrentEventId: (id: string | null) => void;
  createEvent: (name: string) => string;
  setEventName: (id: string, name: string) => void;
  setStudents: (id: string, students: Student[]) => void;
  setJudges: (id: string, judges: Judge[]) => void;
  updateScore: (id: string, studentId: string, judgeId: string, value: number) => void;
  resetEvent: (id: string) => void;
  deleteEvent: (id: string) => void;
}

const defaultEventsState: EventsState = {
  events: [],
  currentEventId: null,
};

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const [eventsState, setEventsState] = useState<EventsState>(() => {
    const savedData = localStorage.getItem("eventsData");
    return savedData ? JSON.parse(savedData) : defaultEventsState;
  });

  const { events, currentEventId } = eventsState;
  const currentEvent = currentEventId 
    ? events.find(e => e.id === currentEventId) || null 
    : null;

  useEffect(() => {
    localStorage.setItem("eventsData", JSON.stringify(eventsState));
  }, [eventsState]);

  const createEvent = (name: string) => {
    const id = uuidv4();
    const newEvent: Event = {
      id,
      name,
      students: [],
      judges: [],
      scores: [],
      createdAt: new Date().toISOString()
    };

    setEventsState(prev => ({
      ...prev,
      events: [...prev.events, newEvent],
      currentEventId: id,
    }));

    return id;
  };

  const setCurrentEventId = (id: string | null) => {
    setEventsState(prev => ({ ...prev, currentEventId: id }));
  };

  const setEventName = (id: string, name: string) => {
    setEventsState(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === id ? { ...event, name } : event
      )
    }));
  };

  const setStudents = (id: string, students: Student[]) => {
    setEventsState(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === id ? { ...event, students } : event
      )
    }));
  };

  const setJudges = (id: string, judges: Judge[]) => {
    setEventsState(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === id ? { ...event, judges } : event
      )
    }));
  };

  const updateScore = (id: string, studentId: string, judgeId: string, value: number) => {
    setEventsState(prev => {
      const eventToUpdate = prev.events.find(e => e.id === id);
      if (!eventToUpdate) return prev;

      const existingScoreIndex = eventToUpdate.scores.findIndex(
        score => score.studentId === studentId && score.judgeId === judgeId
      );

      let updatedScores: Score[];
      
      if (existingScoreIndex !== -1) {
        // Update existing score
        updatedScores = [...eventToUpdate.scores];
        updatedScores[existingScoreIndex] = { studentId, judgeId, value };
      } else {
        // Add new score
        updatedScores = [...eventToUpdate.scores, { studentId, judgeId, value }];
      }

      return {
        ...prev,
        events: prev.events.map(event => 
          event.id === id ? { ...event, scores: updatedScores } : event
        )
      };
    });
  };

  const resetEvent = (id: string) => {
    setEventsState(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === id ? { ...event, scores: [] } : event
      )
    }));
  };

  const deleteEvent = (id: string) => {
    setEventsState(prev => {
      const newEvents = prev.events.filter(event => event.id !== id);
      return {
        ...prev,
        events: newEvents,
        currentEventId: prev.currentEventId === id ? null : prev.currentEventId
      };
    });
  };

  return (
    <EventContext.Provider
      value={{
        events,
        currentEvent,
        setCurrentEventId,
        createEvent,
        setEventName,
        setStudents,
        setJudges,
        updateScore,
        resetEvent,
        deleteEvent,
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
