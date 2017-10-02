import os
import logging
from .pyfl_utils import INIFile, FLDll
from .errors import ParserError

_logger = logging.getLogger(__name__)


class ConfigLoader(object):
        
    CONFIG_FILES = [
        ('DATA', 'SHIPS', 'shiparch.ini'),
        ('DATA', 'EQUIPMENT', 'goods.ini'),       
        ('DATA', 'EQUIPMENT', 'market_ships.ini'),   
    ]

    def __init__(self, fl_ini_path):
        self.fl_ini = INIFile(fl_ini_path)
        self._dll_paths_by_index = {}
        self._loaded_inis = {}
        self._loaded_dlls = {}

        self.goods = None
        self.shiparch = None
        self.market_ships = None

        self.base_path = os.path.dirname(self.fl_ini.get_path())
        self._load_inis()
        self._load_dll_paths()

    def _load_dll_paths(self):
        resources = self.fl_ini.get('resources')
        
        for index, dll in enumerate(resources.get('DLL')):
            self._dll_paths_by_index[index] = os.path.join(
                self.base_path, 'EXE', dll,
            )

    def _load_inis(self):        
        for path_parts in self.CONFIG_FILES:
            full_path = self.get_absolute_path(*path_parts)
            base_name = os.path.basename(full_path).replace('.ini', '')
        
            if os.path.isfile(full_path):
                ini_file = INIFile(full_path)
                setattr(self, base_name, ini_file)
                self._loaded_inis[full_path.lower()] = ini_file
            else:
                _logger.error('could not load {}.ini'.format(base_name))
         
    def get_absolute_path(self, *args):
        full_path = os.path.join(self.base_path, *args)      
        full_path = full_path.lower()
        return full_path.replace('\\', '/')
    
    def get_ini_by_path(self, path):
        ini_path = self.get_absolute_path('data', path)
        
        if ini_path in self._loaded_inis:
            return self._loaded_inis[ini_path]
        if os.path.isfile(ini_path):
            return INIFile(ini_path)
    
    def get_dll_string(self, ini_id):
        if not self.fl_ini:
            raise ParserError('freelancer.ini not loaded!')
                        
        ini_id = int(ini_id)
        
        dll_index = ((ini_id - (ini_id % 65536)) / 65536) - 1
        
        if dll_index < 0:
            dll_index = 0
        
        self._load_dll(dll_index)
        return self._loaded_dlls[dll_index].get_by_id(ini_id)
        
    def get_loaded_dll(self, dll_index):
        self._load_dll(dll_index)
        return self._loaded_dlls[dll_index]
        
    def get_dll_list(self):
        return self._dll_paths_by_index
         
    def _load_dll(self, dll_index):
        if dll_index not in self._loaded_dlls and dll_index in self._dll_paths_by_index:
            dll_path = self._dll_paths_by_index[dll_index]
            dll_name = os.path.basename(dll_path)
            self._loaded_dlls[dll_index] = FLDll(dll_path, base_index=dll_index + 1)
            
            _logger.info('loading DLL {} OK'.format(dll_name))
