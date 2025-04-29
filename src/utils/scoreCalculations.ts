
import { Student } from "../types";

interface Score {
  studentId: string;
  judgeId: string;
  value: number;
}

interface StudentScore {
  student: Student;
  totalScore: number;
  averageScore: number;
  rank: number;
}

export const calculateStudentScores = (
  students: Student[],
  scores: Score[]
): StudentScore[] => {
  // Calculate total and average score for each student
  const studentScores = students.map((student) => {
    const studentScores = scores.filter((score) => score.studentId === student.id);
    const totalScore = studentScores.reduce((sum, score) => sum + score.value, 0);
    const averageScore = studentScores.length > 0 
      ? totalScore / studentScores.length 
      : 0;
      
    return {
      student,
      totalScore,
      averageScore,
      rank: 0, // Will be filled in later
    };
  });

  // Sort by average score in descending order
  const sortedScores = [...studentScores].sort((a, b) => b.averageScore - a.averageScore);
  
  // Assign ranks (students with the same score get the same rank)
  let currentRank = 1;
  sortedScores[0].rank = currentRank;
  
  for (let i = 1; i < sortedScores.length; i++) {
    if (sortedScores[i].averageScore < sortedScores[i - 1].averageScore) {
      currentRank = i + 1;
    }
    sortedScores[i].rank = currentRank;
  }

  return sortedScores;
};

export const getStudentScore = (
  studentId: string,
  judgeId: string,
  scores: Score[]
): number | null => {
  const score = scores.find(
    (s) => s.studentId === studentId && s.judgeId === judgeId
  );
  return score ? score.value : null;
};
