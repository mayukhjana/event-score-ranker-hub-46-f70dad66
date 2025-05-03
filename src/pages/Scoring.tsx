
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useEvent } from '@/context/EventContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const Scoring = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentEvent, setScore } = useEvent();

  useEffect(() => {
    // Redirect to setup if no event configuration exists
    if (!currentEvent || !currentEvent.name || 
        currentEvent.students.length === 0 || 
        currentEvent.judges.length === 0) {
      toast({
        title: "Event not configured",
        description: "Please set up your event first",
        variant: "destructive"
      });
      navigate('/setup');
    }
  }, [currentEvent, navigate, toast]);

  if (!currentEvent) return null;

  const { students, judges, scores, maxMarks } = currentEvent;

  // Helper to get the score for a specific student and judge
  const getScore = (studentId: string, judgeId: string): string => {
    const scoreEntry = scores.find(
      (s) => s.studentId === studentId && s.judgeId === judgeId
    );
    return scoreEntry ? scoreEntry.value.toString() : "nil";
  };

  const handleScoreChange = (studentId: string, judgeId: string, valueStr: string) => {
    if (valueStr === "nil" || valueStr === "") {
      // Remove the score if it's nil or empty
      setScore(currentEvent.id, studentId, judgeId, 0);
      return;
    }

    const value = parseFloat(valueStr);
    if (!isNaN(value)) {
      setScore(currentEvent.id, studentId, judgeId, value);
    } else {
      toast({
        title: "Invalid score",
        description: "Please enter a valid number or 'nil'",
        variant: "destructive"
      });
    }
  };

  // Calculate completion percentage
  const totalScoresNeeded = students.length * judges.length;
  const scoresFilled = scores.length;
  const completionPercentage = totalScoresNeeded > 0 
    ? Math.round((scoresFilled / totalScoresNeeded) * 100) 
    : 0;

  return (
    <Layout title="Scoring">
      <div className="space-y-6">
        {/* Event information */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-medium">{currentEvent.name}</h3>
            <p className="text-gray-500">{currentEvent.school}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Maximum marks: {maxMarks}</p>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-500 mb-2">
            Overall Progress: {completionPercentage}% complete
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Scoring Sheet: {currentEvent.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white z-10">Participants</TableHead>
                    {judges.map(judge => (
                      <TableHead key={judge.id} className="text-center">
                        {judge.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell className="sticky left-0 bg-white z-10 font-medium">
                        {student.name}
                      </TableCell>
                      {judges.map(judge => (
                        <TableCell key={judge.id} className="p-1 text-center">
                          <Input
                            type="text"
                            value={getScore(student.id, judge.id)}
                            onChange={(e) => handleScoreChange(student.id, judge.id, e.target.value)}
                            className="h-8 w-16 text-center mx-auto"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/setup')}
          >
            Back to Setup
          </Button>
          <Button onClick={() => navigate('/results')}>
            View Results
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Scoring;
