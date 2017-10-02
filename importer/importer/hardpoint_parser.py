from collections import defaultdict

class HardpointParser(object):
    ALL_ITEM_TYPES = [
        'Weapon', 'RunningLight', 'Shield', 'ConTrail', 'Torpedo',
        'Engine', 'Thruster', 'FX', 'Turret', 'Mount', 'Scanner', 
        'Tractor', 'Button', 'BigButton', 'Radar', 'Cloak', 'unknown',
        'Mine', 'CM', 'DockLight', 'Headlight'
    ]

    def __init__(self, cmp_file, parent):
        self.cmp_file = cmp_file
        self._parent = parent
        self.hardpoints = defaultdict(list)
    
    def update_hardpoints_from_cmp(self):        
        fixed_hardpoints = self.cmp_file.find_nodes_with_name_in_path('Hardpoints\\Fixed')
        revolute_hardpoints = self.cmp_file.find_nodes_with_name_in_path('Hardpoints\\Revolute')
                
        for hp in fixed_hardpoints:
            self._categorize_hardpoint(hp['name'])
            
        for hp in revolute_hardpoints:
            self._categorize_hardpoint(hp['name'])
    
    def _categorize_hardpoint(self, hp_name):
        for key in self.ALL_ITEM_TYPES:
            if key.lower() in hp_name.lower():
                self.hardpoints[key].append(hp_name)
                return
        
        self._parent.status('can\'t assign {} (unknown type)'.format(hp_name))
        self.hardpoints['unknown'].append(hp_name)
