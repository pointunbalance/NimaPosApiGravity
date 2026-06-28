"""
Nima Desktop — POS (Point of Sale) View.
Extends `NimaPosScreen` and wires it to the live NimaPOS API:
  - Loads product catalog from GET /products
  - Adds items to the cart widget
  - Posts the invoice via POST /invoices/checkout
"""
from PyQt6.QtWidgets import QTableWidgetItem, QPushButton
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from nima_ui_kit.screens.pos_screen import NimaPosScreen
from nima_ui_kit.buttons import NimaPrimaryButton, NimaDangerButton
from nima_ui_kit.theme import ColorPalette
from nima_desktop.api_client import api


class _ProductLoader(QThread):
    loaded = pyqtSignal(list)

    def run(self):
        products = api.get("/products") or []
        self.loaded.emit(products)


class PosView(NimaPosScreen):
    """Live POS screen wired to the NimaPOS backend."""

    def __init__(self, parent=None):
        super().__init__(parent)
        # Cart: list of {"product_id", "name", "price", "qty"}
        self._cart: list[dict] = []
        self._products: list[dict] = []

        # Setup cart table
        self.cart_table.setColumnCount(4)
        self.cart_table.setHorizontalHeaderLabels(["المنتج", "الكمية", "السعر", "الإجمالي"])

        # Wire action buttons
        self.btn_pay.clicked.connect(self._checkout)
        self.btn_clear.clicked.connect(self._clear_cart)

        # Load products
        self._load_products()

    # ----------------------------------------------------------- data loading --
    def _load_products(self):
        self._loader = _ProductLoader()
        self._loader.loaded.connect(self._build_product_grid)
        self._loader.start()

    def _build_product_grid(self, products: list):
        self._products = products
        # Clear existing placeholder buttons from the grid
        while self.product_grid.count():
            item = self.product_grid.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        for idx, product in enumerate(products[:20]):  # Max 20 on grid
            name = product.get("name", f"منتج {idx+1}")
            price = product.get("selling_price", 0)
            pid = product.get("id")

            btn = QPushButton(f"{name}\n{price:.2f} SAR")
            btn.setFixedSize(130, 90)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background: {ColorPalette.SURFACE};
                    border: 1px solid {ColorPalette.BORDER};
                    border-radius: 8px;
                    font-size: 11px;
                    color: {ColorPalette.TEXT_PRIMARY};
                }}
                QPushButton:hover {{
                    background: {ColorPalette.PRIMARY_HOVER};
                    color: white;
                }}
            """)
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.clicked.connect(lambda _, p=product: self._add_to_cart(p))
            self.product_grid.addWidget(btn, idx // 4, idx % 4)

    # -------------------------------------------------------------- cart logic --
    def _add_to_cart(self, product: dict):
        pid = product.get("id")
        # If already in cart, just increment qty
        for item in self._cart:
            if item["product_id"] == pid:
                item["qty"] += 1
                self._refresh_cart_table()
                return
        self._cart.append({
            "product_id": pid,
            "name": product.get("name", "منتج"),
            "price": float(product.get("selling_price", 0)),
            "qty": 1,
        })
        self._refresh_cart_table()

    def _refresh_cart_table(self):
        self.cart_table.setRowCount(len(self._cart))
        subtotal = 0.0
        for row, item in enumerate(self._cart):
            line_total = item["price"] * item["qty"]
            subtotal += line_total
            self.cart_table.setItem(row, 0, QTableWidgetItem(item["name"]))
            self.cart_table.setItem(row, 1, QTableWidgetItem(str(item["qty"])))
            self.cart_table.setItem(row, 2, QTableWidgetItem(f"{item['price']:.2f}"))
            self.cart_table.setItem(row, 3, QTableWidgetItem(f"{line_total:.2f}"))

        tax = subtotal * 0.15
        total = subtotal + tax
        self.lbl_subtotal.setText(f"المجموع الفرعي: {subtotal:,.2f} SAR")
        self.lbl_tax.setText(f"الضريبة (15%): {tax:,.2f} SAR")
        self.lbl_total.setText(f"الإجمالي الشامل: {total:,.2f} SAR")

    def _clear_cart(self):
        self._cart.clear()
        self._refresh_cart_table()

    # ------------------------------------------------------------ checkout ----
    def _checkout(self):
        if not self._cart:
            return
        payload = {
            "customer_id": None,
            "payment_method": "cash",
            "items": [
                {"product_id": i["product_id"], "quantity": i["qty"]}
                for i in self._cart
            ],
        }
        result = api.post("/invoices/checkout", json=payload)
        if result:
            from nima_ui_kit.dialogs import NimaToast
            NimaToast.show(self, f"✅ تم إصدار الفاتورة رقم {result.get('invoice_id', '—')} بنجاح!")
            self._clear_cart()
