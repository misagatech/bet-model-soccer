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

// Cargar apuestas guardadas del localStorage
function loadBets() {
    const savedBets = localStorage.getItem('bets');
    if (savedBets) {
        bets = JSON.parse(savedBets);
    }
    updateStats();
    updateBetsTable();
    updatePendingBets();
}

// Guardar apuestas en localStorage
function saveBets() {
    localStorage.setItem('bets', JSON.stringify(bets));
}

// Elementos del DOM
const analyzeBtn = document.getElementById('analyzeBtn');
const marketSection = document.getElementById('marketSection');
const resultsSection = document.getElementById('resultsSection');
const marketGrid = document.getElementById('marketGrid');
const saveBetBtn = document.getElementById('saveBetBtn');
const pendingBetsSection = document.getElementById('pendingBetsSection');
const pendingBetsList = document.getElementById('pendingBetsList');
const sortByProbBtn = document.getElementById('sortByProbBtn');
const sortByValueBtn = document.getElementById('sortByValueBtn');
const legend = document.getElementById('legend');

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
saveBetBtn.addEventListener('click', saveBet);
sortByProbBtn.addEventListener('click', () => {
    sortByProbBtn.classList.add('active');
    sortByValueBtn.classList.remove('active');
    showMarketButtons();
});
sortByValueBtn.addEventListener('click', () => {
    sortByValueBtn.classList.add('active');
    sortByProbBtn.classList.remove('active');
    showMarketButtonsByValue();
});

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
    
    // Mostrar botones de mercados (por defecto por probabilidad)
    showMarketButtons();
    showLegend();
}

function showMarketButtons() {
    marketGrid.innerHTML = '';
    
    // Ordenar mercados por probabilidad (de mayor a menor)
    const sortedMarkets = [...markets].sort((a, b) => {
        return currentProbabilities[b.id] - currentProbabilities[a.id];
    });
    
    sortedMarkets.forEach(market => {
        const prob = currentProbabilities[market.id];
        const fairOdds = (1 / prob).toFixed(2);
        
        // Determinar color según probabilidad (SEMÁFORO)
        let colorClass = '';
        let emoji = '';
        
        if (prob >= 0.70) {
            colorClass = 'market-high';
            emoji = '🟢';
        } else if (prob >= 0.50) {
            colorClass = 'market-medium';
            emoji = '🟡';
        } else if (prob >= 0.30) {
            colorClass = 'market-low';
            emoji = '🟠';
        } else {
            colorClass = 'market-verylow';
            emoji = '🔴';
        }
        
        const button = document.createElement('button');
        button.className = `market-btn ${colorClass}`;
        button.innerHTML = `
            <span class="market-emoji">${emoji}</span>
            <strong>${market.name}</strong>
            <span class="market-prob">${(prob*100).toFixed(1)}%</span>
            <span class="market-odds">@${fairOdds}</span>
        `;
        
        button.addEventListener('click', (e) => selectMarket(market.id, e));
        
        marketGrid.appendChild(button);
    });
    
    marketSection.style.display = 'block';
    marketSection.scrollIntoView({ behavior: 'smooth' });
}

function showMarketButtonsByValue() {
    marketGrid.innerHTML = '';
    
    // Calcular value potencial con cuota de referencia 2.0
    const marketsWithValue = markets.map(market => {
        const prob = currentProbabilities[market.id];
        const fairOdds = 1 / prob;
        const potentialValue = ((2.0 / fairOdds) - 1) * 100;
        
        return {
            ...market,
            prob,
            fairOdds,
            potentialValue
        };
    });
    
    // Ordenar por value potencial (de mayor a menor)
    const sortedMarkets = marketsWithValue.sort((a, b) => b.potentialValue - a.potentialValue);
    
    sortedMarkets.forEach(market => {
        const { prob, fairOdds, potentialValue } = market;
        
        // Determinar color según value potencial
        let colorClass = '';
        let emoji = '';
        
        if (potentialValue > 20) {
            colorClass = 'market-value-high';
            emoji = '💰';
        } else if (potentialValue > 10) {
            colorClass = 'market-value-medium';
            emoji = '💵';
        } else if (potentialValue > 0) {
            colorClass = 'market-value-low';
            emoji = '💸';
        } else {
            colorClass = 'market-value-negative';
            emoji = '❌';
        }
        
        const button = document.createElement('button');
        button.className = `market-btn ${colorClass}`;
        button.innerHTML = `
            <span class="market-emoji">${emoji}</span>
            <strong>${market.name}</strong>
            <span class="market-prob">${(prob*100).toFixed(1)}%</span>
            <span class="market-value">${potentialValue > 0 ? '+' : ''}${potentialValue.toFixed(1)}%</span>
        `;
        
        button.addEventListener('click', (e) => selectMarket(market.id, e));
        
        marketGrid.appendChild(button);
    });
}

function showLegend() {
    legend.innerHTML = `
        <div class="legend-item">
            <span class="legend-color high"></span>
            <span>Muy probable (>70%)</span>
        </div>
        <div class="legend-item">
            <span class="legend-color medium"></span>
            <span>Probable (50-70%)</span>
        </div>
        <div class="legend-item">
            <span class="legend-color low"></span>
            <span>Poco probable (30-50%)</span>
        </div>
        <div class="legend-item">
            <span class="legend-color verylow"></span>
            <span>Muy improbable (<30%)</span>
        </div>
    `;
}

