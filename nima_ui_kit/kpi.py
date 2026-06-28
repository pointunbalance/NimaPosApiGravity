"""Custom KPI / Stat Dashboard Cards."""
from PyQt6.QtWidgets import QFrame, QVBoxLayout, QLabel
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette, Typography

class NimaKpiCard(QFrame):
    def __init__(self, title, value, subtitle="", is_currency=False, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setStyleSheet(f"""
            QFrame {{
                background-color: {ColorPalette.SURFACE};
                border: 1px solid {ColorPalette.BORDER};
                border-radius: 10px;
            }}
            QFrame:hover {{
                border: 1px solid {ColorPalette.PRIMARY};
            }}
        """)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        
        lbl_title = QLabel(title)
        lbl_title.setStyleSheet(f"color: {ColorPalette.TEXT_SECONDARY}; font-size: {Typography.SIZE_BODY}; font-family: {Typography.FONT_FAMILY}; border: none;")
        
        if is_currency:
            try:
                value_str = f"SAR {float(value):,.2f}"
            except (ValueError, TypeError):
                value_str = str(value)
        else:
            value_str = str(value)
            
        lbl_val = QLabel(value_str)
        lbl_val.setStyleSheet(f"color: {ColorPalette.PRIMARY}; font-size: 28px; font-weight: bold; font-family: {Typography.FONT_FAMILY}; border: none;")
        
        layout.addWidget(lbl_title)
        layout.addWidget(lbl_val)
        
        if subtitle:
            lbl_sub = QLabel(subtitle)
            lbl_sub.setStyleSheet(f"color: {ColorPalette.SUCCESS}; font-size: {Typography.SIZE_SMALL}; font-family: {Typography.FONT_FAMILY}; border: none;")
            layout.addWidget(lbl_sub)
