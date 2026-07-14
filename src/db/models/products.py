from decimal import Decimal
from sqlalchemy import DECIMAL, VARCHAR
from sqlalchemy.orm import Mapped, mapped_column
from base import Base


class Products(Base):
	__tablename__ = "Products"

	id: Mapped[int] = mapped_column(primary_key=True, unique=True, nullable=False)
	name: Mapped[str] = mapped_column(VARCHAR(50), nullable=False)
	calories_100g: Mapped[Decimal] = mapped_column(DECIMAL, nullable=False)
	protein_100g: Mapped[Decimal] = mapped_column(DECIMAL, nullable=False)
	fat_100g: Mapped[Decimal] = mapped_column(DECIMAL, nullable=False)
	carbs_100g: Mapped[Decimal] = mapped_column(DECIMAL, nullable=False)
