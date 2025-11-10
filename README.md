# Newton's Method Calculator

A beautiful, modern web-based calculator that finds roots of mathematical functions using Newton's iterative method.

🌐 **Live Website**: [https://nt.c171017.com](https://nt.c171017.com)

## Features

- 🎯 **Easy to Use**: Simply enter a function, starting point, and number of iterations
- 🎬 **Animated Iterations**: Watch each iteration appear step-by-step with beautiful animations
- ⚡ **Adjustable Speed**: Control animation speed (Slow/Medium/Fast) to match your learning pace
- 📊 **Detailed Results**: View step-by-step iterations in a clean table format
- 🔢 **Function Support**: Handles trigonometric and logarithmic functions
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- ✨ **Visual Feedback**: Smooth transitions and highlighting for better understanding

## Supported Functions

- **Basic Operations**: `+`, `-`, `*`, `/`, `^` (power)
- **Trigonometric**: `sin()`, `cos()`, `tan()`
- **Logarithmic**: `log()` or `ln()` (natural logarithm)
- **Other**: `sqrt()`, `abs()`, `exp()`
- **Constants**: `pi`, `e`

## Usage Examples

### Example 1: Square Root
Find the square root of 4:
- **Function**: `x^2 - 4`
- **Starting Point**: `1`
- **Iterations**: `10`
- **Result**: Converges to `x ≈ 2`

### Example 2: Trigonometric
Solve `sin(x) = 0.5`:
- **Function**: `sin(x) - 0.5`
- **Starting Point**: `0.5`
- **Iterations**: `10`
- **Result**: Converges to `x ≈ 0.5236` (π/6)

### Example 3: Logarithmic
Solve `log(x) = 2`:
- **Function**: `log(x) - 2`
- **Starting Point**: `5`
- **Iterations**: `10`
- **Result**: Converges to `x ≈ 7.389` (e²)

### Example 4: Polynomial
Find roots of a cubic equation:
- **Function**: `x^3 - 2*x - 5`
- **Starting Point**: `2`
- **Iterations**: `10`
- **Result**: Converges to `x ≈ 2.0946`

## How It Works

Newton's method uses the formula:

**x_{n+1} = x_n - f(x_n) / f'(x_n)**

The calculator:
1. Evaluates the function at the current point
2. Calculates the derivative numerically using the central difference method
3. Computes the next approximation
4. Repeats until convergence or max iterations reached

## Getting Started

**🌐 Try it online**: Visit [https://nt.c171017.com](https://nt.c171017.com)

Or simply open `index.html` in any modern web browser. No installation or build process required!

## Animation Features

The calculator includes beautiful step-by-step animations that help visualize the convergence process:

- **Visual Iteration Display**: Each iteration appears one at a time with a smooth slide-in effect
- **Row Highlighting**: New rows are highlighted with a color pulse to draw attention
- **Value Animation**: Final results pulse and glow when displayed
- **Speed Control**: Adjust animation speed to:
  - **Slow**: Best for learning and understanding each step
  - **Medium**: Balanced speed for general use
  - **Fast**: Quick results for experienced users or many iterations

## Tips

- Choose a starting point close to the expected root for faster convergence
- If the calculation diverges, try a different starting point
- The method may fail if f'(x) = 0 at any iteration point
- For periodic functions (like sin, cos), different starting points may lead to different roots
- Use slower animation speed when learning to better understand the convergence process

## Technical Details

- **Derivative Calculation**: Uses central difference method with h = 1e-7
- **Convergence Criterion**: |f(x)| < 1e-10
- **Safety Checks**: Prevents division by zero and divergence
- **Number Formatting**: Automatic scientific notation for very large/small numbers

## Browser Compatibility

Works on all modern browsers including:
- Chrome/Edge (v90+)
- Firefox (v88+)
- Safari (v14+)
- Opera (v76+)

---

Built with HTML, CSS, and vanilla JavaScript. No dependencies required.

