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

    probUnder25() {
        return 1 - this.probOver25();
    }

    probOver15() {
        let prob = 0;
        for (let i = 0; i <= 10; i++) {
            for (let j = 0; j <= 10; j++) {
                if (i + j > 1.5) {
                    prob += this.poissonProb(this.xgHome, i) * 
                            this.poissonProb(this.xgAway, j);
                }
            }
        }
        return Math.min(prob, 0.99);
    }

    probUnder15() {
        return 1 - this.probOver15();
    }

    probOver35() {
        let prob = 0;
        for (let i = 0; i <= 10; i++) {
            for (let j = 0; j <= 10; j++) {
                if (i + j > 3.5) {
                    prob += this.poissonProb(this.xgHome, i) * 
                            this.poissonProb(this.xgAway, j);
                }
            }
        }
        return Math.min(prob, 0.99);
    }

    probUnder35() {
        return 1 - this.probOver35();
    }

    probBTTS() {
        const probLocal0 = this.poissonProb(this.xgHome, 0);
        const probVisit0 = this.poissonProb(this.xgAway, 0);
        return (1 - probLocal0) * (1 - probVisit0);
    }

    probBTTSandOver25() {
        let prob = 0;
        for (let i = 1; i <= 10; i++) {
            for (let j = 1; j <= 10; j++) {
                if (i + j > 2.5) {
                    prob += this.poissonProb(this.xgHome, i) * 
                            this.poissonProb(this.xgAway, j);
                }
            }
        }
        return prob;
    }

    probBTTSandUnder25() {
        return this.poissonProb(this.xgHome, 1) * this.poissonProb(this.xgAway, 1);
    }

    probBTTSorOver25() {
        return this.probBTTS() + this.probOver25() - this.probBTTSandOver25();
    }

    kellyCriterion(prob, odds, bankrollPct = 0.02) {
        const q = 1 - prob;
        const b = odds - 1;
        if (b <= 0) return 0;
        const kelly = (prob * b - q) / b;
        return Math.max(0, Math.min(kelly * bankrollPct * 100, 5));
    }
}

// Datos de ejemplo
let bets = [];

// Elementos del DOM
const analyzeBtn = document.getElementById('analyzeBtn');
const marketSection = document.getElementById('marketSection');
const resultsSection = document.getElementById('resultsSection');
const marketGrid = document.getElementById('marketGrid');
const registerWinBtn = document.getElementById('registerWinBtn');
const registerLossBtn = document.getElementById('registerLossBtn');

// Variables globales
let currentModel = null;
let currentProbabilities = {};
let selectedMarket = null;
let lastAnalysis = null;

// Lista de mercados en español
const markets = [
    { id: 'over25', name: 'Over 2.5', probFunc: 'probOver25' },
    { id: 'under25', name: 'Under 2.5', probFunc: 'probUnder25' },
    { id: 'over15', name: 'Over 1.5', probFunc: 'probOver15' },
    { id: 'under15', name: 'Under 1.5', probFunc: 'probUnder15' },
    { id: 'over35', name: 'Over 3.5', probFunc: 'probOver35' },
    { id: 'under35', name: 'Under 3.5', probFunc: 'probUnder35' },
    { id: 'btts', name: 'BTTS (Ambos marcan)', probFunc: 'probBTTS' },
    { id: 'bttsOver', name: 'BTTS + Over 2.5', probFunc: 'probBTTSandOver25' },
    { id: 'bttsUnder', name: 'BTTS + Under 2.5 (1-1)', probFunc: 'probBTTSandUnder25' },
    { id: 'bttsOrOver', name: 'BTTS o Over 2.5', probFunc: 'probBTTSorOver25' }
];

// Event Listeners
analyzeBtn.addEventListener('click', analyzeAllMarkets);
registerWinBtn.addEventListener('click', () => registerResult('win'));
registerLossBtn.addEventListener('click', () => registerResult('loss'));

function analyzeAllMarkets() {
    const xgHome = parseFloat(document.getElementById('xgHome').value);
    const xgAway = parseFloat(document.getElementById('xgAway').value);
    
    if (!xgHome || !xgAway) {
        alert('Por favor completa los xG de ambos equipos');
        return;
    }
    
    currentModel = new PoissonModel(xgHome, xgAway);
    currentProbabilities = {};
    
    // Calcular todos los mercados
    markets.forEach(market => {
        currentProbabilities[market.id] = currentModel[market.probFunc]();
    });
    
    // Mostrar botones de mercados
    showMarketButtons();
}

function showMarketButtons() {
    marketGrid.innerHTML = '';
    
    markets.forEach(market => {
        const prob = currentProbabilities[market.id];
        const fairOdds = (1 / prob).toFixed(2);
        
        const button = document.createElement('button');
        button.className = 'market-btn';
        button.innerHTML = `
            <strong>${market.name}</strong>
            <span class="market-prob">${(prob*100).toFixed(1)}% | @${fairOdds}</span>
        `;
        
        button.addEventListener('click', () => selectMarket(market.id));
        
        marketGrid.appendChild(button);
    });
    
    marketSection.style.display = 'block';
    marketSection.scrollIntoView({ behavior: 'smooth' });
}

