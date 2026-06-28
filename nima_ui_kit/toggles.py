"""Custom Arabic-supported Toggle Switches and Checkboxes."""
from PyQt6.QtWidgets import QCheckBox
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette, Typography

class NimaCheckBox(QCheckBox):
    def __init__(self, text="", parent=None):
        super().__init__(text, parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setStyleSheet(f"""
            QCheckBox {{
                font-family: {Typography.FONT_FAMILY};
                font-size: {Typography.SIZE_BODY};
                color: {ColorPalette.TEXT_PRIMARY};
                spacing: 8px;
            }}
            QCheckBox::indicator {{
                width: 18px;
                height: 18px;
                border-radius: 4px;
                border: 2px solid {ColorPalette.BORDER};
                background-color: {ColorPalette.SURFACE};
            }}
            QCheckBox::indicator:checked {{
                background-color: {ColorPalette.PRIMARY};
                border: 2px solid {ColorPalette.PRIMARY};
            }}
            QCheckBox::indicator:hover {{
                border: 2px solid {ColorPalette.PRIMARY_HOVER};
            }}
        """)
