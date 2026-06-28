"""
Nima Desktop — Main Application Window.
Composes NimaSidebar + QStackedWidget to host all live views.
"""
from PyQt6.QtWidgets import QHBoxLayout, QStackedWidget, QWidget
from PyQt6.QtCore import Qt
from nima_ui_kit import NimaMainWindow, NimaSidebar, get_global_stylesheet
from nima_desktop.views.kpi_view import KpiView
from nima_desktop.views.pos_view import PosView
from nima_ui_kit.screens.data_grid_screen import NimaDataGridScreen


class NimaDesktopApp(NimaMainWindow):
    """Main window that wires sidebar navigation to live views."""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("Nima ERP — نظام نيما للمبيعات")
        self.setMinimumSize(1280, 800)
        self.setStyleSheet(get_global_stylesheet())

        central = QWidget()
        root_layout = QHBoxLayout(central)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        # ---- Sidebar ----
        self._sidebar = NimaSidebar()
        btn_dash = self._sidebar.add_menu_item("📊  لوحة القيادة")
        btn_pos  = self._sidebar.add_menu_item("🛒  نقطة البيع")
        btn_data = self._sidebar.add_menu_item("📋  إدارة البيانات")
        self._sidebar.items[0].setChecked(True)

        # ---- Stacked pages ----
        self._stack = QStackedWidget()
        self._kpi_view  = KpiView()
        self._pos_view  = PosView()
        self._data_view = NimaDataGridScreen()

        self._stack.addWidget(self._kpi_view)   # index 0
        self._stack.addWidget(self._pos_view)   # index 1
        self._stack.addWidget(self._data_view)  # index 2

        # Wire sidebar buttons to stack pages
        btn_dash.clicked.connect(lambda: self._switch(0))
        btn_pos.clicked.connect(lambda: self._switch(1))
        btn_data.clicked.connect(lambda: self._switch(2))

        root_layout.addWidget(self._sidebar)
        root_layout.addWidget(self._stack, stretch=1)
        self.setCentralWidget(central)

    def _switch(self, index: int):
        self._stack.setCurrentIndex(index)
