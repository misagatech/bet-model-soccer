"""
SISTEMA DE VALUE BETTING CON MODELO POISSON
Basado en xG (Expected Goals)
Versión: 1.0
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
    print("="*60)
    print("🎯 SISTEMA DE VALUE BETTING - MODELO POISSON")
    print("="*60)
    print("Análisis de apuestas basado en xG")
    print("-"*60)

def get_float_input(prompt, min_val=0, max_val=None):
    """
    Obtiene input float del usuario con validación
    
    Args:
        prompt (str): mensaje para el usuario
        min_val (float): valor mínimo permitido
        max_val (float): valor máximo permitido (opcional)
    
    Returns:
        float: valor ingresado validado
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

def analyze_bet(xg_home, xg_away, market_odds):
    """
    Analiza una apuesta y muestra la información
    
    Returns:
        tuple: (probabilidad, value_percentage, tiene_value)
    """
    # Crear modelo
    model = PoissonModel(xg_home, xg_away)
    
    # Calcular probabilidad Over 2.5
    probability = model.prob_over_2_5()
    
    # Detectar value
    value_info = model.detect_value(market_odds, probability)
    
    # Mostrar análisis
    print("\n📊 ANÁLISIS DEL PARTIDO")
    print("-"*40)
    print(f"⚽ xG Local:      {xg_home:.2f}")
    print(f"⚽ xG Visitante:  {xg_away:.2f}")
    print(f"📈 Probabilidad:  {value_info['probability']:.2f}%")
    print(f"🎲 Cuota justa:   {value_info['fair_odds']:.2f}")
    print(f"💰 Cuota mercado: {market_odds:.2f}")
    print(f"📊 Value:         {value_info['value_percentage']:+.2f}%")
    
    if value_info['has_value']:
        print("✅ ¡VALUE DETECTADO! Esta apuesta tiene valor positivo")
    else:
        print("❌ Sin value significativo")
    
    print("-"*40)
    
    return probability, value_info['value_percentage'], value_info['has_value']

def main():
    """Función principal del programa"""
    tracker = BetTracker('data/bets.csv')
    
    while True:
        clear_screen()
        print_header()
        
        # Mostrar estadísticas actuales
        tracker.display_stats()
        
        print("\n" + "="*60)
        print("📝 NUEVA APUESTA")
        print("="*60)
        print("(Presiona Ctrl+C para salir)")
        print("-"*60)
        
        try:
            # Obtener inputs del usuario
            xg_home = get_float_input("xG Local (0-5): ", 0, 5)
            xg_away = get_float_input("xG Visitante (0-5): ", 0, 5)
            market_odds = get_float_input("Cuota mercado (>1): ", 1, 10)
            
            # Analizar la apuesta
            probability, value_pct, has_value = analyze_bet(xg_home, xg_away, market_odds)
            
            # Preguntar si quiere registrar
            if has_value:
                print("\n💡 Esta apuesta tiene VALUE POSITIVO")
                register = input("¿Quieres registrar esta apuesta? (s/n): ").strip().lower()
            else:
                print("\n⚠️ Esta apuesta NO tiene value significativo")
                register = input("¿Registrar de todas formas? (s/n): ").strip().lower()
            
            if register == 's':
                # Obtener datos de la apuesta
                stake = get_float_input("Stake (cantidad apostada): ", 0)
                result = get_result_input()
                
                # Registrar la apuesta
                profit = tracker.register_bet(
                    xg_home, xg_away, market_odds,
                    probability * 100, value_pct,
                    stake, result
                )
                
                print(f"\n💰 Profit de esta apuesta: {profit:+.2f}")
            
            # Preguntar si continuar
            print("\n" + "-"*40)
            continue_input = input("¿Analizar otro partido? (Enter para continuar, 'q' para salir): ")
            if continue_input.lower() == 'q':
                break
                
        except KeyboardInterrupt:
            print("\n\n👋 ¡Hasta luego!")
            break
        except Exception as e:
            print(f"\n❌ Error inesperado: {e}")
            input("Presiona Enter para continuar...")
    
    # Mostrar estadísticas finales
    clear_screen()
    print_header()
    tracker.display_stats()
    print("\n📁 Datos guardados en data/bets.csv")
    print("🚀 ¡Gracias por usar el sistema!")

def quick_test():
    """Función para prueba rápida sin input del usuario"""
    print("🔬 EJECUTANDO PRUEBA RÁPIDA")
    print("-"*40)
    
    # Ejemplo de prueba
    xg_home = 1.8
    xg_away = 1.2
    odds = 1.95
    
    model = PoissonModel(xg_home, xg_away)
    prob = model.prob_over_2_5()
    value_info = model.detect_value(odds, prob)
    
    print(f"Partido: xG {xg_home} - {xg_away}")
    print(f"Probabilidad Over 2.5: {prob:.2%}")
    print(f"Cuota justa: {1/prob:.2f}")
    print(f"Cuota mercado: {odds}")
    print(f"Value: {value_info['value_percentage']:+.2f}%")
    print(f"Recomendación: {'✅ APOSTAR' if value_info['has_value'] else '❌ NO APOSTAR'}")

if __name__ == "__main__":
    # Si se pasa argumento 'test', ejecuta prueba rápida
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        quick_test()
    else:
        main()
