"""
Aquaponics AI Models Module
"""
from .deepseek_model import DeepseekModel
from .o1_model import O1Model

# Create model instances for easy import
deepseek_model = DeepseekModel()
o1_model = O1Model()

__all__ = ['DeepseekModel', 'O1Model', 'deepseek_model', 'o1_model']
