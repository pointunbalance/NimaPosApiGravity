"""
main_desktop.py — Entry point for the Nima Desktop Application.
Launch this file to open the GUI. The NimaPOS API server must be running.
"""
import sys
from PyQt6.QtWidgets import QApplication
from nima_desktop.app import NimaDesktopApp

def main():
    app = QApplication(sys.argv)
    window = NimaDesktopApp()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
