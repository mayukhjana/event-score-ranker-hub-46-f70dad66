
import { Student, Score } from '@/types';

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
  totalRank: number; // Sum of individual judge ranks
  rank: number; // Final overall rank
}

export const calculateStudentScores = (
  students: Student[],
  scores: Score[]
): StudentResult[] => {
  // First, organize scores by judge for ranking purposes
  const judges = [...new Set(scores.map(score => score.judgeId))];
  
  // Calculate scores per judge
  const judgeScores: { [judgeId: string]: { [studentId: string]: number } } = {};
  
  // Initialize judge scores object
  judges.forEach(judgeId => {
    judgeScores[judgeId] = {};
  });
  
  // Populate scores by judge
  scores.forEach(score => {
    if (judgeScores[score.judgeId]) {
      judgeScores[score.judgeId][score.studentId] = score.value;
    }
  });
  
  // Calculate ranks by judge
  const judgeRanks: { [judgeId: string]: { [studentId: string]: number } } = {};
  
  for (const judgeId of judges) {
    const studentScores = judgeScores[judgeId];
    
    // Create array of student IDs and scores for sorting
    const scoreArray = Object.entries(studentScores).map(([studentId, score]) => ({
      studentId,
      score
    }));
    
    // Sort by score (descending)
    scoreArray.sort((a, b) => b.score - a.score);
    
    judgeRanks[judgeId] = {};
    
    // Group by scores to handle ties properly
    const scoreGroups: { [score: number]: string[] } = {};
    scoreArray.forEach(item => {
      if (!scoreGroups[item.score]) {
        scoreGroups[item.score] = [];
      }
      scoreGroups[item.score].push(item.studentId);
    });
    
    // Assign ranks with proper tie handling
    let currentRank = 1;
    
    Object.entries(scoreGroups)
      .sort(([scoreA], [scoreB]) => Number(scoreB) - Number(scoreA))
      .forEach(([_, studentIds]) => {
        // For tied students, assign the same rank (don't average)
        studentIds.forEach(studentId => {
          judgeRanks[judgeId][studentId] = currentRank;
        });
        
        // Move rank pointer past this group
        currentRank += studentIds.length;
      });
  }
  
  // Calculate results for each student
  const results = students.map(student => {
    const studentScores = scores.filter(score => score.studentId === student.id);
    const totalScore = studentScores.reduce((sum, score) => sum + score.value, 0);
    const averageScore = studentScores.length > 0 
      ? totalScore / studentScores.length 
      : 0;
    
    // Get ranks from each judge for this student
    const judgeRankArray: JudgeRank[] = judges.map(judgeId => ({
      judgeId,
      judgeName: judgeId, // Will be replaced with actual judge name later
      rank: judgeRanks[judgeId]?.[student.id] || 0
    }));
    
    // Calculate sum of ranks
    const totalRank = judgeRankArray.reduce((sum, rankObj) => sum + rankObj.rank, 0);
    
    return {
      student: {
        id: student.id,
        name: student.name,
      },
      totalScore,
      averageScore,
      judgeRanks: judgeRankArray,
      totalRank,
      rank: 0, // Placeholder, will be set below
    };
  });
  
  // Group by totalRank to handle final rank ties properly
  const rankGroups: { [totalRank: string]: StudentResult[] } = {};
  results.forEach(result => {
    const key = result.totalRank.toString();
    if (!rankGroups[key]) {
      rankGroups[key] = [];
    }
    rankGroups[key].push(result);
  });
  
  // Assign final ranks with proper tie handling - for ties, all students get the same rank
  let currentRank = 1;
  
  Object.entries(rankGroups)
    .sort(([rankSumA], [rankSumB]) => Number(rankSumA) - Number(rankSumB))
    .forEach(([_, studentsInGroup]) => {
      // Assign the same rank to all students with this total rank sum - no averaging
      studentsInGroup.forEach(result => {
        const studentIndex = results.findIndex(r => r.student.id === result.student.id);
        if (studentIndex !== -1) {
          results[studentIndex].rank = currentRank;
        }
      });
      
      // Move rank pointer past this group
      currentRank += studentsInGroup.length;
    });
  
  return results;
};
