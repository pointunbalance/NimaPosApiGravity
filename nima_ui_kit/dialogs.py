"""Custom Arabic-supported Dialogs and Modals."""
from PyQt6.QtWidgets import QMessageBox, QDialog, QVBoxLayout, QLabel, QHBoxLayout
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette, Typography
from nima_ui_kit.buttons import NimaPrimaryButton, NimaSecondaryButton

class NimaToast:
    """Utility class for native looking toast/alerts."""
    @staticmethod
    def show(parent, message: str):
        """Convenience method: short success toast (info-level)."""
        msg = QMessageBox(parent)
        msg.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        msg.setWindowTitle("إشعار")
        msg.setText(message)
        msg.setIcon(QMessageBox.Icon.Information)
        msg.setStyleSheet(f"font-family: {Typography.FONT_FAMILY}; font-size: {Typography.SIZE_BODY};")
        msg.exec()

    @staticmethod
    def show_info(parent, title, message):
        msg = QMessageBox(parent)
        msg.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        msg.setWindowTitle(title)
        msg.setText(message)
        msg.setIcon(QMessageBox.Icon.Information)
        msg.setStyleSheet(f"font-family: {Typography.FONT_FAMILY}; font-size: {Typography.SIZE_BODY};")
        msg.exec()

    @staticmethod
    def show_error(parent, title, message):
        msg = QMessageBox(parent)
        msg.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        msg.setWindowTitle(title)
        msg.setText(message)
        msg.setIcon(QMessageBox.Icon.Critical)
        msg.setStyleSheet(f"font-family: {Typography.FONT_FAMILY}; font-size: {Typography.SIZE_BODY};")
        msg.exec()

class NimaConfirmDialog(QDialog):
    """Standard generic confirmation modal built with Nima UI."""
    def __init__(self, title, message, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setWindowTitle(title)
        self.setFixedSize(400, 200)
        self.setStyleSheet(f"background-color: {ColorPalette.SURFACE}; font-family: {Typography.FONT_FAMILY};")

        layout = QVBoxLayout(self)

        lbl_message = QLabel(message)
        lbl_message.setWordWrap(True)
        lbl_message.setAlignment(Qt.AlignmentFlag.AlignCenter)
        lbl_message.setStyleSheet(f"font-size: {Typography.SIZE_H2}; color: {ColorPalette.TEXT_PRIMARY};")
        
        btn_layout = QHBoxLayout()
        self.btn_yes = NimaPrimaryButton("تأكيد")
        self.btn_no = NimaSecondaryButton("إلغاء")

        self.btn_yes.clicked.connect(self.accept)
        self.btn_no.clicked.connect(self.reject)

        btn_layout.addWidget(self.btn_yes)
        btn_layout.addWidget(self.btn_no)

        layout.addWidget(lbl_message)
        layout.addLayout(btn_layout)
