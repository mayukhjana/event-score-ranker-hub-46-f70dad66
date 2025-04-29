
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useEvent } from '@/context/EventContext';

const Scoring = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { eventData, updateScore } = useEvent();
  const { students, judges, scores } = eventData;

  useEffect(() => {
    // Redirect to setup if no event configuration exists
    if (!eventData.eventName || students.length === 0 || judges.length === 0) {
      toast({
        title: "Event not configured",
        description: "Please set up your event first",
        variant: "destructive"
      });
      navigate('/setup');
    }
  }, [eventData, navigate, toast]);

  const handleScoreChange = (studentId: string, judgeId: string, value: string) => {
    const numValue = parseFloat(value);
    
    // Validate score (0-100 range)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      updateScore(studentId, judgeId, numValue);
    }
  };

  const getScoreValue = (studentId: string, judgeId: string): string => {
    const score = scores.find(
      s => s.studentId === studentId && s.judgeId === judgeId
    );
    return score ? score.value.toString() : '';
  };

  const handleViewResults = () => {
    // Count expected scores (students × judges)
    const expectedScores = students.length * judges.length;
    const actualScores = scores.length;
    
    if (actualScores < expectedScores) {
      const missingScores = expectedScores - actualScores;
      toast({
        title: "Missing scores",
        description: `There are ${missingScores} scores missing. Continue anyway?`,
        action: (
          <Button onClick={() => navigate('/results')}>Continue</Button>
        ),
      });
    } else {
      navigate('/results');
    }
  };

  return (
    <Layout title="Score Entry">
      <div className="space-y-6">
        <Card>
          <div className="p-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 border">Participant</th>
                  {judges.map(judge => (
                    <th key={judge.id} className="p-2 border text-center">
                      {judge.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td className="p-2 border font-medium">{student.name}</td>
                    {judges.map(judge => (
                      <td key={judge.id} className="p-2 border">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="Score"
                          value={getScoreValue(student.id, judge.id)}
                          onChange={(e) => 
                            handleScoreChange(student.id, judge.id, e.target.value)
                          }
                          className="text-center"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button onClick={handleViewResults}>
            View Results
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Scoring;
