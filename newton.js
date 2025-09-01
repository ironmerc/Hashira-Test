const fs = require('fs');

// Function to convert a number from any base to decimal
function convertToDecimal(value, base) {
    const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    let result = 0;
    let power = 0;
    
    // Process from right to left
    for (let i = value.length - 1; i >= 0; i--) {
        const digit = value[i].toLowerCase();
        const digitValue = digits.indexOf(digit);
        
        if (digitValue === -1 || digitValue >= base) {
            throw new Error(`Invalid digit '${digit}' for base ${base}`);
        }
        
        result += digitValue * Math.pow(base, power);
        power++;
    }
    
    return result;
}

// Newton's Divided Differences method
class NewtonInterpolation {
    constructor(points) {
        this.points = points;
        this.n = points.length;
        this.dividedDiffTable = [];
        this.buildDividedDifferenceTable();
    }
    
    buildDividedDifferenceTable() {
        // Initialize table with n rows and n columns
        for (let i = 0; i < this.n; i++) {
            this.dividedDiffTable[i] = new Array(this.n).fill(0);
        }
        
        // Fill first column with y-values
        for (let i = 0; i < this.n; i++) {
            this.dividedDiffTable[i][0] = this.points[i][1]; // y-value
        }
        
        // Build the divided difference table
        for (let j = 1; j < this.n; j++) {
            for (let i = 0; i < this.n - j; i++) {
                const x_i = this.points[i][0];
                const x_i_plus_j = this.points[i + j][0];
                
                this.dividedDiffTable[i][j] = 
                    (this.dividedDiffTable[i + 1][j - 1] - this.dividedDiffTable[i][j - 1]) / 
                    (x_i_plus_j - x_i);
            }
        }
    }
    
    // Print the divided difference table for verification
    printTable() {
        console.log("\nNewton's Divided Difference Table:");
        console.log("x_i    f[x_i]     ", 
            Array.from({length: this.n - 1}, (_, i) => `f[x0..x${i + 1}]`).join("    "));
        
        for (let i = 0; i < this.n; i++) {
            let row = `${this.points[i][0]}      `;
            for (let j = 0; j < this.n - i; j++) {
                row += `${this.dividedDiffTable[i][j].toFixed(6)}    `;
            }
            console.log(row);
        }
        
        // Show Newton form
        console.log("\nNewton's Interpolating Polynomial:");
        let polynomial = `P(x) = ${this.dividedDiffTable[0][0]}`;
        for (let i = 1; i < this.n; i++) {
            polynomial += ` + ${this.dividedDiffTable[0][i]}`;
            for (let j = 0; j < i; j++) {
                polynomial += `(x-${this.points[j][0]})`;
            }
        }
        console.log(polynomial);
    }
    
    // Evaluate polynomial at x=0 to get the secret
    evaluateAtZero() {
        let result = this.dividedDiffTable[0][0]; // f[x0]
        let product = 1;
        
        for (let i = 1; i < this.n; i++) {
            // Multiply by (0 - x_{i-1}) for each previous point
            product *= (0 - this.points[i - 1][0]);
            result += this.dividedDiffTable[0][i] * product;
        }
        
        return Math.round(result);
    }
}

// Alternative method: Matrix-based Gaussian Elimination
function gaussianEliminationMethod(points, k) {
    console.log("\n=== Using Gaussian Elimination Method ===");
    
    const matrix = [];
    const rhs = [];
    
    // Build Vandermonde matrix: [x^0, x^1, x^2, ..., x^(k-1)]
    for (let i = 0; i < k; i++) {
        const [x, y] = points[i];
        const row = [];
        
        for (let j = 0; j < k; j++) {
            row.push(Math.pow(x, j)); // x^j
        }
        
        matrix.push(row);
        rhs.push(y);
    }
    
    console.log("Vandermonde Matrix:");
    matrix.forEach((row, i) => {
        console.log(`[${row.join(", ")}] | ${rhs[i]}`);
    });
    
    // Forward elimination
    for (let i = 0; i < k; i++) {
        // Find pivot
        let maxRow = i;
        for (let k_idx = i + 1; k_idx < k; k_idx++) {
            if (Math.abs(matrix[k_idx][i]) > Math.abs(matrix[maxRow][i])) {
                maxRow = k_idx;
            }
        }
        
        // Swap rows
        [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];
        [rhs[i], rhs[maxRow]] = [rhs[maxRow], rhs[i]];
        
        // Eliminate column
        for (let k_idx = i + 1; k_idx < k; k_idx++) {
            const factor = matrix[k_idx][i] / matrix[i][i];
            for (let j = i; j < k; j++) {
                matrix[k_idx][j] -= factor * matrix[i][j];
            }
            rhs[k_idx] -= factor * rhs[i];
        }
    }
    
    // Back substitution
    const coefficients = new Array(k).fill(0);
    for (let i = k - 1; i >= 0; i--) {
        coefficients[i] = rhs[i];
        for (let j = i + 1; j < k; j++) {
            coefficients[i] -= matrix[i][j] * coefficients[j];
        }
        coefficients[i] /= matrix[i][i];
    }
    
    console.log("Polynomial coefficients (a0, a1, a2, ...):", coefficients);
    console.log("Constant term (secret) from Gaussian elimination:", Math.round(coefficients[0]));
    
    return Math.round(coefficients[0]);
}

