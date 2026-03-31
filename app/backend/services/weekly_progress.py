import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.weekly_progress import Weekly_progress

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Weekly_progressService:
    """Service layer for Weekly_progress operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Weekly_progress]:
        """Create a new weekly_progress"""
        try:
            obj = Weekly_progress(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created weekly_progress with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating weekly_progress: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Weekly_progress]:
        """Get weekly_progress by ID"""
        try:
            query = select(Weekly_progress).where(Weekly_progress.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching weekly_progress {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of weekly_progresss"""
        try:
            query = select(Weekly_progress)
            count_query = select(func.count(Weekly_progress.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Weekly_progress, field):
                        query = query.where(getattr(Weekly_progress, field) == value)
                        count_query = count_query.where(getattr(Weekly_progress, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Weekly_progress, field_name):
                        query = query.order_by(getattr(Weekly_progress, field_name).desc())
                else:
                    if hasattr(Weekly_progress, sort):
                        query = query.order_by(getattr(Weekly_progress, sort))
            else:
                query = query.order_by(Weekly_progress.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching weekly_progress list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Weekly_progress]:
        """Update weekly_progress"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Weekly_progress {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated weekly_progress {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating weekly_progress {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete weekly_progress"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Weekly_progress {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted weekly_progress {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting weekly_progress {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Weekly_progress]:
        """Get weekly_progress by any field"""
        try:
            if not hasattr(Weekly_progress, field_name):
                raise ValueError(f"Field {field_name} does not exist on Weekly_progress")
            result = await self.db.execute(
                select(Weekly_progress).where(getattr(Weekly_progress, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching weekly_progress by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Weekly_progress]:
        """Get list of weekly_progresss filtered by field"""
        try:
            if not hasattr(Weekly_progress, field_name):
                raise ValueError(f"Field {field_name} does not exist on Weekly_progress")
            result = await self.db.execute(
                select(Weekly_progress)
                .where(getattr(Weekly_progress, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Weekly_progress.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching weekly_progresss by {field_name}: {str(e)}")
            raise