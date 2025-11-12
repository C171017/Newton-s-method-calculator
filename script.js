// Graph Renderer for Cartesian Coordinate System
class GraphRenderer {
    constructor(canvasId, parseFunction) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.parseFunction = parseFunction;
        
        // Get device pixel ratio for high-DPI displays (Retina, etc.)
        this.dpr = window.devicePixelRatio || 1;
        
        // Set logical canvas size (display size)
        this.width = 800;
        this.height = 600;
        
        // Set actual canvas size (internal resolution) - higher for crisp rendering
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        
        // Scale context to match device pixel ratio
        this.ctx.scale(this.dpr, this.dpr);
        
        // Set CSS size to logical size (responsive - width is handled by CSS, height by aspect-ratio)
        this.canvas.style.width = '100%';
        this.canvas.style.maxWidth = this.width + 'px';
        // Height is controlled by CSS aspect-ratio for responsive design
        
        // Padding for axis labels (reduced to maximize graph area)
        this.padding = 35;
        
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
        
        // Collect all x values from iterations and their x-axis intersections
        results.forEach((r, index) => {
            xValues.push(r.x);
            yValues.push(r.fx);
            
            // Calculate x-axis intersection point (where tangent line crosses x-axis)
            // This is: x - f(x) / f'(x), which is the next x in Newton's method
            if (isFinite(r.fx) && isFinite(r.fpx) && Math.abs(r.fpx) > 1e-10) {
                const xIntersect = r.x - r.fx / r.fpx;
                if (isFinite(xIntersect)) {
                    xValues.push(xIntersect);
                    yValues.push(0); // x-axis intersection is always at y=0
                }
            }
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
        
        // Axis labels (smaller font and tighter spacing to maximize graph area)
        this.ctx.fillStyle = this.colors.axes;
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        
        // X-axis labels
        const xStep = (this.xMax - this.xMin) / 10;
        for (let x = Math.ceil(this.xMin / xStep) * xStep; x <= this.xMax; x += xStep) {
            if (Math.abs(x) > 0.01) {
                const canvasX = this.worldToCanvas(x, 0).x;
                this.ctx.fillText(x.toFixed(1), canvasX, xAxisY + 15);
            }
        }
        
        // Y-axis labels
        this.ctx.textAlign = 'right';
        const yStep = (this.yMax - this.yMin) / 10;
        for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
            if (Math.abs(y) > 0.01) {
                const canvasY = this.worldToCanvas(0, y).y;
                this.ctx.fillText(y.toFixed(1), yAxisX - 8, canvasY + 3);
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
                
                // Store the base image before animation (use device pixel coordinates)
                const baseImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                
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
            
            // Draw line from point on function to x-axis intersection (no extension/tail)
            const pointOnFunction = this.worldToCanvas(x, fx);
            const pointOnAxis = this.worldToCanvas(xIntersect, 0);
            
            if (!animated) {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = lineWidth;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(pointOnFunction.x, pointOnFunction.y);
                this.ctx.lineTo(pointOnAxis.x, pointOnAxis.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                resolve();
            } else {
                const duration = 500; // ms
                const startTime = performance.now();
                
                // Store the base image before animation (use device pixel coordinates)
                const baseImage = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                
                const animate = (currentTime) => {
                    // Restore base image
                    this.ctx.putImageData(baseImage, 0, 0);
                    
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // Animate from point on function to x-axis intersection (no tail)
                    const currentX = pointOnFunction.x + (pointOnAxis.x - pointOnFunction.x) * progress;
                    const currentY = pointOnFunction.y + (pointOnAxis.y - pointOnFunction.y) * progress;
                    
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
        
        // Step 1: Draw vertical line from x-axis to function (animated, thicker for visibility)
        await this.drawVerticalLine(x, 0, fx, this.colors.current, 3, true);
        
        // Step 2: Draw point on function (after vertical line is complete)
        this.drawPoint(x, fx, this.colors.current, 6);
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100 * speedMultiplier));
        
        // Step 3: Draw tangent line (animated)
        // Store current state (includes vertical line and point) as base for tangent animation
        const baseForTangent = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Manually animate tangent line with correct base (no tail - stops at x-axis)
        const xIntersect = x - fx / fpx;
        const pointOnFunction = this.worldToCanvas(x, fx);
        const pointOnAxis = this.worldToCanvas(xIntersect, 0);
        
        const duration = 500 * speedMultiplier;
        const startTime = performance.now();
        
        await new Promise(resolve => {
            const animate = (currentTime) => {
                // Restore base (includes vertical line and point)
                this.ctx.putImageData(baseForTangent, 0, 0);
                
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Animate from point on function to x-axis intersection (no tail)
                const currentX = pointOnFunction.x + (pointOnAxis.x - pointOnFunction.x) * progress;
                const currentY = pointOnFunction.y + (pointOnAxis.y - pointOnFunction.y) * progress;
                
                // Draw animated tangent line (thicker and more prominent for current iteration)
                this.ctx.strokeStyle = this.colors.current;
                this.ctx.lineWidth = 3; // Increased from 2 to make it more visible
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
                .replace(/(?<!Math\.)log\(/g, 'Math.log(')  // Natural logarithm (single argument) - but not if already Math.log
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/abs\(/g, 'Math.abs(')
                .replace(/exp\(/g, 'Math.exp(')
                .replace(/pi/gi, 'Math.PI')
                .replace(/e(?![a-z])/gi, 'Math.E');

            // Handle implicit multiplication
            // First, protect function calls from being modified
            // Store function calls temporarily with placeholders to handle nested parentheses
            const functionCallPlaceholders = [];
            
            // Replace Math.xxx(...) patterns with placeholders, handling nested parentheses
            let funcCallRegex = /Math\.\w+\(/g;
            let funcMatch;
            const funcCalls = [];
            
            // Find all function calls and their positions
            while ((funcMatch = funcCallRegex.exec(expression)) !== null) {
                const startPos = funcMatch.index;
                let pos = funcMatch.index + funcMatch[0].length;
                let depth = 1;
                let funcCall = funcMatch[0];
                
                // Find the matching closing parenthesis
                while (pos < expression.length && depth > 0) {
                    const char = expression[pos];
                    funcCall += char;
                    if (char === '(') depth++;
                    else if (char === ')') depth--;
                    pos++;
                }
                
                if (depth === 0) {
                    funcCalls.push({ start: startPos, end: pos, content: funcCall });
                }
            }
            
            // Replace function calls with placeholders (from right to left to preserve indices)
            funcCalls.sort((a, b) => b.start - a.start);
            funcCalls.forEach((funcCall, index) => {
                const placeholder = `__FUNC${index}__`;
                functionCallPlaceholders[index] = funcCall.content;
                expression = expression.substring(0, funcCall.start) + 
                         placeholder + 
                         expression.substring(funcCall.end);
            });
            
            // Number followed by x: 2x -> 2*x
            expression = expression.replace(/(\d)([x])/g, '$1*$2');
            // x followed by number: x2 -> x*2
            expression = expression.replace(/([x])(\d)/g, '$1*$2');
            // Number/x followed by opening parenthesis: 2( or x( -> 2*( or x*(
            expression = expression.replace(/(\d|x)(\()/g, '$1*$2');
            // Closing parenthesis followed by number/x/opening parenthesis: )2 or )x or )( -> )*2 or )*x or )*(
            expression = expression.replace(/(\))(\d|x|\()/g, '$1*$2');
            
            // Restore function calls (from right to left to preserve indices)
            for (let i = functionCallPlaceholders.length - 1; i >= 0; i--) {
                expression = expression.replace(`__FUNC${i}__`, functionCallPlaceholders[i]);
            }
            
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

    // Symbolic differentiation - returns the derivative as a function string
    symbolicDerivative(funcStr) {
        try {
            let expr = funcStr.trim().replace(/\s+/g, '');
            console.log('Symbolic diff input:', expr);
            
            // Handle implicit multiplication (same as parseFunction)
            // Number followed by x: 2x -> 2*x
            expr = expr.replace(/(\d)([x])/g, '$1*$2');
            // x followed by number: x2 -> x*2
            expr = expr.replace(/([x])(\d)/g, '$1*$2');
            // Number/x followed by opening parenthesis: 2( or x( -> 2*( or x*(
            expr = expr.replace(/(\d|x)(\()/g, '$1*$2');
            // Closing parenthesis followed by number/x/opening parenthesis: )2 or )x or )( -> )*2 or )*x or )*(
            // But protect function calls first
            const functionCallPlaceholders = [];
            let funcCallRegex = /(sin|cos|tan|ln|log|sqrt|abs|exp)\(/g;
            let funcMatch;
            const funcCalls = [];
            
            while ((funcMatch = funcCallRegex.exec(expr)) !== null) {
                const startPos = funcMatch.index;
                let pos = funcMatch.index + funcMatch[0].length;
                let depth = 1;
                let funcCall = funcMatch[0];
                
                while (pos < expr.length && depth > 0) {
                    const char = expr[pos];
                    funcCall += char;
                    if (char === '(') depth++;
                    else if (char === ')') depth--;
                    pos++;
                }
                
                if (depth === 0) {
                    funcCalls.push({ start: startPos, end: pos, content: funcCall });
                }
            }
            
            funcCalls.sort((a, b) => b.start - a.start);
            funcCalls.forEach((funcCall, index) => {
                const placeholder = `__FUNC${index}__`;
                functionCallPlaceholders[index] = funcCall.content;
                expr = expr.substring(0, funcCall.start) + 
                     placeholder + 
                     expr.substring(funcCall.end);
            });
            
            expr = expr.replace(/(\))(\d|x|\()/g, '$1*$2');
            
            for (let i = functionCallPlaceholders.length - 1; i >= 0; i--) {
                expr = expr.replace(`__FUNC${i}__`, functionCallPlaceholders[i]);
            }
            
            // Helper function to wrap expression in parentheses if needed
            const wrap = (str) => {
                // Check if already wrapped or is a simple term
                if (str.match(/^\(.+\)$/) || str.match(/^[\d.x]+$/) || str.match(/^Math\.\w+\(/)) {
                    return str;
                }
                return `(${str})`;
            };
            
            // Helper to differentiate a term
            const diffTerm = (term) => {
                term = term.trim();
                
                // Constant
                if (term.match(/^-?\d+\.?\d*$/)) {
                    return '0';
                }
                
                // x
                if (term === 'x') {
                    return '1';
                }
                
                // -x
                if (term === '-x') {
                    return '-1';
                }
                
                // x^n
                const powerMatch = term.match(/^x\^(\d+\.?\d*)$/);
                if (powerMatch) {
                    const n = parseFloat(powerMatch[1]);
                    if (n === 1) return '1';
                    if (n === 2) return '2*x';
                    return `${n}*x^${n - 1}`;
                }
                
                // -x^n
                const negPowerMatch = term.match(/^-x\^(\d+\.?\d*)$/);
                if (negPowerMatch) {
                    const n = parseFloat(negPowerMatch[1]);
                    if (n === 1) return '-1';
                    if (n === 2) return '-2*x';
                    return `-${n}*x^${n - 1}`;
                }
                
                // c*x^n where c is constant (handles both positive and negative)
                const constPowerMatch = term.match(/^(-?\d+\.?\d*)\*x\^(\d+\.?\d*)$/);
                if (constPowerMatch) {
                    const c = parseFloat(constPowerMatch[1]);
                    const n = parseFloat(constPowerMatch[2]);
                    const newC = c * n;
                    if (n === 0) return '0';
                    if (n === 1) {
                        // Format negative numbers properly
                        return newC < 0 ? `${newC}` : `${newC}`;
                    }
                    if (n === 2) {
                        return newC < 0 ? `${newC}*x` : `${newC}*x`;
                    }
                    return newC < 0 ? `${newC}*x^${n - 1}` : `${newC}*x^${n - 1}`;
                }
                
                // c*x where c is constant (handles both positive and negative)
                const constXMatch = term.match(/^(-?\d+\.?\d*)\*x$/);
                if (constXMatch) {
                    return constXMatch[1];
                }
                
                // sin(x)
                if (term === 'sin(x)') {
                    return 'cos(x)';
                }
                const sinMatch = term.match(/^sin\((.*)\)$/);
                if (sinMatch) {
                    const inner = sinMatch[1];
                    const innerDiff = this.symbolicDerivative(inner);
                    if (innerDiff === '1') {
                        return `cos(${inner})`;
                    }
                    return `cos(${inner})*${wrap(innerDiff)}`;
                }
                
                // cos(x)
                if (term === 'cos(x)') {
                    return '-sin(x)';
                }
                const cosMatch = term.match(/^cos\((.*)\)$/);
                if (cosMatch) {
                    const inner = cosMatch[1];
                    const innerDiff = this.symbolicDerivative(inner);
                    if (innerDiff === '1') {
                        return `-sin(${inner})`;
                    }
                    return `-sin(${inner})*${wrap(innerDiff)}`;
                }
                
                // tan(x)
                if (term === 'tan(x)') {
                    return '1/(cos(x)^2)';
                }
                const tanMatch = term.match(/^tan\((.*)\)$/);
                if (tanMatch) {
                    const inner = tanMatch[1];
                    const innerDiff = this.symbolicDerivative(inner);
                    if (innerDiff === '1') {
                        return `1/(cos(${inner})^2)`;
                    }
                    return `1/(cos(${inner})^2)*${wrap(innerDiff)}`;
                }
                
                // ln(x) or log(x)
                if (term === 'ln(x)' || term === 'log(x)') {
                    return '1/x';
                }
                const lnMatch = term.match(/^(ln|log)\((.*)\)$/);
                if (lnMatch) {
                    const inner = lnMatch[2];
                    const innerDiff = this.symbolicDerivative(inner);
                    if (innerDiff === '1') {
                        return `1/${wrap(inner)}`;
                    }
                    return `${wrap(innerDiff)}/${wrap(inner)}`;
                }
                
                // sqrt(x)
                if (term === 'sqrt(x)') {
                    return '1/(2*sqrt(x))';
                }
                const sqrtMatch = term.match(/^sqrt\((.*)\)$/);
                if (sqrtMatch) {
                    const inner = sqrtMatch[1];
                    const innerDiff = this.symbolicDerivative(inner);
                    if (innerDiff === '1') {
                        return `1/(2*sqrt(${inner}))`;
                    }
                    return `${wrap(innerDiff)}/(2*sqrt(${inner}))`;
                }
                
                // abs(x) - derivative is sign(x) = x/abs(x)
                if (term === 'abs(x)') {
                    return 'x/abs(x)';
                }
                const absMatch = term.match(/^abs\((.*)\)$/);
                if (absMatch) {
                    const inner = absMatch[1];
                    const innerDiff = this.symbolicDerivative(inner);
                    if (innerDiff === '1') {
                        return `${inner}/abs(${inner})`;
                    }
                    return `${wrap(innerDiff)}*${inner}/abs(${inner})`;
                }
                
                // exp(x)
                if (term === 'exp(x)') {
                    return 'exp(x)';
                }
                const expMatch = term.match(/^exp\((.*)\)$/);
                if (expMatch) {
                    const inner = expMatch[1];
                    const innerDiff = this.symbolicDerivative(inner);
                    if (innerDiff === '1') {
                        return `exp(${inner})`;
                    }
                    return `exp(${inner})*${wrap(innerDiff)}`;
                }
                
                // e^x (handled as exp(x) in our parser)
                if (term === 'e^x' || term.match(/^e\^x$/)) {
                    return 'e^x';
                }
                
                // If term doesn't match simple patterns, try recursive differentiation
                // This handles complex nested expressions
                const recursiveResult = diffPower(term);
                if (recursiveResult !== null) {
                    return recursiveResult;
                }
                
                return null; // Unknown term
            };
            
            // Handle addition and subtraction
            const diffSum = (expr) => {
                console.log('diffSum called with:', expr);
                // Handle leading negative sign
                let sign = 1;
                if (expr.startsWith('-')) {
                    sign = -1;
                    expr = expr.substring(1);
                }
                
                // Split by + and - but preserve them
                const terms = [];
                let current = '';
                let depth = 0;
                let termSign = sign;
                
                for (let i = 0; i < expr.length; i++) {
                    const char = expr[i];
                    if (char === '(') depth++;
                    else if (char === ')') depth--;
                    else if ((char === '+' || char === '-') && depth === 0) {
                        if (current) {
                            terms.push({ term: current.trim(), sign: termSign });
                            current = '';
                        }
                        termSign = char === '+' ? 1 : -1;
                        continue;
                    }
                    current += char;
                }
                if (current) {
                    terms.push({ term: current.trim(), sign: termSign });
                }
                
                console.log('diffSum terms:', terms);
                
                if (terms.length === 0) return '0';
                if (terms.length === 1) {
                    const diff = diffTerm(terms[0].term);
                    console.log('diffSum single term diff:', diff);
                    if (terms[0].sign === -1) {
                        return diff === '0' ? '0' : `-${wrap(diff)}`;
                    }
                    return diff;
                }
                
                const derivatives = terms.map(t => {
                    let diff = diffTerm(t.term);
                    console.log(`diffSum term "${t.term}" (sign ${t.sign}) -> diff:`, diff);
                    if (diff === null) {
                        // Try recursive differentiation on the whole term
                        diff = diffPower(t.term);
                        console.log(`diffSum recursive diff for "${t.term}":`, diff);
                        if (diff === null) return null;
                    }
                    if (diff === '0') return null;
                    if (t.sign === -1) {
                        return `-${wrap(diff)}`;
                    }
                    return diff;
                }).filter(d => d !== null);
                
                console.log('diffSum derivatives:', derivatives);
                
                if (derivatives.length === 0) return '0';
                if (derivatives.length === 1) return derivatives[0];
                return derivatives.join('+').replace(/\+\-/g, '-');
            };
            
            // Handle multiplication (product rule)
            const diffProduct = (expr) => {
                // Check if it's a product
                const factors = [];
                let current = '';
                let depth = 0;
                
                for (let i = 0; i < expr.length; i++) {
                    const char = expr[i];
                    if (char === '(') depth++;
                    else if (char === ')') depth--;
                    else if (char === '*' && depth === 0 && current) {
                        factors.push(current.trim());
                        current = '';
                        continue;
                    }
                    current += char;
                }
                if (current) {
                    factors.push(current.trim());
                }
                
                if (factors.length === 1) {
                    // Not a product, try sum/difference
                    return diffSum(factors[0]);
                }
                
                // Product rule: (f*g)' = f'*g + f*g'
                const derivatives = [];
                for (let i = 0; i < factors.length; i++) {
                    const f = factors[i];
                    const fPrime = diffTerm(f);
                    if (fPrime === '0') continue;
                    
                    const otherFactors = [...factors];
                    otherFactors.splice(i, 1);
                    const otherProduct = otherFactors.join('*');
                    
                    if (fPrime === '1') {
                        derivatives.push(otherProduct);
                    } else {
                        derivatives.push(`${wrap(fPrime)}*${otherProduct}`);
                    }
                }
                
                if (derivatives.length === 0) return '0';
                if (derivatives.length === 1) return derivatives[0];
                return derivatives.join('+');
            };
            
            // Handle division (quotient rule)
            const diffQuotient = (expr) => {
                const divMatch = expr.match(/^(.+)\/(.+)$/);
                if (!divMatch) {
                    return diffProduct(expr);
                }
                
                const num = divMatch[1].trim();
                const den = divMatch[2].trim();
                
                const numPrime = diffTerm(num);
                const denPrime = diffTerm(den);
                
                // Quotient rule: (f/g)' = (f'*g - f*g')/g^2
                if (numPrime === '0' && denPrime === '0') {
                    return '0';
                }
                if (numPrime === '0') {
                    return `-${wrap(num)}*${wrap(denPrime)}/${wrap(den)}^2`;
                }
                if (denPrime === '0') {
                    return `${wrap(numPrime)}/${wrap(den)}`;
                }
                
                return `(${wrap(numPrime)}*${wrap(den)}-${wrap(num)}*${wrap(denPrime)})/${wrap(den)}^2`;
            };
            
            // Handle power (chain rule for x^f(x) or f(x)^g(x))
            // Power has higher precedence than +, -, *, /, so we need to find the rightmost ^ at top level
            const diffPower = (expr) => {
                // Find the rightmost ^ that's not inside parentheses
                let powerIndex = -1;
                let depth = 0;
                for (let i = expr.length - 1; i >= 0; i--) {
                    const char = expr[i];
                    if (char === ')') depth++;
                    else if (char === '(') depth--;
                    else if (char === '^' && depth === 0) {
                        powerIndex = i;
                        break;
                    }
                }
                
                if (powerIndex === -1) {
                    // No power operator at top level, try quotient
                    return diffQuotient(expr);
                }
                
                const base = expr.substring(0, powerIndex).trim();
                const exponent = expr.substring(powerIndex + 1).trim();
                
                // x^n where n is constant
                if (base === 'x' && exponent.match(/^\d+\.?\d*$/)) {
                    const n = parseFloat(exponent);
                    if (n === 0) return '0';
                    if (n === 1) return '1';
                    if (n === 2) return '2*x';
                    return `${n}*x^${n - 1}`;
                }
                
                // f(x)^n where n is constant - use chain rule
                if (exponent.match(/^\d+\.?\d*$/)) {
                    const n = parseFloat(exponent);
                    const basePrime = diffTerm(base);
                    if (basePrime === null || basePrime === '0') return '0';
                    if (n === 0) return '0';
                    if (n === 1) return basePrime;
                    if (basePrime === '1') {
                        return `${n}*${wrap(base)}^${n - 1}`;
                    }
                    return `${n}*${wrap(base)}^${n - 1}*${wrap(basePrime)}`;
                }
                
                // General case: f(x)^g(x) - complex, use numerical for now
                // For now, fall back to numerical differentiation for complex powers
                return null;
            };
            
            // Main differentiation logic
            // Check operator precedence: + and - have lowest precedence, so check them first
            // If there are + or - at top level, it's a sum/difference
            let hasTopLevelSum = false;
            let depth = 0;
            for (let i = 0; i < expr.length; i++) {
                const char = expr[i];
                if (char === '(') depth++;
                else if (char === ')') depth--;
                else if ((char === '+' || char === '-') && depth === 0 && i > 0) {
                    hasTopLevelSum = true;
                    break;
                }
            }
            
            let result;
            if (hasTopLevelSum) {
                // It's a sum/difference - handle that first
                result = diffSum(expr);
            } else {
                // Try power first, then quotient, then product, then sum
                result = diffPower(expr);
            }
            
            if (result === null) {
                // Fall back to numerical if symbolic fails
                return null;
            }
            
            // Simplify: remove unnecessary parentheses and combine terms
            result = result
                .replace(/\(0\)/g, '0')
                .replace(/\*1\b/g, '')
                .replace(/\b1\*/g, '')
                .replace(/\+0\b/g, '')
                .replace(/\b0\+/g, '')
                .replace(/^0\+/, '')
                .replace(/\+0$/, '')
                .replace(/\+\-/g, '-')  // Replace +- with -
                .replace(/\-\+/g, '-')  // Replace -+ with -
                .replace(/^\+/, '')     // Remove leading +
                .replace(/\(([^()]+)\)/g, '$1'); // Remove unnecessary parentheses around simple terms (be careful with this)
            
            console.log('Symbolic derivative final result:', result);
            return result;
        } catch (error) {
            // If symbolic differentiation fails, return null to fall back to numerical
            return null;
        }
    }

    // Derivative - tries symbolic first, falls back to numerical
    derivative(funcStr, x, h = 1e-7) {
        // Try symbolic differentiation first
        const symbolicDeriv = this.symbolicDerivative(funcStr);
        console.log('Symbolic derivative result:', symbolicDeriv);
        if (symbolicDeriv !== null) {
            try {
                // Evaluate the symbolic derivative at x
                const result = this.parseFunction(symbolicDeriv, x);
                console.log('Evaluated symbolic derivative at x=' + x + ':', result);
                return result;
            } catch (error) {
                console.log('Error evaluating symbolic derivative:', error);
                // If evaluation fails, fall back to numerical
            }
        } else {
            console.log('Symbolic differentiation returned null, using numerical');
        }
        
        // Fall back to numerical derivative using central difference method
        try {
            const f_plus = this.parseFunction(funcStr, x + h);
            const f_minus = this.parseFunction(funcStr, x - h);
            
            // Check if values are finite
            if (!isFinite(f_plus) || !isFinite(f_minus)) {
                return NaN;
            }
            
            const deriv = (f_plus - f_minus) / (2 * h);
            
            // Check if derivative is finite
            if (!isFinite(deriv)) {
                return NaN;
            }
            
            // Return raw derivative (no rounding - preserve full precision)
            return deriv;
        } catch (error) {
            // If calculation fails, return NaN
            return NaN;
        }
    }

    // Newton's Method implementation
    newtonsMethod(funcStr, x0, maxIterations) {
        const results = [];
        let x = x0;
        let error = null;

        for (let i = 0; i <= maxIterations; i++) {
            try {
                const fx = this.parseFunction(funcStr, x);
                const fpx = this.derivative(funcStr, x);

                // Check if values are finite
                if (!isFinite(fx) || !isFinite(fpx)) {
                    error = 'Function or derivative is not finite (infinity or undefined)';
                    results.push({
                        iteration: i,
                        x: x,
                        fx: fx,
                        fpx: fpx,
                        error: error
                    });
                    break;
                }

                results.push({
                    iteration: i,
                    x: x,
                    fx: fx,
                    fpx: fpx
                });

                // Check if derivative is too close to zero
                if (Math.abs(fpx) < 1e-10) {
                    error = `Derivative too close to zero at iteration ${i} (x = ${this.formatNumber(x)}, f'(x) = ${this.formatNumber(fpx)}). The derivative became too small during iteration, not necessarily due to the starting point.`;
                    results[results.length - 1].error = error;
                    break;
                }

                // Check for convergence
                if (Math.abs(fx) < 1e-10 && i > 0) {
                    break;
                }

                // Newton's method formula: x_n+1 = x_n - f(x_n) / f'(x_n)
                if (i < maxIterations) {
                    x = x - fx / fpx;
                    // No rounding - preserve full precision for calculations
                    
                    // Check for NaN or Infinity
                    if (!isFinite(x)) {
                        error = 'Calculation diverged. Try a different starting point.';
                        results[results.length - 1].error = error;
                        break;
                    }
                }
            } catch (err) {
                // Catch any errors during calculation
                error = err.message || 'Error during calculation';
                // Try to add the current iteration with error, even if we couldn't calculate fx/fpx
                try {
                    results.push({
                        iteration: i,
                        x: x,
                        fx: NaN,
                        fpx: NaN,
                        error: error
                    });
                } catch {
                    // If we can't even add the result, just break
                }
                break;
            }
        }

        return { results, error };
    }

    // Format number for display
    formatNumber(num, decimals = 10) {
        // Check if number is effectively zero
        if (Math.abs(num) < 1e-15) return '0';
        
        // Round to 10 decimal places (rounds only the last digit)
        const rounded = num.toFixed(decimals);
        const roundedNum = Number(rounded);
        
        // If rounding to 10 decimal places made it exactly 0 but original was non-zero,
        // it means the number is very small. Show it with more precision instead of rounding to 0.
        if (roundedNum === 0 && Math.abs(num) >= 1e-15) {
            // For very small non-zero numbers, show with enough precision to see it's not zero
            // Find how many decimal places needed to show at least one non-zero digit
            const absNum = Math.abs(num);
            let precision = decimals;
            while (precision < 20 && Math.abs(Number(num.toFixed(precision))) === 0) {
                precision++;
            }
            return num.toFixed(precision).replace(/\.?0+$/, '');
        }
        
        // Remove trailing zeros but keep the rounded value
        return roundedNum.toString();
    }

    // Display results in table with animation
    async displayResults(results, funcStr, x0, error = null) {
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

        // Get animation speed from slider (1=very slow, 2=slow, 3=medium, 4=fast, 5=very fast)
        const speedSetting = parseInt(this.animationSpeedInput.value);
        // Speed multipliers: lower value = faster animation
        // Default (medium) is now 50% faster than before (0.67 instead of 1.0)
        const speedMultiplier = speedSetting === 1 ? 2.0 :      // Very Slow
                               speedSetting === 2 ? 1.5 :        // Slow
                               speedSetting === 3 ? 0.67 :       // Medium (50% faster default)
                               speedSetting === 4 ? 0.4 :        // Fast
                               0.2;                              // Very Fast
        
        // Calculate graph bounds (only for valid results)
        const validResults = results.filter(r => !r.error && isFinite(r.fx) && isFinite(r.fpx));
        if (validResults.length > 0) {
            this.graphRenderer.calculateBounds(funcStr, x0, results.length, validResults);
            // Draw initial graph setup (grid, axes, function)
            this.graphRenderer.drawSetup(funcStr);
        }
        
        // Wait a bit for graph to render
        await new Promise(resolve => setTimeout(resolve, 300));

        // Calculate delay based on number of iterations and speed setting
        let baseDelay = results.length > 20 ? 100 : results.length > 10 ? 200 : 300;
        baseDelay = baseDelay * speedMultiplier;

        // Animate each iteration on graph and table simultaneously
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const isErrorRow = result.error || !isFinite(result.fx) || !isFinite(result.fpx);
            
            // Only animate graph for valid iterations
            if (!isErrorRow && validResults.length > 0) {
                // Redraw base graph (grid, axes, function) and previous iterations
                this.graphRenderer.drawSetup(funcStr);
                if (i > 0) {
                    const previousValid = results.slice(0, i).filter(r => !r.error && isFinite(r.fx) && isFinite(r.fpx));
                    if (previousValid.length > 0) {
                        this.graphRenderer.drawAllIterations(previousValid, funcStr, previousValid.length, this.parseFunction.bind(this), this.derivative.bind(this));
                    }
                }
                
                // Animate current iteration on graph
                const graphAnimation = this.graphRenderer.animateIteration(
                    i, 
                    result, 
                    funcStr, 
                    speedMultiplier,
                    this.parseFunction.bind(this),
                    this.derivative.bind(this)
                );
                
                // Animate table row
                const tableAnimation = this.animateRow(result, baseDelay, isErrorRow);
                
                // Wait for both animations to complete
                await Promise.all([graphAnimation, tableAnimation]);
            } else {
                // For error rows, just animate the table row
                const tableAnimation = this.animateRow(result, baseDelay, isErrorRow);
                await tableAnimation;
            }
        }
        
        // Draw final state with all valid iterations
        if (validResults.length > 0) {
            this.graphRenderer.drawSetup(funcStr);
            this.graphRenderer.drawAllIterations(validResults, funcStr, validResults.length, this.parseFunction.bind(this), this.derivative.bind(this));
        }

        // Display final summary with animation
        const lastResult = results[results.length - 1];
        await new Promise(resolve => setTimeout(resolve, 200));
        
        this.finalRootSpan.classList.add('animate-value');
        this.finalValueSpan.classList.add('animate-value');
        this.iterationsUsedSpan.classList.add('animate-value');
        
        // Show error in final result if there was an error
        if (error || lastResult.error) {
            this.finalRootSpan.textContent = 'Error';
            this.finalValueSpan.textContent = error || lastResult.error || 'Error occurred';
            this.iterationsUsedSpan.textContent = results.length - 1;
        } else {
            this.finalRootSpan.textContent = this.formatNumber(lastResult.x);
            this.finalValueSpan.textContent = this.formatNumber(lastResult.fx);
            this.iterationsUsedSpan.textContent = results.length - 1;
        }
        
        // Remove animation class after animation completes
        setTimeout(() => {
            this.finalRootSpan.classList.remove('animate-value');
            this.finalValueSpan.classList.remove('animate-value');
            this.iterationsUsedSpan.classList.remove('animate-value');
        }, 600);
    }

    // Animate a single row
    animateRow(result, delay, isErrorRow = false) {
        return new Promise(resolve => {
            setTimeout(() => {
                const row = document.createElement('tr');
                row.classList.add('animate-row');
                if (isErrorRow) {
                    row.classList.add('error-row');
                }
                
                // Format values, showing "Error" or "NaN" for invalid values
                const formatValue = (val) => {
                    if (!isFinite(val)) {
                        return isErrorRow ? 'Error' : 'NaN';
                    }
                    return this.formatNumber(val);
                };
                
                row.innerHTML = `
                    <td>${result.iteration}</td>
                    <td>${formatValue(result.x)}</td>
                    <td>${formatValue(result.fx)}</td>
                    <td>${formatValue(result.fpx)}</td>
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
            const { results, error } = this.newtonsMethod(funcStr, x0, iterations);

            // Display results with animation (pass funcStr and x0 for graph, and error if any)
            await this.displayResults(results, funcStr, x0, error);

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

