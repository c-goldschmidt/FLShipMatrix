import argparse
import logging

from importer.importer import ShipDataImporter

_logger = logging.getLogger('main')


def setup_logging(debug=False):
    log_format = '[%(levelname)s][%(name)s] %(message)s'
    log_format += ' (%(name)s)' if debug else ''

    logging.basicConfig(
        format=log_format,
        level=logging.DEBUG if debug else logging.INFO,
    )

    _logger.debug('Debug output enabled')
    logging.getLogger('PIL.Image').setLevel(logging.WARNING)
    logging.getLogger('importer.pyfl_utils.utf').setLevel(logging.WARNING)


def get_args():
    parser = argparse.ArgumentParser(formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument(
        '--root',
        type=str,
        help="root directory of installation"
    )

    parser.add_argument(
        '--debug',
        action='store_true',
        default=False,
        help='Enable debug output'
    )

    return parser.parse_args()

if __name__ == '__main__':
    args = get_args()
    setup_logging(args.debug)
    
    try: 
        importer = ShipDataImporter(args)
        importer.run_import()
    except:
        _logger.error('an error was catched')
        raise
