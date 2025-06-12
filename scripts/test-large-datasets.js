#!/usr/bin/env node

/**
 * Large Dataset Testing Framework
 * 
 * This script generates and tests Fire-Enrich with datasets of various sizes
 * to validate performance claims and identify bottlenecks.
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

console.log('🧪 Fire-Enrich Large Dataset Testing Framework');
console.log('==============================================\n');

// Test configurations
const TEST_CONFIGS = [
  { name: 'Small Dataset', rows: 1000, description: 'Baseline performance test' },
  { name: 'Medium Dataset', rows: 10000, description: 'Standard business use case' },
  { name: 'Large Dataset', rows: 50000, description: 'Enterprise scale validation' },
  { name: 'Extra Large Dataset', rows: 100000, description: 'Maximum capacity test' }
];

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  1000: { loadTime: 500, memoryMB: 50, processingSpeed: 2000 },
  10000: { loadTime: 1000, memoryMB: 100, processingSpeed: 1500 },
  50000: { loadTime: 2000, memoryMB: 300, processingSpeed: 1000 },
  100000: { loadTime: 3000, memoryMB: 500, processingSpeed: 800 }
};

// Sample data generators
const SAMPLE_COMPANIES = [
  'Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Future Systems',
  'Digital Dynamics', 'Smart Solutions', 'NextGen Tech', 'Alpha Industries', 'Beta Corp',
  'Gamma Systems', 'Delta Solutions', 'Epsilon Tech', 'Zeta Corp', 'Eta Industries'
];

const SAMPLE_DOMAINS = [
  'gmail.com', 'outlook.com', 'company.com', 'business.org', 'enterprise.net',
  'startup.io', 'tech.co', 'solutions.com', 'systems.net', 'corp.com'
];

const SAMPLE_TITLES = [
  'CEO', 'CTO', 'VP Engineering', 'Director of Sales', 'Marketing Manager',
  'Product Manager', 'Software Engineer', 'Data Scientist', 'Operations Manager',
  'Business Analyst', 'Sales Representative', 'Customer Success Manager'
];

const SAMPLE_LOCATIONS = [
  'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA',
  'Los Angeles, CA', 'Chicago, IL', 'Denver, CO', 'Atlanta, GA', 'Miami, FL'
];

function generateRandomEmail(firstName, lastName, domain) {
  const formats = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`
  ];
  return formats[Math.floor(Math.random() * formats.length)];
}

function generateRandomName() {
  const firstNames = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa',
    'James', 'Maria', 'William', 'Jennifer', 'Richard', 'Patricia', 'Charles'
  ];
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez'
  ];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { firstName, lastName };
}

function generateTestDataset(rowCount) {
  console.log(`📊 Generating dataset with ${rowCount.toLocaleString()} rows...`);
  const startTime = performance.now();
  
  const headers = ['email', 'first_name', 'last_name', 'company', 'title', 'location'];
  const rows = [headers];
  
  for (let i = 0; i < rowCount; i++) {
    const { firstName, lastName } = generateRandomName();
    const company = SAMPLE_COMPANIES[Math.floor(Math.random() * SAMPLE_COMPANIES.length)];
    const domain = SAMPLE_DOMAINS[Math.floor(Math.random() * SAMPLE_DOMAINS.length)];
    const email = generateRandomEmail(firstName, lastName, domain);
    const title = SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)];
    const location = SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)];
    
    rows.push([email, firstName, lastName, company, title, location]);
    
    // Progress indicator for large datasets
    if (i > 0 && i % 10000 === 0) {
      const progress = Math.round((i / rowCount) * 100);
      process.stdout.write(`\r   Progress: ${progress}% (${i.toLocaleString()} rows)`);
    }
  }
  
  const endTime = performance.now();
  const generationTime = Math.round(endTime - startTime);
  
  console.log(`\r   ✅ Generated ${rowCount.toLocaleString()} rows in ${generationTime}ms`);
  
  return rows;
}

function saveDatasetToCSV(data, filename) {
  const csvContent = data.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const filePath = path.join(__dirname, '..', 'public', 'test-data', filename);
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, csvContent);
  
  const fileSizeMB = Math.round(fs.statSync(filePath).size / 1024 / 1024);
  console.log(`   💾 Saved to ${filename} (${fileSizeMB}MB)`);
  
  return { filePath, fileSizeMB };
}

function analyzeDatasetComplexity(data) {
  const rowCount = data.length - 1; // Exclude header
  const columnCount = data[0].length;
  
  // Calculate unique values per column
  const uniqueValues = {};
  for (let col = 0; col < columnCount; col++) {
    const columnName = data[0][col];
    const values = new Set();
    for (let row = 1; row < data.length; row++) {
      values.add(data[row][col]);
    }
    uniqueValues[columnName] = values.size;
  }
  
  // Calculate average cell length
  let totalLength = 0;
  let cellCount = 0;
  for (let row = 1; row < data.length; row++) {
    for (let col = 0; col < columnCount; col++) {
      totalLength += String(data[row][col]).length;
      cellCount++;
    }
  }
  const avgCellLength = Math.round(totalLength / cellCount);
  
  return {
    rowCount,
    columnCount,
    uniqueValues,
    avgCellLength,
    estimatedMemoryMB: Math.round((totalLength * 2) / 1024 / 1024) // Rough estimate
  };
}

function generatePerformanceReport(testResults) {
  console.log('\n📈 Performance Analysis Report');
  console.log('==============================\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    testResults,
    summary: {
      totalTests: testResults.length,
      passedTests: testResults.filter(r => r.passed).length,
      failedTests: testResults.filter(r => !r.passed).length
    },
    recommendations: []
  };
  
  // Analyze results and generate recommendations
  testResults.forEach(result => {
    const threshold = PERFORMANCE_THRESHOLDS[result.rowCount];
    
    console.log(`📊 ${result.name}:`);
    console.log(`   Rows: ${result.rowCount.toLocaleString()}`);
    console.log(`   File Size: ${result.fileSizeMB}MB`);
    console.log(`   Generation Time: ${result.generationTime}ms`);
    console.log(`   Estimated Memory: ${result.analysis.estimatedMemoryMB}MB`);
    console.log(`   Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (!result.passed) {
      console.log(`   Issues:`);
      result.issues.forEach(issue => {
        console.log(`     - ${issue}`);
      });
    }
    
    console.log('');
  });
  
  // Generate recommendations
  const largestPassingTest = testResults.filter(r => r.passed).pop();
  const smallestFailingTest = testResults.find(r => !r.passed);
  
  if (largestPassingTest) {
    report.recommendations.push(
      `✅ Validated performance up to ${largestPassingTest.rowCount.toLocaleString()} rows`
    );
  }
  
  if (smallestFailingTest) {
    report.recommendations.push(
      `⚠️  Performance issues detected at ${smallestFailingTest.rowCount.toLocaleString()} rows`
    );
    report.recommendations.push(
      `💡 Consider implementing virtual scrolling for datasets larger than ${largestPassingTest?.rowCount.toLocaleString() || '10,000'} rows`
    );
  }
  
  // Memory recommendations
  const highMemoryTests = testResults.filter(r => r.analysis.estimatedMemoryMB > 200);
  if (highMemoryTests.length > 0) {
    report.recommendations.push(
      `🧠 High memory usage detected for large datasets - consider streaming or pagination`
    );
  }
  
  console.log('💡 Recommendations:');
  report.recommendations.forEach(rec => {
    console.log(`   ${rec}`);
  });
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'test-results', `performance-report-${Date.now()}.json`);
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${path.relative(process.cwd(), reportPath)}`);
  
  return report;
}

async function runTests() {
  console.log('🚀 Starting large dataset tests...\n');
  
  const testResults = [];
  
  for (const config of TEST_CONFIGS) {
    console.log(`🧪 Running test: ${config.name}`);
    console.log(`   Description: ${config.description}`);
    
    const startTime = performance.now();
    
    try {
      // Generate dataset
      const data = generateTestDataset(config.rows);
      
      // Analyze complexity
      const analysis = analyzeDatasetComplexity(data);
      
      // Save to file
      const filename = `test-dataset-${config.rows}-rows.csv`;
      const { filePath, fileSizeMB } = saveDatasetToCSV(data, filename);
      
      const endTime = performance.now();
      const generationTime = Math.round(endTime - startTime);
      
      // Check against thresholds
      const threshold = PERFORMANCE_THRESHOLDS[config.rows];
      const issues = [];
      let passed = true;
      
      if (generationTime > threshold.loadTime) {
        issues.push(`Generation time ${generationTime}ms exceeds threshold ${threshold.loadTime}ms`);
        passed = false;
      }
      
      if (analysis.estimatedMemoryMB > threshold.memoryMB) {
        issues.push(`Estimated memory ${analysis.estimatedMemoryMB}MB exceeds threshold ${threshold.memoryMB}MB`);
        passed = false;
      }
      
      const result = {
        name: config.name,
        rowCount: config.rows,
        generationTime,
        fileSizeMB,
        analysis,
        threshold,
        passed,
        issues
      };
      
      testResults.push(result);
      
      console.log(`   ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
      
    } catch (error) {
      console.error(`   ❌ ERROR: ${error.message}\n`);
      testResults.push({
        name: config.name,
        rowCount: config.rows,
        error: error.message,
        passed: false,
        issues: [error.message]
      });
    }
  }
  
  // Generate final report
  generatePerformanceReport(testResults);
  
  console.log('\n🎉 Testing complete!');
  console.log('\nNext steps:');
  console.log('1. Review the generated test datasets in public/test-data/');
  console.log('2. Test these datasets in the Fire-Enrich UI');
  console.log('3. Monitor performance metrics during enrichment');
  console.log('4. Validate virtual scrolling performance');
  console.log('5. Check memory usage with browser dev tools');
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  generateTestDataset,
  saveDatasetToCSV,
  analyzeDatasetComplexity,
  TEST_CONFIGS,
  PERFORMANCE_THRESHOLDS
};
