"""Nima UI Kit: Executive Dashboard Screen Template."""
from PyQt6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout
from PyQt6.QtCore import Qt
from nima_ui_kit.theme import ColorPalette
from nima_ui_kit.kpi import NimaKpiCard
from nima_ui_kit.cards import NimaCard
from nima_ui_kit.tables import NimaTableWidget

class NimaDashboardScreen(QWidget):
    """
    A logic-less Dashboard GUI Shell containing KPIs and dual-table placeholders.
    """
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setLayoutDirection(Qt.LayoutDirection.RightToLeft)
        self.setStyleSheet(f"background-color: {ColorPalette.BACKGROUND};")
        
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(20)

        # ---- TOP ROW: KPIs ----
        kpi_layout = QHBoxLayout()
        kpi_layout.addWidget(NimaKpiCard("المبيعات الإجمالية", 125030.00, "ارتفاع 5% عن الشهر الماضي", is_currency=True))
        kpi_layout.addWidget(NimaKpiCard("أرباح المشاريع", 42100.00, "هامش ربح 35%", is_currency=True))
        kpi_layout.addWidget(NimaKpiCard("مبيعات مستردة", 1240.00, "انخفاض 2% عن الشهر الماضي", is_currency=True))
        kpi_layout.addWidget(NimaKpiCard("عملاء جدد", 14, "3 عبر المتجر الإلكتروني", is_currency=False))
        
        main_layout.addLayout(kpi_layout)

        # ---- BOTTOM ROW: Tables/Grids ----
        data_layout = QHBoxLayout()
        data_layout.setSpacing(20)
        
        # Left Table Card (Recent Invoices)
        recent_invoices_card = NimaCard(title="أحدث الفواتير")
        recent_invoices_layout = QVBoxLayout()
        inv_table = NimaTableWidget(5, 4)
        inv_table.setHorizontalHeaderLabels(["الفاتورة", "التاريخ", "العميل", "الإجمالي"])
        recent_invoices_layout.addWidget(inv_table)
        recent_invoices_card.set_content_layout(recent_invoices_layout)
        
        # Right Table Card (Low Stock Alerts)
        low_stock_card = NimaCard(title="نواقص المخزون")
        low_stock_layout = QVBoxLayout()
        stock_table = NimaTableWidget(5, 3)
        stock_table.setHorizontalHeaderLabels(["الباركود", "المنتج", "الكمية المتبقية"])
        low_stock_layout.addWidget(stock_table)
        low_stock_card.set_content_layout(low_stock_layout)
        
        data_layout.addWidget(recent_invoices_card)
        data_layout.addWidget(low_stock_card)
        
        main_layout.addLayout(data_layout)
        
        # Push Everything Up
        main_layout.addStretch()
