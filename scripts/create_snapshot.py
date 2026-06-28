import zipfile
import os

def zip_directory(folders_and_files, zip_name):
    print(f"Starting archival of {len(folders_and_files)} items into {zip_name}...")
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for item in folders_and_files:
            if not os.path.exists(item):
                print(f"Warning: {item} not found, skipping.")
                continue
            if os.path.isfile(item):
                zipf.write(item)
                print(f"  Added file: {item}")
            else:
                print(f"  Processing directory: {item}")
                for root, dirs, files in os.walk(item):
                    # EXCLUSIONS
                    if any(x in root for x in ['Source_Hub', '.venv', '__pycache__', '.git', 'logs', '.gemini']):
                        continue
                    for file in files:
                        full_path = os.path.join(root, file)
                        zipf.write(full_path)

items_to_zip = [
    'app', 'data', 'docs', 'reports', 'walkthroughs', 'references', 'scripts',
    'migrations', 'utils', 'MASTER_STATE.md', 'README.md', 'requirements.txt', 'run.py'
]

zip_path = r'Source_Hub\V1.40.0_EliteEnterprise_GodMode_20260228.zip'
zip_directory(items_to_zip, zip_path)
print(f"Archive created successfully at: {os.path.abspath(zip_path)}")
