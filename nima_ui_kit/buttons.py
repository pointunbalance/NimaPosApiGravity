"""Custom Arabic-supported Buttons."""
from PyQt6.QtWidgets import QPushButton
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette, Typography

class BaseButton(QPushButton):
    def __init__(self, text, parent=None):
        super().__init__(text, parent)
        # Enforce RTL
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setCursor(Qt.CursorShape.PointingHandCursor)

class NimaPrimaryButton(BaseButton):
    def __init__(self, text, parent=None):
        super().__init__(text, parent)
        self.setStyleSheet(f"""
            QPushButton {{
                background-color: {ColorPalette.PRIMARY};
                color: {ColorPalette.SURFACE};
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-family: {Typography.FONT_FAMILY};
                font-weight: bold;
                font-size: {Typography.SIZE_BODY};
            }}
            QPushButton:hover {{
                background-color: {ColorPalette.PRIMARY_HOVER};
            }}
        """)

class NimaSecondaryButton(BaseButton):
    def __init__(self, text, parent=None):
        super().__init__(text, parent)
        self.setStyleSheet(f"""
            QPushButton {{
                background-color: {ColorPalette.SECONDARY};
                color: {ColorPalette.SURFACE};
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-family: {Typography.FONT_FAMILY};
                font-weight: bold;
                font-size: {Typography.SIZE_BODY};
            }}
            QPushButton:hover {{
                background-color: {ColorPalette.SECONDARY_HOVER};
            }}
        """)

class NimaDangerButton(BaseButton):
    def __init__(self, text, parent=None):
        super().__init__(text, parent)
        self.setStyleSheet(f"""
            QPushButton {{
                background-color: {ColorPalette.DANGER};
                color: {ColorPalette.SURFACE};
                border: none;
                border-radius: 6px;
                padding: 10px 20px;
                font-family: {Typography.FONT_FAMILY};
                font-weight: bold;
                font-size: {Typography.SIZE_BODY};
            }}
            QPushButton:hover {{
                background-color: {ColorPalette.DANGER_HOVER};
            }}
        """)
