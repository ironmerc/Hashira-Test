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
            throw new Error(Invalid digit '${digit}' for base ${base});
        }
        
        result += digitValue * Math.pow(base, power);
        power++;
    }
    
    return result;
}

// Lagrange interpolation to find the constant term (secret)
function lagrangeInterpolation(points, k) {
    // We only need the first k points
    const selectedPoints = points.slice(0, k);
    
    // Calculate the constant term (f(0)) using Lagrange interpolation
    let secret = 0;
    
    for (let i = 0; i < selectedPoints.length; i++) {
        const [xi, yi] = selectedPoints[i];
        
        // Calculate the Lagrange basis polynomial Li(0)
        let li = 1;
        for (let j = 0; j < selectedPoints.length; j++) {
            if (i !== j) {
                const [xj, yj] = selectedPoints[j];
                li *= (0 - xj) / (xi - xj);
            }
        }
        
        secret += yi * li;
    }
    
    return Math.round(secret);
}

// Main function to solve the problem
function solveHashiraPlacement(jsonInput) {
    const data = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
    
    const n = data.keys.n;
    const k = data.keys.k;
    
    console.log(Number of roots (n): ${n});
    console.log(Minimum roots required (k): ${k});
    console.log(Polynomial degree: ${k-1}\n);
    
    // Extract and convert all points
    const points = [];
    
    for (let i = 1; i <= n; i++) {
        if (data[i.toString()]) {
            const base = parseInt(data[i.toString()].base);
            const value = data[i.toString()].value;
            
            const decimalValue = convertToDecimal(value, base);
            points.push([i, decimalValue]);
            
            console.log(Point ${i}: base ${base}, value "${value}" -> decimal ${decimalValue});
        }
    }
    
    console.log(\nTotal points available: ${points.length});
    console.log(Using first ${k} points for interpolation\n);
    
    // Find the secret using Lagrange interpolation
    const secret = lagrangeInterpolation(points, k);
    
    console.log(The secret (constant term) is: ${secret});
    
    return secret;
}