"""
SISTEMA DE VALUE BETTING CON MODELO POISSON
Basado en xG (Expected Goals)
Versión: 2.0 - Análisis Múltiples Mercados
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

def format_value(value_pct):
    """Formatea el valor con emojis según el porcentaje"""
    if value_pct > 5:
        return f"✅ {value_pct:+.1f}%"
    elif value_pct < -5:
        return f"❌ {value_pct:+.1f}%"
    else:
        return f"⚖️ {value_pct:+.1f}%"

def analyze_bet(xg_home, xg_away, market_odds):
    """
    Analiza una apuesta y muestra la información para múltiples mercados
    
    Returns:
        tuple: (probabilidad, value_percentage, tiene_value)
    """
    # Crear modelo
    model = PoissonModel(xg_home, xg_away)
    
    # Calcular probabilidades para diferentes mercados
    prob_over25 = model.prob_over_2_5()
    prob_under25 = model.prob_under_2_5()
    prob_over15 = model.prob_over_1_5()
    prob_under15 = model.prob_under_1_5()
    prob_over35 = model.prob_over_3_5()
    prob_under35 = model.prob_under_3_5()
    
    # Calcular cuotas justas
    fair_over25 = 1/prob_over25 if prob_over25 > 0 else 0
    fair_under25 = 1/prob_under25 if prob_under25 > 0 else 0
    fair_over15 = 1/prob_over15 if prob_over15 > 0 else 0
    fair_under15 = 1/prob_under15 if prob_under15 > 0 else 0
    fair_over35 = 1/prob_over35 if prob_over35 > 0 else 0
    fair_under35 = 1/prob_under35 if prob_under35 > 0 else 0
    
    # Calcular value para Over 2.5 (asumiendo que la cuota ingresada es para este mercado)
    value_over25 = (market_odds / fair_over25 - 1) * 100
    
    # Mostrar análisis COMPLETO
    print("\n" + "="*70)
    print("📊 ANÁLISIS COMPLETO DE MERCADOS")
    print("="*70)
    print(f"⚽ xG Local: {xg_home:.2f} | xG Visitante: {xg_away:.2f} | Total: {xg_home + xg_away:.2f}")
    print("-"*70)
    
    # Tabla de mercados
    print(f"{'MERCADO':<15} {'PROBABILIDAD':<15} {'CUOTA JUSTA':<15} {'VALUE':<20}")
    print("-"*70)
    
    print(f"{'Over 2.5':<15} {prob_over25*100:<14.1f}% {fair_over25:<14.2f} {format_value(value_over25)}")
    print(f"{'Under 2.5':<15} {prob_under25*100:<14.1f}% {fair_under25:<14.2f} {'N/A':<20}")
    print(f"{'Over 1.5':<15} {prob_over15*100:<14.1f}% {fair_over15:<14.2f} {'N/A':<20}")
    print(f"{'Under 1.5':<15} {prob_under15*100:<14.1f}% {fair_under15:<14.2f} {'N/A':<20}")
    print(f"{'Over 3.5':<15} {prob_over35*100:<14.1f}% {fair_over35:<14.2f} {'N/A':<20}")
    print(f"{'Under 3.5':<15} {prob_under35*100:<14.1f}% {fair_under35:<14.2f} {'N/A':<20}")
    
    print("="*70)
    
    # Recomendación basada en value
    print("\n📈 RECOMENDACIÓN:")
    if value_over25 > 5:
        print(f"✅ APOSTAR Over 2.5 con cuota {market_odds:.2f} (Value: +{value_over25:.1f}%)")
        kelly = model.kelly_criterion(prob_over25, market_odds) * 100
        print(f"   Kelly recomendado: {kelly:.1f}% del bankroll")
    elif value_over25 < -5:
        print(f"❌ NO APOSTAR Over 2.5 (Value negativo: {value_over25:.1f}%)")
        print("   Considera Under 2.5 si la cuota es buena")
    else:
        print(f"⚖️ Over 2.5 sin value significativo ({value_over25:+.1f}%)")
    
    # Sugerir otros mercados basado en probabilidades
    print("\n💡 SUGERENCIAS PARA OTROS MERCADOS:")
    
    suggestions = []
    if prob_over15 > 0.75:
        suggestions.append(f"• Over 1.5 es muy probable ({prob_over15*100:.1f}%) - Busca cuotas > {fair_over15:.2f}")
    if prob_under15 > 0.75:
        suggestions.append(f"• Under 1.5 es muy probable ({prob_under15*100:.1f}%) - Busca cuotas > {fair_under15:.2f}")
    if prob_over35 > 0.40:
        suggestions.append(f"• Over 3.5 tiene buena posibilidad ({prob_over35*100:.1f}%) - Ideal para cuotas altas")
    if prob_under35 > 0.75:
        suggestions.append(f"• Under 3.5 es muy probable ({prob_under35*100:.1f}%) - Busca cuotas > {fair_under35:.2f}")
    
    if suggestions:
        for suggestion in suggestions:
            print(f"   {suggestion}")
    else:
        print("   No hay sugerencias destacadas para otros mercados")
    
    print("-"*70)
    
    # Devolver los valores para Over 2.5 (para mantener compatibilidad)
    return prob_over25, value_over25, value_over25 > 5

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
            market_odds = get_float_input("Cuota mercado Over 2.5 (>1): ", 1, 10)
            
            # Analizar la apuesta
            probability, value_pct, has_value = analyze_bet(xg_home, xg_away, market_odds)
            
            # Preguntar si quiere registrar
            print("\n" + "-"*40)
            if has_value:
                print("💡 Esta apuesta tiene VALUE POSITIVO")
            else:
                print("⚠️ Esta apuesta NO tiene value significativo")
            
            register = input("¿Quieres registrar esta apuesta? (s/n): ").strip().lower()
            
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
    
    # Probar análisis completo
    analyze_bet(xg_home, xg_away, odds)

if __name__ == "__main__":
    # Si se pasa argumento 'test', ejecuta prueba rápida
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        quick_test()
    else:
        main()
