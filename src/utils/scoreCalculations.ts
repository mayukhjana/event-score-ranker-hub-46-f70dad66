
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
  
  // Calculate judge names map for easier lookup
  const judgeNamesMap: {[key: string]: string} = {};
  const uniqueJudges = Array.from(
    scores.reduce((map, score) => {
      map.set(score.judgeId, score.judgeId);
      return map;
    }, new Map())
  ).map(judgeId => {
    // This is a placeholder - the actual judge name would come from event.judges
    return judgeId;
  });
  
  // Calculate scores and ranks per judge
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
    
    // Assign ranks (handling ties)
    let currentRank = 1;
    let previousScore = null;
    let tiedStudents = 0;
    let rankSum = 0;
    
    judgeRanks[judgeId] = {};
    
    // Process each student for this judge
    for (let i = 0; i < scoreArray.length; i++) {
      const { studentId, score } = scoreArray[i];
      
      if (previousScore !== null && score < previousScore) {
        // New rank
        currentRank = i + 1;
        tiedStudents = 0;
        rankSum = currentRank;
      } else if (previousScore !== null && score === previousScore) {
        // Tied with previous student(s)
        tiedStudents++;
        rankSum += i + 1;
      }
      
      // Assign rank (for ties, use average rank)
      judgeRanks[judgeId][studentId] = tiedStudents > 0 
        ? rankSum / (tiedStudents + 1) 
        : currentRank;
      
      previousScore = score;
    }
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
      judgeName: judgeNamesMap[judgeId] || judgeId,
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
  
  // Sort by totalRank (lowest sum of ranks first) and assign final ranks
  const sortedResults = [...results].sort((a, b) => a.totalRank - b.totalRank);
  
  let currentRank = 1;
  let previousRankSum = null;
  let tiedStudents = 0;
  let rankSum = 0;
  
  // Assign final ranks (handling ties)
  sortedResults.forEach((result, index) => {
    if (previousRankSum !== null && result.totalRank > previousRankSum) {
      // New rank
      currentRank = index + 1;
      tiedStudents = 0;
      rankSum = currentRank;
    } else if (previousRankSum !== null && result.totalRank === previousRankSum) {
      // Tied with previous student(s)
      tiedStudents++;
      rankSum += index + 1;
    }
    
    const studentIndex = results.findIndex(r => r.student.id === result.student.id);
    if (studentIndex !== -1) {
      results[studentIndex].rank = tiedStudents > 0 
        ? rankSum / (tiedStudents + 1) 
        : currentRank;
    }
    
    previousRankSum = result.totalRank;
  });
  
  return results;
};
