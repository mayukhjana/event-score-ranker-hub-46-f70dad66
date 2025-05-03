import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, School, Columns } from 'lucide-react';
import { useEvent } from '@/context/EventContext';
import { v4 as uuidv4 } from 'uuid';
import { Student, Judge, ScoringColumn } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { generateJudgeScoringSheets } from '@/utils/pdfGenerator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const DEFAULT_SCHOOLS = ["St. Xavier's Collegiate School Kolkata"];

const Setup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    currentEvent, 
    createEvent,
    setEventName,
    setSchool,
    setMaxMarks,
    setStudents, 
    setJudges,
    setScoringColumns,
    setRankingMethod,
    isLoading,
    error
  } = useEvent();
  
  const [localEventName, setLocalEventName] = useState("");
  const [localSchool, setLocalSchool] = useState(DEFAULT_SCHOOLS[0]);
  const [customSchool, setCustomSchool] = useState("");
  const [showCustomSchoolInput, setShowCustomSchoolInput] = useState(false);
  const [localMaxMarks, setLocalMaxMarks] = useState("100");
  const [localStudents, setLocalStudents] = useState<Student[]>([
    { id: uuidv4(), name: '' }
  ]);
  const [localJudges, setLocalJudges] = useState<Judge[]>([
    { id: uuidv4(), name: '' }
  ]);
  const [localRankingMethod, setLocalRankingMethod] = useState<"spearman" | "general">("spearman");
  const [localScoringColumns, setLocalScoringColumns] = useState<ScoringColumn[]>([]);

  // Show error toast if context has an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Load current event data when available
  useEffect(() => {
    if (currentEvent) {
      setLocalEventName(currentEvent.name);
      setLocalSchool(currentEvent.school || DEFAULT_SCHOOLS[0]);
      setLocalMaxMarks(currentEvent.maxMarks?.toString() || "100");
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
      setLocalRankingMethod(currentEvent.rankingMethod || "spearman");
      setLocalScoringColumns(
        currentEvent.scoringColumns && currentEvent.scoringColumns.length > 0
        ? currentEvent.scoringColumns
        : []
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

  // Scoring columns functions
  const addScoringColumn = () => {
    const order = localScoringColumns.length > 0 
      ? Math.max(...localScoringColumns.map(col => col.order)) + 1 
      : 1;
      
    setLocalScoringColumns([
      ...localScoringColumns, 
      { id: uuidv4(), name: '', order }
    ]);
  };

  const removeScoringColumn = (id: string) => {
    setLocalScoringColumns(localScoringColumns.filter(column => column.id !== id));
  };

  const updateScoringColumn = (id: string, name: string) => {
    setLocalScoringColumns(
      localScoringColumns.map(column => 
        column.id === id ? { ...column, name } : column
      )
    );
  };

  const handleSchoolChange = (value: string) => {
    if (value === "custom") {
      setShowCustomSchoolInput(true);
    } else {
      setShowCustomSchoolInput(false);
      setLocalSchool(value);
    }
  };

  const generateScoringSheets = () => {
    // Validate that we have at least one student and one judge
    if (localStudents.some(s => !s.name.trim())) {
      toast({
        title: "Missing participant names",
        description: "Please fill in names for all participants",
        variant: "destructive"
      });
      return;
    }

    if (localJudges.some(j => !j.name.trim())) {
      toast({
        title: "Missing judge names",
        description: "Please fill in names for all judges",
        variant: "destructive"
      });
      return;
    }

    const mockEvent = {
      id: currentEvent?.id || uuidv4(),
      name: localEventName || "Unnamed Event",
      school: showCustomSchoolInput ? customSchool : localSchool,
      maxMarks: parseInt(localMaxMarks) || 100,
      students: localStudents,
      judges: localJudges,
      scores: [], // Empty scores since this is just for scoring sheets
      createdAt: new Date().toISOString(),
      rankingMethod: localRankingMethod,
      scoringColumns: localScoringColumns
    };

    try {
      generateJudgeScoringSheets(mockEvent);
      toast({
        title: "Scoring Sheets Generated",
        description: "Judge scoring sheets have been generated and downloaded",
      });
    } catch (error) {
      console.error("Error generating scoring sheets:", error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating scoring sheets",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Validate school
    const finalSchool = showCustomSchoolInput ? customSchool : localSchool;
    if (!finalSchool.trim()) {
      toast({
        title: "School name required",
        description: "Please provide a school name",
        variant: "destructive"
      });
      return;
    }

    // Validate max marks
    const maxMarks = parseInt(localMaxMarks);
    if (isNaN(maxMarks) || maxMarks <= 0) {
      toast({
        title: "Invalid maximum marks",
        description: "Please provide a valid positive number for maximum marks",
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

    // Validate scoring columns
    const emptyColumns = localScoringColumns.filter(c => !c.name.trim());
    if (emptyColumns.length > 0) {
      toast({
        title: "Missing column names",
        description: "Please fill in names for all scoring columns",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save data to context
      if (currentEvent) {
        // Update existing event
        await setEventName(currentEvent.id, localEventName);
        await setSchool(currentEvent.id, finalSchool);
        await setMaxMarks(currentEvent.id, maxMarks);
        await setStudents(currentEvent.id, localStudents);
        await setJudges(currentEvent.id, localJudges);
        await setRankingMethod(currentEvent.id, localRankingMethod);
        await setScoringColumns(currentEvent.id, localScoringColumns);
      } else {
        // Create new event if none exists
        const id = await createEvent(localEventName, finalSchool, maxMarks, localRankingMethod);
        await setStudents(id, localStudents);
        await setJudges(id, localJudges);
        await setScoringColumns(id, localScoringColumns);
      }
      
      toast({
        title: "Event setup complete",
        description: "You can now proceed to scoring"
      });
      
      navigate('/scoring');
    } catch (error: any) {
      console.error("Error saving event:", error);
      toast({
        title: "Error saving event",
        description: error.message || "An error occurred while saving your event. Please try again.",
        variant: "destructive"
      });
    }
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
              
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select 
                  onValueChange={handleSchoolChange}
                  defaultValue={localSchool}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_SCHOOLS.map((school) => (
                      <SelectItem key={school} value={school}>
                        <div className="flex items-center">
                          <School className="mr-2 h-4 w-4" />
                          <span>{school}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      + Add custom school
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {showCustomSchoolInput && (
                  <div className="mt-2">
                    <Input
                      placeholder="Enter school name"
                      value={customSchool}
                      onChange={(e) => setCustomSchool(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxMarks">Maximum Marks per Judge</Label>
                <Input
                  id="maxMarks"
                  type="number"
                  placeholder="100"
                  value={localMaxMarks}
                  onChange={(e) => setLocalMaxMarks(e.target.value)}
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Ranking Method</Label>
                <RadioGroup 
                  value={localRankingMethod} 
                  onValueChange={(value) => setLocalRankingMethod(value as "spearman" | "general")}
                  className="flex flex-col space-y-2 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="spearman" id="spearman" />
                    <Label htmlFor="spearman" className="cursor-pointer">
                      <span className="font-medium">Spearman's Ranking Method</span>
                      <p className="text-sm text-muted-foreground">
                        Ties are given the same rank, but subsequent ranks are skipped
                      </p>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="general" id="general" />
                    <Label htmlFor="general" className="cursor-pointer">
                      <span className="font-medium">General Ranking Method</span>
                      <p className="text-sm text-muted-foreground">
                        Ties are given the same rank, subsequent ranks are not skipped
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
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

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="scoringColumns">
            <Card>
              <CardHeader className="p-0 border-b-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <CardTitle className="flex items-center">
                    <Columns className="mr-2 h-5 w-5" />
                    <span>Additional Scoring Columns</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      (Optional)
                    </span>
                  </CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Add custom columns that will appear in the scoring sheets and results.
                      These can be used for rounds, categories, or any additional scoring criteria.
                    </p>
                    
                    {localScoringColumns.map((column, index) => (
                      <div key={column.id} className="flex gap-3 items-center">
                        <div className="flex-grow">
                          <Label htmlFor={`column-${column.id}`}>
                            Column {index + 1}
                          </Label>
                          <Input
                            id={`column-${column.id}`}
                            placeholder="e.g., Round 1, Creativity, Technique"
                            value={column.name}
                            onChange={(e) => updateScoringColumn(column.id!, e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-7"
                          onClick={() => removeScoringColumn(column.id!)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={addScoringColumn}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Column
                    </Button>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        <CardFooter className="flex justify-end space-x-4 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={generateScoringSheets}
            disabled={isLoading}
          >
            Generate Scoring Sheets
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/')} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save and Continue"}
          </Button>
        </CardFooter>
      </form>
    </Layout>
  );
};

export default Setup;
