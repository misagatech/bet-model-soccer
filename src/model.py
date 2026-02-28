import numpy as np
from scipy import stats
import math

class PoissonModel:
    """
    Modelo Poisson para calcular probabilidades de fútbol
    Basado en xG (expected goals)
    Versión: 3.0 - Con BTTS y Combinadas
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
        for home_goals in range(0, 11):
            for away_goals in range(0, 11):
                total_goals = home_goals + away_goals
                if total_goals > 2.5:
                    prob_home = self.poisson_prob(self.xg_home, home_goals)
                    prob_away = self.poisson_prob(self.xg_away, away_goals)
                    prob_total += prob_home * prob_away
        
        return min(prob_total, 0.99)
    
    def prob_under_2_5(self):
        """
        Calcula probabilidad de Under 2.5 goles
        """
        return 1 - self.prob_over_2_5()
    
    def prob_over_1_5(self):
        """
        Calcula probabilidad de Over 1.5 goles
        """
        prob_total = 0
        
        for home_goals in range(0, 11):
            for away_goals in range(0, 11):
                total_goals = home_goals + away_goals
                if total_goals > 1.5:
                    prob_home = self.poisson_prob(self.xg_home, home_goals)
                    prob_away = self.poisson_prob(self.xg_away, away_goals)
                    prob_total += prob_home * prob_away
        
        return min(prob_total, 0.99)
    
    def prob_under_1_5(self):
        """
        Calcula probabilidad de Under 1.5 goles
        """
        return 1 - self.prob_over_1_5()
    
    def prob_over_3_5(self):
        """
        Calcula probabilidad de Over 3.5 goles
        """
        prob_total = 0
        
        for home_goals in range(0, 11):
            for away_goals in range(0, 11):
                total_goals = home_goals + away_goals
                if total_goals > 3.5:
                    prob_home = self.poisson_prob(self.xg_home, home_goals)
                    prob_away = self.poisson_prob(self.xg_away, away_goals)
                    prob_total += prob_home * prob_away
        
        return min(prob_total, 0.99)
    
    def prob_under_3_5(self):
        """
        Calcula probabilidad de Under 3.5 goles
        """
        return 1 - self.prob_over_3_5()
    
    def prob_btts(self):
        """
        Calcula probabilidad de que ambos equipos marquen (BTTS)
        Fórmula: (1 - P(no marque local)) * (1 - P(no marque visitante))
        """
        # Probabilidad de que local no marque (0 goles)
        prob_local_0 = self.poisson_prob(self.xg_home, 0)
        
        # Probabilidad de que visitante no marque (0 goles)
        prob_visit_0 = self.poisson_prob(self.xg_away, 0)
        
        # BTTS = ambos marcan al menos 1 gol
        prob_btts = (1 - prob_local_0) * (1 - prob_visit_0)
        
        return prob_btts
    
    def prob_btts_and_over25(self):
        """
        Calcula probabilidad de que ambos marquen Y haya over 2.5
        """
        prob = 0
        for i in range(1, 11):
            for j in range(1, 11):
                if i + j > 2.5:
                    prob += self.poisson_prob(self.xg_home, i) * self.poisson_prob(self.xg_away, j)
        return prob
    
    def prob_btts_and_under25(self):
        """
        Calcula probabilidad de que ambos marquen PERO sea under 2.5
        Solo posibles resultados: 1-1 (2 goles)
        """
        # Solo 1-1 cumple: ambos marcan y total = 2 (<2.5)
        prob = self.poisson_prob(self.xg_home, 1) * self.poisson_prob(self.xg_away, 1)
        return prob
    
    def prob_btts_or_over25(self):
        """
        Calcula probabilidad de que ocurra BTTS O Over 2.5 (o ambos)
        """
        prob_btts = self.prob_btts()
        prob_over = self.prob_over_2_5()
        prob_both = self.prob_btts_and_over25()
        
        return prob_btts + prob_over - prob_both
    
    def fair_odds(self, probability):
        """
        Calcula cuota justa basada en probabilidad
        """
        if probability <= 0:
            return 1000
        return 1 / probability
    
    def detect_value(self, market_odds, probability, threshold=0.05):
        """
        Detecta si hay value betting
        """
        fair_odds = self.fair_odds(probability)
        value_percentage = (market_odds / fair_odds - 1) * 100
        
        return {
            'has_value': value_percentage > threshold * 100,
            'value_percentage': value_percentage,
            'fair_odds': fair_odds,
            'probability': probability * 100
        }
    
    def kelly_criterion(self, probability, odds, bankroll_percentage=0.02):
        """
        Calcula stake recomendado según Kelly Criterion
        """
        q = 1 - probability
        b = odds - 1
        
        if b <= 0:
            return 0
            
        kelly = (probability * b - q) / b
        
        return max(0, min(kelly * bankroll_percentage, 0.05))


def test_model():
    """Prueba rápida del modelo"""
    model = PoissonModel(1.8, 1.2)
    print(f"Over 2.5: {model.prob_over_2_5():.2%}")
    print(f"BTTS: {model.prob_btts():.2%}")
    print(f"BTTS + Over 2.5: {model.prob_btts_and_over25():.2%}")
    print(f"BTTS + Under 2.5 (1-1): {model.prob_btts_and_under25():.2%}")


if __name__ == "__main__":
    test_model()
