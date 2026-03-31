import json
import logging
from typing import List, Optional


from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.weekly_progress import Weekly_progressService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/weekly_progress", tags=["weekly_progress"])


# ---------- Pydantic Schemas ----------
class Weekly_progressData(BaseModel):
    """Entity data schema (for create/update)"""
    patient_id: int
    week: int
    pain_avg: int
    pain_spread: str = None
    pain_relief: str = None
    pain_worsen: str = None
    movement: int
    energy: int
    exercise_frequency: int
    how_feeling: str = None
    hard_exercises: str = None
    liked_exercises: str = None
    progress_exercises: str = None
    other_notes: str = None
    entry_date: str


class Weekly_progressUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    patient_id: Optional[int] = None
    week: Optional[int] = None
    pain_avg: Optional[int] = None
    pain_spread: Optional[str] = None
    pain_relief: Optional[str] = None
    pain_worsen: Optional[str] = None
    movement: Optional[int] = None
    energy: Optional[int] = None
    exercise_frequency: Optional[int] = None
    how_feeling: Optional[str] = None
    hard_exercises: Optional[str] = None
    liked_exercises: Optional[str] = None
    progress_exercises: Optional[str] = None
    other_notes: Optional[str] = None
    entry_date: Optional[str] = None


class Weekly_progressResponse(BaseModel):
    """Entity response schema"""
    id: int
    patient_id: int
    week: int
    pain_avg: int
    pain_spread: Optional[str] = None
    pain_relief: Optional[str] = None
    pain_worsen: Optional[str] = None
    movement: int
    energy: int
    exercise_frequency: int
    how_feeling: Optional[str] = None
    hard_exercises: Optional[str] = None
    liked_exercises: Optional[str] = None
    progress_exercises: Optional[str] = None
    other_notes: Optional[str] = None
    entry_date: str

    class Config:
        from_attributes = True


class Weekly_progressListResponse(BaseModel):
    """List response schema"""
    items: List[Weekly_progressResponse]
    total: int
    skip: int
    limit: int


class Weekly_progressBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Weekly_progressData]


class Weekly_progressBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Weekly_progressUpdateData


class Weekly_progressBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Weekly_progressBatchUpdateItem]


class Weekly_progressBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Weekly_progressListResponse)
async def query_weekly_progresss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query weekly_progresss with filtering, sorting, and pagination"""
    logger.debug(f"Querying weekly_progresss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Weekly_progressService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
        )
        logger.debug(f"Found {result['total']} weekly_progresss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying weekly_progresss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Weekly_progressListResponse)
async def query_weekly_progresss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query weekly_progresss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying weekly_progresss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Weekly_progressService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} weekly_progresss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying weekly_progresss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Weekly_progressResponse)
async def get_weekly_progress(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single weekly_progress by ID"""
    logger.debug(f"Fetching weekly_progress with id: {id}, fields={fields}")
    
    service = Weekly_progressService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Weekly_progress with id {id} not found")
            raise HTTPException(status_code=404, detail="Weekly_progress not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching weekly_progress {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Weekly_progressResponse, status_code=201)
async def create_weekly_progress(
    data: Weekly_progressData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new weekly_progress"""
    logger.debug(f"Creating new weekly_progress with data: {data}")
    
    service = Weekly_progressService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create weekly_progress")
        
        logger.info(f"Weekly_progress created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating weekly_progress: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating weekly_progress: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Weekly_progressResponse], status_code=201)
async def create_weekly_progresss_batch(
    request: Weekly_progressBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple weekly_progresss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} weekly_progresss")
    
    service = Weekly_progressService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} weekly_progresss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Weekly_progressResponse])
async def update_weekly_progresss_batch(
    request: Weekly_progressBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple weekly_progresss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} weekly_progresss")
    
    service = Weekly_progressService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} weekly_progresss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Weekly_progressResponse)
async def update_weekly_progress(
    id: int,
    data: Weekly_progressUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing weekly_progress"""
    logger.debug(f"Updating weekly_progress {id} with data: {data}")

    service = Weekly_progressService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Weekly_progress with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Weekly_progress not found")
        
        logger.info(f"Weekly_progress {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating weekly_progress {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating weekly_progress {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_weekly_progresss_batch(
    request: Weekly_progressBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple weekly_progresss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} weekly_progresss")
    
    service = Weekly_progressService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} weekly_progresss successfully")
        return {"message": f"Successfully deleted {deleted_count} weekly_progresss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_weekly_progress(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single weekly_progress by ID"""
    logger.debug(f"Deleting weekly_progress with id: {id}")
    
    service = Weekly_progressService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Weekly_progress with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Weekly_progress not found")
        
        logger.info(f"Weekly_progress {id} deleted successfully")
        return {"message": "Weekly_progress deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting weekly_progress {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")