// Barycentric Lagrange Interpolation (more numerically stable)
function barycentricLagrange(points, k) {
    console.log("\n=== Using Barycentric Lagrange Method ===");
    
    const selectedPoints = points.slice(0, k);
    
    // Calculate barycentric weights
    const weights = [];
    for (let i = 0; i < k; i++) {
        let weight = 1;
        for (let j = 0; j < k; j++) {
            if (i !== j) {
                weight /= (selectedPoints[i][0] - selectedPoints[j][0]);
            }
        }
        weights.push(weight);
    }
    
    console.log("Barycentric weights:", weights.map(w => w.toFixed(6)));
    
    // Evaluate at x = 0
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < k; i++) {
        const [xi, yi] = selectedPoints[i];
        const term = weights[i] / (0 - xi); // 1/(x - xi) at x=0
        numerator += yi * term;
        denominator += term;
    }
    
    const result = numerator / denominator;
    console.log("Secret from Barycentric Lagrange:", Math.round(result));
    
    return Math.round(result);
}

// Main function to solve the problem using multiple methods
function solveHashiraPlacement(jsonInput) {
    const data = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
    
    const n = parseInt(data.keys.n);
    const k = parseInt(data.keys.k);
    
    console.log(`Number of roots (n): ${n}`);
    console.log(`Minimum roots required (k): ${k}`);
    console.log(`Polynomial degree: ${k-1}\n`);
    
    // Extract and convert all points
    const points = [];
    
    for (let i = 1; i <= n; i++) {
        if (data[i.toString()]) {
            const base = parseInt(data[i.toString()].base);
            const value = data[i.toString()].value;
            
            const decimalValue = convertToDecimal(value, base);
            points.push([i, decimalValue]);
            
            console.log(`Point ${i}: base ${base}, value "${value}" -> decimal ${decimalValue}`);
        }
    }
    
    console.log(`\nTotal points available: ${points.length}`);
    console.log(`Using first ${k} points for interpolation\n`);
    
    const selectedPoints = points.slice(0, k);
    console.log("Selected points:", selectedPoints);
    
    // Method 1: Newton's Divided Differences (Primary method)
    console.log("\n" + "=".repeat(50));
    console.log("METHOD 1: NEWTON'S DIVIDED DIFFERENCES");
    console.log("=".repeat(50));
    
    const newton = new NewtonInterpolation(selectedPoints);
    newton.printTable();
    const newtonSecret = newton.evaluateAtZero();
    console.log(`\nSecret from Newton's method: ${newtonSecret}`);
    
    // Method 2: Gaussian Elimination
    console.log("\n" + "=".repeat(50));
    console.log("METHOD 2: GAUSSIAN ELIMINATION");
    console.log("=".repeat(50));
    
    const gaussianSecret = gaussianEliminationMethod(selectedPoints, k);
    
    // Method 3: Barycentric Lagrange
    console.log("\n" + "=".repeat(50));
    console.log("METHOD 3: BARYCENTRIC LAGRANGE");
    console.log("=".repeat(50));
    
    const barycentricSecret = barycentricLagrange(selectedPoints, k);
    
    // Verify all methods give same result
    console.log("\n" + "=".repeat(50));
    console.log("VERIFICATION");
    console.log("=".repeat(50));
    console.log(`Newton's method result: ${newtonSecret}`);
    console.log(`Gaussian elimination result: ${gaussianSecret}`);
    console.log(`Barycentric Lagrange result: ${barycentricSecret}`);
    
    const allSame = (newtonSecret === gaussianSecret && gaussianSecret === barycentricSecret);
    console.log(`All methods agree: ${allSame ? 'YES' : 'NO'}`);
    
    console.log("\n" + "=".repeat(50));
    console.log(`FINAL ANSWER: The secret (constant term) is: ${newtonSecret}`);
    console.log("=".repeat(50));
    
    return newtonSecret;
}

// Test with both test cases
function runTestCases() {
    // Test Case 1
    const testCase1 = {
        "keys": { "n": 4, "k": 3 },
        "1": { "base": "10", "value": "4" },
        "2": { "base": "2", "value": "111" },
        "3": { "base": "10", "value": "12" },
        "6": { "base": "4", "value": "213" }
    };
    
    // Test Case 2  
    const testCase2 = {
        "keys": { "n": 10, "k": 7 },
        "1": { "base": "6", "value": "13444211440455345511" },
        "2": { "base": "15", "value": "aed7015a346d635" },
        "3": { "base": "15", "value": "6aeeb69631c227c" },
        "4": { "base": "16", "value": "e1b5e05623d881f" },
        "5": { "base": "8", "value": "316034514573652620673" },
        "6": { "base": "3", "value": "2122212201122002221120200210011020220200" },
        "7": { "base": "3", "value": "20120221122211000100210021102001201112121" },
        "8": { "base": "6", "value": "20220554335330240002224253" },
        "9": { "base": "12", "value": "45153788322a1255483" },
        "10": { "base": "7", "value": "1101613130313526312514143" }
    };
    
    console.log("TESTING MULTIPLE POLYNOMIAL RECONSTRUCTION METHODS");
    console.log("===================================================");
    
    console.log("\n🔍 PROCESSING TEST CASE 1 🔍");
    const result1 = solveHashiraPlacement(testCase1);
    
    console.log("\n\n🔍 PROCESSING TEST CASE 2 🔍");
    const result2 = solveHashiraPlacement(testCase2);
    
    console.log("\n📊 FINAL SUMMARY:");
    console.log(`Test Case 1 Secret: ${result1}`);
    console.log(`Test Case 2 Secret: ${result2}`);
}

// Run the test cases
runTestCases();
