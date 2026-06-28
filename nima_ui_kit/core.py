"""Core widgets enforcing RTL layout."""
from PyQt6.QtWidgets import QWidget, QMainWindow, QDialog
from PyQt6.QtCore import Qt

class NimaWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)

class NimaMainWindow(QMainWindow):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)

class NimaDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
