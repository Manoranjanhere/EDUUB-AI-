import { jsPDF } from 'jspdf';
// Add font import for better styling
import 'jspdf/dist/polyfills.es.js';
// Import the autotable plugin
import autoTable from 'jspdf-autotable';

export const generateStudentPDF = (studentData) => {
  try {
    console.log("Generating PDF with data:", studentData);
    
    // Create a new document
    const doc = new jsPDF();
    
    // Add autoTable plugin manually if needed
    if (typeof doc.autoTable !== 'function') {
      console.log("Adding autoTable function to jsPDF");
      doc.autoTable = autoTable;
    }
    
    // Get page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add title header
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('EDUUB Learning Progress Report', 14, 10);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 16);
    
    // Stats summary header
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(14);
    doc.text('Learning Summary', 14, 35);
    
    // Prepare stats data safely
    const stats = studentData?.stats || {
      formattedTotalTime: '00:00:00',
      totalVideos: 0,
      videosCompleted: 0,
      totalQuestionsAsked: 0,
      totalQuestions: 0
    };
    
    const statsData = [
      ['Total Watch Time', stats.formattedTotalTime || '00:00:00'],
      ['Videos Watched', (stats.totalVideos || 0).toString()],
      ['Videos Completed', (stats.videosCompleted || 0).toString()],
      ['Completion Rate', `${Math.round(((stats.videosCompleted || 0) / Math.max(stats.totalVideos || 1, 1)) * 100)}%`],
      ['Questions Asked', (stats.totalQuestionsAsked || stats.totalQuestions || 0).toString()]
    ];
    
    // Generate stats table
    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: statsData,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 183, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        font: 'helvetica',
        overflow: 'linebreak',
        cellPadding: 5
      }
    });
    
    // Top videos section
    const yPos1 = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('Most Watched Videos', 14, yPos1);
    
    // Get top videos data safely
    const topVideos = studentData?.topVideos || [];
    const topVideosData = topVideos.length > 0 
      ? topVideos.map(video => [
          video.title || 'Unknown',
          `${Math.round((video.watchTime || 0) / 60 * 10) / 10} minutes`,
          (video.questionsAsked || 0).toString()
        ])
      : [['No data available', '', '']];
    
    // Generate top videos table
    autoTable(doc, {
      startY: yPos1 + 5,
      head: [['Video Title', 'Watch Time', 'Questions Asked']],
      body: topVideosData,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 183, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 }
      }
    });
    
    // All videos section
    const yPos2 = doc.lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text('All Videos Activity', 14, yPos2);
    
    // Get video engagement data safely
    const videoEngagement = studentData?.videoEngagement || [];
    const videosData = videoEngagement.length > 0
      ? videoEngagement.map(video => [
          video.title || 'Unknown',
          `${Math.round((video.watchTime || 0) / 60 * 10) / 10} min`,
          (video.questionsAsked || 0).toString(),
          video.completed ? 'Yes' : 'No',
          video.lastWatched ? new Date(video.lastWatched).toLocaleDateString() : 'N/A'
        ])
      : [['No data available', '', '', '', '']];
    
    // Generate all videos table
    autoTable(doc, {
      startY: yPos2 + 5,
      head: [['Video Title', 'Watch Time', 'Questions', 'Completed', 'Last Watched']],
      body: videosData,
      theme: 'grid',
      headStyles: { 
        fillColor: [0, 183, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 }
      }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`EDUUB Learning Progress - Page ${i} of ${pageCount}`, 14, pageHeight - 10);
      doc.text('© ' + new Date().getFullYear() + ' EDUUB', pageWidth - 30, pageHeight - 10);
    }
    
    // Save the PDF
    doc.save('learning-progress-report.pdf');
    console.log("PDF generated successfully");
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('There was an error generating your PDF report. Please try again later.');
  }
};

export default generateStudentPDF;