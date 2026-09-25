import json
from fastapi import APIRouter, HTTPException
from backend.db import supabase
from backend.schemas import PlaceCreate, PlaceUpdate, PlaceReorder, PlaceSessionUpdate

router = APIRouter(prefix="/places", tags=["places"])


def get_place_sessions() -> dict:
    """Fetch place session mappings from app_settings."""
    try:
        res = (
            supabase.table("app_settings")
            .select("value")
            .eq("key", "place_sessions")
            .execute()
        )
        if res.data and res.data[0].get("value"):
            return json.loads(res.data[0]["value"])
    except Exception as e:
        print("[places] Error loading place_sessions:", e)
    return {}


def save_place_sessions(sessions: dict):
    """Save place session mappings into app_settings."""
    try:
        supabase.table("app_settings").upsert({
            "key": "place_sessions",
            "value": json.dumps(sessions)
        }).execute()
    except Exception as e:
        print("[places] Error saving place_sessions:", e)


@router.get("/")
def get_places():
    """Return all places ordered by priority ASC, enriched with session (morning/evening)."""
    res = (
        supabase.table("places")
        .select("id, name, priority")
        .order("priority", desc=False)
        .execute()
    )
    places = res.data or []
    sessions = get_place_sessions()

    for p in places:
        p["session"] = sessions.get(str(p["id"]), "morning")

    return places


@router.post("/")
def create_place(data: PlaceCreate):
    """Create a new place with session."""
    # Check for duplicate name
    existing = (
        supabase.table("places")
        .select("id")
        .eq("name", data.name.strip())
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="A place with this name already exists.")

    res = (
        supabase.table("places")
        .insert({"name": data.name.strip(), "priority": data.priority})
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create place.")

    new_place = res.data[0]
    session_val = data.session or "morning"
    sessions = get_place_sessions()
    sessions[str(new_place["id"])] = session_val
    save_place_sessions(sessions)

    new_place["session"] = session_val
    return new_place


@router.put("/reorder")
def reorder_places(data: PlaceReorder):
    """Bulk-update priorities for a list of places."""
    errors = []
    for item in data.items:
        try:
            supabase.table("places").update({"priority": item.priority}).eq("id", item.id).execute()
        except Exception as e:
            errors.append({"id": item.id, "error": str(e)})
    if errors:
        raise HTTPException(status_code=500, detail={"message": "Some updates failed", "errors": errors})
    return {"message": "Priorities updated successfully."}


@router.put("/{place_id}/session")
def update_place_session(place_id: int, data: PlaceSessionUpdate):
    """Quickly update only a place's session (morning or evening)."""
    if data.session not in ["morning", "evening"]:
        raise HTTPException(status_code=400, detail="Session must be 'morning' or 'evening'.")

    sessions = get_place_sessions()
    sessions[str(place_id)] = data.session
    save_place_sessions(sessions)

    return {"message": f"Place {place_id} session updated to {data.session}.", "session": data.session}


@router.put("/{place_id}")
def update_place(place_id: int, data: PlaceUpdate):
    """Update a place's name, priority, and/or session."""
    update_data = data.dict(exclude_none=True)
    session_val = update_data.pop("session", None)

    if session_val is not None:
        if session_val not in ["morning", "evening"]:
            raise HTTPException(status_code=400, detail="Session must be 'morning' or 'evening'.")
        sessions = get_place_sessions()
        sessions[str(place_id)] = session_val
        save_place_sessions(sessions)

    if "name" in update_data:
        update_data["name"] = update_data["name"].strip()
        if not update_data["name"]:
            raise HTTPException(status_code=400, detail="Place name cannot be empty.")

    if update_data:
        res = (
            supabase.table("places")
            .update(update_data)
            .eq("id", place_id)
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Place not found.")
        place = res.data[0]
    else:
        # If only session was updated, fetch existing place row
        res = supabase.table("places").select("id, name, priority").eq("id", place_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Place not found.")
        place = res.data[0]

    sessions = get_place_sessions()
    place["session"] = sessions.get(str(place["id"]), "morning")
    return place


@router.delete("/{place_id}")
def delete_place(place_id: int):
    """Delete a place only if no customers reference it."""
    # Check if any customers use this place
    customers = (
        supabase.table("customers")
        .select("customer_id")
        .eq("place_id", place_id)
        .execute()
    )
    if customers.data:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete: {len(customers.data)} customer(s) are assigned to this place. Reassign them first."
        )

    res = (
        supabase.table("places")
        .delete()
        .eq("id", place_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Place not found.")

    # Clean up from sessions map
    sessions = get_place_sessions()
    if str(place_id) in sessions:
        del sessions[str(place_id)]
        save_place_sessions(sessions)

    return {"message": "Place deleted successfully."}
