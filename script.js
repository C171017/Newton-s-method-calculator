// Graph Renderer for Cartesian Coordinate System
class GraphRenderer {
    constructor(canvasId, parseFunction) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.parseFunction = parseFunction;
        
        // Set canvas size
        this.width = 800;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Padding for axis labels
        this.padding = 60;
        
        // Coordinate bounds
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        
        // Scaling factors
        this.scaleX = 1;
        this.scaleY = 1;
        this.originX = 0;
        this.originY = 0;
        
        // Colors
        this.colors = {
            function: '#6366f1',
            current: '#10b981',
            previous: 'rgba(16, 185, 129, 0.4)',
            axes: '#1e293b',
            grid: '#e2e8f0',
            point: '#ef4444'
        };
    }

    // Calculate bounds based on function and iterations
    calculateBounds(funcStr, x0, iterations, results) {
        let xValues = [x0];
        let yValues = [0]; // x-axis
        
        // Collect all x values from iterations
        results.forEach(r => {
            xValues.push(r.x);
            yValues.push(r.fx);
        });
        
        // Sample function to find range
        const samplePoints = 200;
        const tempXMin = Math.min(...xValues) - 2;
        const tempXMax = Math.max(...xValues) + 2;
        const xRange = tempXMax - tempXMin;
        
        for (let i = 0; i <= samplePoints; i++) {
            const x = tempXMin + (xRange * i / samplePoints);
            try {
                const y = this.parseFunction(funcStr, x);
                if (isFinite(y)) {
                    yValues.push(y);
                }
            } catch (e) {
                // Skip invalid points
            }
        }
        
        // Calculate bounds with 20% padding
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        
        const xPadding = (xMax - xMin) * 0.2 || 2;
        const yPadding = (yMax - yMin) * 0.2 || 2;
        
        this.xMin = xMin - xPadding;
        this.xMax = xMax + xPadding;
        this.yMin = yMin - yPadding;
        this.yMax = yMax + yPadding;
        
        // Ensure minimum range
        if (this.xMax - this.xMin < 4) {
            const center = (this.xMin + this.xMax) / 2;
            this.xMin = center - 2;
            this.xMax = center + 2;
        }
        if (this.yMax - this.yMin < 4) {
            const center = (this.yMin + this.yMax) / 2;
            this.yMin = center - 2;
            this.yMax = center + 2;
        }
        
        this.setupCoordinateSystem();
    }

    // Setup coordinate system scaling
    setupCoordinateSystem() {
        const plotWidth = this.width - 2 * this.padding;
        const plotHeight = this.height - 2 * this.padding;
        
        this.scaleX = plotWidth / (this.xMax - this.xMin);
        this.scaleY = plotHeight / (this.yMax - this.yMin);
        
        this.originX = this.padding - this.xMin * this.scaleX;
        this.originY = this.padding + this.yMax * this.scaleY;
    }

    // Convert world coordinates to canvas coordinates
    worldToCanvas(x, y) {
        return {
            x: this.originX + x * this.scaleX,
            y: this.originY - y * this.scaleY
        };
    }

    // Draw grid lines
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        
        // Vertical grid lines
        const xStep = (this.xMax - this.xMin) / 10;
        for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
            const canvasX = this.worldToCanvas(x, 0).x;
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, this.padding);
            this.ctx.lineTo(canvasX, this.height - this.padding);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines
        const yStep = (this.yMax - this.yMin) / 10;
        for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
            const canvasY = this.worldToCanvas(0, y).y;
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, canvasY);
            this.ctx.lineTo(this.width - this.padding, canvasY);
            this.ctx.stroke();
        }
    }

    // Draw axes
    drawAxes() {
        this.ctx.strokeStyle = this.colors.axes;
        this.ctx.lineWidth = 2;
        
        // X-axis
        const xAxisY = this.worldToCanvas(0, 0).y;
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, xAxisY);
        this.ctx.lineTo(this.width - this.padding, xAxisY);
        this.ctx.stroke();
        
        // Y-axis
        const yAxisX = this.worldToCanvas(0, 0).x;
        this.ctx.beginPath();
        this.ctx.moveTo(yAxisX, this.padding);
        this.ctx.lineTo(yAxisX, this.height - this.padding);
        this.ctx.stroke();
        
        // Axis labels
        this.ctx.fillStyle = this.colors.axes;
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        
        // X-axis labels
        const xStep = (this.xMax - this.xMin) / 10;
        for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
            if (Math.abs(x) > 0.01) {
                const canvasX = this.worldToCanvas(x, 0).x;
                this.ctx.fillText(x.toFixed(1), canvasX, xAxisY + 20);
            }
        }
        
        // Y-axis labels
        this.ctx.textAlign = 'right';
        const yStep = (this.yMax - this.yMin) / 10;
        for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
            if (Math.abs(y) > 0.01) {
                const canvasY = this.worldToCanvas(0, y).y;
                this.ctx.fillText(y.toFixed(1), yAxisX - 10, canvasY + 4);
            }
        }
    }

    // Plot function curve
    plotFunction(funcStr, color = this.colors.function, lineWidth = 2) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        
        const numPoints = 300;
        let firstPoint = true;
        
        for (let i = 0; i <= numPoints; i++) {
            const x = this.xMin + (this.xMax - this.xMin) * i / numPoints;
            try {
                const y = this.parseFunction(funcStr, x);
                if (isFinite(y) && y >= this.yMin - 1 && y <= this.yMax + 1) {
                    const canvas = this.worldToCanvas(x, y);
                    if (firstPoint) {
                        this.ctx.moveTo(canvas.x, canvas.y);
                        firstPoint = false;
                    } else {
                        this.ctx.lineTo(canvas.x, canvas.y);
                    }
                } else {
                    firstPoint = true;
                }
            } catch (e) {
                firstPoint = true;
            }
        }
        
        this.ctx.stroke();
    }

    // Draw vertical line
    drawVerticalLine(x, y1, y2, color, lineWidth = 2, animated = false) {
        return new Promise(resolve => {
            if (!animated) {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = lineWidth;
                this.ctx.setLineDash([]);
                const start = this.worldToCanvas(x, y1);
                const end = this.worldToCanvas(x, y2);
                this.ctx.beginPath();
                this.ctx.moveTo(start.x, start.y);
                this.ctx.lineTo(end.x, end.y);
                this.ctx.stroke();
                resolve();
            } else {
                const start = this.worldToCanvas(x, y1);
                const end = this.worldToCanvas(x, y2);
                const duration = 400; // ms
                const startTime = performance.now();
                
                // Store the base image before animation
                const baseImage = this.ctx.getImageData(0, 0, this.width, this.height);
                
                const animate = (currentTime) => {
                    // Restore base image
                    this.ctx.putImageData(baseImage, 0, 0);
                    
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const currentY = start.y + (end.y - start.y) * progress;
                    
                    // Draw animated line
                    this.ctx.strokeStyle = color;
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.setLineDash([]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(start.x, start.y);
                    this.ctx.lineTo(start.x, currentY);
                    this.ctx.stroke();
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        resolve();
                    }
                };
                requestAnimationFrame(animate);
            }
        });
    }

    // Draw tangent line
    drawTangentLine(x, fx, fpx, color, lineWidth = 2, animated = false) {
        return new Promise(resolve => {
            // Calculate tangent line: y = f'(x) * (x - x0) + f(x)
            // Find intersection with x-axis: 0 = f'(x) * (x_int - x) + f(x)
            // x_int = x - f(x) / f'(x)
            const xIntersect = x - fx / fpx;
            
            // Extend line beyond visible area for better visualization
            const pointOnFunction = this.worldToCanvas(x, fx);
            const pointOnAxis = this.worldToCanvas(xIntersect, 0);
            
            // Extend line
            const dx = pointOnAxis.x - pointOnFunction.x;
            const dy = pointOnAxis.y - pointOnFunction.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const extend = 50;
            const endX = pointOnFunction.x + (dx / length) * (length + extend);
            const endY = pointOnFunction.y + (dy / length) * (length + extend);
            
            if (!animated) {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = lineWidth;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(pointOnFunction.x, pointOnFunction.y);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                resolve();
            } else {
                const duration = 500; // ms
                const startTime = performance.now();
                
                // Store the base image before animation
                const baseImage = this.ctx.getImageData(0, 0, this.width, this.height);
                
                const animate = (currentTime) => {
                    // Restore base image
                    this.ctx.putImageData(baseImage, 0, 0);
                    
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const currentX = pointOnFunction.x + (endX - pointOnFunction.x) * progress;
                    const currentY = pointOnFunction.y + (endY - pointOnFunction.y) * progress;
                    
                    // Draw animated line
                    this.ctx.strokeStyle = color;
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(pointOnFunction.x, pointOnFunction.y);
                    this.ctx.lineTo(currentX, currentY);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        resolve();
                    }
                };
                requestAnimationFrame(animate);
            }
        });
    }

    // Draw point
    drawPoint(x, y, color, radius = 5) {
        const canvas = this.worldToCanvas(x, y);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(canvas.x, canvas.y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    // Clear canvas
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    // Draw all iterations up to current (faded)
    drawAllIterations(results, funcStr, currentIteration, parseFunction, derivative) {
        // Draw previous iterations in faded color
        for (let i = 0; i < currentIteration; i++) {
            const result = results[i];
            const x = result.x;
            const fx = result.fx;
            const fpx = result.fpx;
            
            // Vertical line
            this.drawVerticalLine(x, 0, fx, this.colors.previous, 1.5, false);
            // Point on function
            this.drawPoint(x, fx, this.colors.previous, 4);
            // Tangent line
            this.drawTangentLine(x, fx, fpx, this.colors.previous, 1.5, false);
            // Point on x-axis (next x)
            if (i < results.length - 1) {
                const nextX = results[i + 1].x;
                this.drawPoint(nextX, 0, this.colors.previous, 4);
            }
        }
    }

    // Animate one iteration
    async animateIteration(iteration, result, funcStr, speedMultiplier, parseFunction, derivative) {
        const x = result.x;
        const fx = result.fx;
        const fpx = result.fpx;
        
        // Calculate next x (intersection of tangent with x-axis)
        const nextX = x - fx / fpx;
        
        // Step 1: Draw vertical line from x-axis to function (animated)
        await this.drawVerticalLine(x, 0, fx, this.colors.current, 2, true);
        
        // Step 2: Draw point on function (after vertical line is complete)
        this.drawPoint(x, fx, this.colors.current, 6);
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100 * speedMultiplier));
        
        // Step 3: Draw tangent line (animated)
        // Store current state (includes vertical line and point) as base for tangent animation
        const baseForTangent = this.ctx.getImageData(0, 0, this.width, this.height);
        
        // Manually animate tangent line with correct base
        const xIntersect = x - fx / fpx;
        const pointOnFunction = this.worldToCanvas(x, fx);
        const pointOnAxis = this.worldToCanvas(xIntersect, 0);
        const dx = pointOnAxis.x - pointOnFunction.x;
        const dy = pointOnAxis.y - pointOnFunction.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const extend = 50;
        const endX = pointOnFunction.x + (dx / length) * (length + extend);
        const endY = pointOnFunction.y + (dy / length) * (length + extend);
        
        const duration = 500 * speedMultiplier;
        const startTime = performance.now();
        
        await new Promise(resolve => {
            const animate = (currentTime) => {
                // Restore base (includes vertical line and point)
                this.ctx.putImageData(baseForTangent, 0, 0);
                
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentX = pointOnFunction.x + (endX - pointOnFunction.x) * progress;
                const currentY = pointOnFunction.y + (endY - pointOnFunction.y) * progress;
                
                // Draw animated tangent line
                this.ctx.strokeStyle = this.colors.current;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(pointOnFunction.x, pointOnFunction.y);
                this.ctx.lineTo(currentX, currentY);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
        
        // Step 4: Draw intersection point on x-axis (after tangent line is complete)
        this.drawPoint(nextX, 0, this.colors.current, 6);
        
        // Small delay before next iteration
        await new Promise(resolve => setTimeout(resolve, 200 * speedMultiplier));
    }

    // Draw complete graph setup
    drawSetup(funcStr) {
        this.clear();
        this.drawGrid();
        this.drawAxes();
        this.plotFunction(funcStr);
    }
}

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
        this.graphSection = document.getElementById('graphSection');

        // Initialize graph renderer
        this.graphRenderer = new GraphRenderer('graphCanvas', (funcStr, x) => this.parseFunction(funcStr, x));

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
            
            // Handle log(b, x) - arbitrary base logarithm (must be done before single-arg log)
            // This uses change of base formula: log_b(x) = ln(x) / ln(b)
            // Find and replace log(base, arg) patterns by parsing parentheses properly
            const logBaseRegex = /log\(/g;
            let logMatch;
            const replacements = [];
            
            // Find all log( occurrences and check if they have two arguments
            while ((logMatch = logBaseRegex.exec(expression)) !== null) {
                const startPos = logMatch.index;
                let pos = startPos + 4; // After "log("
                let depth = 1; // Track depth of parentheses
                let base = '';
                let arg = '';
                let currentPart = 'base';
                
                // Parse the arguments by tracking parentheses
                while (pos < expression.length && depth > 0) {
                    const char = expression[pos];
                    if (char === '(') {
                        depth++;
                        if (currentPart === 'base') base += char;
                        else arg += char;
                    } else if (char === ')') {
                        depth--;
                        if (depth === 0) {
                            // This is the closing paren for log(, we're done
                            break;
                        } else {
                            // Nested closing paren
                            if (currentPart === 'base') base += char;
                            else arg += char;
                        }
                    } else if (char === ',' && depth === 1 && currentPart === 'base') {
                        // Top-level comma, switch to arg
                        currentPart = 'arg';
                    } else {
                        // Regular character
                        if (currentPart === 'base') base += char;
                        else arg += char;
                    }
                    pos++;
                }
                
                // If we found a comma at top level and both base and arg, it's log(base, arg)
                if (currentPart === 'arg' && base && arg && depth === 0) {
                    const fullMatch = expression.substring(startPos, pos + 1);
                    replacements.push({
                        original: fullMatch,
                        replacement: `(Math.log(${arg})/Math.log(${base}))`,
                        index: startPos
                    });
                }
            }
            
            // Apply replacements from right to left to preserve indices
            replacements.sort((a, b) => b.index - a.index);
            replacements.forEach(rep => {
                expression = expression.substring(0, rep.index) + rep.replacement + expression.substring(rep.index + rep.original.length);
            });
            
            // Replace common mathematical notation
            expression = expression
                .replace(/\^/g, '**')  // Power operator
                .replace(/ln\(/g, 'Math.log(')   // Natural logarithm (do ln first)
                .replace(/log\(/g, 'Math.log(')  // Natural logarithm (single argument)
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
    async displayResults(results, funcStr, x0) {
        // Clear previous results
        this.tableBody.innerHTML = '';
        
        // Show results section and graph section
        this.resultsSection.classList.remove('hidden');
        this.graphSection.classList.remove('hidden');
        this.errorDiv.classList.add('hidden');
        
        // Clear summary initially
        this.finalRootSpan.textContent = '...';
        this.finalValueSpan.textContent = '...';
        this.iterationsUsedSpan.textContent = '...';

        // Get animation speed from slider (1=slow, 2=medium, 3=fast)
        const speedSetting = parseInt(this.animationSpeedInput.value);
        const speedMultiplier = speedSetting === 1 ? 1.5 : speedSetting === 2 ? 1 : 0.4;
        
        // Calculate graph bounds
        this.graphRenderer.calculateBounds(funcStr, x0, results.length, results);
        
        // Draw initial graph setup (grid, axes, function)
        this.graphRenderer.drawSetup(funcStr);
        
        // Wait a bit for graph to render
        await new Promise(resolve => setTimeout(resolve, 300));

        // Calculate delay based on number of iterations and speed setting
        let baseDelay = results.length > 20 ? 100 : results.length > 10 ? 200 : 300;
        baseDelay = baseDelay * speedMultiplier;

        // Animate each iteration on graph and table simultaneously
        for (let i = 0; i < results.length; i++) {
            // Redraw base graph (grid, axes, function) and previous iterations
            this.graphRenderer.drawSetup(funcStr);
            if (i > 0) {
                this.graphRenderer.drawAllIterations(results, funcStr, i, this.parseFunction.bind(this), this.derivative.bind(this));
            }
            
            // Animate current iteration on graph
            const graphAnimation = this.graphRenderer.animateIteration(
                i, 
                results[i], 
                funcStr, 
                speedMultiplier,
                this.parseFunction.bind(this),
                this.derivative.bind(this)
            );
            
            // Animate table row
            const tableAnimation = this.animateRow(results[i], baseDelay);
            
            // Wait for both animations to complete
            await Promise.all([graphAnimation, tableAnimation]);
        }
        
        // Draw final state with all iterations
        this.graphRenderer.drawSetup(funcStr);
        this.graphRenderer.drawAllIterations(results, funcStr, results.length, this.parseFunction.bind(this), this.derivative.bind(this));

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

            // Hide graph section initially
            this.graphSection.classList.add('hidden');

            // Perform Newton's method
            const results = this.newtonsMethod(funcStr, x0, iterations);

            // Display results with animation (pass funcStr and x0 for graph)
            await this.displayResults(results, funcStr, x0);

            // Re-enable button
            this.calculateBtn.disabled = false;
            this.calculateBtn.textContent = 'Calculate Root';

        } catch (error) {
            this.showError(error.message);
            // Hide graph on error
            this.graphSection.classList.add('hidden');
            // Re-enable button on error
            this.calculateBtn.disabled = false;
            this.calculateBtn.textContent = 'Calculate Root';
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewtonCalculator();
    
    // Initialize collapsible input format section
    const inputFormatToggle = document.getElementById('inputFormatToggle');
    const inputFormatContent = document.getElementById('inputFormatContent');
    
    if (inputFormatToggle && inputFormatContent) {
        inputFormatToggle.addEventListener('click', () => {
            const isExpanded = inputFormatToggle.getAttribute('aria-expanded') === 'true';
            
            if (isExpanded) {
                // Collapse
                inputFormatToggle.setAttribute('aria-expanded', 'false');
                inputFormatContent.classList.remove('expanded');
            } else {
                // Expand
                inputFormatToggle.setAttribute('aria-expanded', 'true');
                inputFormatContent.classList.add('expanded');
            }
        });
    }
});

