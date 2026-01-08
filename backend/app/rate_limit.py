# backend/app/rate_limit.py

from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter instance for all routers
limiter = Limiter(key_func=get_remote_address)