function selectMarket(marketId) {
    selectedMarket = markets.find(m => m.id === marketId);
    const probability = currentProbabilities[marketId];
    const fairOdds = 1 / probability;
    
    // Guardar análisis
    lastAnalysis = {
        xgHome: parseFloat(document.getElementById('xgHome').value),
        xgAway: parseFloat(document.getElementById('xgAway').value),
        market: selectedMarket.name,
        probability: probability,
        fairOdds: fairOdds
    };
    
    // Actualizar UI
    document.getElementById('marketLabel').textContent = selectedMarket.name;
    document.getElementById('probabilityValue').textContent = (probability * 100).toFixed(1) + '%';
    document.getElementById('fairOddsValue').textContent = fairOdds.toFixed(2);
    
    // Quitar selección anterior
    document.querySelectorAll('.market-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Marcar el seleccionado
    event.currentTarget.classList.add('selected');
    
    // Mostrar sección de resultados
    resultsSection.style.display = 'block';
    
    // Calcular value con la cuota actual
    calculateValue();
}

function calculateValue() {
    if (!lastAnalysis) return;
    
    const marketOdds = parseFloat(document.getElementById('marketOdds').value);
    const probability = lastAnalysis.probability;
    const fairOdds = lastAnalysis.fairOdds;
    
    const valuePct = ((marketOdds / fairOdds) - 1) * 100;
    const kelly = currentModel.kellyCriterion(probability, marketOdds);
    
    document.getElementById('valuePercentage').textContent = 
        (valuePct > 0 ? '+' : '') + valuePct.toFixed(1) + '%';
    document.getElementById('kellyValue').textContent = kelly.toFixed(1) + '%';
    
    // Actualizar color del value card
    const valueCard = document.getElementById('valueCard');
    const valueLabel = document.getElementById('valueLabel');
    
    if (valuePct > 5) {
        valueCard.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
        valueCard.style.color = 'white';
        valueLabel.textContent = '✅ VALUE DETECTADO';
        valueLabel.style.color = 'white';
    } else if (valuePct < -5) {
        valueCard.style.background = 'linear-gradient(135deg, #ef4444, #f87171)';
        valueCard.style.color = 'white';
        valueLabel.textContent = '❌ VALUE NEGATIVO';
        valueLabel.style.color = 'white';
    } else {
        valueCard.style.background = 'linear-gradient(135deg, #f59e0b, #fbbf24)';
        valueCard.style.color = 'white';
        valueLabel.textContent = '⚖️ SIN VALUE';
        valueLabel.style.color = 'white';
    }
}

// Event listeners para inputs de odds y stake
document.getElementById('marketOdds').addEventListener('input', calculateValue);
document.getElementById('stakeAmount').addEventListener('input', calculateValue);

function registerResult(result) {
    if (!lastAnalysis) {
        alert('Primero debes analizar un mercado');
        return;
    }
    
    const stake = parseFloat(document.getElementById('stakeAmount').value);
    const odds = parseFloat(document.getElementById('marketOdds').value);
    const profit = result === 'win' ? stake * (odds - 1) : -stake;
    const valuePct = ((odds / lastAnalysis.fairOdds) - 1) * 100;
    
    const newBet = {
        date: new Date().toLocaleDateString('es-ES'),
        market: lastAnalysis.market,
        odds: odds,
        value: (valuePct > 0 ? '+' : '') + valuePct.toFixed(1) + '%',
        stake: stake,
        result: result,
        profit: (profit > 0 ? '+' : '') + profit.toFixed(2)
    };
    
    bets.unshift(newBet);
    updateStats();
    updateBetsTable();
    
    alert(`✅ Apuesta registrada como ${result === 'win' ? 'GANADA' : 'PERDIDA'}\nProfit: ${newBet.profit}`);
}

function updateStats() {
    const total = bets.length;
    const wins = bets.filter(b => b.result === 'win').length;
    const losses = total - wins;
    const winrate = total > 0 ? (wins / total * 100).toFixed(1) : 0;
    const totalProfit = bets.reduce((sum, b) => sum + parseFloat(b.profit), 0);
    const totalStake = bets.reduce((sum, b) => sum + b.stake, 0);
    const roi = totalStake > 0 ? (totalProfit / totalStake * 100).toFixed(1) : 0;
    
    document.getElementById('totalBets').textContent = total;
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('winrate').textContent = winrate + '%';
    document.getElementById('totalProfit').textContent = 
        (totalProfit > 0 ? '+' : '') + '€' + totalProfit.toFixed(2);
    document.getElementById('roi').textContent = 
        (roi > 0 ? '+' : '') + roi + '%';
}

function updateBetsTable() {
    const tbody = document.getElementById('betsTableBody');
    tbody.innerHTML = '';
    
    bets.slice(0, 10).forEach(bet => {
        const row = tbody.insertRow();
        
        row.insertCell().textContent = bet.date;
        row.insertCell().textContent = bet.market;
        row.insertCell().textContent = bet.odds.toFixed(2);
        
        const valueCell = row.insertCell();
        valueCell.textContent = bet.value;
        valueCell.style.color = bet.value.includes('+') ? '#10b981' : '#ef4444';
        
        const resultCell = row.insertCell();
        const badge = document.createElement('span');
        badge.className = `result-badge ${bet.result}`;
        badge.textContent = bet.result === 'win' ? 'WIN' : 'LOSS';
        resultCell.appendChild(badge);
        
        const profitCell = row.insertCell();
        profitCell.textContent = '€' + bet.profit;
        profitCell.className = bet.profit.includes('+') ? 'profit-positive' : 'profit-negative';
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    updateBetsTable();
});
