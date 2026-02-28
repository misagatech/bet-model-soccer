// Clase para manejar el modelo Poisson
class PoissonModel {
    constructor(xgHome, xgAway) {
        this.xgHome = parseFloat(xgHome);
        this.xgAway = parseFloat(xgAway);
    }

    poissonProb(lam, k) {
        return (Math.exp(-lam) * Math.pow(lam, k)) / this.factorial(k);
    }

    factorial(n) {
        if (n === 0 || n === 1) return 1;
        return n * this.factorial(n - 1);
    }

    probOver25() {
        let prob = 0;
        for (let i = 0; i <= 10; i++) {
            for (let j = 0; j <= 10; j++) {
                if (i + j > 2.5) {
                    prob += this.poissonProb(this.xgHome, i) * 
                            this.poissonProb(this.xgAway, j);
                }
            }
        }
        return Math.min(prob, 0.99);
    }

    fairOdds(prob) {
        return prob > 0 ? (1 / prob).toFixed(2) : 1000;
    }

    calculateValue(marketOdds, prob) {
        const fairOdds = this.fairOdds(prob);
        const valuePct = ((marketOdds / fairOdds) - 1) * 100;
        return {
            percentage: valuePct.toFixed(1),
            hasValue: valuePct > 5,
            fairOdds: fairOdds
        };
    }

    kellyCriterion(prob, odds, bankrollPct = 0.02) {
        const q = 1 - prob;
        const b = odds - 1;
        if (b <= 0) return 0;
        const kelly = (prob * b - q) / b;
        return Math.max(0, Math.min(kelly * bankrollPct * 100, 5)).toFixed(1);
    }
}

// Datos de ejemplo
let bets = [
    {
        date: '2024-01-15',
        xgHome: 1.8,
        xgAway: 1.2,
        odds: 1.95,
        value: '+14.2%',
        stake: 100,
        result: 'win',
        profit: '+95.00'
    },
    {
        date: '2024-01-14',
        xgHome: 2.1,
        xgAway: 0.9,
        odds: 1.85,
        value: '+8.5%',
        stake: 100,
        result: 'loss',
        profit: '-100.00'
    }
];

// Elementos del DOM
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('resultsSection');
const registerWinBtn = document.getElementById('registerWinBtn');
const registerLossBtn = document.getElementById('registerLossBtn');

// Variables globales para el último análisis
let lastAnalysis = null;

// Event Listeners
analyzeBtn.addEventListener('click', analyzeBet);
registerWinBtn.addEventListener('click', () => registerResult('win'));
registerLossBtn.addEventListener('click', () => registerResult('loss'));

// Función principal de análisis
function analyzeBet() {
    const xgHome = document.getElementById('xgHome').value;
    const xgAway = document.getElementById('xgAway').value;
    const odds = parseFloat(document.getElementById('odds').value);
    
    if (!xgHome || !xgAway || !odds) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    const model = new PoissonModel(xgHome, xgAway);
    const prob = model.probOver25();
    const valueInfo = model.calculateValue(odds, prob);
    const kelly = model.kellyCriterion(prob, odds);
    
    // Guardar análisis
    lastAnalysis = {
        xgHome, xgAway, odds, prob, valueInfo, kelly
    };
    
    // Actualizar UI
    document.getElementById('probabilityValue').textContent = 
        (prob * 100).toFixed(1) + '%';
    document.getElementById('fairOddsValue').textContent = 
        valueInfo.fairOdds;
    document.getElementById('valuePercentage').textContent = 
        (valueInfo.hasValue ? '+' : '') + valueInfo.percentage + '%';
    document.getElementById('kellyValue').textContent = 
        kelly + '%';
    
    // Actualizar estilo del value card
    const valueCard = document.getElementById('valueCard');
    const valueLabel = document.getElementById('valueLabel');
    
    if (valueInfo.hasValue) {
        valueCard.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
        valueCard.style.color = 'white';
        valueLabel.textContent = '✅ VALUE DETECTADO';
        valueLabel.style.color = 'white';
    } else {
        valueCard.style.background = 'linear-gradient(135deg, #ef4444, #f87171)';
        valueCard.style.color = 'white';
        valueLabel.textContent = '❌ SIN VALUE';
        valueLabel.style.color = 'white';
    }
    
    // Mostrar sección de resultados
    resultsSection.style.display = 'block';
    
    // Hacer scroll a los resultados
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Registrar resultado
function registerResult(result) {
    if (!lastAnalysis) {
        alert('Primero debes analizar una apuesta');
        return;
    }
    
    const stake = parseFloat(document.getElementById('stake').value);
    const profit = result === 'win' ? 
        stake * (lastAnalysis.odds - 1) : -stake;
    
    const newBet = {
        date: new Date().toLocaleDateString('es-ES'),
        xgHome: lastAnalysis.xgHome,
        xgAway: lastAnalysis.xgAway,
        odds: lastAnalysis.odds,
        value: (lastAnalysis.valueInfo.hasValue ? '+' : '') + 
               lastAnalysis.valueInfo.percentage + '%',
        stake: stake,
        result: result,
        profit: (profit > 0 ? '+' : '') + profit.toFixed(2)
    };
    
    bets.unshift(newBet);
    updateStats();
    updateBetsTable();
    
    // Feedback visual
    alert(`✅ Apuesta registrada como ${result.toUpperCase()}\nProfit: ${newBet.profit}`);
}

// Actualizar estadísticas
function updateStats() {
    const total = bets.length;
    const wins = bets.filter(b => b.result === 'win').length;
    const losses = total - wins;
    const winrate = (wins / total * 100).toFixed(1);
    const totalProfit = bets.reduce((sum, b) => 
        sum + parseFloat(b.profit), 0);
    const totalStake = bets.reduce((sum, b) => 
        sum + parseFloat(b.stake), 0);
    const roi = (totalProfit / totalStake * 100).toFixed(1);
    
    document.getElementById('totalBets').textContent = total;
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('winrate').textContent = winrate + '%';
    document.getElementById('totalProfit').textContent = 
        (totalProfit > 0 ? '+' : '') + '€' + totalProfit.toFixed(2);
    document.getElementById('roi').textContent = 
        (roi > 0 ? '+' : '') + roi + '%';
}

// Actualizar tabla de apuestas
function updateBetsTable() {
    const tbody = document.getElementById('betsTableBody');
    tbody.innerHTML = '';
    
    bets.slice(0, 10).forEach(bet => {
        const row = tbody.insertRow();
        
        // Fecha
        row.insertCell().textContent = bet.date;
        
        // xG
        row.insertCell().textContent = `${bet.xgHome} - ${bet.xgAway}`;
        
        // Cuota
        row.insertCell().textContent = bet.odds.toFixed(2);
        
        // Value
        const valueCell = row.insertCell();
        valueCell.textContent = bet.value;
        valueCell.style.color = bet.value.includes('+') ? '#10b981' : '#ef4444';
        
        // Stake
        row.insertCell().textContent = '€' + bet.stake;
        
        // Resultado
        const resultCell = row.insertCell();
        const badge = document.createElement('span');
        badge.className = `result-badge ${bet.result}`;
        badge.textContent = bet.result === 'win' ? 'WIN' : 'LOSS';
        resultCell.appendChild(badge);
        
        // Profit
        const profitCell = row.insertCell();
        profitCell.textContent = '€' + bet.profit;
        profitCell.className = bet.profit.includes('+') ? 
            'profit-positive' : 'profit-negative';
    });
}

// Inicializar la página
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    updateBetsTable();
    
    // Análisis de ejemplo al cargar
    setTimeout(() => {
        analyzeBet();
    }, 500);
});
