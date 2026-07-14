from decimal import Decimal
import datetime
from sqlalchemy import DECIMAL, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from base import Base


class ConsumptionLog(Base):
	__tablename__ = "ConsumptionLog"

	id: Mapped[int] = mapped_column(primary_key=True, unique=True, nullable=False)
	user_id: Mapped[int] = mapped_column(ForeignKey("Users.id"), nullable=False)
	product_id: Mapped[int] = mapped_column(ForeignKey("Products.id"), nullable=False)
	consumed_time: Mapped[datetime.datetime] = mapped_column(
		DateTime(timezone=True),
		default=datetime.datetime.utcnow,
		nullable=False,
	)
	weight: Mapped[Decimal] = mapped_column(DECIMAL, nullable=False)
	log_calories: Mapped[Decimal] = mapped_column(DECIMAL, nullable=False)
	log_protein: Mapped[Decimal] = mapped_column(DECIMAL, nullable=False)
	log_fat: Mapped[Decimal] = mapped_column(DECIMAL, nullable=False)
	log_carbs: Mapped[Decimal] = mapped_column(DECIMAL, nullable=False)
