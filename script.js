// Newton's Method Calculator
class NewtonCalculator {
    constructor() {
        this.calculateBtn = document.getElementById('calculateBtn');
        this.functionInput = document.getElementById('function');
        this.startingPointInput = document.getElementById('startingPoint');
        this.iterationsInput = document.getElementById('iterations');
        this.animationSpeedInput = document.getElementById('animationSpeed');
        this.resultsSection = document.getElementById('results');
        this.errorDiv = document.getElementById('error');
        this.tableBody = document.getElementById('tableBody');
        this.finalRootSpan = document.getElementById('finalRoot');
        this.finalValueSpan = document.getElementById('finalValue');
        this.iterationsUsedSpan = document.getElementById('iterationsUsed');

        this.initEventListeners();
    }

    initEventListeners() {
        this.calculateBtn.addEventListener('click', () => this.calculate());
        
        // Allow Enter key to trigger calculation
        [this.functionInput, this.startingPointInput, this.iterationsInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.calculate();
            });
        });
    }

    // Parse and evaluate mathematical expression
    parseFunction(funcStr, x) {
        try {
            // Remove extra spaces and prepare expression
            let expression = funcStr.trim().replace(/\s+/g, '');
            
            // Replace common mathematical notation
            expression = expression
                .replace(/\^/g, '**')  // Power operator
                .replace(/ln\(/g, 'Math.log(')   // Natural logarithm (do ln first)
                .replace(/log\(/g, 'Math.log(')  // Natural logarithm
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/abs\(/g, 'Math.abs(')
                .replace(/exp\(/g, 'Math.exp(')
                .replace(/pi/gi, 'Math.PI')
                .replace(/e(?![a-z])/gi, 'Math.E');

            // Handle implicit multiplication
            // Number followed by x: 2x -> 2*x
            expression = expression.replace(/(\d)([x])/g, '$1*$2');
            // x followed by number: x2 -> x*2
            expression = expression.replace(/([x])(\d)/g, '$1*$2');
            // Number/x followed by opening parenthesis: 2( or x( -> 2*( or x*(
            expression = expression.replace(/(\d|x)(\()/g, '$1*$2');
            // Closing parenthesis followed by number/x/opening parenthesis: )2 or )x or )( -> )*2 or )*x or )*(
            expression = expression.replace(/(\))(\d|x|\()/g, '$1*$2');
            
            // Replace x with the actual value
            // Use word boundaries to avoid replacing x in exp, etc.
            expression = expression.replace(/\bx\b/g, `(${x})`);

            // Evaluate the expression
            const result = eval(expression);
            
            // Round to 10 decimal points to avoid floating point precision issues
            const rounded = Math.round(result * 1e10) / 1e10;
            
            if (!isFinite(rounded)) {
                throw new Error('Result is not finite (infinity or undefined)');
            }
            
            return rounded;
        } catch (error) {
            throw new Error(`Error evaluating function: ${error.message}`);
        }
    }

    // Numerical derivative using central difference method
    derivative(funcStr, x, h = 1e-7) {
        const f_plus = this.parseFunction(funcStr, x + h);
        const f_minus = this.parseFunction(funcStr, x - h);
        const deriv = (f_plus - f_minus) / (2 * h);
        // Round to 10 decimal points
        return Math.round(deriv * 1e10) / 1e10;
    }

    // Newton's Method implementation
    newtonsMethod(funcStr, x0, maxIterations) {
        const results = [];
        let x = x0;

        for (let i = 0; i <= maxIterations; i++) {
            const fx = this.parseFunction(funcStr, x);
            const fpx = this.derivative(funcStr, x);

            results.push({
                iteration: i,
                x: x,
                fx: fx,
                fpx: fpx
            });

            // Check if derivative is too close to zero
            if (Math.abs(fpx) < 1e-10) {
                throw new Error('Derivative too close to zero. Try a different starting point.');
            }

            // Check for convergence
            if (Math.abs(fx) < 1e-10 && i > 0) {
                break;
            }

            // Newton's method formula: x_n+1 = x_n - f(x_n) / f'(x_n)
            if (i < maxIterations) {
                x = x - fx / fpx;
                // Round to 10 decimal points to avoid floating point errors
                x = Math.round(x * 1e10) / 1e10;
            }

            // Check for NaN or Infinity
            if (!isFinite(x)) {
                throw new Error('Calculation diverged. Try a different starting point.');
            }
        }

        return results;
    }

    // Format number for display
    formatNumber(num, decimals = 10) {
        if (Math.abs(num) < 1e-10) return '0';
        if (Math.abs(num) > 1e10 || Math.abs(num) < 1e-4) {
            return num.toExponential(6);
        }
        return num.toFixed(decimals).replace(/\.?0+$/, '');
    }

    // Display results in table with animation
    async displayResults(results) {
        // Clear previous results
        this.tableBody.innerHTML = '';
        
        // Show results section immediately (but without data)
        this.resultsSection.classList.remove('hidden');
        this.errorDiv.classList.add('hidden');
        
        // Clear summary initially
        this.finalRootSpan.textContent = '...';
        this.finalValueSpan.textContent = '...';
        this.iterationsUsedSpan.textContent = '...';

        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Get animation speed from slider (1=slow, 2=medium, 3=fast)
        const speedSetting = parseInt(this.animationSpeedInput.value);
        const speedMultiplier = speedSetting === 1 ? 1.5 : speedSetting === 2 ? 1 : 0.4;
        
        // Calculate delay based on number of iterations and speed setting
        let baseDelay = results.length > 20 ? 100 : results.length > 10 ? 200 : 300;
        baseDelay = baseDelay * speedMultiplier;

        // Animate each row
        for (let i = 0; i < results.length; i++) {
            await this.animateRow(results[i], baseDelay);
        }

        // Display final summary with animation
        const lastResult = results[results.length - 1];
        await new Promise(resolve => setTimeout(resolve, 200));
        
        this.finalRootSpan.classList.add('animate-value');
        this.finalValueSpan.classList.add('animate-value');
        this.iterationsUsedSpan.classList.add('animate-value');
        
        this.finalRootSpan.textContent = this.formatNumber(lastResult.x);
        this.finalValueSpan.textContent = this.formatNumber(lastResult.fx);
        this.iterationsUsedSpan.textContent = results.length - 1;
        
        // Remove animation class after animation completes
        setTimeout(() => {
            this.finalRootSpan.classList.remove('animate-value');
            this.finalValueSpan.classList.remove('animate-value');
            this.iterationsUsedSpan.classList.remove('animate-value');
        }, 600);
    }

    // Animate a single row
    animateRow(result, delay) {
        return new Promise(resolve => {
            setTimeout(() => {
                const row = document.createElement('tr');
                row.classList.add('animate-row');
                row.innerHTML = `
                    <td>${result.iteration}</td>
                    <td>${this.formatNumber(result.x)}</td>
                    <td>${this.formatNumber(result.fx)}</td>
                    <td>${this.formatNumber(result.fpx)}</td>
                `;
                this.tableBody.appendChild(row);
                
                // Trigger animation
                setTimeout(() => row.classList.add('visible'), 10);
                
                // Scroll the new row into view
                row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                
                resolve();
            }, delay);
        });
    }

    // Show error message
    showError(message) {
        this.errorDiv.textContent = message;
        this.errorDiv.classList.remove('hidden');
        this.resultsSection.classList.add('hidden');
    }

    // Validate input
    validateInput(funcStr, x0, iterations) {
        if (!funcStr || funcStr.trim() === '') {
            throw new Error('Please enter a function.');
        }

        if (isNaN(x0)) {
            throw new Error('Please enter a valid starting point.');
        }

        if (isNaN(iterations) || iterations < 1 || iterations > 100) {
            throw new Error('Please enter a valid number of iterations (1-100).');
        }

        // Test if function can be evaluated at starting point
        try {
            this.parseFunction(funcStr, x0);
        } catch (error) {
            throw new Error('Invalid function syntax. Please check your input.');
        }
    }

    // Main calculation function
    async calculate() {
        try {
            const funcStr = this.functionInput.value.trim();
            const x0 = parseFloat(this.startingPointInput.value);
            const iterations = parseInt(this.iterationsInput.value);

            // Validate input
            this.validateInput(funcStr, x0, iterations);

            // Disable button and show loading state
            this.calculateBtn.disabled = true;
            this.calculateBtn.textContent = 'Calculating...';

            // Perform Newton's method
            const results = this.newtonsMethod(funcStr, x0, iterations);

            // Display results with animation
            await this.displayResults(results);

            // Re-enable button
            this.calculateBtn.disabled = false;
            this.calculateBtn.textContent = 'Calculate Root';

        } catch (error) {
            this.showError(error.message);
            // Re-enable button on error
            this.calculateBtn.disabled = false;
            this.calculateBtn.textContent = 'Calculate Root';
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewtonCalculator();
});

