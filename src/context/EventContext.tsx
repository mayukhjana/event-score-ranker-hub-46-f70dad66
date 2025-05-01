
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { Event, Student, Judge, Score, EventsState, SupabaseEvent, SupabaseStudent, SupabaseJudge, SupabaseScore } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface EventContextType {
  events: Event[];
  currentEvent: Event | null;
  setCurrentEventId: (id: string | null) => void;
  createEvent: (name: string, school?: string, maxMarks?: number) => Promise<string>;
  setEventName: (id: string, name: string) => Promise<void>;
  setSchool: (id: string, school: string) => Promise<void>;
  setMaxMarks: (id: string, maxMarks: number) => Promise<void>;
  setStudents: (id: string, students: Student[]) => Promise<void>;
  setJudges: (id: string, judges: Judge[]) => Promise<void>;
  updateScore: (id: string, studentId: string, judgeId: string, value: number) => Promise<void>;
  resetEvent: (id: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  loading: boolean;
}

const defaultEventsState: EventsState = {
  events: [],
  currentEventId: null,
};

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider = ({ children }: { children: ReactNode }) => {
  const [eventsState, setEventsState] = useState<EventsState>(defaultEventsState);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const { events, currentEventId } = eventsState;
  const currentEvent = currentEventId 
    ? events.find(e => e.id === currentEventId) || null 
    : null;

  // Load events from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setEventsState(defaultEventsState);
      setLoading(false);
      return;
    }

    const loadEvents = async () => {
      setLoading(true);
      try {
        // Fetch events
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });

        if (eventError) throw eventError;

        if (eventData && eventData.length > 0) {
          const loadedEvents: Event[] = await Promise.all(
            eventData.map(async (event: SupabaseEvent) => {
              // For each event, fetch students
              const { data: students, error: studentsError } = await supabase
                .from('students')
                .select('*')
                .eq('event_id', event.id);
              
              if (studentsError) throw studentsError;

              // For each event, fetch judges
              const { data: judges, error: judgesError } = await supabase
                .from('judges')
                .select('*')
                .eq('event_id', event.id);
              
              if (judgesError) throw judgesError;

              // For each event, fetch scores
              const { data: scores, error: scoresError } = await supabase
                .from('scores')
                .select('*')
                .eq('event_id', event.id);
              
              if (scoresError) throw scoresError;

              // Transform to our app's format
              return {
                id: event.id,
                name: event.name,
                school: event.school,
                maxMarks: event.max_marks,
                createdAt: event.created_at,
                students: students.map((s: SupabaseStudent) => ({
                  id: s.id,
                  name: s.name
                })),
                judges: judges.map((j: SupabaseJudge) => ({
                  id: j.id,
                  name: j.name
                })),
                scores: scores.map((s: SupabaseScore) => ({
                  studentId: s.student_id,
                  judgeId: s.judge_id,
                  value: s.value
                }))
              };
            })
          );

          setEventsState({
            events: loadedEvents,
            currentEventId: null
          });
        }
      } catch (error) {
        console.error("Error loading events:", error);
        toast({
          title: "Error loading events",
          description: "Failed to load your events data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user, toast]);

  const createEvent = async (name: string, school: string = "St. Xavier's Collegiate School Kolkata", maxMarks: number = 100) => {
    try {
      // Check if user exists
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Insert new event into Supabase
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          name,
          school,
          max_marks: maxMarks,
          user_id: user.id // Add the user_id from the authenticated user
        })
        .select()
        .single();

      if (eventError) throw eventError;

      const newEvent: Event = {
        id: eventData.id,
        name: eventData.name,
        school: eventData.school,
        maxMarks: eventData.max_marks,
        students: [],
        judges: [],
        scores: [],
        createdAt: eventData.created_at
      };

      setEventsState(prev => ({
        ...prev,
        events: [...prev.events, newEvent],
        currentEventId: newEvent.id,
      }));

      return newEvent.id;
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error creating event",
        description: "Failed to create your new event",
        variant: "destructive"
      });
      throw error;
    }
  };

  const setCurrentEventId = (id: string | null) => {
    setEventsState(prev => ({ ...prev, currentEventId: id }));
  };

  const setEventName = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      setEventsState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === id ? { ...event, name } : event
        )
      }));
    } catch (error) {
      console.error("Error updating event name:", error);
      toast({
        title: "Error updating event",
        description: "Failed to update event name",
        variant: "destructive"
      });
    }
  };

  const setSchool = async (id: string, school: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ school })
        .eq('id', id);

      if (error) throw error;

      setEventsState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === id ? { ...event, school } : event
        )
      }));
    } catch (error) {
      console.error("Error updating school:", error);
      toast({
        title: "Error updating event",
        description: "Failed to update school name",
        variant: "destructive"
      });
    }
  };

  const setMaxMarks = async (id: string, maxMarks: number) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ max_marks: maxMarks })
        .eq('id', id);

      if (error) throw error;

      setEventsState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === id ? { ...event, maxMarks } : event
        )
      }));
    } catch (error) {
      console.error("Error updating max marks:", error);
      toast({
        title: "Error updating event",
        description: "Failed to update maximum marks",
        variant: "destructive"
      });
    }
  };

  const setStudents = async (id: string, students: Student[]) => {
    try {
      // Get current event from state for comparison
      const currentEvent = events.find(event => event.id === id);
      if (!currentEvent) return;
      
      // Get existing student IDs to detect those we need to delete
      const existingStudentIds = new Set(currentEvent.students.map(s => s.id));
      const newStudentIds = new Set(students.map(s => s.id));
      
      // Delete students that are no longer in the new list
      const studentsToDelete = [...existingStudentIds].filter(sid => !newStudentIds.has(sid));
      if (studentsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('students')
          .delete()
          .in('id', studentsToDelete);
        
        if (deleteError) throw deleteError;
      }
      
      // For each new student, insert or update
      for (const student of students) {
        if (existingStudentIds.has(student.id)) {
          // Update existing student
          const { error } = await supabase
            .from('students')
            .update({ name: student.name })
            .eq('id', student.id);
          
          if (error) throw error;
        } else {
          // Insert new student
          const { error } = await supabase
            .from('students')
            .insert({
              id: student.id,
              name: student.name,
              event_id: id
            });
          
          if (error) throw error;
        }
      }
      
      setEventsState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === id ? { ...event, students } : event
        )
      }));
    } catch (error) {
      console.error("Error updating students:", error);
      toast({
        title: "Error updating students",
        description: "Failed to update participant list",
        variant: "destructive"
      });
    }
  };

  const setJudges = async (id: string, judges: Judge[]) => {
    try {
      // Get current event from state for comparison
      const currentEvent = events.find(event => event.id === id);
      if (!currentEvent) return;
      
      // Get existing judge IDs to detect those we need to delete
      const existingJudgeIds = new Set(currentEvent.judges.map(j => j.id));
      const newJudgeIds = new Set(judges.map(j => j.id));
      
      // Delete judges that are no longer in the new list
      const judgesToDelete = [...existingJudgeIds].filter(jid => !newJudgeIds.has(jid));
      if (judgesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('judges')
          .delete()
          .in('id', judgesToDelete);
        
        if (deleteError) throw deleteError;
      }
      
      // For each new judge, insert or update
      for (const judge of judges) {
        if (existingJudgeIds.has(judge.id)) {
          // Update existing judge
          const { error } = await supabase
            .from('judges')
            .update({ name: judge.name })
            .eq('id', judge.id);
          
          if (error) throw error;
        } else {
          // Insert new judge
          const { error } = await supabase
            .from('judges')
            .insert({
              id: judge.id,
              name: judge.name,
              event_id: id
            });
          
          if (error) throw error;
        }
      }
      
      setEventsState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === id ? { ...event, judges } : event
        )
      }));
    } catch (error) {
      console.error("Error updating judges:", error);
      toast({
        title: "Error updating judges",
        description: "Failed to update judge list",
        variant: "destructive"
      });
    }
  };

  const updateScore = async (id: string, studentId: string, judgeId: string, value: number) => {
    try {
      // Check if score already exists
      const { data, error: checkError } = await supabase
        .from('scores')
        .select('id')
        .eq('event_id', id)
        .eq('student_id', studentId)
        .eq('judge_id', judgeId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (data) {
        // Update existing score
        const { error } = await supabase
          .from('scores')
          .update({ value })
          .eq('id', data.id);
        
        if (error) throw error;
      } else {
        // Insert new score
        const { error } = await supabase
          .from('scores')
          .insert({
            value,
            student_id: studentId,
            judge_id: judgeId,
            event_id: id
          });
        
        if (error) throw error;
      }

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
    } catch (error) {
      console.error("Error updating score:", error);
      toast({
        title: "Error updating score",
        description: "Failed to save the score",
        variant: "destructive"
      });
    }
  };

  const resetEvent = async (id: string) => {
    try {
      // Delete all scores for the event
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('event_id', id);

      if (error) throw error;

      setEventsState(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === id ? { ...event, scores: [] } : event
        )
      }));

      toast({
        title: "Scores reset",
        description: "All scores for this event have been cleared"
      });
    } catch (error) {
      console.error("Error resetting scores:", error);
      toast({
        title: "Error resetting scores",
        description: "Failed to reset scores for this event",
        variant: "destructive"
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      // Delete the event (cascade will handle related records)
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEventsState(prev => {
        const newEvents = prev.events.filter(event => event.id !== id);
        return {
          ...prev,
          events: newEvents,
          currentEventId: prev.currentEventId === id ? null : prev.currentEventId
        };
      });

      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error deleting event",
        description: "Failed to delete this event",
        variant: "destructive"
      });
    }
  };

  return (
    <EventContext.Provider
      value={{
        events,
        currentEvent,
        setCurrentEventId,
        createEvent,
        setEventName,
        setSchool,
        setMaxMarks,
        setStudents,
        setJudges,
        updateScore,
        resetEvent,
        deleteEvent,
        loading
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
