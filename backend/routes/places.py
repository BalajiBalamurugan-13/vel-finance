from fastapi import APIRouter, HTTPException
from backend.db import supabase
from backend.schemas import PlaceCreate, PlaceUpdate, PlaceReorder

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/")
def get_places():
    """Return all places ordered by priority ASC."""
    res = (
        supabase.table("places")
        .select("id, name, priority")
        .order("priority", desc=False)
        .execute()
    )
    return res.data


@router.post("/")
def create_place(data: PlaceCreate):
    """Create a new place."""
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
    return res.data[0]


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


@router.put("/{place_id}")
def update_place(place_id: int, data: PlaceUpdate):
    """Update a place's name and/or priority."""
    update_data = data.dict(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")

    # Strip name if present
    if "name" in update_data:
        update_data["name"] = update_data["name"].strip()
        if not update_data["name"]:
            raise HTTPException(status_code=400, detail="Place name cannot be empty.")

    res = (
        supabase.table("places")
        .update(update_data)
        .eq("id", place_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Place not found.")
    return res.data[0]


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
    return {"message": "Place deleted successfully."}
