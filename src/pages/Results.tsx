
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useEvent } from '@/context/EventContext';
import { calculateStudentScores } from '@/utils/scoreCalculations';
import { calculateGeneralRanking } from '@/utils/generalRankingMethod';
import { generatePDF } from '@/utils/pdfGenerator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface JudgeRank {
  judgeId: string;
  judgeName: string;
  rank: number;
}

interface StudentResult {
  student: {
    id: string;
    name: string;
  };
  totalScore: number;
  averageScore: number;
  judgeRanks: JudgeRank[];
  totalRank: number;
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

    // Calculate results with judge ranks based on the configured ranking method
    let calculatedResults = currentEvent.rankingMethod === "general"
      ? calculateGeneralRanking(currentEvent.students, currentEvent.scores)
      : calculateStudentScores(currentEvent.students, currentEvent.scores);
    
    // Add judge names to the results
    calculatedResults = calculatedResults.map(result => {
      return {
        ...result,
        judgeRanks: result.judgeRanks.map(judgeRank => {
          const judge = currentEvent.judges.find(j => j.id === judgeRank.judgeId);
          return {
            ...judgeRank,
            judgeName: judge ? judge.name : judgeRank.judgeId
          };
        })
      };
    });
    
    setResults(calculatedResults);
  }, [currentEvent, navigate, toast]);

  if (!currentEvent) return null;

  // Display which ranking method is being used
  const rankingMethodName = currentEvent.rankingMethod === "general" 
    ? "General Ranking Method" 
    : "Spearman's Ranking Method";

  return (
    <Layout title="Results">
      <div className="space-y-6">
        {/* Event information */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-medium">{currentEvent.name}</h3>
            <p className="text-gray-500">{currentEvent.school || 'School not specified'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Maximum marks: {currentEvent.maxMarks || 100}</p>
            <p className="text-sm text-gray-500">Ranking method: {rankingMethodName}</p>
          </div>
        </div>
        
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">
            Event: {currentEvent.name}
          </h3>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Participant</TableHead>
                  {currentEvent.judges.map(judge => (
                    <TableHead key={judge.id} className="font-bold text-center">
                      {judge.name}
                    </TableHead>
                  ))}
                  {currentEvent.judges.map(judge => (
                    <TableHead key={`rank-${judge.id}`} className="font-bold text-center">
                      R({judge.name})
                    </TableHead>
                  ))}
                  <TableHead className="font-bold text-center">Sum of Ranks</TableHead>
                  <TableHead className="font-bold text-center">Final Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.student.id} className={result.rank === 1 ? "bg-blue-50" : ""}>
                    <TableCell>{result.student.name}</TableCell>
                    
                    {/* Score for each judge */}
                    {currentEvent.judges.map(judge => {
                      const score = currentEvent.scores.find(
                        s => s.studentId === result.student.id && s.judgeId === judge.id
                      );
                      return (
                        <TableCell key={`score-${judge.id}`} className="text-center">
                          {score ? score.value : "nil"}
                        </TableCell>
                      );
                    })}
                    
                    {/* Rank given by each judge */}
                    {currentEvent.judges.map(judge => {
                      const judgeRank = result.judgeRanks.find(
                        jr => jr.judgeId === judge.id
                      );
                      return (
                        <TableCell key={`rank-${judge.id}`} className="text-center">
                          {judgeRank ? judgeRank.rank.toFixed(1) : "-"}
                        </TableCell>
                      );
                    })}
                    
                    <TableCell className="text-center font-medium">
                      {result.totalRank.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {Math.floor(result.rank)}
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
