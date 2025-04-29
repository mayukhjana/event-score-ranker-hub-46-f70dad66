
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useEvent } from '@/context/EventContext';
import { calculateStudentScores } from '@/utils/scoreCalculations';
import { generatePDF } from '@/utils/pdfGenerator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

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
  const { currentEvent } = useEvent();
  const [results, setResults] = useState<StudentResult[]>([]);

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
      return;
    }

    // Calculate results
    const calculatedResults = calculateStudentScores(currentEvent.students, currentEvent.scores);
    setResults(calculatedResults);
  }, [currentEvent, navigate, toast]);

  if (!currentEvent) return null;

  return (
    <Layout title="Results">
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">
            Event: {currentEvent.name}
          </h3>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Rank</TableHead>
                  <TableHead className="font-bold">Participant</TableHead>
                  <TableHead className="font-bold text-center">Average Score</TableHead>
                  <TableHead className="font-bold text-center">Total Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results
                  .sort((a, b) => a.rank - b.rank)
                  .map((result) => (
                    <TableRow key={result.student.id} className={result.rank === 1 ? "bg-blue-50" : ""}>
                      <TableCell className="font-medium">{result.rank}</TableCell>
                      <TableCell>{result.student.name}</TableCell>
                      <TableCell className="text-center">
                        {result.averageScore.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.totalScore.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => navigate('/scoring')}>
            Back to Scoring
          </Button>
          <Button onClick={async () => {
            if (!currentEvent) return;
            try {
              await generatePDF(currentEvent);
              toast({
                title: "PDF Generated",
                description: "Results have been exported to PDF"
              });
            } catch (error) {
              toast({
                title: "Error generating PDF",
                description: "An error occurred while generating the PDF",
                variant: "destructive"
              });
              console.error(error);
            }
          }}>
            Generate PDF Report
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Results;
