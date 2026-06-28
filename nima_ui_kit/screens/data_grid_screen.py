"""Nima UI Kit: Standard CRUD Data Grid Screen Template."""
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette
from nima_ui_kit.cards import NimaCard
from nima_ui_kit.tables import NimaTableWidget
from nima_ui_kit.buttons import NimaPrimaryButton, NimaSecondaryButton
from nima_ui_kit.inputs import NimaLineEdit

class NimaDataGridScreen(QWidget):
    """
    A logic-less Data Grid GUI Shell suitable for Customer, Product, or User management views.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setStyleSheet(f"background-color: {ColorPalette.BACKGROUND};")
        
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(20, 20, 20, 20)
        
        # The Main Container Card
        grid_card = NimaCard(title="إدارة البيانات الرئيسية")
        grid_layout = QVBoxLayout()
        grid_layout.setSpacing(15)
        
        # ---- HEADER BAR ----
        header_layout = QHBoxLayout()
        
        self.search_bar = NimaLineEdit()
        self.search_bar.setPlaceholderText("ابحث هنا...")
        self.search_bar.setMinimumWidth(300)
        
        self.btn_search = NimaSecondaryButton("بحث")
        self.btn_add_new = NimaPrimaryButton("إضافة سجل جديد +")
        
        header_layout.addWidget(self.search_bar)
        header_layout.addWidget(self.btn_search)
        header_layout.addStretch()
        header_layout.addWidget(self.btn_add_new)
        
        grid_layout.addLayout(header_layout)
        
        # ---- DATA TABLE ----
        self.data_table = NimaTableWidget(10, 6)
        self.data_table.setHorizontalHeaderLabels(["ID", "الاسم", "النوع", "الرصيد/الكمية", "تاريخ الإضافة", "الإجراءات"])
        grid_layout.addWidget(self.data_table)
        
        grid_card.set_content_layout(grid_layout)
        main_layout.addWidget(grid_card)
