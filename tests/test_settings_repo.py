from app.repositories import settings_repo


def test_settings_repo_returns_default_for_missing_key(test_setup):
    value = settings_repo.get("missing_key_for_test", "fallback-value")

    assert value == "fallback-value"


def test_settings_repo_returns_persisted_value(test_setup):
    settings_repo.upsert("store_name", "Nima POS")

    value = settings_repo.get("store_name", "fallback-value")

    assert value == "Nima POS"
