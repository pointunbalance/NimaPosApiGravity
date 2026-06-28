"""Custom Arabic-supported Tab Widgets."""
from PyQt6.QtWidgets import QTabWidget
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette, Typography

class NimaTabWidget(QTabWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setStyleSheet(f"""
            QTabWidget::pane {{
                border: 1px solid {ColorPalette.BORDER};
                background: {ColorPalette.SURFACE};
                border-radius: 6px;
                margin-top: -1px;
            }}
            QTabBar::tab {{
                background: {ColorPalette.BACKGROUND};
                border: 1px solid {ColorPalette.BORDER};
                border-bottom: none;
                border-top-left-radius: 6px;
                border-top-right-radius: 6px;
                padding: 10px 20px;
                font-family: {Typography.FONT_FAMILY};
                font-size: {Typography.SIZE_BODY};
                color: {ColorPalette.TEXT_SECONDARY};
                margin-left: 2px;
            }}
            QTabBar::tab:selected {{
                background: {ColorPalette.SURFACE};
                color: {ColorPalette.PRIMARY};
                font-weight: bold;
                border-bottom: 2px solid {ColorPalette.SURFACE}; 
            }}
            QTabBar::tab:hover {{
                background: {ColorPalette.SURFACE};
                color: {ColorPalette.TEXT_PRIMARY};
            }}
        """)
