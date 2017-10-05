import time

class Timer(object):
    def __init__(self, logger_fnc):
        self.logger_fnc = logger_fnc
        self.level = 0
        self.timers = {}
        self.start()

    def start(self):
        self.level += 1
        self.timers[self.level] = time.clock()

    def step(self, message):
        self._format_message(message)
        self.timers[self.level] = time.clock()

    def stop(self, message):
        self.step(message)
        self.level -= 1

    def _format_message(self, message):
        delta = time.clock() - self.timers[self.level]
        self.logger_fnc('[{:.3f}s] {}'.format(delta, message))
