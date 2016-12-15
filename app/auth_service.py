class AuthCheckResult():
    def __init__(self, authenticated, error = None, userinfo = None):
        self.authenticated = authenticated
        self.error = error

class AuthService:
    def check_auth(self):
        # Should be re-implemented in subclasses
        return AuthCheckResult(false)
