import time

class Timer(object):
    def __init__(self, logger_fnc):
        self.total_timer = time.clock()
        self.current_timer = time.clock()
        self.logger_fnc = logger_fnc
        
        self.start()

    def start(self):
        self.logger_fnc('tmer started')
        self.total_timer = time.clock()
        self.current_timer = time.clock()

    def step(self, message):
        self._format_message(message, self.current_timer)
        self.current_timer =  time.clock()

    def done(self, message):
        self._format_message(message, self.total_timer)
        self.total_timer = time.clock()

    def _format_message(self, message, timer):
        delta = time.clock() - timer
        self.logger_fnc('[{:.3f}s] {}'.format(delta, message))
