import asyncio
import copy
from typing import Any, Callable, Dict, Optional

from .models import UserState
from .state_limits import BoundedStateStoreMixin


def _deep_merge(dest: Dict[str, Any], src: Dict[str, Any]) -> Dict[str, Any]:
    for key, value in src.items():
        if (
            key in dest
            and isinstance(dest[key], dict)
            and isinstance(value, dict)
        ):
            dest[key] = _deep_merge(dest[key], value)
        else:
            dest[key] = copy.deepcopy(value)
    return dest


class StateStore(BoundedStateStoreMixin):
    """In-memory state store keyed by user id."""

    def __init__(
        self,
        *,
        ttl_seconds: Optional[float] = None,
        max_entries: Optional[int] = None,
        max_total_bytes: Optional[int] = None,
        clock: Optional[Callable[[], float]] = None,
    ) -> None:
        self._states: Dict[str, UserState] = {}
        self._lock = asyncio.Lock()
        self._init_state_limits(
            ttl_seconds=ttl_seconds,
            max_entries=max_entries,
            max_total_bytes=max_total_bytes,
            clock=clock,
        )

    async def get_state(self, user_id: str) -> UserState:
        async with self._lock:
            now = self._prepare_state_access()
            state = self._states.get(user_id)
            if state is None:
                state = UserState()
                return self._store_state(user_id, state, now)
            self._mark_access(user_id, now)
            self._evict_lru()
            return state

    async def replace_state(self, user_id: str, new_state: Dict[str, Any]) -> UserState:
        async with self._lock:
            now = self._prepare_state_access()
            state = UserState(**new_state)
            return self._store_state(user_id, state, now)

    async def patch_state(self, user_id: str, patch: Dict[str, Any], note: Optional[str]) -> UserState:
        async with self._lock:
            now = self._prepare_state_access()
            state = self._states.get(user_id, UserState())
            updated_data = _deep_merge(copy.deepcopy(state.data), patch)
            state.data = updated_data
            if note is not None:
                state.note = note
            state.touch()
            return self._store_state(user_id, state, now)

    async def reset_state(self, user_id: str) -> UserState:
        async with self._lock:
            now = self._prepare_state_access()
            state = UserState()
            return self._store_state(user_id, state, now)

    async def mutate_data(
        self,
        user_id: str,
        mutator: Callable[[Dict[str, Any]], Dict[str, Any]],
        note: Optional[str] = None,
    ) -> UserState:
        async with self._lock:
            now = self._prepare_state_access()
            state = self._states.get(user_id, UserState())
            state.data = mutator(copy.deepcopy(state.data))
            if note is not None:
                state.note = note
            state.touch()
            return self._store_state(user_id, state, now)

    async def delete_state(self, user_id: str) -> None:
        async with self._lock:
            self._remove_tracked_state(user_id)
