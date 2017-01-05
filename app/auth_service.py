class AuthCheckResult():
    def __init__(self, authenticated, userinfo = None):
        self.authenticated = authenticated
        self.userinfo = userinfo

class AuthService:
    def check_auth(self):
        # Should be re-implemented in subclasses
        return AuthCheckResult(false)

    def check_token(self):
        # Should be re-implemented in subclasses
        return AuthCheckResult(false)
