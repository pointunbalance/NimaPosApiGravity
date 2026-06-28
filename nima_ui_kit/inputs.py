"""Custom Arabic-supported Input Fields."""
from PyQt6.QtWidgets import QLineEdit, QComboBox
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette, Typography

class NimaLineEdit(QLineEdit):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        # Force alignment to right for Arabic text
        self.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        self.setStyleSheet(f"""
            QLineEdit {{
                border: 1px solid {ColorPalette.BORDER};
                border-radius: 6px;
                padding: 8px 12px;
                font-family: {Typography.FONT_FAMILY};
                font-size: {Typography.SIZE_BODY};
                background-color: {ColorPalette.SURFACE};
                color: {ColorPalette.TEXT_PRIMARY};
            }}
            QLineEdit:focus {{
                border: 2px solid {ColorPalette.PRIMARY};
            }}
        """)

class NimaComboBox(QComboBox):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setStyleSheet(f"""
            QComboBox {{
                border: 1px solid {ColorPalette.BORDER};
                border-radius: 6px;
                padding: 8px 12px;
                font-family: {Typography.FONT_FAMILY};
                font-size: {Typography.SIZE_BODY};
                background-color: {ColorPalette.SURFACE};
                color: {ColorPalette.TEXT_PRIMARY};
            }}
            QComboBox:focus {{
                border: 2px solid {ColorPalette.PRIMARY};
            }}
            QComboBox::drop-down {{
                border-left: 1px solid {ColorPalette.BORDER};
                width: 30px;
            }}
        """)
