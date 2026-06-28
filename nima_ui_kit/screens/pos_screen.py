"""Nima UI Kit: POS Screen Template."""
from PyQt6.QtWidgets import QWidget, QHBoxLayout, QVBoxLayout, QGridLayout, QLabel
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette, Typography
from nima_ui_kit.cards import NimaCard
from nima_ui_kit.tables import NimaTableWidget
from nima_ui_kit.buttons import NimaPrimaryButton, NimaDangerButton, NimaSecondaryButton
from nima_ui_kit.inputs import NimaLineEdit

class NimaPosScreen(QWidget):
    """
    A logic-less Point of Sale (POS) GUI Shell.
    Splits into: Left (Visual Right) for Products Grid. Right (Visual Left) for Receipt & Checkout.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setStyleSheet(f"background-color: {ColorPalette.BACKGROUND};")
        
        main_layout = QHBoxLayout(self)
        main_layout.setContentsMargins(15, 15, 15, 15)
        main_layout.setSpacing(15)

        # ---- RECEIPT PANE (Cart & Checkout) ----
        self.receipt_pane = NimaCard(title="الفاتورة الحالية")
        receipt_layout = QVBoxLayout()
        
        # Customer Search
        self.customer_search = NimaLineEdit()
        self.customer_search.setPlaceholderText("البحث عن عميل (أو إضافة عميل سريع)")
        receipt_layout.addWidget(self.customer_search)

        # Cart Table
        self.cart_table = NimaTableWidget(0, 4)
        self.cart_table.setHorizontalHeaderLabels(["المنتج", "الكمية", "السعر", "الإجمالي"])
        receipt_layout.addWidget(self.cart_table)
        
        # Totals
        totals_layout = QVBoxLayout()
        self.lbl_subtotal = QLabel("المجموع الفرعي: 0.00 SAR")
        self.lbl_tax = QLabel("الضريبة (15%): 0.00 SAR")
        self.lbl_total = QLabel("الإجمالي الشامل: 0.00 SAR")
        
        for lbl in [self.lbl_subtotal, self.lbl_tax]:
            lbl.setStyleSheet(f"font-family: {Typography.FONT_FAMILY}; font-size: {Typography.SIZE_BODY}; color: {ColorPalette.TEXT_SECONDARY};")
        self.lbl_total.setStyleSheet(f"font-family: {Typography.FONT_FAMILY}; font-size: {Typography.SIZE_H2}; color: {ColorPalette.PRIMARY}; font-weight: bold;")
        
        totals_layout.addWidget(self.lbl_subtotal)
        totals_layout.addWidget(self.lbl_tax)
        totals_layout.addWidget(self.lbl_total)
        receipt_layout.addLayout(totals_layout)
        
        # Action Buttons
        actions_layout = QHBoxLayout()
        self.btn_pay = NimaPrimaryButton("دفع الفاتورة")
        self.btn_hold = NimaSecondaryButton("تعليق الفاتورة")
        self.btn_clear = NimaDangerButton("إلغاء الطلب")
        
        actions_layout.addWidget(self.btn_pay)
        actions_layout.addWidget(self.btn_hold)
        actions_layout.addWidget(self.btn_clear)
        receipt_layout.addLayout(actions_layout)

        self.receipt_pane.set_content_layout(receipt_layout)
        
        # ---- PRODUCT GRID PANE ----
        self.products_pane = NimaCard()
        products_layout = QVBoxLayout()
        
        # Search and Filters
        filter_layout = QHBoxLayout()
        self.product_search = NimaLineEdit()
        self.product_search.setPlaceholderText("بحث برقم الباركود أو اسم المنتج...")
        filter_layout.addWidget(self.product_search)
        products_layout.addLayout(filter_layout)
        
        # The Grid
        self.product_grid = QGridLayout()
        self.product_grid.setSpacing(10)
        
        # Dummy Placeholders for rendering
        for i in range(12):
            btn = NimaSecondaryButton(f"منتج {i+1}")
            btn.setFixedSize(120, 100)
            self.product_grid.addWidget(btn, i // 4, i % 4)
            
        products_layout.addLayout(self.product_grid)
        products_layout.addStretch()
        self.products_pane.set_content_layout(products_layout)

        # Assemble Main Layout (Products take 65%, Receipt takes 35%)
        main_layout.addWidget(self.products_pane, stretch=65)
        main_layout.addWidget(self.receipt_pane, stretch=35)
