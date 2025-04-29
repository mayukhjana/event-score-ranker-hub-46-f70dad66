
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { useEvent } from '@/context/EventContext';

const Scoring = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentEvent, updateScore } = useEvent();
  const [activeStudentIndex, setActiveStudentIndex] = useState(0);

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

  const { students, judges, scores } = currentEvent;
  const activeStudent = students[activeStudentIndex];

  // Helper to get the score for a specific student and judge
  const getScore = (studentId: string, judgeId: string): number => {
    const scoreEntry = scores.find(
      (s) => s.studentId === studentId && s.judgeId === judgeId
    );
    return scoreEntry ? scoreEntry.value : 50; // Default to 50
  };

  const handleScoreChange = (studentId: string, judgeId: string, value: number) => {
    updateScore(currentEvent.id, studentId, judgeId, value);
  };

  const handleNext = () => {
    if (activeStudentIndex < students.length - 1) {
      setActiveStudentIndex(activeStudentIndex + 1);
      window.scrollTo(0, 0);
    } else {
      navigate('/results');
    }
  };

  const handlePrevious = () => {
    if (activeStudentIndex > 0) {
      setActiveStudentIndex(activeStudentIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleJumpToStudent = (index: number) => {
    setActiveStudentIndex(index);
    window.scrollTo(0, 0);
  };

  const isScoreComplete = (studentId: string): boolean => {
    return judges.every((judge) =>
      scores.some((s) => s.studentId === studentId && s.judgeId === judge.id)
    );
  };

  const progress = students.filter((student) => 
    isScoreComplete(student.id)
  ).length / students.length;

  return (
    <Layout title="Scoring">
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-500 mb-2">
            Overall Progress: {Math.round(progress * 100)}% complete
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
        </div>

        {activeStudent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex justify-between items-center">
                <span>Scoring: {activeStudent.name}</span>
                <span className="text-sm text-gray-500">
                  Participant {activeStudentIndex + 1} of {students.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {judges.map((judge) => (
                  <div key={judge.id} className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Judge: {judge.name}</Label>
                      <span className="font-bold text-lg">
                        {getScore(activeStudent.id, judge.id)}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[getScore(activeStudent.id, judge.id)]}
                      onValueChange={(value) =>
                        handleScoreChange(activeStudent.id, judge.id, value[0])
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={activeStudentIndex === 0}
          >
            Previous
          </Button>

          <div className="flex-1 mx-4">
            <div className="flex flex-wrap justify-center gap-2">
              {students.map((student, index) => (
                <Button
                  key={student.id}
                  variant={activeStudentIndex === index ? "default" : "outline"}
                  size="sm"
                  className={`${
                    isScoreComplete(student.id) ? "bg-green-100" : ""
                  }`}
                  onClick={() => handleJumpToStudent(index)}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleNext}>
            {activeStudentIndex < students.length - 1 ? "Next" : "View Results"}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Scoring;