function selectMarket(marketId, event) {
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

function saveBet() {
    if (!lastAnalysis) {
        alert('Primero debes seleccionar un mercado');
        return;
    }
    
    const stake = parseFloat(document.getElementById('stakeAmount').value);
    const odds = parseFloat(document.getElementById('marketOdds').value);
    const valuePct = ((odds / lastAnalysis.fairOdds) - 1) * 100;
    
    const newBet = {
        id: Date.now(),
        date: new Date().toLocaleString('es-ES'),
        xgHome: lastAnalysis.xgHome,
        xgAway: lastAnalysis.xgAway,
        market: lastAnalysis.market,
        odds: odds,
        value: (valuePct > 0 ? '+' : '') + valuePct.toFixed(1) + '%',
        stake: stake,
        status: 'pending',
        result: null,
        profit: null
    };
    
    bets.unshift(newBet);
    saveBets();
    updateStats();
    updateBetsTable();
    updatePendingBets();
    
    alert('✅ Apuesta guardada correctamente. Podrás registrar el resultado después del partido.');
    
    // Limpiar selección
    resultsSection.style.display = 'none';
    marketSection.style.display = 'none';
}

function registerResult(betId, result) {
    const betIndex = bets.findIndex(b => b.id === betId);
    if (betIndex === -1) return;
    
    const bet = bets[betIndex];
    const profit = result === 'win' ? bet.stake * (bet.odds - 1) : -bet.stake;
    
    bets[betIndex] = {
        ...bet,
        status: result === 'win' ? 'won' : 'lost',
        result: result,
        profit: (profit > 0 ? '+' : '') + profit.toFixed(2)
    };
    
    saveBets();
    updateStats();
    updateBetsTable();
    updatePendingBets();
    
    alert(`✅ Resultado registrado: ${result === 'win' ? 'GANADA' : 'PERDIDA'}\nProfit: ${bets[betIndex].profit}`);
}

// Hacer la función global para que funcione desde el HTML
window.registerResult = registerResult;

function updatePendingBets() {
    const pendingBets = bets.filter(b => b.status === 'pending');
    
    if (pendingBets.length === 0) {
        pendingBetsSection.style.display = 'none';
        return;
    }
    
    pendingBetsSection.style.display = 'block';
    pendingBetsList.innerHTML = '';
    
    pendingBets.forEach(bet => {
        const card = document.createElement('div');
        card.className = 'pending-bet-card';
        card.innerHTML = `
            <div class="pending-bet-header">
                <span class="bet-market">${bet.market}</span>
                <span class="bet-date">${bet.date}</span>
            </div>
            <div class="pending-bet-details">
                <div class="detail-item">
                    <span class="detail-label">Cuota:</span>
                    <span class="detail-value">${bet.odds.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Stake:</span>
                    <span class="detail-value">€${bet.stake}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Value:</span>
                    <span class="detail-value ${bet.value.includes('+') ? 'value-positive-text' : 'value-negative-text'}">${bet.value}</span>
                </div>
            </div>
            <div class="pending-bet-actions">
                <button class="btn-small btn-success" onclick="registerResult(${bet.id}, 'win')">
                    ✅ Ganó
                </button>
                <button class="btn-small btn-danger" onclick="registerResult(${bet.id}, 'loss')">
                    ❌ Perdió
                </button>
            </div>
        `;
        pendingBetsList.appendChild(card);
    });
}

function updateStats() {
    const total = bets.length;
    const completed = bets.filter(b => b.status !== 'pending').length;
    const wins = bets.filter(b => b.status === 'won').length;
    const losses = bets.filter(b => b.status === 'lost').length;
    const pending = bets.filter(b => b.status === 'pending').length;
    
    const winrate = completed > 0 ? (wins / completed * 100).toFixed(1) : 0;
    const totalProfit = bets.reduce((sum, b) => sum + (parseFloat(b.profit) || 0), 0);
    const totalStake = bets.reduce((sum, b) => sum + b.stake, 0);
    const roi = totalStake > 0 ? (totalProfit / totalStake * 100).toFixed(1) : 0;
    
    document.getElementById('totalBets').textContent = total;
    document.getElementById('completedBets').textContent = completed;
    document.getElementById('pendingBets').textContent = pending;
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
        
        const stakeCell = row.insertCell();
        stakeCell.textContent = '€' + bet.stake;
        
        const statusCell = row.insertCell();
        if (bet.status === 'pending') {
            statusCell.innerHTML = '<span class="status-badge pending">⏳ Pendiente</span>';
        } else {
            const badge = document.createElement('span');
            badge.className = `result-badge ${bet.result}`;
            badge.textContent = bet.result === 'win' ? 'WIN' : 'LOSS';
            statusCell.appendChild(badge);
        }
        
        const profitCell = row.insertCell();
        if (bet.profit) {
            profitCell.textContent = '€' + bet.profit;
            profitCell.className = bet.profit.includes('+') ? 'profit-positive' : 'profit-negative';
        } else {
            profitCell.textContent = '—';
        }
    });
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadBets();
    updatePendingBets();
});
