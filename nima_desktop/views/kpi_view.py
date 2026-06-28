"""
Nima Desktop — KPI Dashboard View.
Extends `NimaDashboardScreen` and populates it from the live API on load.
"""
from PyQt6.QtWidgets import QVBoxLayout, QHBoxLayout, QWidget
from PyQt6.QtCore import QThread, pyqtSignal
from nima_ui_kit.screens.dashboard_screen import NimaDashboardScreen
from nima_ui_kit.kpi import NimaKpiCard
from nima_desktop.api_client import api


class _FetchWorker(QThread):
    """Background thread to fetch dashboard data without freezing UI."""
    data_ready = pyqtSignal(dict)

    def run(self):
        data = api.get("/dashboard/metrics") or {}
        self.data_ready.emit(data)


class KpiView(NimaDashboardScreen):
    """Live Dashboard view — fetches metrics from the NimaPOS API."""

    def __init__(self, parent=None):
        super().__init__(parent)
        # Keep a direct reference to the KPI row layout for safe population
        self._kpi_row = QHBoxLayout()
        # Insert our own managed KPI row *before* the existing placeholder row
        # by replacing the entire top slot via a fresh container widget
        self._kpi_container = QWidget()
        self._kpi_container.setLayout(self._kpi_row)
        # We insert as the first widget; the parent layout is QVBoxLayout
        parent_layout = self.layout()
        if parent_layout:
            parent_layout.insertWidget(0, self._kpi_container)

        self._load_data()

    def _load_data(self):
        self._worker = _FetchWorker()
        self._worker.data_ready.connect(self._populate)
        self._worker.start()

    def _populate(self, data: dict):
        """Populate our managed KPI row with live values."""
        if not data:
            return
        # Clear any existing KPI cards
        while self._kpi_row.count():
            item = self._kpi_row.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        metrics = [
            ("المبيعات الإجمالية",    data.get("total_sales", 0),      "SAR", True),
            ("عدد الفواتير",           data.get("total_invoices", 0),   "فاتورة", False),
            ("أعلى مبيعات (صنف)",     data.get("top_product", "—"),    "", False),
            ("رصيد المخزون",           data.get("stock_value", 0),      "SAR", True),
        ]
        for title, value, subtitle, is_curr in metrics:
            self._kpi_row.addWidget(
                NimaKpiCard(title, value, subtitle, is_currency=is_curr)
            )
