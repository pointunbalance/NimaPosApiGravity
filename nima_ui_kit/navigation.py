"""Custom Arabic-supported Navigation & Sidebar components."""
from PyQt6.QtWidgets import QVBoxLayout, QPushButton, QFrame, QLabel
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette, Typography

class NimaSidebarItem(QPushButton):
    def __init__(self, text, icon_name=None, parent=None):
        super().__init__(text, parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setCheckable(True)
        
        self.setStyleSheet(f"""
            QPushButton {{
                background-color: transparent;
                color: {ColorPalette.TEXT_PRIMARY};
                border: none;
                border-radius: 6px;
                padding: 12px 15px;
                text-align: right;
                font-family: {Typography.FONT_FAMILY};
                font-size: {Typography.SIZE_BODY};
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {ColorPalette.BORDER};
            }}
            QPushButton:checked {{
                background-color: {ColorPalette.PRIMARY_HOVER};
                color: {ColorPalette.SURFACE};
            }}
        """)

class NimaSidebar(QFrame):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setFixedWidth(250)
        self.setStyleSheet(f"""
            QFrame {{
                background-color: {ColorPalette.SURFACE};
                border-left: 1px solid {ColorPalette.BORDER};
            }}
        """)
        
        self.layout_ext = QVBoxLayout(self)
        self.layout_ext.setContentsMargins(10, 20, 10, 20)
        self.layout_ext.setSpacing(5)
        self.layout_ext.setAlignment(Qt.AlignmentFlag.AlignTop)
        
        # Add Logo Area Placeholder
        self.logo_lbl = QLabel("Nima ERP")
        self.logo_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.logo_lbl.setStyleSheet(f"""
            color: {ColorPalette.PRIMARY};
            font-size: {Typography.SIZE_H1};
            font-family: {Typography.FONT_FAMILY};
            font-weight: 900;
            margin-bottom: 20px;
        """)
        self.layout_ext.addWidget(self.logo_lbl)
        
        # Track items for exclusive selection logic
        self.items = []

    def add_menu_item(self, text):
        btn = NimaSidebarItem(text)
        btn.clicked.connect(lambda: self._handle_item_click(btn))
        self.items.append(btn)
        self.layout_ext.addWidget(btn)
        return btn

    def _handle_item_click(self, clicked_btn):
        # Exclusive check behavior
        for btn in self.items:
            if btn != clicked_btn:
                btn.setChecked(False)
        clicked_btn.setChecked(True)
