import numpy as np
from scipy import stats
import math

class PoissonModel:
    """
    Modelo Poisson para calcular probabilidades de fútbol
    Basado en xG (expected goals)
    """
    
    def __init__(self, xg_home, xg_away):
        """
        Inicializa el modelo con los xG de local y visitante
        
        Args:
            xg_home (float): Expected goals del equipo local
            xg_away (float): Expected goals del equipo visitante
        """
        self.xg_home = xg_home
        self.xg_away = xg_away
    
    def poisson_prob(self, lam, k):
        """
        Calcula probabilidad de Poisson para k goles
        
        Args:
            lam (float): lambda (xg)
            k (int): número de goles
            
        Returns:
            float: probabilidad
        """
        return (math.exp(-lam) * lam**k) / math.factorial(k)
    
    def prob_over_2_5(self):
        """
        Calcula probabilidad de Over 2.5 goles
        
        Returns:
            float: probabilidad entre 0 y 1
        """
        prob_total = 0
        
        # Sumar probabilidades de todos los resultados con total > 2.5
        for home_goals in range(0, 11):  # 0-10 goles (suficiente rango)
            for away_goals in range(0, 11):
                total_goals = home_goals + away_goals
                if total_goals > 2.5:  # Over 2.5
                    prob_home = self.poisson_prob(self.xg_home, home_goals)
                    prob_away = self.poisson_prob(self.xg_away, away_goals)
                    prob_total += prob_home * prob_away
        
        return min(prob_total, 0.99)  # Cap al 99% para evitar valores extremos
    
    def prob_under_2_5(self):
        """
        Calcula probabilidad de Under 2.5 goles
        """
        return 1 - self.prob_over_2_5()
    
    def fair_odds(self, probability):
        """
        Calcula cuota justa basada en probabilidad
        
        Args:
            probability (float): probabilidad entre 0 y 1
            
        Returns:
            float: cuota justa
        """
        if probability <= 0:
            return 1000  # Valor alto si probabilidad muy baja
        return 1 / probability
    
    def detect_value(self, market_odds, probability, threshold=0.05):
        """
        Detecta si hay value betting
        
        Args:
            market_odds (float): cuota ofrecida por la casa
            probability (float): probabilidad real calculada
            threshold (float): umbral mínimo de value (5% por defecto)
            
        Returns:
            dict: información sobre el value
        """
        fair_odds = self.fair_odds(probability)
        value_percentage = (market_odds / fair_odds - 1) * 100
        
        return {
            'has_value': value_percentage > threshold * 100,
            'value_percentage': value_percentage,
            'fair_odds': fair_odds,
            'probability': probability * 100  # En porcentaje
        }
    
    def kelly_criterion(self, probability, odds, bankroll_percentage=0.02):
        """
        Calcula stake recomendado según Kelly Criterion
        
        Args:
            probability (float): probabilidad real (0-1)
            odds (float): cuota de mercado
            bankroll_percentage (float): % del bankroll a arriesgar
            
        Returns:
            float: stake recomendado (0-1)
        """
        q = 1 - probability
        b = odds - 1
        
        if b <= 0:
            return 0
            
        kelly = (probability * b - q) / b
        
        # Limitar y aplicar fracción de Kelly
        return max(0, min(kelly * bankroll_percentage, 0.05))  # Máx 5%


# Función auxiliar para probar el modelo
def test_model():
    """Prueba rápida del modelo"""
    model = PoissonModel(1.8, 1.2)
    prob_over = model.prob_over_2_5()
    print(f"Probabilidad Over 2.5: {prob_over:.2%}")
    print(f"Cuota justa: {model.fair_odds(prob_over):.2f}")


if __name__ == "__main__":
    test_model()
