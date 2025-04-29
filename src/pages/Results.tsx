
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useEvent } from '@/context/EventContext';
import { calculateStudentScores } from '@/utils/scoreCalculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StudentResult {
  student: {
    id: string;
    name: string;
  };
  totalScore: number;
  averageScore: number;
  rank: number;
}

const Results = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { eventData } = useEvent();
  const { students, judges, scores } = eventData;
  const [results, setResults] = useState<StudentResult[]>([]);

  useEffect(() => {
    // Redirect to setup if no event configuration exists
    if (!eventData.eventName || students.length === 0 || judges.length === 0) {
      toast({
        title: "Event not configured",
        description: "Please set up your event first",
        variant: "destructive"
      });
      navigate('/setup');
      return;
    }

    // Calculate results
    const calculatedResults = calculateStudentScores(students, scores);
    setResults(calculatedResults);
  }, [eventData, navigate, toast, students, judges, scores]);

  // Format data for the chart
  const chartData = results.map(result => ({
    name: result.student.name,
    score: result.averageScore
  }));

  return (
    <Layout title="Results">
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">
            Event: {eventData.eventName}
          </h3>
          
          <div className="mb-8">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" name="Average Score" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 border">Rank</th>
                  <th className="text-left p-2 border">Participant</th>
                  <th className="text-center p-2 border">Average Score</th>
                  <th className="text-center p-2 border">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {results
                  .sort((a, b) => a.rank - b.rank)
                  .map((result) => (
                    <tr key={result.student.id} className={result.rank === 1 ? "bg-blue-50" : ""}>
                      <td className="p-2 border font-medium">{result.rank}</td>
                      <td className="p-2 border">{result.student.name}</td>
                      <td className="p-2 border text-center">
                        {result.averageScore.toFixed(2)}
                      </td>
                      <td className="p-2 border text-center">
                        {result.totalScore.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate('/scoring')}>
            Back to Scoring
          </Button>
          <Button onClick={() => {
            // Generate and download results as CSV
            const headers = ["Rank", "Participant", "Average Score", "Total Score"];
            const rows = results
              .sort((a, b) => a.rank - b.rank)
              .map(r => [
                r.rank,
                r.student.name,
                r.averageScore.toFixed(2),
                r.totalScore.toFixed(2)
              ]);
            
            const csvContent = [
              headers.join(','),
              ...rows.map(r => r.join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${eventData.eventName.replace(/\s+/g, '_')}_results.csv`);
            link.click();
          }}>
            Export Results
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Results;
