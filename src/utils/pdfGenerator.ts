
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Event, Judge } from "@/types";
import { calculateStudentScores } from "./scoreCalculations";
import { calculateGeneralRanking } from "./generalRankingMethod";

export const generatePDF = async (event: Event): Promise<void> => {
  const doc = new jsPDF();
  // Use the appropriate ranking method based on event configuration
  const results = event.rankingMethod === "general" 
    ? calculateGeneralRanking(event.students, event.scores)
    : calculateStudentScores(event.students, event.scores);
  
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
  
  // Add school name
  doc.setFontSize(14);
  doc.text(`School: ${event.school || 'Not specified'}`, 14, 30);
  
  // Add date
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);

  // Add participant and judge count with ranking method
  doc.text(
    `Participants: ${event.students.length} | Judges: ${event.judges.length} | Max Marks: ${event.maxMarks || 100} | Ranking: ${event.rankingMethod === "general" ? "General" : "Spearman's"}`, 
    14, 
    46
  );
  
  // List judge names
  doc.setFontSize(10);
  const judgeNames = event.judges.map(judge => judge.name).join(", ");
  doc.text(`Judges: ${judgeNames}`, 14, 54);
  
  // Create ranking table with judge-specific ranks
  const headers = [
    [
      'Participant', 
      ...event.judges.map(judge => `${judge.name}`),
      ...event.judges.map(judge => `R(${judge.name})`),
      'Sum of Ranks',
      'Final Rank'
    ]
  ];
  
  const data = resultsWithJudgeNames.map(result => {
    const rowData = [
      result.student.name,
    ];
    
    // Add scores for each judge
    event.judges.forEach(judge => {
      const score = event.scores.find(
        s => s.studentId === result.student.id && s.judgeId === judge.id
      );
      rowData.push(score ? score.value.toString() : 'nil');
    });
    
    // Add ranks for each judge
    event.judges.forEach(judge => {
      const judgeRank = result.judgeRanks.find(jr => jr.judgeId === judge.id);
      rowData.push(judgeRank ? judgeRank.rank.toFixed(1) : '-');
    });
    
    // Add sum of ranks and final rank
    rowData.push(result.totalRank.toFixed(1));
    rowData.push(result.rank.toFixed(0)); // Display final rank as whole number
    
    return rowData;
  });
  
  autoTable(doc, {
    head: headers,
    body: data,
    startY: 62,
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
  doc.setFontSize(12);
  doc.text(`Maximum Marks: ${event.maxMarks || 100}`, 14, 28);
  
  const scoreHeaders = [['Participant', ...event.judges.map(j => j.name)]];
  
  const scoreData = event.students.map(student => {
    const row = [student.name];
    
    event.judges.forEach(judge => {
      const score = event.scores.find(
        s => s.studentId === student.id && s.judgeId === judge.id
      );
      
      row.push(score ? score.value.toString() : 'nil');
    });
    
    return row;
  });
  
  autoTable(doc, {
    head: scoreHeaders,
    body: scoreData,
    startY: 36,
    headStyles: { 
      fillColor: [59, 130, 246],
      textColor: 255
    },
    theme: 'grid'
  });

  // Save PDF
  doc.save(`${event.name.replace(/\s+/g, '_')}_results.pdf`);
};

// New function to generate individual scoring sheets for each judge
export const generateJudgeScoringSheets = (event: Event): void => {
  // Create one PDF with multiple pages - one page per judge
  const doc = new jsPDF();
  
  // First add a cover page
  doc.setFontSize(24);
  doc.text(`Scoring Sheets: ${event.name}`, 14, 30, { align: 'left' });
  
  doc.setFontSize(16);
  doc.text(`School: ${event.school || 'Not specified'}`, 14, 50);
  doc.text(`Maximum Marks: ${event.maxMarks}`, 14, 60);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 70);
  doc.text(`Total Judges: ${event.judges.length}`, 14, 80);
  doc.text(`Total Participants: ${event.students.length}`, 14, 90);
  
  doc.setFontSize(12);
  doc.text("This document contains individual scoring sheets for each judge.", 14, 110);
  doc.text("Please distribute the respective pages to each judge.", 14, 120);
  
  // For each judge, create a separate page with their scoring sheet
  event.judges.forEach((judge: Judge, index: number) => {
    doc.addPage();
    
    // Page header
    doc.setFontSize(16);
    doc.text(`Judge Scoring Sheet: ${judge.name}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Event: ${event.name}`, 14, 30);
    doc.text(`School: ${event.school || 'Not specified'}`, 14, 38);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 46);
    doc.text(`Maximum Marks: ${event.maxMarks}`, 14, 54);
    
    // Create scoring table
    const headers = [['Participant', 'Marks (out of ' + event.maxMarks + ')', 'Remarks']];
    
    const data = event.students.map(student => [
      student.name,
      '', // Empty cell for marks
      ''  // Empty cell for remarks
    ]);
    
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 65,
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: 255
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 90 },
      },
      rowPageBreak: 'auto',
      bodyStyles: { valign: 'middle' },
      theme: 'grid'
    });
    
    // Add signature field
    doc.setFontSize(11);
    doc.text('Judge Signature: _______________________', 14, doc.internal.pageSize.height - 25);
    doc.text('Page ' + (index + 1) + ' of ' + event.judges.length, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
  });

  // Save PDF
  doc.save(`${event.name.replace(/\s+/g, '_')}_judge_scoring_sheets.pdf`);
};
