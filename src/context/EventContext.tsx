import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Event, Student, Judge, Score, ScoringColumn, 
  SupabaseEvent, SupabaseStudent, SupabaseJudge, 
  SupabaseScore, SupabaseScoringColumn, SupabaseEventUpdate 
} from "@/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";

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
  setScoringColumns: (id: string, columns: ScoringColumn[]) => Promise<void>;
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

        if (data) {
          const formattedEvents: Event[] = [];
          
          for (const event of data) {
            // Check if ranking_method exists in the database schema
            let rankingMethod: "spearman" | "general" = "spearman"; // Default value
            
            try {
              // Try to access ranking_method with type assertion
              const eventAny = event as any;
              if (eventAny.ranking_method && 
                  (eventAny.ranking_method === "spearman" || 
                   eventAny.ranking_method === "general")) {
                rankingMethod = eventAny.ranking_method;
              }
            } catch (e) {
              console.warn("Could not access ranking_method, using default value", e);
            }
            
            // Fetch students
            const { data: studentsData } = await supabase
              .from('students')
              .select('*')
              .eq('event_id', event.id);
            
            // Fetch judges
            const { data: judgesData } = await supabase
              .from('judges')
              .select('*')
              .eq('event_id', event.id);
            
            // Fetch scores
            const { data: scoresData } = await supabase
              .from('scores')
              .select('*')
              .eq('event_id', event.id);
            
            // Try to fetch scoring columns, handle case if the table doesn't exist yet
            let columnsData: any[] = [];
            try {
              // Use type assertion to bypass type checking
              const { data } = await (supabase as any)
                .from('scoring_columns')
                .select('*')
                .eq('event_id', event.id);
                
              if (data) columnsData = data;
            } catch (e) {
              console.warn("Could not fetch scoring columns:", e);
              // Continue without scoring columns
            }
              
            const students: Student[] = studentsData ? studentsData.map((s: any) => ({
              id: s.id,
              name: s.name
            })) : [];
            
            const judges: Judge[] = judgesData ? judgesData.map((j: any) => ({
              id: j.id,
              name: j.name
            })) : [];
            
            const scores: Score[] = scoresData ? scoresData.map((s: any) => ({
              studentId: s.student_id,
              judgeId: s.judge_id,
              value: s.value
            })) : [];
            
            const scoringColumns: ScoringColumn[] = columnsData 
              ? columnsData.map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  order: c.order
                })) 
              : [];
            
            formattedEvents.push({
              id: event.id,
              name: event.name,
              school: event.school,
              maxMarks: event.max_marks,
              students,
              judges,
              scores,
              createdAt: event.created_at,
              rankingMethod,
              scoringColumns,
            });
          }
          
          setEvents(formattedEvents);
        }
      } catch (err: any) {
        console.error("Error fetching events:", err);
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
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw new Error(userError.message);
        }
        
        const userId = userData.user?.id;
        
        if (!userId) {
          throw new Error("User not authenticated");
        }
        
        // First, create the event with basic properties
        const { error: insertError } = await supabase
          .from('events')
          .insert({
            id,
            name,
            school,
            max_marks: maxMarks,
            user_id: userId,
          });

        if (insertError) {
          throw new Error(insertError.message);
        }
        
        // Then try to update with ranking_method
        try {
          await supabase.rpc('update_ranking_method', { 
            event_id: id, 
            method: rankingMethod 
          });
        } catch (rpcError) {
          console.warn("Could not update ranking_method using RPC, falling back to direct update", rpcError);
          
          // Use a type that matches the database schema
          const updateData: SupabaseEventUpdate = {
            ranking_method: rankingMethod
          };
          
          // Use the typed update method
          const { error: updateError } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', id);
              
          if (updateError) {
            console.warn("Could not update ranking_method directly:", updateError);
            // Continue without setting ranking_method
          }
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
          rankingMethod,
          scoringColumns: [],
        };

        setEvents(prevEvents => [newEvent, ...prevEvents]);
        setCurrentEventId(id);
        return id;
      } catch (err: any) {
        console.error("Error creating event:", err);
        setError(err.message);
        toast({
          title: "Error creating event",
          description: err.message,
          variant: "destructive"
        });
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

        // Update the local state
        setEvents(prevEvents => 
          prevEvents.map(event => {
            if (event.id === id) {
              // Find if score already exists
              const existingScoreIndex = event.scores.findIndex(
                s => s.studentId === studentId && s.judgeId === judgeId
              );
              
              // Create new scores array with updated or added score
              let updatedScores;
              if (existingScoreIndex !== -1) {
                updatedScores = [...event.scores];
                updatedScores[existingScoreIndex] = { studentId, judgeId, value };
              } else {
                updatedScores = [...event.scores, { studentId, judgeId, value }];
              }
              
              return { ...event, scores: updatedScores };
            }
            return event;
          })
        );
      } catch (err: any) {
        console.error("Error setting score:", err);
        setError(err.message);
        toast({
          title: "Error setting score",
          description: err.message,
          variant: "destructive"
        });
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
      // Try to update using RPC first
      try {
        await supabase.rpc('update_ranking_method', { 
          event_id: id, 
          method 
        });
      } catch (rpcError) {
        console.warn("Could not update ranking_method using RPC, falling back to direct update", rpcError);
        
        // Use a type that matches the database schema
        const updateData: SupabaseEventUpdate = {
          ranking_method: method
        };
        
        // Use the typed update method
        const { error } = await supabase
          .from('events')
          .update(updateData)
          .eq('id', id);
          
        if (error) {
          // If that fails too, create the column manually
          if (error.message.includes("column") && error.message.includes("does not exist")) {
            throw new Error("The ranking_method column does not exist in the events table. Please add it to your Supabase schema.");
          } else {
            throw new Error(error.message);
          }
        }
      }

      // Update the local state
      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === id ? { ...event, rankingMethod: method } : event))
      );
    } catch (err: any) {
      console.error("Error setting ranking method:", err);
      setError(err.message);
      toast({
        title: "Error setting ranking method",
        description: err.message,
        variant: "destructive"
      });
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
      console.error("Error deleting event:", err);
      setError(err.message);
      toast({
        title: "Error deleting event",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId]);

  // Add function to handle scoring columns
  const setScoringColumns = useCallback(async (id: string, columns: ScoringColumn[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Delete existing scoring columns
      try {
        // Use type assertion to bypass type checking
        const { error: deleteError } = await (supabase as any)
          .from('scoring_columns')
          .delete()
          .eq('event_id', id);

        if (deleteError) {
          // If table doesn't exist, log warning but continue
          console.warn("Could not delete scoring columns:", deleteError);
        }
      } catch (err) {
        console.warn("Error deleting scoring columns:", err);
      }

      // Insert new scoring columns if there are any
      if (columns.length > 0) {
        try {
          const supabaseColumns = columns.map(column => ({
            id: column.id || uuidv4(),
            name: column.name,
            order: column.order,
            event_id: id
          }));

          // Use type assertion to bypass type checking
          const { error: insertError } = await (supabase as any)
            .from('scoring_columns')
            .insert(supabaseColumns);

          if (insertError) {
            console.warn("Could not insert scoring columns:", insertError);
            // Continue even if insert fails
          }
        } catch (err) {
          console.warn("Error inserting scoring columns:", err);
        }
      }

      // Update local state regardless of DB operations
      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === id ? { ...event, scoringColumns: columns } : event))
      );
    } catch (err: any) {
      console.error("Error setting scoring columns:", err);
      setError(err.message);
      toast({
        title: "Error setting scoring columns",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    setScoringColumns,
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
  scoringColumns: [],
});
