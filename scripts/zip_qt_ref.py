import zipfile
import os

def zip_directory(source_dir, zip_name):
    print(f"Zipping {source_dir} into {zip_name}...")
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            if any(x in root for x in ['.venv', '__pycache__', '.git', 'logs', '.gemini', '.pytest_cache', 'htmlcov']):
                continue
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, source_dir)
                zipf.write(full_path, rel_path)

source = r'E:\NimaTechVibeCoding\NimaPosPythonQTGPTManger'
target = r'E:\NimaTechVibeCoding\NimaPosApiGravity\references\NimaPosPythonQTGPTManger_Reference.zip'

if not os.path.exists(os.path.dirname(target)):
    os.makedirs(os.path.dirname(target))

zip_directory(source, target)
print(f"Done! Archive size: {os.path.getsize(target) / 1024 / 1024:.2f} MB")
