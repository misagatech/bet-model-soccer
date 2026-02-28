"""
SISTEMA DE VALUE BETTING CON MODELO POISSON
Versión: 3.0 - BTTS y Combinadas
"""

from src.model import PoissonModel
from src.tracker import BetTracker
import sys

def clear_screen():
    """Limpia la pantalla de la terminal"""
    import os
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header():
    """Muestra el header del programa"""
    print("="*70)
    print("🎯 SISTEMA DE VALUE BETTING - MODELO POISSON")
    print("="*70)
    print("Análisis de Over/Under, BTTS y Combinadas")
    print("-"*70)

def get_float_input(prompt, min_val=0, max_val=None):
    """
    Obtiene input float del usuario con validación
    """
    while True:
        try:
            value = float(input(prompt))
            
            if value < min_val:
                print(f"❌ El valor debe ser mayor o igual a {min_val}")
                continue
            
            if max_val and value > max_val:
                print(f"❌ El valor debe ser menor o igual a {max_val}")
                continue
            
            return value
        except ValueError:
            print("❌ Por favor ingresa un número válido")
        except KeyboardInterrupt:
            print("\n👋 Saliendo...")
            sys.exit(0)

def get_result_input():
    """Obtiene el resultado de la apuesta"""
    while True:
        result = input("Resultado (win/loss): ").strip().lower()
        if result in ['win', 'loss']:
            return result
        print("❌ Por favor ingresa 'win' o 'loss'")

def analyze_all_markets(xg_home, xg_away):
    """Analiza TODOS los mercados disponibles"""
    model = PoissonModel(xg_home, xg_away)
    
    # Calcular probabilidades
    markets = {
        'Over 2.5': model.prob_over_2_5(),
        'Under 2.5': model.prob_under_2_5(),
        'Over 1.5': model.prob_over_1_5(),
        'Under 1.5': model.prob_under_1_5(),
        'Over 3.5': model.prob_over_3_5(),
        'Under 3.5': model.prob_under_3_5(),
        'BTTS (Ambos marcan)': model.prob_btts(),
        'BTTS + Over 2.5': model.prob_btts_and_over25(),
        'BTTS + Under 2.5 (1-1)': model.prob_btts_and_under25(),
        'BTTS o Over 2.5': model.prob_btts_or_over25()
    }
    
    return model, markets

def main():
    """Función principal del programa"""
    tracker = BetTracker('data/bets.csv')
    
    while True:
        clear_screen()
        print_header()
        tracker.display_stats()
        
        print("\n" + "="*70)
        print("📝 NUEVA APUESTA")
        print("="*70)
        print("(Presiona Ctrl+C para salir)")
        print("-"*70)
        
        try:
            # Obtener inputs
            xg_home = get_float_input("xG Local (0-5): ", 0, 5)
            xg_away = get_float_input("xG Visitante (0-5): ", 0, 5)
            
            # Analizar todos los mercados
            model, markets = analyze_all_markets(xg_home, xg_away)
            
            # Mostrar tabla de probabilidades
            print("\n" + "="*70)
            print("📊 PROBABILIDADES PARA TODOS LOS MERCADOS")
            print("="*70)
            print(f"{'MERCADO':<30} {'PROBABILIDAD':<15} {'CUOTA JUSTA':<15}")
            print("-"*70)
            
            # Crear lista ordenada para mostrar
            market_list = list(markets.items())
            for i, (market_name, prob) in enumerate(market_list, 1):
                fair_odds = 1/prob if prob > 0 else 0
                print(f"{i:2d}. {market_name:<27} {prob*100:>6.1f}% {fair_odds:>14.2f}")
            
            print("="*70)
            
            # Elegir mercado
            print("\n🎯 ELIGE EL NÚMERO DEL MERCADO:")
            market_choice = get_float_input("Opción (1-10): ", 1, 10)
            selected_index = int(market_choice) - 1
            selected_market, probability = market_list[selected_index]
            
            # Ingresar cuota
            print(f"\n💰 Mercado seleccionado: {selected_market}")
            market_odds = get_float_input(f"Cuota para {selected_market}: ", 1, 10)
            
            # Calcular value
            fair_odds = 1/probability
            value_pct = (market_odds / fair_odds - 1) * 100
            kelly = model.kelly_criterion(probability, market_odds) * 100
            
            print("\n" + "-"*70)
            print(f"📊 ANÁLISIS PARA {selected_market}")
            print("-"*70)
            print(f"📈 Probabilidad real: {probability*100:.2f}%")
            print(f"🎲 Cuota justa: {fair_odds:.2f}")
            print(f"💰 Cuota mercado: {market_odds:.2f}")
            print(f"💵 Value: {value_pct:+.2f}%")
            print(f"📐 Kelly recomendado: {kelly:.1f}% del bankroll")
            
            # Recomendación
            if value_pct > 5:
                print("✅ ¡VALUE DETECTADO! Esta apuesta tiene valor positivo")
            elif value_pct < -5:
                print("❌ Value negativo, NO apostar")
            else:
                print("⚖️ Sin value significativo")
            
            print("-"*70)
            
            # Registrar apuesta
            print("\n¿Quieres registrar esta apuesta?")
            register = input("(s/n): ").strip().lower()
            
            if register == 's':
                stake = get_float_input("Stake (cantidad apostada): ", 0)
                result = get_result_input()
                
                profit = tracker.register_bet(
                    xg_home, xg_away, selected_market,
                    market_odds, probability * 100, value_pct,
                    stake, result
                )
                
                print(f"\n💰 Profit de esta apuesta: {profit:+.2f}")
            
            # Continuar
            print("\n" + "-"*70)
            continue_input = input("¿Analizar otro partido? (Enter para continuar, 'q' para salir): ")
            if continue_input.lower() == 'q':
                break
                
        except KeyboardInterrupt:
            print("\n\n👋 ¡Hasta luego!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            input("Presiona Enter para continuar...")
    
    # Mostrar estadísticas finales
    clear_screen()
    print_header()
    tracker.display_stats()
    print("\n📁 Datos guardados en data/bets.csv")
    print("🚀 ¡Gracias por usar el sistema!")

def quick_test():
    """Función para prueba rápida"""
    print("🔬 PRUEBA RÁPIDA - TODOS LOS MERCADOS")
    print("="*70)
    
    xg_home = 1.8
    xg_away = 1.2
    
    print(f"xG Local: {xg_home} | xG Visitante: {xg_away}")
    print("-"*70)
    
    model, markets = analyze_all_markets(xg_home, xg_away)
    
    for market, prob in markets.items():
        fair = 1/prob
        print(f"{market:<30} {prob*100:>6.1f}% {fair:>14.2f}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        quick_test()
    else:
        main()
