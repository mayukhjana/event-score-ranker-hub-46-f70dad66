
import { Student, Score } from '@/types';

interface StudentResult {
  student: {
    id: string;
    name: string;
  };
  totalScore: number;
  averageScore: number;
  rank: number;
}

export const calculateStudentScores = (
  students: Student[],
  scores: Score[]
): StudentResult[] => {
  // Calculate total and average scores for each student
  const results = students.map(student => {
    const studentScores = scores.filter(score => score.studentId === student.id);
    const totalScore = studentScores.reduce((sum, score) => sum + score.value, 0);
    const averageScore = studentScores.length > 0 
      ? totalScore / studentScores.length 
      : 0;
    
    return {
      student: {
        id: student.id,
        name: student.name,
      },
      totalScore,
      averageScore,
      rank: 0, // Placeholder, will be set below
    };
  });
  
  // Sort by average score (highest first) and assign ranks
  const sortedResults = [...results].sort((a, b) => b.averageScore - a.averageScore);
  
  // Assign ranks (handling ties)
  let currentRank = 1;
  let previousScore = null;
  
  sortedResults.forEach((result, index) => {
    if (previousScore !== null && result.averageScore < previousScore) {
      currentRank = index + 1;
    }
    result.rank = currentRank;
    previousScore = result.averageScore;
  });
  
  return results;
};
