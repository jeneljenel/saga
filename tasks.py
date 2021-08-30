import os
import sys
from invoke import task
from pathlib import Path

from jsonschema import Draft7Validator, RefResolver
from json import load


def preflight_checklist():
    """ Stuff we want to check before running our tasks """

    # Check that we are in the right folder
    if not os.path.exists("tasks.py"):
        print("Please run tasks from the root project folder")
        exit()


def validate_station_file(filename):
    """Validate a given file against our schema a return a list of errors"""

    schemafile = "./schemas/schema_rewrite.json"
    with open(schemafile) as handle:
        schema = load(handle)

    with open(filename) as handle:
        json_to_check = load(handle)

    # Get the project folder
    base_uri = f"file://{Path(__file__).parents[0].as_posix()}/"

    # So that we can correctly resolve references to local files in our schema
    resolver = RefResolver(base_uri, schema)
    validator = Draft7Validator(schema, resolver=resolver)

    return [e for e in validator.iter_errors(json_to_check)]


def output_validation_errors(errors, filename):
    """ Output validation errors and filename for human consumption """
    if errors:
        print("=" * 100)
        print(f"{filename} has {len(errors)} errors.")
    for error in errors:
        print("-" * 100)
        print(f"{error.validator=}")
        print(f"{error.path=}")
        print(f"{error.message=}")


@task
def validate_schema(ctx, filename):
    """Validate a json schema itself."""
    preflight_checklist()
    with open("./schemas/jsonschema-draft-v7.json") as handle:
        schema = load(handle)

    with open(filename) as handle:
        json_to_check = load(handle)

    validator = Draft7Validator(schema)
    errors = [e for e in validator.iter_errors(json_to_check)]
    output_validation_errors(errors, filename)


@task
def validate_test_file(ctx):
    """ Test the schema validation against a test file"""
    preflight_checklist()
    jsonfile = "./src/data/stations/schema-test.json"

    errors = validate_station_file(jsonfile)
    output_validation_errors(errors, jsonfile)


@task
def validate_stations_in_folder(ctx, folder, exit_on_errors=False):
    """
    Validate all json files in given folder

    If exit_on_error only print errors of first file that does not validate, then exit
    """
    preflight_checklist()
    filenames = [fn for fn in Path(folder).iterdir() if fn.as_posix().endswith(".json")]
    for filename in filenames:
        errors = validate_station_file(filename)
        if errors:
            output_validation_errors(errors, filename)
            if exit_on_errors:
                exit()
            errors = None
