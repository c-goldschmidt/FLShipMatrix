import json
from django.http import HttpResponse

class JSONResponse(HttpResponse):
    def __init__(self, data, code=200):
        super(JSONResponse, self).__init__(content_type='application/json')
        
        self.content = json.dumps(data)
        self.status_code = code

class BinaryResponse(HttpResponse):
    def __init__(self, data, code=200):
        super(BinaryResponse, self).__init__(content_type='application/octet-stream')
        
        self.content = data
        self.status_code = code

class Response404(HttpResponse):
    def __init__(self, reason_string='Not Found'):
        super(Response404, self).__init__()
        self.content = reason_string
        
class Response500(HttpResponse):
    def __init__(self, reason_string='Unknown error'):
        super(Response500, self).__init__()
        self.content = reason_string
