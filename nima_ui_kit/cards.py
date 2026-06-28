"""Custom Arabic-supported Cards and Panels."""
from PyQt6.QtWidgets import QFrame, QVBoxLayout, QLabel
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette, Typography

class NimaCard(QFrame):
    def __init__(self, title=None, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setObjectName("NimaCard")
        
        # Base styling scoped to this card only (not child QFrames)
        self.setStyleSheet(f"""
            QFrame#NimaCard {{
                background-color: {ColorPalette.SURFACE};
                border: 1px solid {ColorPalette.BORDER};
                border-radius: 8px;
            }}
        """)
        
        self.layout_ext = QVBoxLayout(self)
        self.layout_ext.setContentsMargins(15, 15, 15, 15)
        self.layout_ext.setSpacing(10)

        if title:
            lbl_title = QLabel(title)
            lbl_title.setStyleSheet(f"""
                QLabel {{
                    color: {ColorPalette.PRIMARY};
                    font-size: {Typography.SIZE_H2};
                    font-family: {Typography.FONT_FAMILY};
                    font-weight: bold;
                    border: none;
                }}
            """)
            self.layout_ext.addWidget(lbl_title)

    def set_content_layout(self, layout):
        """Injects a custom layout under the card's title."""
        self.layout_ext.addLayout(layout)
