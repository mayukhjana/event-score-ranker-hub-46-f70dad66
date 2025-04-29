
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Event } from "@/types";
import { calculateStudentScores } from "./scoreCalculations";

export const generatePDF = async (event: Event): Promise<void> => {
  const doc = new jsPDF();
  const results = calculateStudentScores(event.students, event.scores);
  
  // Add title
  doc.setFontSize(20);
  doc.text(`Event Results: ${event.name}`, 14, 22);
  
  // Add date
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  // Add participant count and judge count
  doc.text(`Participants: ${event.students.length} | Judges: ${event.judges.length}`, 14, 38);
  
  // Create ranking table
  const headers = [['Rank', 'Participant', 'Average Score', 'Total Score']];
  const data = results
    .sort((a, b) => a.rank - b.rank)
    .map(result => [
      result.rank.toString(),
      result.student.name,
      result.averageScore.toFixed(2),
      result.totalScore.toFixed(2)
    ]);
  
  autoTable(doc, {
    head: headers,
    body: data,
    startY: 45,
    headStyles: { 
      fillColor: [59, 130, 246],
      textColor: 255
    },
    rowPageBreak: 'auto',
    bodyStyles: { valign: 'middle' },
    theme: 'grid'
  });

  // Add individual scores table (scores per judge)
  if (event.judges.length > 0) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Individual Scores by Judge", 14, 20);
    
    const judgeHeaders = [['Participant', ...event.judges.map(j => j.name)]];
    
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
      head: judgeHeaders,
      body: scoreData,
      startY: 30,
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: 255
      },
      theme: 'grid'
    });
  }

  // Save PDF
  doc.save(`${event.name.replace(/\s+/g, '_')}_results.pdf`);
};
