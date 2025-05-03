
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Event, Student, Judge, Score, SupabaseEvent, SupabaseStudent, SupabaseJudge, SupabaseScore } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface EventContextType {
  events: Event[];
  currentEvent: Event | null;
  currentEventId: string | null;
  isLoading: boolean;
  error: string | null;
  createEvent: (name: string, school?: string, maxMarks?: number, rankingMethod?: "spearman" | "general") => Promise<string>;
  setCurrentEventId: (id: string | null) => void;
  setEventName: (id: string, name: string) => Promise<void>;
  setSchool: (id: string, school: string) => Promise<void>;
  setMaxMarks: (id: string, maxMarks: number) => Promise<void>;
  setStudents: (id: string, students: Student[]) => Promise<void>;
  setJudges: (id: string, judges: Judge[]) => Promise<void>;
  setScores: (id: string, scores: Score[]) => Promise<void>;
  setScore: (id: string, studentId: string, judgeId: string, value: number) => Promise<void>;
  setRankingMethod: (id: string, method: "spearman" | "general") => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvent = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
};

interface EventProviderProps {
  children: React.ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error(error.message);
        }

        const formattedEvents = data ? data.map((item: any) => supabaseEventToEvent(item as SupabaseEvent)) : [];
        setEvents(formattedEvents);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const currentEvent = events.find(event => event.id === currentEventId) || null;

  const createEvent = useCallback(
    async (name: string, school: string = "", maxMarks: number = 100, rankingMethod: "spearman" | "general" = "spearman"): Promise<string> => {
      setIsLoading(true);
      setError(null);
      const id = uuidv4();

      try {
        // Get current user ID
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || 'anonymous';
        
        // Insert the event
        const { error } = await supabase.from('events').insert({
          id,
          name,
          school,
          max_marks: maxMarks,
          ranking_method: rankingMethod,
          user_id: userId
        });

        if (error) {
          throw new Error(error.message);
        }

        const newEvent: Event = {
          id,
          name,
          school,
          maxMarks,
          students: [],
          judges: [],
          scores: [],
          createdAt: new Date().toISOString(),
          rankingMethod: rankingMethod,
        };

        setEvents(prevEvents => [newEvent, ...prevEvents]);
        return id;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const setEventName = useCallback(async (id: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('events')
        .update({ name })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === id ? { ...event, name } : event))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSchool = useCallback(async (id: string, school: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('events')
        .update({ school })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === id ? { ...event, school } : event))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setMaxMarks = useCallback(async (id: string, maxMarks: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('events')
        .update({ max_marks: maxMarks })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === id ? { ...event, maxMarks } : event))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setStudents = useCallback(async (id: string, students: Student[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Delete existing students for the event
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('event_id', id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Insert the new set of students
      const supabaseStudents = students.map(student => ({
        id: student.id,
        name: student.name,
        event_id: id,
      }));

      const { error: insertError } = await supabase
        .from('students')
        .insert(supabaseStudents);

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Update the local state
      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === id ? { ...event, students } : event))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setJudges = useCallback(async (id: string, judges: Judge[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Delete existing judges for the event
      const { error: deleteError } = await supabase
        .from('judges')
        .delete()
        .eq('event_id', id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Insert the new set of judges
      const supabaseJudges = judges.map(judge => ({
        id: judge.id,
        name: judge.name,
        event_id: id,
      }));

      const { error: insertError } = await supabase
        .from('judges')
        .insert(supabaseJudges);

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Update the local state
      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === id ? { ...event, judges } : event))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setScores = useCallback(async (id: string, scores: Score[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Delete existing scores for the event
      const { error: deleteError } = await supabase
        .from('scores')
        .delete()
        .eq('event_id', id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Insert the new set of scores
      const supabaseScores = scores.map(score => ({
        id: uuidv4(),
        value: score.value,
        student_id: score.studentId,
        judge_id: score.judgeId,
        event_id: id,
      }));

      const { error: insertError } = await supabase
        .from('scores')
        .insert(supabaseScores);

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Update the local state
      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === id ? { ...event, scores } : event))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setScore = useCallback(
    async (id: string, studentId: string, judgeId: string, value: number) => {
      setIsLoading(true);
      setError(null);

      try {
        // Check if the score already exists
        const { data: existingScores, error: selectError } = await supabase
          .from('scores')
          .select('*')
          .eq('student_id', studentId)
          .eq('judge_id', judgeId)
          .eq('event_id', id);

        if (selectError) {
          throw new Error(selectError.message);
        }

        if (existingScores && existingScores.length > 0) {
          // Update the existing score
          const { error: updateError } = await supabase
            .from('scores')
            .update({ value })
            .eq('student_id', studentId)
            .eq('judge_id', judgeId)
            .eq('event_id', id);

          if (updateError) {
            throw new Error(updateError.message);
          }
        } else {
          // Insert a new score
          const { error: insertError } = await supabase.from('scores').insert({
            id: uuidv4(),
            value,
            student_id: studentId,
            judge_id: judgeId,
            event_id: id,
          });

          if (insertError) {
            throw new Error(insertError.message);
          }
        }

        // Fetch the updated scores for the event
        const { data: updatedScores, error: fetchError } = await supabase
          .from('scores')
          .select('*')
          .eq('event_id', id);

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (updatedScores) {
          // Convert Supabase scores to the app's Score type
          const formattedScores: Score[] = updatedScores.map((score: any) => ({
            studentId: score.student_id,
            judgeId: score.judge_id,
            value: score.value,
          }));

          // Update the local state with the formatted scores
          setEvents(prevEvents =>
            prevEvents.map(event => (event.id === id ? { ...event, scores: formattedScores } : event))
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const setRankingMethod = useCallback(async (id: string, method: "spearman" | "general") => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if the ranking_method column exists in the events table
      const { error } = await supabase
        .from('events')
        .update({ ranking_method: method })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === id ? { ...event, rankingMethod: method } : event))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add deleteEvent function for Index.tsx
  const deleteEvent = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Delete event and related data (cascade delete should handle this if set up in Supabase)
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Update local state
      setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
      if (currentEventId === id) {
        setCurrentEventId(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId]);

  const value: EventContextType = {
    events,
    currentEvent,
    currentEventId,
    isLoading,
    error,
    createEvent,
    setCurrentEventId,
    setEventName,
    setSchool,
    setMaxMarks,
    setStudents,
    setJudges,
    setScores,
    setScore,
    setRankingMethod,
    deleteEvent,
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};

// Helper function to convert SupabaseEvent to Event
const supabaseEventToEvent = (supabaseEvent: SupabaseEvent): Event => ({
  id: supabaseEvent.id,
  name: supabaseEvent.name,
  school: supabaseEvent.school,
  maxMarks: supabaseEvent.max_marks,
  students: [], // Fetch separately if needed
  judges: [], // Fetch separately if needed
  scores: [], // Fetch separately if needed
  createdAt: supabaseEvent.created_at,
  rankingMethod: supabaseEvent.ranking_method,
});
