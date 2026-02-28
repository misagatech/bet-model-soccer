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
    
    // Calcular TODAS las probabilidades
    const probOver25 = model.probOver25();
    const probUnder25 = 1 - probOver25;
    const probOver15 = model.probOver15();
    const probUnder15 = 1 - probOver15;
    const probOver35 = model.probOver35();
    const probUnder35 = 1 - probOver35;
    
    // Calcular cuotas justas
    const fairOver25 = (1 / probOver25).toFixed(2);
    const fairUnder25 = (1 / probUnder25).toFixed(2);
    const fairOver15 = (1 / probOver15).toFixed(2);
    const fairUnder15 = (1 / probUnder15).toFixed(2);
    const fairOver35 = (1 / probOver35).toFixed(2);
    const fairUnder35 = (1 / probUnder35).toFixed(2);
    
    // Calcular value para Over 2.5
    const valueOver25 = ((odds / fairOver25) - 1) * 100;
    
    // Guardar análisis completo
    lastAnalysis = {
        xgHome, xgAway, odds,
        probOver25, probUnder25, probOver15, probUnder15, probOver35, probUnder35,
        fairOver25, fairUnder25, fairOver15, fairUnder15, fairOver35, fairUnder35,
        valueOver25,
        hasValue: valueOver25 > 5
    };
    
    // Actualizar UI con los resultados básicos
    document.getElementById('probabilityValue').textContent = 
        (probOver25 * 100).toFixed(1) + '%';
    document.getElementById('fairOddsValue').textContent = fairOver25;
    document.getElementById('valuePercentage').textContent = 
        (valueOver25 > 0 ? '+' : '') + valueOver25.toFixed(1) + '%';
    
    // Calcular Kelly
    const kelly = model.kellyCriterion(probOver25, odds);
    document.getElementById('kellyValue').textContent = kelly + '%';
    
    // Actualizar estilo del value card
    const valueCard = document.getElementById('valueCard');
    const valueLabel = document.getElementById('valueLabel');
    
    if (valueOver25 > 5) {
        valueCard.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
        valueCard.style.color = 'white';
        valueLabel.textContent = '✅ VALUE DETECTADO';
        valueLabel.style.color = 'white';
    } else if (valueOver25 < -5) {
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
    
    // Crear y mostrar la tabla de análisis completo
    showFullAnalysis(lastAnalysis);
    
    // Mostrar sección de resultados
    resultsSection.style.display = 'block';
    
    // Hacer scroll a los resultados
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Función para mostrar análisis completo (VERSIÓN COMPLETA)
function showFullAnalysis(data) {
    // Verificar si ya existe la sección de análisis completo
    let fullAnalysisSection = document.getElementById('fullAnalysisSection');
    
    // Si no existe, crearla
    if (!fullAnalysisSection) {
        fullAnalysisSection = document.createElement('section');
        fullAnalysisSection.id = 'fullAnalysisSection';
        fullAnalysisSection.className = 'analysis-section';
        
        // Insertar después de resultsSection
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.parentNode.insertBefore(fullAnalysisSection, resultsSection.nextSibling);
    }
    
    // Determinar la clase de recomendación
    let recommendClass = '';
    if (data.valueOver25 > 5) {
        recommendClass = 'recommend-yes';
    } else if (data.valueOver25 < -5) {
        recommendClass = 'recommend-no';
    } else {
        recommendClass = 'recommend-neutral';
    }
    
    // Crear el HTML de la tabla completa
    fullAnalysisSection.innerHTML = `
        <h2>📊 ANÁLISIS COMPLETO DE MERCADOS</h2>
        <div class="analysis-card">
            <div class="xg-total">
                ⚽ xG Total: ${(parseFloat(data.xgHome) + parseFloat(data.xgAway)).toFixed(2)}
                (Local: ${data.xgHome} | Visitante: ${data.xgAway})
            </div>
            
            <div class="markets-table-container">
                <table class="markets-table">
                    <thead>
                        <tr>
                            <th>MERCADO</th>
                            <th>PROB</th>
                            <th>C. JUSTA</th>
                            <th>VALUE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="${data.valueOver25 > 5 ? 'value-positive' : (data.valueOver25 < -5 ? 'value-negative' : '')}">
                            <td><strong>Over 2.5</strong></td>
                            <td>${(data.probOver25 * 100).toFixed(1)}%</td>
                            <td>${data.fairOver25}</td>
                            <td>${data.valueOver25 > 0 ? '+' : ''}${data.valueOver25.toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td>Under 2.5</td>
                            <td>${(data.probUnder25 * 100).toFixed(1)}%</td>
                            <td>${data.fairUnder25}</td>
                            <td>—</td>
                        </tr>
                        <tr>
                            <td>Over 1.5</td>
                            <td>${(data.probOver15 * 100).toFixed(1)}%</td>
                            <td>${data.fairOver15}</td>
                            <td>—</td>
                        </tr>
                        <tr>
                            <td>Under 1.5</td>
                            <td>${(data.probUnder15 * 100).toFixed(1)}%</td>
                            <td>${data.fairUnder15}</td>
                            <td>—</td>
                        </tr>
                        <tr>
                            <td>Over 3.5</td>
                            <td>${(data.probOver35 * 100).toFixed(1)}%</td>
                            <td>${data.fairOver35}</td>
                            <td>—</td>
                        </tr>
                        <tr>
                            <td>Under 3.5</td>
                            <td>${(data.probUnder35 * 100).toFixed(1)}%</td>
                            <td>${data.fairUnder35}</td>
                            <td>—</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="recommendation-box ${recommendClass}">
                <h3>📈 RECOMENDACIÓN</h3>
                ${data.valueOver25 > 5 ? 
                    `<p>✅ APOSTAR Over 2.5 con cuota ${data.odds}</p>
                     <p>Value: +${data.valueOver25.toFixed(1)}%</p>
                     <p class="kelly">💰 Kelly: ${document.getElementById('kellyValue').textContent} del bankroll</p>` : 
                    data.valueOver25 < -5 ?
                    `<p>❌ NO APOSTAR Over 2.5</p>
                     <p>Value negativo: ${data.valueOver25.toFixed(1)}%</p>
                     <p>⚡ Considera Under 2.5 si la cuota es buena</p>` :
                    `<p>⚖️ Over 2.5 sin value significativo</p>
                     <p>Value: ${data.valueOver25.toFixed(1)}%</p>`
                }
            </div>
            
            <div class="suggestions-box">
                <h3>💡 SUGERENCIAS PARA OTROS MERCADOS</h3>
                <ul>
                    ${data.probOver15 > 0.75 ? 
                        `<li>✅ Over 1.5: ${(data.probOver15*100).toFixed(1)}% - Busca cuotas > ${data.fairOver15}</li>` : ''}
                    ${data.probUnder15 > 0.75 ? 
                        `<li>✅ Under 1.5: ${(data.probUnder15*100).toFixed(1)}% - Busca cuotas > ${data.fairUnder15}</li>` : ''}
                    ${data.probOver35 > 0.40 ? 
                        `<li>⚡ Over 3.5: ${(data.probOver35*100).toFixed(1)}% - Ideal para cuotas altas</li>` : ''}
                    ${data.probUnder35 > 0.75 ? 
                        `<li>✅ Under 3.5: ${(data.probUnder35*100).toFixed(1)}% - Busca cuotas > ${data.fairUnder35}</li>` : ''}
                </ul>
                ${(!data.probOver15 > 0.75 && !data.probUnder15 > 0.75 && !data.probOver35 > 0.40 && !data.probUnder35 > 0.75) ? 
                    '<p>No hay sugerencias destacadas para otros mercados</p>' : ''}
            </div>
        </div>
    `;
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
        value: (lastAnalysis.valueOver25 > 0 ? '+' : '') + 
               lastAnalysis.valueOver25.toFixed(1) + '%',
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
