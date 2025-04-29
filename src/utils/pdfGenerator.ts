
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Event } from "@/types";
import { calculateStudentScores } from "./scoreCalculations";

export const generatePDF = async (event: Event): Promise<void> => {
  const doc = new jsPDF();
  const results = calculateStudentScores(event.students, event.scores);
  
  // Add judge names to results
  const resultsWithJudgeNames = results.map(result => {
    return {
      ...result,
      judgeRanks: result.judgeRanks.map(judgeRank => {
        const judge = event.judges.find(j => j.id === judgeRank.judgeId);
        return {
          ...judgeRank,
          judgeName: judge ? judge.name : judgeRank.judgeId
        };
      })
    };
  });
  
  // Add title
  doc.setFontSize(20);
  doc.text(`Event Results: ${event.name}`, 14, 22);
  
  // Add date
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  // Add participant and judge count with judge names
  doc.text(`Participants: ${event.students.length} | Judges: ${event.judges.length}`, 14, 38);
  
  // List judge names
  doc.setFontSize(10);
  const judgeNames = event.judges.map(judge => judge.name).join(", ");
  doc.text(`Judges: ${judgeNames}`, 14, 46);
  
  // Create ranking table with judge-specific ranks
  const headers = [
    [
      'Final Rank', 
      'Participant', 
      ...event.judges.map(judge => `${judge.name} Score`),
      ...event.judges.map(judge => `R(${judge.name})`),
      'Sum of Ranks',
      'Average Score'
    ]
  ];
  
  const data = resultsWithJudgeNames
    .sort((a, b) => a.rank - b.rank)
    .map(result => {
      const rowData = [
        result.rank.toString(),
        result.student.name,
      ];
      
      // Add scores for each judge
      event.judges.forEach(judge => {
        const score = event.scores.find(
          s => s.studentId === result.student.id && s.judgeId === judge.id
        );
        rowData.push(score ? score.value.toString() : '-');
      });
      
      // Add ranks for each judge
      event.judges.forEach(judge => {
        const judgeRank = result.judgeRanks.find(jr => jr.judgeId === judge.id);
        rowData.push(judgeRank ? judgeRank.rank.toFixed(1) : '-');
      });
      
      // Add sum of ranks and average score
      rowData.push(result.totalRank.toFixed(1));
      rowData.push(result.averageScore.toFixed(2));
      
      return rowData;
    });
  
  autoTable(doc, {
    head: headers,
    body: data,
    startY: 54,
    headStyles: { 
      fillColor: [59, 130, 246],
      textColor: 255
    },
    rowPageBreak: 'auto',
    bodyStyles: { valign: 'middle' },
    theme: 'grid'
  });

  // Add scoring table (Excel-like format)
  doc.addPage();
  doc.setFontSize(16);
  doc.text("Scoring Sheet", 14, 20);
  
  const scoreHeaders = [['Participant', ...event.judges.map(j => j.name)]];
  
  const scoreData = event.students.map(student => {
    const row = [student.name];
    
    event.judges.forEach(judge => {
      const score = event.scores.find(
        s => s.studentId === student.id && s.judgeId === judge.id
      );
      
      row.push(score ? score.value.toString() : '-');
    });
    
    return row;
  });
  
  autoTable(doc, {
    head: scoreHeaders,
    body: scoreData,
    startY: 30,
    headStyles: { 
      fillColor: [59, 130, 246],
      textColor: 255
    },
    theme: 'grid'
  });

  // Save PDF
  doc.save(`${event.name.replace(/\s+/g, '_')}_results.pdf`);
};
