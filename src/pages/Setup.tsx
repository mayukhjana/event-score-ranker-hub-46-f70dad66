
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { useEvent } from '@/context/EventContext';
import { v4 as uuidv4 } from 'uuid';
import { Student, Judge } from '@/types';

const Setup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    currentEvent, 
    createEvent,
    setEventName, 
    setStudents, 
    setJudges 
  } = useEvent();
  
  const [localEventName, setLocalEventName] = useState("");
  const [localStudents, setLocalStudents] = useState<Student[]>([
    { id: uuidv4(), name: '' }
  ]);
  const [localJudges, setLocalJudges] = useState<Judge[]>([
    { id: uuidv4(), name: '' }
  ]);

  // Load current event data when available
  useEffect(() => {
    if (currentEvent) {
      setLocalEventName(currentEvent.name);
      setLocalStudents(
        currentEvent.students.length > 0 
        ? currentEvent.students 
        : [{ id: uuidv4(), name: '' }]
      );
      setLocalJudges(
        currentEvent.judges.length > 0 
        ? currentEvent.judges 
        : [{ id: uuidv4(), name: '' }]
      );
    }
  }, [currentEvent]);

  const addStudent = () => {
    setLocalStudents([...localStudents, { id: uuidv4(), name: '' }]);
  };

  const removeStudent = (id: string) => {
    if (localStudents.length > 1) {
      setLocalStudents(localStudents.filter(student => student.id !== id));
    } else {
      toast({
        title: "Cannot remove",
        description: "You need at least one participant",
        variant: "destructive"
      });
    }
  };

  const updateStudent = (id: string, name: string) => {
    setLocalStudents(
      localStudents.map(student => 
        student.id === id ? { ...student, name } : student
      )
    );
  };

  const addJudge = () => {
    setLocalJudges([...localJudges, { id: uuidv4(), name: '' }]);
  };

  const removeJudge = (id: string) => {
    if (localJudges.length > 1) {
      setLocalJudges(localJudges.filter(judge => judge.id !== id));
    } else {
      toast({
        title: "Cannot remove",
        description: "You need at least one judge",
        variant: "destructive"
      });
    }
  };

  const updateJudge = (id: string, name: string) => {
    setLocalJudges(
      localJudges.map(judge => 
        judge.id === id ? { ...judge, name } : judge
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate event name
    if (!localEventName.trim()) {
      toast({
        title: "Event name required",
        description: "Please provide a name for your event",
        variant: "destructive"
      });
      return;
    }

    // Validate students
    const emptyStudents = localStudents.filter(s => !s.name.trim());
    if (emptyStudents.length > 0) {
      toast({
        title: "Missing participant names",
        description: "Please fill in names for all participants",
        variant: "destructive"
      });
      return;
    }

    // Validate judges
    const emptyJudges = localJudges.filter(j => !j.name.trim());
    if (emptyJudges.length > 0) {
      toast({
        title: "Missing judge names",
        description: "Please fill in names for all judges",
        variant: "destructive"
      });
      return;
    }

    // Save data to context
    if (currentEvent) {
      // Update existing event
      setEventName(currentEvent.id, localEventName);
      setStudents(currentEvent.id, localStudents);
      setJudges(currentEvent.id, localJudges);
    } else {
      // Create new event if none exists
      const id = createEvent(localEventName);
      setStudents(id, localStudents);
      setJudges(id, localJudges);
    }
    
    toast({
      title: "Event setup complete",
      description: "You can now proceed to scoring"
    });
    
    navigate('/scoring');
  };

  return (
    <Layout title="Event Setup">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name</Label>
                <Input
                  id="eventName"
                  placeholder="e.g., School Talent Show 2025"
                  value={localEventName}
                  onChange={(e) => setLocalEventName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {localStudents.map((student, index) => (
                <div key={student.id} className="flex gap-3 items-center">
                  <div className="flex-grow">
                    <Label htmlFor={`student-${student.id}`}>
                      Participant {index + 1}
                    </Label>
                    <Input
                      id={`student-${student.id}`}
                      placeholder="Participant name"
                      value={student.name}
                      onChange={(e) => updateStudent(student.id, e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-7"
                    onClick={() => removeStudent(student.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addStudent}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Participant
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Judges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {localJudges.map((judge, index) => (
                <div key={judge.id} className="flex gap-3 items-center">
                  <div className="flex-grow">
                    <Label htmlFor={`judge-${judge.id}`}>
                      Judge {index + 1}
                    </Label>
                    <Input
                      id={`judge-${judge.id}`}
                      placeholder="Judge name"
                      value={judge.name}
                      onChange={(e) => updateJudge(judge.id, e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-7"
                    onClick={() => removeJudge(judge.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addJudge}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Judge
              </Button>
            </div>
          </CardContent>
        </Card>

        <CardFooter className="flex justify-end space-x-4 pt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/')}>
            Cancel
          </Button>
          <Button type="submit">
            Save and Continue
          </Button>
        </CardFooter>
      </form>
    </Layout>
  );
};

export default Setup;
