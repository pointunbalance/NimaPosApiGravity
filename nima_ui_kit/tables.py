"""Custom Arabic-supported Data Tables."""
from PyQt6.QtWidgets import QTableWidget, QHeaderView, QAbstractItemView
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette, Typography

class NimaTableWidget(QTableWidget):
    def __init__(self, rows=0, columns=0, parent=None):
        super().__init__(rows, columns, parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        
        # General Table Settings
        self.setAlternatingRowColors(True)
        self.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.setShowGrid(False)
        self.horizontalHeader().setStretchLastSection(True)
        self.verticalHeader().setVisible(False)
        
        # Table Styling
        self.setStyleSheet(f"""
            QTableWidget {{
                background-color: {ColorPalette.SURFACE};
                alternate-background-color: {ColorPalette.BACKGROUND};
                border: 1px solid {ColorPalette.BORDER};
                border-radius: 6px;
                font-family: {Typography.FONT_FAMILY};
                font-size: {Typography.SIZE_BODY};
                color: {ColorPalette.TEXT_PRIMARY};
            }}
            QHeaderView::section {{
                background-color: {ColorPalette.PRIMARY};
                color: {ColorPalette.SURFACE};
                padding: 8px;
                border: none;
                font-weight: bold;
                font-family: {Typography.FONT_FAMILY};
                font-size: {Typography.SIZE_BODY};
            }}
            QTableWidget::item:selected {{
                background-color: {ColorPalette.PRIMARY_HOVER};
                color: {ColorPalette.SURFACE};
            }}
        """)
