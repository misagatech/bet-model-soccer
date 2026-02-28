import csv
import os
from datetime import datetime
from pathlib import Path

class BetTracker:
    """
    Gestiona el registro y estadísticas de apuestas
    Guarda en CSV y calcula métricas de rendimiento
    """
    
    def __init__(self, csv_file='bets.csv'):
        """
        Inicializa el tracker con el archivo CSV
        
        Args:
            csv_file (str): nombre del archivo CSV
        """
        self.csv_file = csv_file
        self.ensure_csv_exists()
    
    def ensure_csv_exists(self):
        """Crea el archivo CSV con headers si no existe"""
        if not os.path.exists(self.csv_file):
            with open(self.csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'fecha',
                    'xg_local',
                    'xg_visitante',
                    'cuota',
                    'probabilidad',
                    'value',
                    'stake',
                    'resultado',
                    'profit'
                ])
            print(f"✅ Archivo {self.csv_file} creado")
    
    def register_bet(self, xg_home, xg_away, odds, probability, 
                     value_percentage, stake, result):
        """
        Registra una nueva apuesta
        
        Args:
            xg_home (float): xG local
            xg_away (float): xG visitante
            odds (float): cuota apostada
            probability (float): probabilidad calculada
            value_percentage (float): % de value
            stake (float): cantidad apostada
            result (str): 'win' o 'loss'
            
        Returns:
            float: profit de la apuesta
        """
        # Calcular profit
        if result.lower() == 'win':
            profit = stake * (odds - 1)
        else:
            profit = -stake
        
        # Preparar datos
        bet_data = [
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            round(xg_home, 2),
            round(xg_away, 2),
            round(odds, 2),
            round(probability, 2),
            round(value_percentage, 2),
            round(stake, 2),
            result.lower(),
            round(profit, 2)
        ]
        
        # Guardar en CSV
        with open(self.csv_file, 'a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(bet_data)
        
        print(f"✅ Apuesta registrada: {'🎯 GANADA' if profit > 0 else '❌ PERDIDA'} (Profit: {profit:+.2f})")
        return profit
    
    def get_statistics(self):
        """
        Calcula estadísticas de todas las apuestas
        
        Returns:
            dict: estadísticas completas
        """
        bets = self.load_bets()
        
        if not bets:
            return {
                'total_bets': 0,
                'wins': 0,
                'losses': 0,
                'winrate': 0,
                'total_staked': 0,
                'total_profit': 0,
                'roi': 0,
                'avg_value': 0,
                'avg_odds': 0
            }
        
        # Calcular métricas
        wins = sum(1 for b in bets if b['resultado'] == 'win')
        losses = len(bets) - wins
        total_staked = sum(b['stake'] for b in bets)
        total_profit = sum(b['profit'] for b in bets)
        
        winrate = (wins / len(bets) * 100) if bets else 0
        roi = (total_profit / total_staked * 100) if total_staked > 0 else 0
        
        avg_value = sum(b['value'] for b in bets) / len(bets)
        avg_odds = sum(b['cuota'] for b in bets) / len(bets)
        
        return {
            'total_bets': len(bets),
            'wins': wins,
            'losses': losses,
            'winrate': winrate,
            'total_staked': total_staked,
            'total_profit': total_profit,
            'roi': roi,
            'avg_value': avg_value,
            'avg_odds': avg_odds
        }
    
    def load_bets(self):
        """Carga todas las apuestas del CSV"""
        bets = []
        
        if not os.path.exists(self.csv_file):
            return bets
        
        try:
            with open(self.csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                bets = list(reader)
                
                # Convertir tipos
                for bet in bets:
                    for key in ['xg_local', 'xg_visitante', 'cuota', 'probabilidad', 
                               'value', 'stake', 'profit']:
                        if key in bet:
                            bet[key] = float(bet[key])
        except Exception as e:
            print(f"Error cargando CSV: {e}")
        
        return bets
    
    def display_stats(self):
        """Muestra estadísticas en formato legible"""
        stats = self.get_statistics()
        
        print("\n" + "="*50)
        print("📊 ESTADÍSTICAS DE APUESTAS")
        print("="*50)
        
        if stats['total_bets'] == 0:
            print("No hay apuestas registradas todavía")
            return
        
        print(f"🎲 Total apuestas:    {stats['total_bets']}")
        print(f"✅ Wins:              {stats['wins']}")
        print(f"❌ Losses:            {stats['losses']}")
        print(f"📈 Winrate:           {stats['winrate']:.2f}%")
        print(f"💰 Total stake:       {stats['total_staked']:.2f}")
        print(f"💵 Profit total:      {stats['total_profit']:+.2f}")
        print(f"🎯 ROI:               {stats['roi']:+.2f}%")
        print(f"📊 Value promedio:    {stats['avg_value']:+.2f}%")
        print(f"🎲 Cuota promedio:    {stats['avg_odds']:.2f}")
        print("="*50)


# Prueba rápida
if __name__ == "__main__":
    tracker = BetTracker('test_bets.csv')
    tracker.display_stats()
