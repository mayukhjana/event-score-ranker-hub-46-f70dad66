
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Event, Judge, ScoringColumn } from "@/types";
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
  
  // Create header array with additional columns if they exist
  const additionalColumnHeaders = event.scoringColumns && event.scoringColumns.length > 0
    ? event.scoringColumns.sort((a, b) => a.order - b.order).map(col => col.name)
    : [];

  // Create ranking table with judge-specific ranks
  const headers = [
    [
      'Participant', 
      ...event.judges.map(judge => `${judge.name}`),
      ...event.judges.map(judge => `R(${judge.name})`),
      ...additionalColumnHeaders,
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
    
    // Add empty cells for additional columns (to be filled manually or in future versions)
    if (event.scoringColumns) {
      event.scoringColumns.forEach(() => {
        rowData.push('-');
      });
    }
    
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
  
  const scoreHeaders = [['Participant', ...event.judges.map(j => j.name), ...additionalColumnHeaders]];
  
  const scoreData = event.students.map(student => {
    const row = [student.name];
    
    event.judges.forEach(judge => {
      const score = event.scores.find(
        s => s.studentId === student.id && s.judgeId === judge.id
      );
      
      row.push(score ? score.value.toString() : 'nil');
    });
    
    // Add empty cells for additional columns
    if (event.scoringColumns) {
      event.scoringColumns.forEach(() => {
        row.push('-');
      });
    }
    
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

// Updated function to generate individual scoring sheets for each judge
export const generateJudgeScoringSheets = (event: Event): void => {
  // Create one PDF with multiple pages - one page per judge
  const doc = new jsPDF();
  
  // Get the sorted scoring columns if they exist
  const scoringColumns = event.scoringColumns && event.scoringColumns.length > 0
    ? [...event.scoringColumns].sort((a, b) => a.order - b.order)
    : [];
  
  // First add a cover page
  doc.setFontSize(24);
  doc.text(`Scoring Sheets: ${event.name}`, 14, 30, { align: 'left', maxWidth: 180 });
  
  doc.setFontSize(16);
  doc.text(`School: ${event.school || 'Not specified'}`, 14, 50, { maxWidth: 180 });
  doc.text(`Maximum Marks: ${event.maxMarks}`, 14, 60);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 70);
  doc.text(`Total Judges: ${event.judges.length}`, 14, 80);
  doc.text(`Total Participants: ${event.students.length}`, 14, 90);
  
  // Add scoring columns info if they exist
  if (scoringColumns.length > 0) {
    doc.text(`Additional Scoring Columns: ${scoringColumns.length}`, 14, 100);
    let yOffset = 110;
    for (let i = 0; i < scoringColumns.length; i++) {
      doc.setFontSize(12);
      
      // Handle line wrapping for long column names
      const textLines = doc.splitTextToSize(`${i + 1}. ${scoringColumns[i].name}`, 170);
      doc.text(textLines, 24, yOffset);
      yOffset += 10 * (textLines.length || 1);
      
      // Ensure we don't go off the page
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }
    }
    doc.setFontSize(16);
  }
  
  // Add content at the bottom part of the page, make sure it's visible
  const contentStartY = Math.min(scoringColumns.length > 0 ? 130 + (scoringColumns.length * 10) : 130, 240);
  doc.setFontSize(12);
  doc.text("This document contains individual scoring sheets for each judge.", 14, contentStartY);
  doc.text("Please distribute the respective pages to each judge.", 14, contentStartY + 10);
  
  // For each judge, create a separate page with their scoring sheet
  event.judges.forEach((judge: Judge, index: number) => {
    doc.addPage();
    
    // Page header
    doc.setFontSize(16);
    doc.text(`Judge Scoring Sheet: ${judge.name}`, 14, 20, { maxWidth: 180 });
    
    doc.setFontSize(12);
    doc.text(`Event: ${event.name}`, 14, 30, { maxWidth: 180 });
    doc.text(`School: ${event.school || 'Not specified'}`, 14, 38, { maxWidth: 180 });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 46);
    doc.text(`Maximum Marks: ${event.maxMarks}`, 14, 54);
    
    // Create headers for the scoring table, with "Marks" at the end
    const headers = [['Participant']];
    
    // Add additional column headers if they exist
    if (scoringColumns.length > 0) {
      headers[0].push(...scoringColumns.map(col => col.name));
    }
    
    // Add marks column at the end
    headers[0].push(`Marks (out of ${event.maxMarks})`);
    
    // Create data rows
    const data = event.students.map(student => {
      // Start with participant name
      const row = [student.name];
      
      // Add empty cells for additional columns if they exist
      if (scoringColumns.length > 0) {
        scoringColumns.forEach(() => {
          row.push(''); // Empty cell for each additional column
        });
      }
      
      // Add empty cell for marks column
      row.push('');
      
      return row;
    });
    
    // Calculate column widths with marks at the end
    const columnStyles: { [key: number]: { cellWidth: number } } = {
      0: { cellWidth: 50 },  // Participant name column
    };
    
    // Set widths for additional columns to make them wider
    if (scoringColumns.length > 0) {
      // Calculate available width
      const totalPageWidth = 180;  // Increased to use more of the page width
      const participantColumnWidth = 50;
      const marksColumnWidth = 30;
      
      // Distribute remaining width among scoring columns
      const remainingWidth = totalPageWidth - participantColumnWidth - marksColumnWidth;
      const columnCount = scoringColumns.length;
      const scoringColumnWidth = Math.max(30, remainingWidth / columnCount);
      
      // Set width for each scoring column
      scoringColumns.forEach((_, i) => {
        columnStyles[i + 1] = { cellWidth: scoringColumnWidth };
      });
      
      // Set width for marks column (last column)
      columnStyles[1 + scoringColumns.length] = { cellWidth: marksColumnWidth };
    } else {
      // No additional columns, just marks
      columnStyles[1] = { cellWidth: 130 };
    }
    
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 65,
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: 255
      },
      columnStyles: columnStyles,
      rowPageBreak: 'auto',
      bodyStyles: { valign: 'middle' },
      theme: 'grid',
      margin: { left: 14, right: 14 },  // Ensure margins are small enough to fit the page
      tableWidth: 'auto'  // Ensure the table fits the page
    });
    
    // Add signature field
    doc.setFontSize(11);
    doc.text('Judge Signature: _______________________', 14, doc.internal.pageSize.height - 25);
    doc.text(`Page ${index + 1} of ${event.judges.length}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10);
  });

  // Save PDF
  doc.save(`${event.name.replace(/\s+/g, '_')}_judge_scoring_sheets.pdf`);
};

