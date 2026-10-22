const fs = require('fs');
const content = fs.readFileSync('src/app/login/page.tsx', 'utf8');

let braceStack = [];
let parenStack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  // Ignore comments simply
  let cleanLine = line.split('//')[0];
  for (let j = 0; j < cleanLine.length; j++) {
    let char = cleanLine[j];
    if (char === '{') {
      braceStack.push({ line: i + 1, col: j + 1 });
    } else if (char === '}') {
      if (braceStack.length === 0) {
        console.log(`Extra closing brace } at line ${i + 1}:${j + 1}`);
      } else {
        braceStack.pop();
      }
    } else if (char === '(') {
      parenStack.push({ line: i + 1, col: j + 1 });
    } else if (char === ')') {
      if (parenStack.length === 0) {
        console.log(`Extra closing parenthesis ) at line ${i + 1}:${j + 1}`);
      } else {
        parenStack.pop();
      }
    }
  }
}

console.log("Outstanding braces opened at lines:", braceStack);
console.log("Outstanding parentheses opened at lines:", parenStack);
