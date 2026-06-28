"""Nima UI Kit Theme definitions (Light Mode + Arabic Typography)."""

class ColorPalette:
    PRIMARY = "#3498db"
    PRIMARY_HOVER = "#2980b9"
    SECONDARY = "#95a5a6"
    SECONDARY_HOVER = "#7f8c8d"
    SUCCESS = "#2ecc71"
    SUCCESS_HOVER = "#27ae60"
    DANGER = "#e74c3c"
    DANGER_HOVER = "#c0392b"
    BACKGROUND = "#f5f6fa"
    SURFACE = "#ffffff"
    TEXT_PRIMARY = "#2c3e50"
    TEXT_SECONDARY = "#7f8c8d"
    BORDER = "#dcdde1"

class Typography:
    FONT_FAMILY = "Cairo, Tajawal, Arial"
    SIZE_H1 = "24px"
    SIZE_H2 = "20px"
    SIZE_BODY = "14px"
    SIZE_SMALL = "12px"

def get_global_stylesheet():
    return f"""
    QWidget {{
        font-family: {Typography.FONT_FAMILY};
        font-size: {Typography.SIZE_BODY};
        color: {ColorPalette.TEXT_PRIMARY};
    }}
    QMainWindow, QDialog {{
        background-color: {ColorPalette.BACKGROUND};
    }}
    """
