const readline = require('readline');
const mathLib = require('mathjs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (txt) => new Promise(resolve => rl.question(txt, resolve));

function factorial(n) {
    let f = 1;
    for (let i = 1; i <= n; i++) f *= i;
    return f;
}


async function askNumber(msg) {
    while (true) {
        const data = await ask(msg);
        const num = parseFloat(data);
        if (!isNaN(num)) return num;
        console.log('Enter valid num\n');
    }
}

async function inEx(txt, ele = 'x') {
    while (true) {
        const inp = await ask(txt);
        try {
            const comp = mathLib.compile(inp);
            comp.evaluate({ [ele]: 1 });
            return { data: inp, compiled: comp };
        } catch (err) {
            console.log(`Error: ${err.message} \n`);
        }
    }
}

class RootSolver {
    constructor(obj, tol) {
        this.strFn = obj.data;
        this.compFn = obj.compiled;
        this.tol = tol;
        this.maxSteps = 100;
    }

    f(x) {
        try {
            return this.compFn.evaluate({ x });
        } catch (e) {
            return NaN;
        }
    }

    fDre(x) {
        try {
            const df = mathLib.derivative(this.strFn, 'x');
            return df.evaluate({ x });
        } catch (err) {
            return NaN;
        }
    }

    printTable(method, data, root) {
        console.log(`\n=== ${method} ===`);
        const table = data.map(item => {
            const tItem = {};
            for (const i in item) {
                let v = item[i];
                if (typeof v === 'number') {
                    tItem[i] = Number(v.toFixed(12));
                } else {
                    tItem[i] = v;
                }
            }
            return tItem;
        });
        console.table(table);
        console.log('\nroot = ' + root.toFixed(12) + '\n');
    }

    async bisection() {
        console.log("-> Bisection:\n");
        let a = await askNumber("Left bound (a): ");
        let b = await askNumber("Right bound (b): ");
        let fA = this.f(a);
        let fB = this.f(b);
        if (fA * fB >= 0) {
            console.log("f(a) * f(b) must be -ve\n");
            return;
        }
        let step = 0;
        let pre = 0;
        let err = 100;
        let c = 0;
        const table = [];
        while (err > this.tol && step < this.maxSteps) {
            step++;
            c = (a + b) / 2;
            const fC = this.f(c);
            if (step > 1) {
                err = Math.abs(c - pre);
            }
            table.push({
                a: a,
                b: b,
                c: c,
                'f(c)': (fC > 0 ? '+ve' : '-ve'),
                'Err': step > 1 ? err : '--'
            });
            pre = c;
            if (fC === 0) break;
            if (fC < 0) {
                b = c;
            } else {
                a = c;
            }
        }
        this.printTable("Bisection", table, c);
    }

    async falsePosition() {
        console.log("-> False Position:\n");
        let a = await askNumber("Left bound (a): ");
        let b = await askNumber("Right bound (b): ");
        let fA = this.f(a);
        let fB = this.f(b);
        if (fA * fB >= 0) {
            console.log("f(a) * f(b) must be -ve\n");
            return;
        }
        let i = 0;
        let prev = 0;
        let err = 100;
        let c = 0;
        const table = [];
        while (err > this.tol && i < this.maxSteps) {
            i++;
            if ((fB - fA) === 0) break;
            c = (a * fB - b * fA) / (fB - fA);
            const fC = this.f(c);
            if (i > 1) err = Math.abs(c - prev);
            table.push({
                a: a,
                b: b,
                c: c,
                'f(c)': (fC > 0 ? '+ve' : '-ve'),
                'Err': i > 1 ? err : '--'
            });
            prev = c;
            if (fC === 0) break;
            if (fA * fC < 0) {
                b = c;
                fB = fC;
            } else {
                a = c;
                fA = fC;
            }
        }
        this.printTable("False Position", table, c);
    }

    async fixedPoint() {
        console.log("-> Fixed Point:\n");
        const gObj = await inEx("Enter g(x): ");
        let x = await askNumber("(x0): ");
        const g = gObj.compiled;
        let err = 100;
        let n = 0;
        const table = [];
        while (err > this.tol && n < this.maxSteps) {
            n++;
            const prev = x;
            try {
                x = g.evaluate({ x: prev });
            } catch (e) {
                console.log(`Error ${e.message}`);
                return;
            }
            if (x !== 0) err = Math.abs(x - prev)
            else err = 0;
            table.push({
                'x(i-1)': prev,
                'x(i)': x,
                'Err': err
            });
        }
        if (n >= this.maxSteps) {
            console.log("Reached max iterations");
        }
        this.printTable("Fixed Point", table, x);
    }

    async newtonRaphson() {
        console.log("-> Newton-Raphson:\n");
        let x = await askNumber("(x0): ");
        let err = 100;
        let i = 0;
        const table = [];
        while (err > this.tol && i < this.maxSteps) {
            i++;
            const fX = this.f(x);
            const fDash = this.fDre(x);
            if (fDash === 0) {
                console.log("F'(x) = 0\n");
                break;
            }
            const next = x - fX / fDash;
            if (next !== 0) err = Math.abs(next - x);
            else err = 0;
            table.push({
                'x(i-1)': x,
                'x(i)': next,
                'Err': err
            });
            x = next;
        }
        this.printTable("Newton-Raphson", table, x);
    }

    async secant() {
        console.log("-> Secant Method:\n");
        let x0 = await askNumber("(x0): ");
        let x1 = await askNumber("(x1): ");
        let err = 100;
        let i = 0;
        const table = [];
        while (err > this.tol && i < this.maxSteps) {
            i++;
            const f0 = this.f(x0);
            const f1 = this.f(x1);
            if ((f1 - f0) === 0) {
                console.log(`(f${i - 1} - f${i}) = 0)\n`);
                break;
            }
            const x2 = x1 - f1 * ((x1 - x0) / (f1 - f0));
            err = Math.abs(x2 - x1);
            table.push({
                'x(i-1)': x0,
                'x(i)': x1,
                'x(i+1)': x2,
                'Err': err
            });
            x0 = x1;
            x1 = x2;
        }
        this.printTable("Secant", table, x1);
    }
}

async function main() {
    console.clear();
    console.log("=======================================================");
    console.log("   NUMERICAL ANALYSIS SOLVER (by Abdelrahman Ashraf)");
    console.log("=======================================================");

    while (true) {
        console.log("\nWhat would you like to solve?");
        console.log("1. Roots of Non-Linear Equation (f(x) = 0)");
        console.log("2. System of Linear Equations (Ax = B)");
        console.log("3. Interpolation / Curve Fitting");
        console.log("4. Exit");
        const choice = await ask("\nChoice: ");
        if (choice.trim() === '1') {
            await runRootFinder();
        } else if (choice.trim() === '2') {
            await runLinearSystem();
        } else if (choice.trim() === '3') {
            await runInterpolation();
        } else if (choice.trim() === '4') {
            rl.close();
            process.exit(0);
        } else {
            console.log("Invalid selection.");
        }
    }
}

main();
