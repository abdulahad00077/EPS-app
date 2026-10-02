const fs = require('fs');

let content = fs.readFileSync('screens/teacher/TeacherWorksheetsScreen.tsx', 'utf8');

// Replace Syllabus -> Worksheets
content = content.replace(/TeacherSyllabusScreen/g, 'TeacherWorksheetsScreen');
content = content.replace(/Syllabus/g, 'Worksheet');
content = content.replace(/syllabus/g, 'worksheets');

// Replace chapter_name with title
content = content.replace(/chapter_name/g, 'title');
content = content.replace(/Chapter Name/g, 'Title');
content = content.replace(/Add Worksheet/g, 'Add Worksheet');

// Update state variable name for new worksheet to newWorksheet
content = content.replace(/newWorksheet/g, 'newWorksheet'); 

// The table is worksheets, not worksheets (wait, it was replaced to worksheets)
// But useRealtimeData will use 'worksheets', which is correct since table is 'worksheets'.
content = content.replace(/'worksheets'/g, "'worksheets'"); 

fs.writeFileSync('screens/teacher/TeacherWorksheetsScreen.tsx', content, 'utf8');
console.log('Done');
